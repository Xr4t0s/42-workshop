import { useEffect, useMemo, useState, useCallback } from "react";
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/config/networkConfig";
import { unique } from "@/utils/strings";
import { PAGE, REFRESH_MS } from "@/config/constants";
import type { Post, Profile } from "@/types/types";
import { mapMoveToPost, mapMoveToProfile } from "@/utils/mappers";
import {
  getPostsOfTableIdFromRegistry,
  readPostsVectorForProfile,
} from "@/utils/sui";

export function useProfileFeed(profileId?: string | null) {
  const suiClient = useSuiClient();
  const postsRegistryId = useNetworkVariable("postsRegistryId");

  const postsReg = useSuiClientQuery("getObject", {
    id: postsRegistryId,
    options: { showContent: true, showType: true },
  });

  const targetProfileObj = useSuiClientQuery("getObject", {
    id: profileId ?? "",
    options: { showContent: true, showType: true },
  });

  const postsOfTableId = useMemo(
    () => getPostsOfTableIdFromRegistry(postsReg.data?.data ?? null),
    [postsReg.data?.data?.digest]
  );

  const [feedPostIds, setFeedPostIds] = useState<string[]>([]);
  const [myPostIdSet, setMyPostIdSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!postsOfTableId || !profileId) {
        setFeedPostIds([]);
        setMyPostIdSet(new Set());
        return;
      }
      const ids = await readPostsVectorForProfile(suiClient, postsOfTableId, profileId);
      const merged = unique(ids);
      if (!cancelled) {
        setFeedPostIds(merged);
        setMyPostIdSet(new Set(merged));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postsOfTableId, profileId, suiClient]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (feedPostIds.length === 0) {
        setPosts([]);
        setProfiles({});
        return;
      }
      setLoadingPosts(true);
      setLoadError(null);
      try {
        const out: Post[] = [];
        const CHUNK = 50;

        for (let i = 0; i < feedPostIds.length; i += CHUNK) {
          const slice = feedPostIds.slice(i, i + CHUNK);
          const objs = await suiClient.multiGetObjects({
            ids: slice,
            options: { showContent: true, showType: true },
          });

          for (const o of objs) {
            const p = mapMoveToPost(o.data);
            if (p) out.push(p);
          }
        }

        const profileIds = unique(out.map((p) => p.authorProfileId).filter(Boolean));
        const profMap: Record<string, Profile> = {};
        if (profileIds.length) {
          const profObjs = await suiClient.multiGetObjects({
            ids: profileIds,
            options: { showContent: true, showType: true },
          });
          for (const o of profObjs) {
            const prof = mapMoveToProfile(o.data);
            if (prof) {
              profMap[prof.id] = prof;
            }
          }
        }

        out.sort((a, b) => b.createdMs - a.createdMs);

        if (!cancelled) {
          setPosts(out);
          setProfiles(profMap);
        }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? "Unable to load posts");
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [feedPostIds.join("|"), suiClient]);

  const [visibleCount, setVisibleCount] = useState(PAGE);
  useEffect(() => {
    setVisibleCount(PAGE);
  }, [posts.length]);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  useEffect(() => {
    const id = setInterval(() => {
      postsReg.refetch?.();
      targetProfileObj.refetch?.();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  const manualRefresh = useCallback(() => {
    postsReg.refetch?.();
    targetProfileObj.refetch?.();
  }, [postsReg.refetch, targetProfileObj.refetch]);

  return {
    posts,
    profiles,
    loadingPosts,
    loadError,
    visiblePosts,
    hasMore,
    setVisibleCount,
    myPostIdSet,
    manualRefresh,
  };
}

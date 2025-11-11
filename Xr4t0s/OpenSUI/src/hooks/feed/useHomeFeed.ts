import { useEffect, useMemo, useState, useCallback } from "react";
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/config/networkConfig";
import { isMoveObject } from "@/utils/move";
import { unique } from "@/utils/strings";
import { PAGE, POST_TYPE_SUFFIX, REFRESH_MS } from "@/config/constants";
import type { Post, Profile } from "@/types/types";
import {
  getPostsOfTableIdFromRegistry,
  listAllAuthors,
  readPostsVectorForProfile,
} from "@/utils/sui";

type ProfileMini = Pick<Profile, "username" | "avatarUrl">;

export function useHomeFeed(myProfileId?: string | null) {
  const suiClient = useSuiClient();
  const postsRegistryId = useNetworkVariable("postsRegistryId");

  const postsReg = useSuiClientQuery("getObject", {
    id: postsRegistryId,
    options: { showContent: true, showType: true },
  });
  const myProfileObj = useSuiClientQuery("getObject", {
    id: myProfileId ?? "",
    options: { showContent: true, showType: true },
  });

  const postsOfTableId = useMemo(
    () => getPostsOfTableIdFromRegistry(postsReg.data?.data ?? null),
    [postsReg.data?.data?.digest]
  );

  const listAuthors = useCallback(async () => {
    if (!postsOfTableId) return [];
    return listAllAuthors(suiClient, postsOfTableId);
  }, [postsOfTableId, suiClient]);

  const [feedPostIds, setFeedPostIds] = useState<string[]>([]);
  const [myPostIdSet, setMyPostIdSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!postsOfTableId) {
        setFeedPostIds([]);
        setMyPostIdSet(new Set());
        return;
      }
      const authors = await listAuthors();
      const BATCH = 25;
      const allIds: string[] = [];
      for (let i = 0; i < authors.length; i += BATCH) {
        const slice = authors.slice(i, i + BATCH);
        const part = await Promise.all(
          slice.map((a) => readPostsVectorForProfile(suiClient, postsOfTableId, a))
        );
        allIds.push(...part.flat());
      }
      const merged = unique(allIds);
      const mine = myProfileId
        ? await readPostsVectorForProfile(suiClient, postsOfTableId, myProfileId)
        : [];
      if (!cancelled) {
        setFeedPostIds(merged);
        setMyPostIdSet(new Set(mine));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postsOfTableId, myProfileId, listAuthors, suiClient]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
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
            const d = o.data;
            const typ = (d?.content as any)?.type as string | undefined;
            if (!isMoveObject(d) || !typ?.endsWith(POST_TYPE_SUFFIX)) continue;
            const f: any = (d!.content as any).fields;
            out.push({
              id: d!.objectId!,
              content: String(f.content ?? ""),
              createdMs: Number(f.created_ms ?? 0),
              updatedMs: Number(f.updated_ms ?? 0),
              authorProfileId: String(f.author_profile_id),
              author: String(f.author ?? ""),
            });
          }
        }

        const profileIds = unique(out.map((p) => p.authorProfileId).filter(Boolean));
        const profMap: Record<string, ProfileMini> = {};
        if (profileIds.length) {
          const profObjs = await suiClient.multiGetObjects({
            ids: profileIds,
            options: { showContent: true, showType: true },
          });
          for (const o of profObjs) {
            const d = o.data;
            if (!isMoveObject(d)) continue;
            const f: any = (d!.content as any).fields;
            profMap[d!.objectId!] = {
              username: f.username ? String(f.username) : "",
              avatarUrl: f.avatar_url ? String(f.avatar_url) : "",
            };
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
  useEffect(() => setVisibleCount(PAGE), [posts.length]);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  useEffect(() => {
    const id = setInterval(() => {
      postsReg.refetch?.();
      myProfileObj.refetch?.();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  const manualRefresh = useCallback(() => {
    postsReg.refetch?.();
    myProfileObj.refetch?.();
  }, [postsReg.refetch, myProfileObj.refetch]);

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

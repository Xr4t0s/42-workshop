import { useEffect, useMemo, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { useNetworkVariable } from "@/config/networkConfig";
import { isMoveObject } from "@/utils/move";

export type FollowingRow = {
  profileId: string;
  username: string;
  description: string;
  avatar_url?: string;
};

const FOLLOW_NFT_TYPE_SUFFIX = "::social::FollowNFT";
const PROFILE_TYPE_SUFFIX   = "::social::Profile";

const isObjectId = (x: unknown): x is string =>
  typeof x === "string" && /^0x[0-9a-fA-F]{64}$/.test(x as string);

export function useFollowingRows(myAddress: string | null) {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable("socialPackageId");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FollowingRow[]>([]);

  const nftTypeExact = useMemo(
    () => (typeof packageId === "string" ? `${packageId}${FOLLOW_NFT_TYPE_SUFFIX}` : null),
    [packageId]
  );
  const profileTypeExact = useMemo(
    () => (typeof packageId === "string" ? `${packageId}${PROFILE_TYPE_SUFFIX}` : null),
    [packageId]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!myAddress || !nftTypeExact || !profileTypeExact) {
        setRows([]);
        return;
      }
      setLoading(true);

      try {
        const followedIds: string[] = [];
        let cursor: string | null | undefined = null;

        while (true) {
          const page = await suiClient.getOwnedObjects({
            owner: myAddress,
            cursor,
            limit: 50,
            options: { showType: true, showContent: true },
          });

          for (const it of page.data) {
            const t = it.data?.type as string | undefined;
            if (t !== nftTypeExact) continue;

            const fields = isMoveObject(it.data as SuiObjectData | undefined)
              ? (it.data!.content as any).fields
              : null;
            if (!fields) continue;

            const follower = String(fields.follower ?? "").toLowerCase();
            const followed = fields.followed_profile_id as string | undefined;

            if (follower !== myAddress.toLowerCase()) continue;
            if (!isObjectId(followed)) continue;

            followedIds.push(followed);
          }

          cursor = page.hasNextPage ? page.nextCursor : null;
          if (!cursor) break;
        }

        const uniqueFollowed = Array.from(new Set(followedIds));
        if (uniqueFollowed.length === 0) {
          if (!cancelled) {
            setRows([]);
            setLoading(false);
          }
          return;
        }

        const out: FollowingRow[] = [];
        const CHUNK = 50;

        for (let i = 0; i < uniqueFollowed.length; i += CHUNK) {
          const slice = uniqueFollowed.slice(i, i + CHUNK);
          const objs = await suiClient.multiGetObjects({
            ids: slice,
            options: { showType: true, showContent: true },
          });

          for (const obj of objs) {
            const d = obj.data;
            const typ = (d?.content as any)?.type as string | undefined;
            if (!d || !typ || typ !== profileTypeExact) continue;

            const f: any = isMoveObject(d) ? (d.content as any).fields : null;
            if (!f) continue;

            out.push({
              profileId: d.objectId!,
              username: String(f.username ?? ""),
              description: String(f.description ?? ""),
              avatar_url: f.avatar_url ? String(f.avatar_url) : undefined,
            });
          }
        }

        out.sort((a, b) => {
          const ua = (a.username || "").toLowerCase();
          const ub = (b.username || "").toLowerCase();
          if (ua < ub) return -1;
          if (ua > ub) return 1;
          return a.profileId.localeCompare(b.profileId);
        });

        if (!cancelled) setRows(out);
      } catch (e) {
        console.error("[useFollowingRows] load error:", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [myAddress, nftTypeExact, profileTypeExact, suiClient]);

  return { rows, loading };
}

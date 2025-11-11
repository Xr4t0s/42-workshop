import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { FOLLOW_NFT_TYPE_SUFFIX } from "@/config/constants";
import { isMoveObject } from "@/utils/move";

const norm = (a?: string | null) => (a ? a.toLowerCase() : "");

export function useMyFollowNftForTarget(targetProfileId: string | null, opts: { pollMs?: number; maxTries?: number } = {}) {
  const { pollMs = 2000, maxTries = 20 } = opts;
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  const me = norm(account?.address);
  const target = norm(targetProfileId);

  const [nftId, setNftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bump, setBump] = useState(0);
  const refresh = useCallback(() => setBump((n) => n + 1), []);
  const foundKeyRef = useRef<string | null>(null);
  const scanKey = useMemo(() => `${me}|${target}|${bump}`, [me, target, bump]);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function scanOnce(): Promise<string | null> {
      if (!me || !target) return null;
      let cursor: string | null | undefined = null;
      do {
        const owned = await suiClient.getOwnedObjects({
          owner: me,
          cursor,
          limit: 50,
          options: { showContent: true, showType: true },
        });

        for (const o of owned.data) {
          const t = o.data?.type as string | undefined;
          if (!t || !t.endsWith(FOLLOW_NFT_TYPE_SUFFIX)) continue;
          const ff = isMoveObject(o.data as SuiObjectData | undefined)
            ? (o.data!.content as any).fields
            : null;
          const follower = norm(ff?.follower);
          const followed = norm(ff?.followed_profile_id);
          if (follower === me && followed === target) return o.data!.objectId!;
        }
        cursor = owned.hasNextPage ? owned.nextCursor : null;
      } while (cursor);
      return null;
    }

    async function loop() {
      if (!me || !target) {
        setNftId(null);
        return;
      }
      const nowKey = `${me}|${target}`;
      if (foundKeyRef.current === nowKey && nftId) return;

      setLoading(true);
      while (!cancelled && tries < maxTries) {
        const found = await scanOnce();
        if (cancelled) break;
        if (found) {
          foundKeyRef.current = nowKey;
          setNftId(found);
          setLoading(false);
          return;
        }
        tries += 1;
        await new Promise<void>((resolve) => {
          timer = setTimeout(() => resolve(), pollMs);
        });
      }
      if (!cancelled) {
        setNftId(null);
        setLoading(false);
      }
    }

    loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [scanKey, suiClient]);

  return { nftId, loading, refresh };
}

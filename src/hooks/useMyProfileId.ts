import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAccount, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../config/networkConfig";

const PROFILE_SUFFIX = "::social::Profile";

function extractProfileIdsFromRegistry(regObj: any): string[] {
  const move = regObj?.data?.content;
  if (!move || move.dataType !== "moveObject") return [];
  const fields: any = move.fields ?? {};
  const arr = (fields.profiles as string[]) ?? [];
  return Array.from(new Set(arr)).filter((x) => typeof x === "string" && x.startsWith("0x"));
}

export function useMyProfileId() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const registryId = useNetworkVariable("profilesId");

  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const refresh = useCallback(() => setBump((n) => n + 1), []);

  const { data: regData } = useSuiClientQuery("getObject", {
    id: registryId,
    options: { showContent: true, showType: true },
  });

  const profileIds = useMemo(() => extractProfileIdsFromRegistry(regData), [regData?.data?.digest]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveOnce(): Promise<string | null> {
      const addr = account?.address;
      if (!addr || profileIds.length === 0) return null;

      const BATCH = 50;
      for (let i = 0; i < profileIds.length; i += BATCH) {
        const slice = profileIds.slice(i, i + BATCH);
        const objs = await suiClient.multiGetObjects({
          ids: slice,
          options: { showContent: true, showType: true },
        });

        for (const obj of objs) {
          const data = obj.data;
          if (
            data?.content?.dataType === "moveObject" &&
            typeof (data.content as any).type === "string" &&
            (data.content as any).type.endsWith(PROFILE_SUFFIX)
          ) {
            const f: any = (data.content as any).fields;
            if (f?.owner === addr) return data.objectId!;
          }
        }
      }
      return null;
    }

    async function run() {
      setMyProfileId(null);

      const found = await resolveOnce();
      if (cancelled) return;

      if (found) {
        setMyProfileId(found);
        return;
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(async () => {
        const again = await resolveOnce();
        if (cancelled) return;
        if (again) {
          setMyProfileId(again);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 10000);
    }

    run();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [account?.address, suiClient, profileIds.join("|"), bump]);

  return { myProfileId, refresh };
}

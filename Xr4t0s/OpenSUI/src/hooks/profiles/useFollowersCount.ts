import { useEffect, useState } from "react";
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { useNetworkVariable } from "@/config/networkConfig";
import { isMoveObject, getTableId } from "@/utils/move";

export function useFollowersCount(profileId: string | null, refreshToken = 0) {
  const sui = useSuiClient();
  const followersRegistryId = useNetworkVariable("followersRegistryId");
  const [count, setCount] = useState<number | null>(null);

  const regQuery = useSuiClientQuery("getObject", {
    id: followersRegistryId,
    options: { showContent: true, showType: true },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const obj = regQuery.data?.data;
      if (!profileId || !followersRegistryId || !isMoveObject(obj)) {
        if (!cancelled) setCount(null);
        return;
      }
      const countsId = getTableId((obj.content as any).fields?.counts);
      if (!countsId) {
        if (!cancelled) setCount(null);
        return;
      }
      try {
        const entry = await sui.getDynamicFieldObject({
          parentId: countsId,
          name: { type: "address", value: profileId },
        });
        const ed = (entry as any).data as SuiObjectData | undefined;
        if (!isMoveObject(ed)) {
          if (!cancelled) setCount(0);
          return;
        }
        const f: any = (ed.content as any).fields;
        const val = f.value ?? f.val ?? 0;
        if (!cancelled) setCount(Number(val));
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [followersRegistryId, regQuery.data?.data, profileId, sui, refreshToken]);

  return count;
}

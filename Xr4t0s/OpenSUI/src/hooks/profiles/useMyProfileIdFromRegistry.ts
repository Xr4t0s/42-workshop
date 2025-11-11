import { useSuiClient } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "@/config/networkConfig";
import { mapMoveToProfilesRegistry } from "@/utils/mappers";

export function useMyProfileIdFromRegistry(owner?: string | null) {
  const sui = useSuiClient();
  const profilesId = useNetworkVariable("profilesId");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ownersTableId, setOwnersTableId] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      const obj = await sui.getObject({ id: profilesId, options: { showContent: true, showType: true } });
      const reg = mapMoveToProfilesRegistry(obj.data);
      if (!ok || !reg?.ownersTableId) return setOwnersTableId(null), setProfileId(null);
      setOwnersTableId(reg.ownersTableId);

      if (owner && reg.ownersTableId) {
        try {
          const entry = await sui.getDynamicFieldObject({
            parentId: reg.ownersTableId,
            name: { type: "address", value: owner },
          });
          const v: any = (entry as any).data?.content as any;
          const pid = v?.fields?.value ?? v?.fields?.contents ?? v?.fields?.id ?? null;
          setProfileId(pid ? String(pid) : null);
        } catch {
          setProfileId(null);
        }
      }
    })();
    return () => { ok = false; };
  }, [profilesId, owner, sui]);

  return { profileId, ownersTableId };
}

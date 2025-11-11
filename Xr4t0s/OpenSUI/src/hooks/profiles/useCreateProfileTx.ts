import { useCallback, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/config/networkConfig";
import { PROFILE_TYPE_SUFFIX } from "@/config/constants";

export function useCreateProfileTx(onCreated: (id: string) => void) {
  const packageId = useNetworkVariable("socialPackageId");
  const profilesId = useNetworkVariable("profilesId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const resetFeedback = () => {
    setErrorMsg(null);
    setSuccessId(null);
  };

  const callCreate = useCallback((
    username: string,
    description: string,
    withAvatarUrl?: string
  ) => {
    resetFeedback();
    const tx = new Transaction();

    if (withAvatarUrl && withAvatarUrl.trim().length > 0) {
      tx.moveCall({
        target: `${packageId}::social::create_profile_with_avatar`,
        arguments: [
          tx.object(profilesId),
          tx.pure.string(username.trim()),
          tx.pure.string(description.trim()),
          tx.pure.string(withAvatarUrl.trim()),
        ],
      });
    } else {
      tx.moveCall({
        target: `${packageId}::social::create_profile`,
        arguments: [
          tx.object(profilesId),
          tx.pure.string(username.trim()),
          tx.pure.string(description.trim()),
        ],
      });
    }

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          try {
            const res = await suiClient.waitForTransaction({
              digest,
              options: { showEffects: true },
            });
            const createdIds =
              res.effects?.created?.map((c) => c.reference?.objectId).filter(Boolean) ?? [];
            if (!createdIds.length) {
              setErrorMsg("Aucun objet créé n’a été retourné.");
              return;
            }
            const objs = await suiClient.multiGetObjects({
              ids: createdIds as string[],
              options: { showType: true, showContent: true },
            });
            const profileObj = objs.find(
              (o) =>
                o.data?.content?.dataType === "moveObject" &&
                typeof (o.data.content as any).type === "string" &&
                (o.data.content as any).type.endsWith(PROFILE_TYPE_SUFFIX),
            );
            const profileId = profileObj?.data?.objectId ?? null;
            if (!profileId) {
              setErrorMsg("Profil introuvable parmi les objets créés.");
              return;
            }
            setSuccessId(profileId);
            onCreated(profileId);
			window.location.reload();
          } catch (err: any) {
            setErrorMsg(err?.message || "Erreur lors de la confirmation de la transaction.");
          }
        },
        onError: (e) => setErrorMsg(e?.message || "La transaction a échoué."),
      },
    );
  }, [profilesId, packageId, signAndExecute, suiClient]);

  return { callCreate, isPending, errorMsg, setErrorMsg, successId };
}

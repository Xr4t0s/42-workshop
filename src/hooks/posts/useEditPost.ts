import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/config/networkConfig";

type Opts = {
  myProfileId?: string | null;
  postId?: string | null;
  moduleName?: string;
  entryName?: string;
  onRefetch?: () => void;
};

export function useEditPost(opts: Opts = {}) {
  const {
    myProfileId,
    postId,
    moduleName = "social",
    entryName = "edit_post_entry",
    onRefetch,
  } = opts;

  const packageId = useNetworkVariable("socialPackageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sui = useSuiClient();

  async function editPost(newContent: string) {
    if (!myProfileId || !postId) {
      throw new Error("IDs requis manquants (myProfileId / postId).");
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::${entryName}`,
      arguments: [
        tx.object(myProfileId),
        tx.object(postId),
        tx.pure.string(newContent),
		tx.object('0x6')
      ],
    });

    const res = await signAndExecute({ transaction: tx });
    const digest = (res as any)?.digest;
    if (digest) await sui.waitForTransaction({ digest });
	window.location.reload();

    onRefetch?.();
  }

  return { editPost };
}

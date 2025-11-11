import { useRef, useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/config/networkConfig";
import type { Post } from "@/types/types";

type Opts = {
  myProfileId?: string | null;
  onRefetch?: () => void;
  onAfterDelete?: (postId: string) => void;
  moduleName?: string;
  entryName?: string;
};

type OptimisticList = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
};

export function useDeletePost(opts: Opts = {}) {
  const {
    myProfileId,
    onRefetch,
    onAfterDelete,
    moduleName = "social",
    entryName = "delete_post_entry",
  } = opts;

  const packageId = useNetworkVariable("socialPackageId");
  const postsRegistryId = useNetworkVariable("postsRegistryId");

  const sui = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const backupRef = useRef<Post[] | null>(null);

  async function deletePost(postId: string, optimistic?: OptimisticList) {
    if (!myProfileId || !postsRegistryId) {
      throw new Error("IDs requis manquants (myProfileId / postsRegistryId).");
    }
    setDeletingIds((s) => new Set(s).add(postId));

    if (optimistic?.posts && optimistic?.setPosts) {
      backupRef.current = optimistic.posts.slice();
      optimistic.setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      backupRef.current = null;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::${entryName}`,
      arguments: [
        tx.object(postsRegistryId),
        tx.object(myProfileId),
        tx.object(postId),
      ],
    });

    try {
      const res = await signAndExecute({ transaction: tx });
      const digest = (res as any)?.digest;
      if (digest) await sui.waitForTransaction({ digest });

      onRefetch?.();
      onAfterDelete?.(postId);
    } catch (e) {
      if (backupRef.current && optimistic?.setPosts) {
        const backup = backupRef.current;
        optimistic.setPosts(() => backup);
      }
      throw e;
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(postId);
        return n;
      });
      backupRef.current = null;
    }
  }

  return { deletingIds, deletePost };
}

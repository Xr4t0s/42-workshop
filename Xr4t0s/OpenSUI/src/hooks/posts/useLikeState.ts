import { useCallback, useEffect, useMemo, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { useNetworkVariable } from "@/config/networkConfig";
import { LIKE_NFT_TYPE_SUFFIX } from "@/config/constants";

const isMoveObject = (o?: SuiObjectData | null) =>
  !!o?.content && (o.content as any).dataType === "moveObject";

export function useLikeState(postId: string | null | undefined, myAddress: string | null | undefined, myProfileId: string | null | undefined) {
  const sui = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("socialPackageId");
  const likesRegistryId = useNetworkVariable("likesRegistryId");

  const [count, setCount] = useState<number>(0);
  const [likeNftId, setLikeNftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const likeNftType = useMemo(
    () => (typeof packageId === "string" ? `${packageId}${LIKE_NFT_TYPE_SUFFIX}` : null),
    [packageId]
  );

  const fetchCount = useCallback(async () => {
    if (!postId || !likesRegistryId) return setCount(0);
    const obj = await sui.getObject({ id: likesRegistryId, options: { showContent: true, showType: true } });
    const move = (obj as any).data?.content;
    if (move?.dataType !== "moveObject") return setCount(0);
    const countsId: string | null =
      move.fields?.counts?.fields?.id?.id ?? move.fields?.counts?.id?.id ?? null;
    if (!countsId) return setCount(0);

    try {
      const df = await sui.getDynamicFieldObject({
        parentId: countsId,
        name: { type: "address", value: postId },
      });
      const v = (df as any).data?.content?.fields?.value;
      setCount(v ? Number(v) : 0);
    } catch {
      setCount(0);
    }
  }, [sui, likesRegistryId, postId]);

  const fetchMyLikeNft = useCallback(async () => {
    if (!myAddress || !likeNftType || !postId) return setLikeNftId(null);
    let cursor: string | null | undefined = null;
    while (true) {
      const page = await sui.getOwnedObjects({
        owner: myAddress,
        cursor,
        limit: 50,
        options: { showType: true, showContent: true },
      });
      for (const it of page.data) {
        const t = it.data?.type as string | undefined;
        if (t !== likeNftType) continue;
        const f: any = isMoveObject(it.data) ? (it.data!.content as any).fields : null;
        if (f && String(f.post_id) === postId) {
          setLikeNftId(it.data!.objectId!);
          return;
        }
      }
      cursor = page.hasNextPage ? page.nextCursor : null;
      if (!cursor) break;
    }
    setLikeNftId(null);
  }, [sui, myAddress, postId, likeNftType]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCount(), fetchMyLikeNft()]);
    } finally {
      setLoading(false);
    }
  }, [fetchCount, fetchMyLikeNft]);

  useEffect(() => { refetch(); }, [refetch]);

  const toggleLike = useCallback(async () => {
    if (!postId || !likesRegistryId || !myProfileId) return;
    const tx = new Transaction();
    if (likeNftId) {
      tx.moveCall({
        target: `${packageId}::social::unlike_post`,
        arguments: [
          tx.object(likesRegistryId),
          tx.object(myProfileId),
          tx.object(likeNftId),
        ],
      });
    } else {
      tx.moveCall({
        target: `${packageId}::social::like_post`,
        arguments: [
          tx.object(likesRegistryId),
          tx.object(myProfileId),
          tx.object(postId),
        ],
      });
    }

    await signAndExecute(
      { transaction: tx, chain: undefined },
      {
        onSuccess: async () => { await refetch(); },
        onError: () => {  },
      }
    );
  }, [signAndExecute, packageId, likesRegistryId, myProfileId, postId, likeNftId, refetch]);

  return { likeCount: count, liked: !!likeNftId, toggleLike, loading, refetch };
}

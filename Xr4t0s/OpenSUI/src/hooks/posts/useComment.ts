import { useCallback, useEffect, useMemo, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { useNetworkVariable } from "@/config/networkConfig";
import { COMMENT_TYPE_SUFFIX } from "@/config/constants";

export type CommentRow = {
  id: string;
  postId: string;
  author: string;
  authorProfileId: string;
  content: string;
  createdMs: number;
  updatedMs: number;
};

export function useCommentsCount(postId?: string | null) {
  const sui = useSuiClient();
  const commentsRegistryId = useNetworkVariable("commentsRegistryId");
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!postId || !commentsRegistryId) return setCount(0);
    const obj = await sui.getObject({ id: commentsRegistryId, options: { showContent: true, showType: true } });
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
  }, [sui, commentsRegistryId, postId]);

  useEffect(() => { fetchCount(); }, [fetchCount]);
  return { count, refetch: fetchCount };
}

export function useCommentsForPost(postId?: string | null) {
  const sui = useSuiClient();
  const commentsRegistryId = useNetworkVariable("commentsRegistryId");
  const packageId = useNetworkVariable("socialPackageId");
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const commentType = useMemo(
    () => (typeof packageId === "string" ? `${packageId}${COMMENT_TYPE_SUFFIX}` : null),
    [packageId]
  );

  const fetch = useCallback(async () => {
    if (!postId || !commentsRegistryId) { setRows([]); return; }
    setLoading(true);
    try {
      const obj = await sui.getObject({ id: commentsRegistryId, options: { showContent: true, showType: true } });
      const move = (obj as any).data?.content;
      const listId: string | null =
        move?.fields?.comments_of?.fields?.id?.id ?? move?.fields?.comments_of?.id?.id ?? null;
      if (!listId) { setRows([]); setLoading(false); return; }

      let ids: string[] = [];
      try {
        const df = await sui.getDynamicFieldObject({
          parentId: listId,
          name: { type: "address", value: postId },
        });
        const vv = (df as any).data?.content?.fields?.value;
        const vec: string[] = Array.isArray(vv) ? vv.map(String) : (vv?.fields?.contents ?? []);
        ids = vec?.map(String) ?? [];
      } catch {
        ids = [];
      }
      if (ids.length === 0) { setRows([]); setLoading(false); return; }

      const objs = await sui.multiGetObjects({ ids, options: { showType: true, showContent: true } });
      const out: CommentRow[] = [];
      for (const obj2 of objs) {
        const d = obj2.data as SuiObjectData;
        const typ = (d?.content as any)?.type as string | undefined;
        if (!d || !typ || typ !== commentType) continue;
        const f: any = (d!.content as any).fields;
        out.push({
          id: d.objectId!,
          postId: String(f.post_id),
          author: String(f.author),
          authorProfileId: String(f.author_profile_id),
          content: String(f.content ?? ""),
          createdMs: Number(f.created_ms ?? 0),
          updatedMs: Number(f.updated_ms ?? 0),
        });
      }
      out.sort((a,b)=>a.createdMs-b.createdMs);
      setRows(out);
    } finally {
      setLoading(false);
    }
  }, [sui, commentsRegistryId, commentType, postId]);

  useEffect(()=>{ fetch(); }, [fetch]);

  return { rows, loading, refetch: fetch };
}


export function useAddCommentTx(postId?: string | null, myProfileId?: string | null) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("socialPackageId");
  const commentsRegistryId = useNetworkVariable("commentsRegistryId");

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = useCallback(
    async (content: string) => {
      setError(null);
      if (!postId || !myProfileId || !commentsRegistryId) {
        setError("Contexte invalide (postId / myProfileId / registry).");
        return;
      }
      const text = content.trim();
      if (!text) {
        setError("Le commentaire est vide.");
        return;
      }

      setPublishing(true);
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::social::add_comment`,
          arguments: [
            tx.object(commentsRegistryId),
            tx.object(myProfileId),
            tx.object(postId),
            tx.pure.string(text),
			tx.object('0x6')
          ],
        });

        await signAndExecute({
          transaction: tx,
        });
      } catch (e: any) {
        setError(e?.message ?? "Échec de la publication du commentaire.");
      } finally {
        setPublishing(false);
      }
    },
    [packageId, commentsRegistryId, myProfileId, postId, signAndExecute]
  );

  return { addComment, publishing, error };
}
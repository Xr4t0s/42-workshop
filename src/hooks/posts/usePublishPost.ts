import { useRef, useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/config/networkConfig";
import { CHAR_LIMIT } from "@/config/constants";
import type { Post } from "@/types/types";

export function usePublish(myProfileId?: string | null, postsRegId?: string | null, onRefresh?: () => void) {
  const acc = useCurrentAccount();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable("socialPackageId");
  const postsRegistryId = postsRegId ?? useNetworkVariable("postsRegistryId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const remaining = CHAR_LIMIT - content.length;

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const canPublish =
    !!acc?.address && !!myProfileId && !!postsRegistryId &&
    content.trim().length > 0 && remaining >= 0 && !publishing;

  useEffect(() => {
    const el = composerRef.current; if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canPublish) { e.preventDefault(); publish(); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [canPublish, content]);

  function publish(setPosts?: React.Dispatch<React.SetStateAction<Post[]>>) {
    if (!canPublish) return;
    setPublishError(null);
    (async () => {
      try {
        setPublishing(true);
        const body = content.trim();
        const tempId = `temp-${Date.now()}`;

        /*
        setPosts?.((prev) => [{
          id: tempId, content: body,
          created_ms: Number.MAX_SAFE_INTEGER, updated_ms: Number.MAX_SAFE_INTEGER,
          author_profile_id: myProfileId!, author: acc?.address,
        }, ...prev]);
        setContent("");
		*/

        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::social::publish_post`,
          arguments: [tx.object(postsRegistryId!), tx.object(myProfileId!), tx.pure.string(body), tx.object('0x6')],
        });

        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async ({ digest }) => {
              try { await suiClient.waitForTransaction({ digest }); onRefresh?.(); }
              finally {
                setPosts?.((prev) => prev.filter((p) => p.id !== tempId));
                setPublishing(false);
				window.location.reload();
              }
            },
            onError: (e) => {
              setPublishError(e?.message ?? "Publish failed");
              setPosts?.((prev) => prev.filter((p) => p.id !== tempId));
              setPublishing(false);
            },
          }
        );
      } catch (e: any) {
        setPublishError(e?.message ?? "Publish failed");
        setPublishing(false);
      }
    })();
  }

  return { composerRef, content, setContent, publishing, publishError, canPublish, remaining, publish };
}

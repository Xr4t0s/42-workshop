import {
  Box,
  Flex,
  Text,
  Separator,
  Button,
  Tooltip,
  IconButton,
  Badge,
} from "@radix-ui/themes";
import {
  DotsHorizontalIcon,
  HeartIcon,
  ChatBubbleIcon,
  Share2Icon,
  TrashIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import type { SuiObjectResponse, SuiObjectData } from "@mysten/sui/client";
import Composer from "@/components/HomeFeed/components/Composer";
import { ipfsToGateway } from "@/utils/ipfs";
import { fmtEpoch } from "@/utils/epoch";
import { isMoveObject } from "@/utils/move";
import { POST_TYPE_SUFFIX, PROFILE_TYPE_SUFFIX } from "@/config/constants";
import type { Post, Profile } from "@/types/types";
import { useMyProfileId } from "@/hooks/useMyProfileId";
import { useLikeState } from "@/hooks/posts/useLikeState";
import {
  useCommentsCount,
  useCommentsForPost,
  useAddCommentTx,
} from "@/hooks/posts/useComment";
import { useDeletePost } from "@/hooks/posts/useDeletePost";
import { useEditPost } from "@/hooks/posts/useEditPost";

function initialsOf(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+|_/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase();
}
const toNum = (v: any) => {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const hasTypeSuffix = (res: SuiObjectResponse | undefined, suffix: string) =>
  typeof res?.data?.type === "string" && (res!.data!.type as string).endsWith(suffix);

function parsePost(res: SuiObjectResponse): Post | null {
  if (!isMoveObject(res?.data) || !hasTypeSuffix(res, POST_TYPE_SUFFIX)) return null;
  const d = res.data!;
  const f: any = (d.content as any).fields ?? {};
  return {
    id: d.objectId!,
    authorProfileId: String(f.author_profile_id ?? ""),
    author: String(f.author ?? ""),
    content: String(f.content ?? ""),
    createdMs: toNum(f.created_ms),
    updatedMs: toNum(f.updated_ms),
  };
}

function parseProfile(res: SuiObjectResponse): Profile | null {
  if (!isMoveObject(res?.data) || !hasTypeSuffix(res, PROFILE_TYPE_SUFFIX)) return null;
  const d = res.data!;
  const f: any = (d.content as any).fields ?? {};
  return {
    id: d.objectId!,
    owner: String(f.owner ?? ""),
    username: String(f.username ?? ""),
    description: String(f.description ?? ""),
    avatarUrl: String(f.avatar_url ?? ""),
    followers: Array.isArray(f.followers) ? (f.followers as string[]).map(String) : [],
    followed: Array.isArray(f.followed) ? (f.followed as string[]).map(String) : [],
  };
}

function usePostData(postId?: string | null) {
  const sui = useSuiClient();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refetch = async () => {
    if (!postId) {
      setPost(null);
      setErr("ID invalide.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await sui.getObject({
        id: postId,
        options: { showContent: true, showType: true, showOwner: true },
      });
      const p = parsePost(res);
      if (!p) setErr("Cet objet n'est pas un Post valide.");
      setPost(p);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await refetch();
    })();
    return () => {
      alive = false;
    };
  }, [postId]);

  return { post, loading, err, refetch };
}

function useProfileData(profileId?: string | null) {
  const sui = useSuiClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refetch = async () => {
    if (!profileId) {
      setProfile(null);
      setErr(null);
      return;
    }
    setErr(null);
    try {
      const res = await sui.getObject({
        id: profileId,
        options: { showContent: true, showType: true, showOwner: true },
      });
      const p = parseProfile(res);
      if (!p) setErr("Cet objet n'est pas un Profile valide.");
      setProfile(p);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur de chargement du profil.");
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await refetch();
    })();
  return () => { alive = false; };
  }, [profileId]);

  return { profile, err, refetch };
}

type Mini = { username?: string; avatarUrl?: string };
function useMiniProfiles(ids: string[]) {
  const sui = useSuiClient();
  const [map, setMap] = useState<Record<string, Mini>>({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      const uniq = Array.from(new Set(ids.filter(Boolean)));
      if (uniq.length === 0) {
        setMap({});
        return;
      }
      const objs = await sui.multiGetObjects({
        ids: uniq,
        options: { showContent: true, showType: true },
      });
      const out: Record<string, Mini> = {};
      for (const o of objs) {
        const d = o.data as SuiObjectData;
        if (!d || (d.content as any)?.dataType !== "moveObject") continue;
        const typ = (d.content as any)?.type as string | undefined;
        if (!typ || !typ.endsWith(PROFILE_TYPE_SUFFIX)) continue;
        const f: any = (d.content as any).fields;
        out[d.objectId!] = {
          username: String(f.username ?? ""),
          avatarUrl: String(f.avatar_url ?? ""),
        };
      }
      if (!cancel) setMap(out);
    })();
    return () => { cancel = true; };
  }, [sui, JSON.stringify(ids)]);

  return map;
}

export function PageModal() {
  const [hashId, setHashId] = useState<string | null>(null);
  useEffect(() => {
    const parse = () => {
      const m = window.location.hash.match(/^#\/post\/([0-9a-zA-Z:_.-]+)$/);
      setHashId(m ? m[1] : null);
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);

  const { post, loading: loadingPost, err: errPost, refetch: refetchPost } = usePostData(hashId);
  const authorProfileId = post?.authorProfileId ?? null;
  const { profile } = useProfileData(authorProfileId);

  const username = useMemo(
    () => profile?.username || post?.author || "Auteur inconnu",
    [profile?.username, post?.author]
  );
  const handle = username ? `@${username.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}` : "";
  const avatarSrc = ipfsToGateway(profile?.avatarUrl);

  const account = useCurrentAccount();
  const { myProfileId } = useMyProfileId();

  const like = useLikeState(post?.id, account?.address ?? null, myProfileId ?? null);
  const { count: commentsCount, refetch: refetchCommentsCount } = useCommentsCount(post?.id);
  const { rows: comments, loading: loadingComments, refetch: refetchComments } = useCommentsForPost(post?.id);
  const miniByProfile = useMiniProfiles(useMemo(() => comments.map((c) => c.authorProfileId), [comments]));

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const [deleteBusy, setDeleteBusy] = useState(false);

  const canEditOrDelete = useMemo(() => {
    if (!account?.address || !profile?.owner || !post?.authorProfileId || !myProfileId) return false;
    const isOwner = account.address.toLowerCase() === profile.owner.toLowerCase();
    const isMyProfile = myProfileId === post.authorProfileId;
    return isOwner && isMyProfile;
  }, [account?.address, profile?.owner, post?.authorProfileId, myProfileId]);

  const { deletePost } = useDeletePost({
    myProfileId: myProfileId ?? undefined,
    onRefetch: async () => {
      // r à faire ici
    },
    onAfterDelete: () => {
      try { window.history.back(); } catch {}
    },
    moduleName: "social",
    entryName: "delete_post",
  });

  const { editPost } = useEditPost({
    myProfileId: myProfileId ?? undefined,
    postId: post?.id ?? undefined,
    moduleName: "social",
    entryName: "edit_post",
    onRefetch: async () => { await refetchPost(); },
  });

  useEffect(() => {
    if (isEditing && post?.content != null) setEditDraft(post.content);
  }, [isEditing, post?.content]);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const COMMENT_MAX = 280;
  const [draft, setDraft] = useState("");
  const remaining = COMMENT_MAX - draft.length;
  const { addComment, publishing, error: publishErr } = useAddCommentTx(post?.id, myProfileId ?? null);

  const onSendComment = async () => {
    const text = draft.trim();
    if (!text) return;
    await addComment(text);
    setDraft("");
    await Promise.all([refetchComments(), refetchCommentsCount()]);
  };

  const refreshAll = async () => {
    await Promise.all([refetchPost(), refetchComments(), refetchCommentsCount()]);
  };

  return (
    <Box
      style={{
        borderRadius: 16,
        outline: "none",
        border: "1px solid var(--gray-a4)",
        background: "var(--color-panel)",
        boxShadow: "0 10px 28px var(--black-a5)",
        overflow: "hidden",
        padding: 10,
      }}
    >
      <Flex align="end" justify="between" mt="3" px="3" wrap="wrap" gap="3">
        <Flex align="center" gap="3">
          <div
            style={{
              width: 84,
              height: 84,
              minWidth: 84,
              minHeight: 84,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 14px 28px var(--black-a6)",
              border: "3px solid var(--color-panel)",
              overflow: "hidden",
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={username} width={84} height={84} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Flex align="center" justify="center" style={{ width: "100%", height: "100%", background: "var(--gray-6)" }}>
                <Text weight="bold">{initialsOf(username)}</Text>
              </Flex>
            )}
          </div>

          <Box>
            <Flex align="center" gap="2" wrap="wrap">
              <Text weight="bold" size="5">{username}</Text>
              {!!profile?.username && <Badge variant="soft">{handle}</Badge>}
            </Flex>

            <Text as="p" mt="2" color="gray" style={{ maxWidth: 640 }}>
              {profile?.description || "—"}
            </Text>
          </Box>
        </Flex>

        <Flex gap="2">
          <Tooltip content="Rafraîchir">
            <Button size="1" variant="soft" onClick={refreshAll}>
              <ReloadIcon />
            </Button>
          </Tooltip>
          <Tooltip content="Plus d’actions">
            <IconButton variant="ghost" size="1" aria-label="Plus d’actions">
              <DotsHorizontalIcon />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      <Separator my="3" />

      <Box px="3" pb="3">
        {errPost && <Text color="red">{errPost}</Text>}
        {!errPost && !isEditing && (
          <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 15 }}>
            {loadingPost ? "Chargement du contenu…" : post?.content || "— (contenu vide) —"}
          </Text>
        )}

        {isEditing && canEditOrDelete && (
          <Box mt="2">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                font: "inherit",
                lineHeight: 1.5,
                borderRadius: 8,
                padding: 10,
                border: "1px solid var(--gray-a5)",
                background: "var(--color-panel)",
              }}
              maxLength={5000}
            />
            <Flex mt="2" gap="2" justify="end">
              <Button variant="soft" onClick={() => setIsEditing(false)} disabled={editBusy}>
                Annuler
              </Button>
              <Button
                variant="solid"
                onClick={async () => {
                  const content = editDraft.trim();
                  if (!content) return alert("Contenu vide");
                  try {
                    setEditBusy(true);
                    await editPost(content);
                    setIsEditing(false);
                  } catch (e) {
                    console.error(e);
                    alert((e as any)?.message ?? "Échec de l’édition");
                  } finally {
                    setEditBusy(false);
                  }
                }}
                disabled={editBusy}
              >
                {editBusy ? "Saving…" : "Enregistrer"}
              </Button>
            </Flex>
          </Box>
        )}

        <Flex align="center" justify="start" mt="3" gap="2">
          <Tooltip content={like.liked ? "Unlike" : "Like"}>
            <Button
              variant={like.liked ? "solid" : "soft"}
              size="1"
              onClick={async () => {
                await like.toggleLike();
              }}
            >
              <HeartIcon />
              <Text as="span" ml="1">
                {like.likeCount > 0 ? like.likeCount : "Like"}
              </Text>
            </Button>
          </Tooltip>

          <Button variant="soft" size="1" disabled>
            <ChatBubbleIcon />
            <Text as="span" ml="1">
              {commentsCount > 0 ? commentsCount : "Comments"}
            </Text>
          </Button>

          <Tooltip content="Partager">
            <Button
              variant="soft"
              size="1"
              onClick={() => {
                const shareData = {
                  title: username ?? "Post",
                  text: post?.content?.slice(0, 140),
                  url: window.location.href,
                };
                const nav: any = navigator;
                if (nav?.share) nav.share(shareData).catch(() => {});
                else navigator.clipboard?.writeText(window.location.href);
              }}
            >
              <Share2Icon />
              <Text as="span" ml="1">Share</Text>
            </Button>
          </Tooltip>

          {canEditOrDelete && (
            <>
              <Tooltip content={isEditing ? "Annuler l’édition" : "Éditer"}>
                <Button
                  variant={isEditing ? "solid" : "soft"}
                  size="1"
                  onClick={() => setIsEditing((v) => !v)}
                  disabled={loadingPost || !!errPost}
                >
                  ✏️
                  <Text as="span" ml="1">{isEditing ? "Cancel" : "Edit"}</Text>
                </Button>
              </Tooltip>

              <Tooltip content="Supprimer">
                <Button
                  variant="soft"
                  color="red"
                  size="1"
                  disabled={!post?.id || deleteBusy}
                  onClick={async () => {
                    if (!post?.id) return;
                    const ok = window.confirm("Supprimer définitivement ce post ?");
                    if (!ok) return;
                    try {
                      setDeleteBusy(true);
                      await deletePost(post.id);
                    } catch (e) {
                      console.error(e);
                      alert((e as any)?.message ?? "Échec de suppression");
                    } finally {
                      setDeleteBusy(false);
                    }
                  }}
                >
                  <TrashIcon />
                  <Text as="span" ml="1">
                    {deleteBusy ? "Deleting…" : "Delete"}
                  </Text>
                </Button>
              </Tooltip>
            </>
          )}
        </Flex>

        <Separator my="3" />

        <Composer
          disabled={!myProfileId}
          remaining={remaining}
          value={draft}
          setValue={setDraft}
          onPublish={onSendComment}
          composerRef={composerRef}
          error={publishErr ?? undefined}
          publishing={publishing}
        />

        <Box mt="3">
          {loadingComments ? (
            <Text color="gray">Chargement des commentaires…</Text>
          ) : comments.length === 0 ? (
            <Text color="gray">Aucun commentaire.</Text>
          ) : (
            <Flex direction="column" gap="2" mt="2">
              {comments.map((c) => {
                const mini = miniByProfile[c.authorProfileId] || {};
                const name = mini.username || c.authorProfileId.slice(0, 10) + "…";
                const handle =
                  mini.username ? `@${mini.username.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}` : "";
                const ava = ipfsToGateway(mini.avatarUrl);

                return (
                  <Box
                    key={c.id}
                    style={{
                      border: "1px solid var(--gray-a4)",
                      borderRadius: 10,
                      padding: 10,
                      background: "var(--color-panel)",
                    }}
                  >
                    <Flex align="start" gap="3">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          minWidth: 32,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "1px solid var(--gray-a5)",
                          background: "white",
                        }}
                      >
                        {ava ? (
                          <img
                            src={ava}
                            alt={name}
                            width={32}
                            height={32}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Flex align="center" justify="center" style={{ width: "100%", height: "100%", background: "var(--gray-6)" }}>
                            <Text size="1" weight="bold">{initialsOf(name)}</Text>
                          </Flex>
                        )}
                      </div>

                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap="2" wrap="wrap">
                          <Text weight="bold">{name}</Text>
                          {handle && <Badge variant="soft">{handle}</Badge>}
                          <Text size="1" color="gray">· {fmtEpoch(c.createdMs)}</Text>
                        </Flex>
                        <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginTop: 4 }}>
                          {c.content}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}
        </Box>
      </Box>
    </Box>
  );
}

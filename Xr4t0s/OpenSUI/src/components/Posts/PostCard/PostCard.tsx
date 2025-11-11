import { useMemo } from "react";
import { Box, Button, Flex, Text, Separator, Tooltip } from "@radix-ui/themes";
import { HeartIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { ipfsToGateway } from "@/utils/ipfs";
import { fmtEpoch } from "@/utils/epoch";
import AvatarDot from "@/components/HomeFeed/components/AvatarDot";
import type { Post } from "@/types/types";
import { useLikeState } from "@/hooks/posts/useLikeState";

type AuthorMini = { username?: string; avatarUrl?: string };

type Props = {
  post: Post;
  profile?: AuthorMini;
  onOpenPost?: (postId: string) => void;
  liked?: boolean;
  likeCount?: number;
  onToggleLike?: () => void;
  enableLikeHook?: boolean;
  myAddress?: string | null;
  myProfileId?: string | null;
  onAfterInteraction?: () => void;
};

export default function PostCard(props: Props) {
  const {
    post,
    profile,
    onOpenPost,
    liked,
    likeCount,
    onToggleLike,
    enableLikeHook = false,
    myAddress,
    myProfileId,
	onAfterInteraction,
  } = props;

  const avatarSrc = useMemo(() => ipfsToGateway(profile?.avatarUrl), [profile?.avatarUrl]);
  const open = () => onOpenPost?.(post.id);

  const likeHook = enableLikeHook
    ? useLikeState(post.id, myAddress ?? null, myProfileId ?? null)
    : null;

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Open post"
      onClick={open}
      style={{
        padding: 14,
        borderRadius: 12,
        cursor: onOpenPost ? "pointer" : "default",
        border: "1px solid var(--gray-a4)",
        background: "var(--color-panel)",
        boxShadow: "0 6px 18px var(--black-a4)",
        transition:
          "transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease",
        outline: "none",
      }}
    >
      <Flex align="center" justify="between">
        <Flex align="center" gap="2">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={profile?.username ?? "avatar"}
              width={36}
              height={36}
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--gray-a5)",
              }}
            />
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <AvatarDot seed={post.authorProfileId} />
            </div>
          )}

          <Flex direction="column" style={{ minWidth: 0 }}>
            <Text
              weight="bold"
              onClick={(e) => e.stopPropagation()}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 260,
              }}
            >
              {profile?.username ?? post.authorProfileId}
            </Text>
            <Text size="1" color="gray" onClick={(e) => e.stopPropagation()}>
              {fmtEpoch(post.createdMs)}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Separator my="2" />

      <Flex direction="column" p="3" gap="3">
        <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14 }}>
          {post.content}
        </Text>

        <Flex align="center" gap="2">
          {enableLikeHook && likeHook && (
            <Tooltip content={likeHook.liked ? "Unlike" : "Like"}>
              <Button
                variant={likeHook.liked ? "solid" : "soft"}
                size="1"
                onClick={(e) => {
                  e.stopPropagation();
                  likeHook.toggleLike();
                }}
              >
                <HeartIcon />
                <Text as="span" ml="1">
                  {likeHook.likeCount > 0 ? likeHook.likeCount : "Like"}
                </Text>
              </Button>
            </Tooltip>
          )}

          {!enableLikeHook && onToggleLike != null && (
            <Tooltip content={liked ? "Unlike" : "Like"}>
              <Button
                variant={liked ? "solid" : "soft"}
                size="1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike();
				  onAfterInteraction?.();
                }}
              >
                <HeartIcon />
                <Text as="span" ml="1">
                  {likeCount && likeCount > 0 ? likeCount : "Like"}
                </Text>
              </Button>
            </Tooltip>
          )}

          {onOpenPost && (
            <Tooltip content="Commenter">
              <Button
                variant="soft"
                size="1"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                <ChatBubbleIcon />
                <Text as="span" ml="1">
                  Comment
                </Text>
              </Button>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

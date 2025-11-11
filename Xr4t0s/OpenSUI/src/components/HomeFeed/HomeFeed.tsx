import { useEffect } from "react";
import { Flex, Heading, IconButton, Separator, Text, Tooltip, Button } from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { useMyProfileId } from "@/hooks/useMyProfileId";
import { useHomeFeed } from "@/hooks/feed/useHomeFeed";
import { usePublish } from "@/hooks/posts/usePublishPost";

import Composer from "./components/Composer";
import PostCard from "@/components/Posts/PostCard/PostCard";
import SkeletonList from "./components/SkeletonList";
import { navigate } from "@/routes/router";

export function HomeFeed() {
  const acc = useCurrentAccount();
  const { myProfileId } = useMyProfileId();

  const {
    posts,
    profiles,
    loadingPosts,
    loadError,
    visiblePosts,
    hasMore,
    setVisibleCount,
    manualRefresh,
  } = useHomeFeed(myProfileId || undefined);

  const {
    composerRef,
    content,
    setContent,
    publishing,
    publishError,
    remaining,
    publish,
  } = usePublish(myProfileId || undefined, undefined, manualRefresh);

  useEffect(() => {
    manualRefresh();
  }, [acc?.address, myProfileId]);

  const handlePublish = async () => {
    await publish((u) => u);
    setVisibleCount((n) => Math.max(12, n));
    manualRefresh();
  };

  const afterInteraction = () => {
    manualRefresh();
  };

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" justify="between">
        <Heading size="4">Home</Heading>
        <Tooltip content="Rafraîchir">
          <IconButton variant="soft" onClick={manualRefresh} className="btn-ghost">
            <ReloadIcon />
          </IconButton>
        </Tooltip>
      </Flex>
      <Separator my="1" />

      <Composer
        disabled={!acc?.address || !myProfileId}
        remaining={remaining}
        value={content}
        setValue={setContent}
        onPublish={handlePublish}
        composerRef={composerRef as any}
        error={publishError}
        publishing={publishing}
      />

      {loadingPosts ? (
        <SkeletonList count={5} />
      ) : loadError ? (
        <Text color="red">Impossible de charger le flux : {loadError}</Text>
      ) : posts.length === 0 ? (
        <Text color="gray">Aucun post à afficher pour le moment. Suivez des profils ou publiez quelque chose !</Text>
      ) : (
        <>
          {visiblePosts.map((p) => {
            const prof = profiles[p.authorProfileId];
            return (
              <PostCard
                key={p.id}
                post={p}
                profile={prof}
                onOpenPost={(id) => navigate({ name: "post", id })}
                enableLikeHook
                myAddress={acc?.address ?? null}
                myProfileId={myProfileId ?? null}
                onAfterInteraction={afterInteraction}
              />
            );
          })}

          {hasMore && (
            <Flex justify="center" mt="2">
              <Button variant="soft" onClick={() => setVisibleCount((n) => n + 12)}>
                Voir plus
              </Button>
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
}

export default HomeFeed;

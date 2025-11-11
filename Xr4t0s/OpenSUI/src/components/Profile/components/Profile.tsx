import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Avatar, Badge, Box, Callout, Flex, Heading, Separator, Tabs, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "@/config/networkConfig";
import { PROFILE_TYPE_SUFFIX } from "@/config/constants";
import { isMoveObject, ipfsToGateway, copyToClipboard, mapMoveToProfile } from "@/utils";
import type { Profile as ProfileType } from "@/types/types";

import { useMyProfileIdFromRegistry } from "@/hooks/profiles/useMyProfileIdFromRegistry";
import { useMyFollowNftForTarget } from "@/hooks/profiles/useMyFollowNftForTarget";
import { useFollowersCount } from "@/hooks/profiles/useFollowersCount";
import { useProfileFeed } from "@/hooks/profiles/useProfileFeed";
import { FollowActions } from "./FollowActions";
import { StatsBar } from "./StatsBar";
import { Bio } from "./Bio";
import PostCard from "@/components/Posts/PostCard/PostCard";

import { AboutPane } from "./AboutPane";
import { ProfilesModal } from "./ProfileModal";
import { navigate } from "@/routes/router";

export function Profile({ id }: { id: string }) {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const packageId = useNetworkVariable("socialPackageId");
  const followersRegistryId = useNetworkVariable("followersRegistryId");

  const query = useSuiClientQuery("getObject", {
    id,
    options: { showContent: true, showOwner: true, showType: true },
  });

  const profile: ProfileType | null = useMemo(() => {
    const obj = query.data?.data;
    if (!isMoveObject(obj)) return null;
    const typ = (obj.content as any).type as string;
    if (!typ.endsWith(PROFILE_TYPE_SUFFIX)) return null;
    return mapMoveToProfile(obj);
  }, [query.data]);

  const ownedByCurrent = !!profile && profile.owner?.toLowerCase() === account?.address?.toLowerCase();

  const { profileId: myProfileId } = useMyProfileIdFromRegistry(account?.address);

  const { nftId: followNftId, refresh: refreshFollow } = useMyFollowNftForTarget(id, {
    pollMs: 1500,
    maxTries: 30,
  });
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const toggleLike = (id: string) => {
    setLiked((prev) => {
    	const next = !prev[id];
    	setLikes((prevLikes) => ({
        ...prevLikes,
    	  [id]: (prevLikes[id] ?? 0) + (next ? 1 : -1),
    	}));
    	return { ...prev, [id]: next };
    });
  };
  const [followersBump, setFollowersBump] = useState(0);
  const followersCount = useFollowersCount(id, followersBump);
  const followingCountLocal = profile ? profile.followed.length : 0;

  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);
  useEffect(() => setOptimisticFollowing(null), [id, account?.address]);

  const [waiting, setWaiting] = useState<"" | "follow" | "unfollow">("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const linkTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (linkTimer.current !== null) {
        window.clearTimeout(linkTimer.current);
    	linkTimer.current = null;
      }
    };
  }, []);


  const initialsFromName = (name?: string) =>
    (name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";

  async function assertMyProfileIsValid(): Promise<true> {
    if (!myProfileId) throw new Error("No profile id (create your profile first).");
    const obj = await sui.getObject({ id: myProfileId, options: { showType: true, showOwner: true, showContent: true } });
    const typ = (obj.data?.content as any)?.type as string | undefined;
    const owner = obj.data?.owner as any;
    if (!typ?.endsWith(PROFILE_TYPE_SUFFIX)) throw new Error(`myProfileId is not social::Profile (got: ${typ ?? "unknown"})`);
    if (!owner?.AddressOwner || owner.AddressOwner !== account?.address) throw new Error("You are not the owner of this Profile");
    const pkgOfObj = typ.split("::")[0];
    if (pkgOfObj.toLowerCase() !== packageId.toLowerCase()) {
      throw new Error(`Profile type mismatch (expected ${packageId}, got ${pkgOfObj})`);
    }
    return true;
  }

  const doFollow = async () => {
    try {
      setErrorMsg(null);
      if (!account?.address) return;
      if (ownedByCurrent) return setErrorMsg("Tu ne peux pas te suivre toi-même.");
      if (!followersRegistryId) return setErrorMsg("FollowersRegistryId manquant/invalid.");
      await assertMyProfileIsValid();

      setWaiting("follow");
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::social::follow`,
        arguments: [tx.object(followersRegistryId), tx.object(myProfileId!), tx.pure.address(id)],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            await sui.waitForTransaction({ digest });
            setOptimisticFollowing(true);
            refreshFollow();
            setFollowersBump((n) => n + 1);
            await query.refetch();
            setWaiting("");
          },
          onError: (e) => {
            setErrorMsg(e?.message || "Tx failed.");
            setWaiting("");
          },
        }
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? String(e));
      setWaiting("");
    }
  };

  const doUnfollow = async () => {
    try {
      setErrorMsg(null);
      if (!followersRegistryId) return setErrorMsg("FollowersRegistryId manquant/invalid.");
      await assertMyProfileIsValid();
      if (!followNftId) return setErrorMsg("Aucun FollowNFT trouvé pour ce profil.");

      setWaiting("unfollow");
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::social::unfollow`,
        arguments: [tx.object(followersRegistryId), tx.object(myProfileId!), tx.object(followNftId)],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            await sui.waitForTransaction({ digest });
            setOptimisticFollowing(false);
            refreshFollow();
            setFollowersBump((n) => n + 1);
            await query.refetch();
            setWaiting("");
          },
          onError: (e) => {
            setErrorMsg(e?.message || "Tx failed.");
            setWaiting("");
          },
        }
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? String(e));
      setWaiting("");
    }
  };

  const { posts, loadingPosts } = useProfileFeed(id);

  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const followerIds = profile?.followers ?? [];
  const followingIds = profile?.followed ?? [];

  const openProfilePage = (pid: string) => navigate({ name: "profile", id: pid });

  if (query.isPending) {
    return (
      <Box>
        <div style={{ height: 200, borderRadius: 12, background: "var(--gray-a3)" }} />
        <div style={{ height: 90 }} />
      </Box>
    );
  }
  if (query.error) return <Text color="red">Error: {(query.error as any)?.message ?? String(query.error)}</Text>;
  if (!profile) return <Text>Object {id} is not a social::Profile</Text>;

  const initials = initialsFromName(profile.username);
  const avatarSrc = ipfsToGateway(profile.avatarUrl);

  const isFollowing = optimisticFollowing ?? !!followNftId;
  const disabled = waiting !== "" || !myProfileId || !followersRegistryId;

  const copyLink = async () => {
    const url = `${window.location.origin}/profile/${id}`;
    const ok = await copyToClipboard(url);
    setCopiedLink(ok);
    linkTimer.current = window.setTimeout(() => setCopiedLink(false), 1200);
  };

  return (
    <Box>
      <Box style={{ height: 220, borderRadius: 16, background: "linear-gradient(135deg, var(--indigo-5), var(--violet-6))" }} />

      <Flex align="end" justify="between" mt="-48" px="3" wrap="wrap" gap="3">
        <Flex align="center" gap="3">
          <Avatar
            src={avatarSrc}
            fallback={initials}
            radius="full"
            size="7"
            style={{
              border: "3px solid var(--color-panel)",
              boxShadow: "0 10px 28px var(--black-a4)",
              background: "white",
            }}
          />
          <Box>
            <Flex align="center" gap="2">
              <Heading size="5">{profile.username || "Unnamed"}</Heading>
              {!!profile.username && <Badge variant="soft">@{profile.username.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}</Badge>}
            </Flex>

            <StatsBar
              followersCount={followersCount}
              followingCount={followingCountLocal}
              copiedLink={copiedLink}
              onCopyLink={copyLink}
              onRefresh={() => query.refetch()}
              onFollowersClick={() => setListOpen("followers")}
              onFollowingClick={() => setListOpen("following")}
            />
          </Box>
        </Flex>

        <FollowActions
          ownedByCurrent={ownedByCurrent}
          isFollowing={isFollowing}
          waiting={waiting}
          onFollow={doFollow}
          onUnfollow={doUnfollow}
          followDisabled={disabled}
          unfollowDisabled={disabled || !isFollowing}
        />
      </Flex>

      <Bio description={profile.description} />

      <Separator my="3" />

      <Tabs.Root defaultValue="posts">
        <Tabs.List>
          <Tabs.Trigger value="posts">Posts</Tabs.Trigger>
          <Tabs.Trigger value="about">About</Tabs.Trigger>
        </Tabs.List>
        <Box mt="3">
          <Tabs.Content value="posts">
			{loadingPosts ? (
				<Text color="gray">Chargement…</Text>
			) : posts.length === 0 ? (
				<Text color="gray">Aucun post pour ce profil.</Text>
			) : (
				<Flex direction="column" gap="3">
				{posts.map((p) => {
					const prof = {
					username: profile.username,
					avatarUrl: profile.avatarUrl,
					};
					const likeCount = likes[p.id] ?? 0;
					const isLiked = liked[p.id] ?? false;

					return (
					<PostCard
						key={p.id}
						post={p}
						profile={prof}
						onOpenPost={(pid) => navigate({ name: "post", id: pid })}
						liked={isLiked}
						likeCount={likeCount}
						onToggleLike={() => toggleLike(p.id)}
					/>
					);
				})}
				</Flex>
			)}
			</Tabs.Content>
          <Tabs.Content value="about">
            <AboutPane owner={profile.owner} id={id} />
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {errorMsg && (
        <Callout.Root color="red" variant="soft" mt="3">
          <Callout.Text>{errorMsg}</Callout.Text>
        </Callout.Root>
      )}

      <ProfilesModal
        open={listOpen === "followers"}
        onOpenChange={(v) => setListOpen(v ? "followers" : null)}
        title="Followers"
        ids={followerIds}
        onOpenProfile={(pid) => {
          openProfilePage(pid);
          setListOpen(null);
        }}
      />
      <ProfilesModal
        open={listOpen === "following"}
        onOpenChange={(v) => setListOpen(v ? "following" : null)}
        title="Following"
        ids={followingIds}
        onOpenProfile={(pid) => {
          openProfilePage(pid);
          setListOpen(null);
        }}
      />
    </Box>
  );
}

import { Heading, Flex, Text, Box, Theme, Separator } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useMemo } from "react";

import { Profile } from "./components/Profile/components/Profile";
import { CreateProfile } from "./components/CreateProfile";
import { ProfilesList } from "./components/Profiles/ProfilesList";
import { ProfilesFollowingList } from "./components/Following";
import { HomeFeed } from "./components/HomeFeed";
import { PageModal } from "./components/Posts/FullPost/PostPage";

import { TopNav } from "./layout/TopNav";
import { LeftRail } from "./layout/LeftRail/LeftRail";
import { PageShellWithRightRail } from "./layout/RightRail/RightRail";
import { PageShell } from "./layout/PageShell";
import { SectionCard } from "./layout/SectionCard";
import { MobileTabBar } from "./layout/MobileTabBar";

import { useMyProfileId } from "./hooks/useMyProfileId";
import { useRoute } from "./routes/useRoute";
import { navigate } from "./routes/router";

export default function App() {
  const currentAccount = useCurrentAccount();
  const { myProfileId } = useMyProfileId();
  const { route, activeTab } = useRoute();

  const hasProfile = !!myProfileId;
  const openProfile = (id: string) => navigate({ name: "profile", id });

  const main = useMemo(() => {
    switch (route.name) {
      case "home":
        return <HomeFeed />;

      case "profile":
        return (
          <SectionCard>
            <Profile id={route.id} />
          </SectionCard>
        );

      case "me":
        return hasProfile ? <Profile id={myProfileId!} /> : <CreateProfile />;

      case "following":
        return (
          <ProfilesFollowingList
            myAddress={currentAccount?.address ?? null}
            onOpen={openProfile}
          />
        );

      case "post":
        return <PageModal />;

      default:
        return hasProfile ? <ProfilesList onOpen={openProfile} /> : <CreateProfile />;
    }
  }, [route, hasProfile, myProfileId, currentAccount?.address]);

  return (
    <Theme appearance="inherit" accentColor="indigo" grayColor="slate" radius="large" scaling="95%">
      <PageShell
        bottomNav={
          <MobileTabBar
            active={route.name as any}
            onHome={() => navigate({ name: "home" })}
            onExplore={() => navigate({ name: "explore" })}
            onFollowing={() => navigate({ name: "following" })}
            onMe={() => navigate({ name: "me" })}
          />
        }
      >
        <TopNav
          activeTab={activeTab}
          hasProfile={hasProfile}
          onHome={() => navigate({ name: "home" })}
          onExplore={() => navigate({ name: "explore" })}
          onFollowing={() => navigate({ name: "following" })}
          onMe={() => navigate({ name: "me" })}
        />

        <Flex
          mt="4"
          gap="4"
          direction="row"
          align="stretch"
          style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          <SectionCard
            className="hide-lg" style={{ display: "flex", maxHeight: "80%" }}
          >
            <LeftRail
              hasProfile={hasProfile}
              myProfileId={myProfileId}
              currentAddress={currentAccount?.address}
              openExplore={() => navigate({ name: "explore" })}
              openFollowing={() => navigate({ name: "following" })}
              openMeOrCreate={() => navigate({ name: "me" })}
              openMyProfile={() =>
                myProfileId ? navigate({ name: "profile", id: myProfileId }) : navigate({ name: "me" })
              }
              openHome={() => navigate({ name: "home" })}
            />
          </SectionCard>

          <Flex
            direction="column"
            gap="4"
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto" }}
          >
            {currentAccount ? (
              main
            ) : (
              <SectionCard>
                <Flex direction="column" gap="3">
                  <Heading size="4">Please connect your wallet</Heading>
                  <Separator my="2" />
                  <Box className="skel" style={{ height: 22, width: "60%" }} />
                  <Box className="skel" style={{ height: 22, width: "40%" }} />
                  <Box className="skel" style={{ height: 200, width: "100%" }} />
                </Flex>
              </SectionCard>
            )}

            <SectionCard>
              <Flex justify="between" align="center" wrap="nowrap" gap="2">
                <Text size="2" color="gray">Built on Sui • Radix Themes UI</Text>
                <Text size="2" color="gray">Tip: use the left menu to open your own profile faster.</Text>
              </Flex>
            </SectionCard>
          </Flex>

          <SectionCard className="hide-lg">
            <PageShellWithRightRail />
          </SectionCard>
        </Flex>
      </PageShell>
    </Theme>
  );
}

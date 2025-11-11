import { useEffect } from "react";
import {
  Heading,
  Box,
  Button,
  Flex,
  Text,
  Separator,
} from "@radix-ui/themes";
import { flatCard } from "./styles";
import { MiniProfileCard } from "./components/ProfileCard";
import { NavButton } from "./components/Navigation";
import { AddressRow } from "./components/Addresses";

type Props = {
  hasProfile: boolean;
  myProfileId: string | null;
  currentAddress?: string;
  openHome(): void;
  openExplore(): void;
  openFollowing(): void;
  openMeOrCreate(): void;
  openMyProfile(): void;
  counts?: {
    following?: number;
    suggestions?: number;
  };
};

export function LeftRail({
  hasProfile,
  myProfileId,
  currentAddress,
  openHome,
  openExplore,
  openFollowing,
  openMeOrCreate,
  openMyProfile,
  counts,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        e.defaultPrevented ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el?.isContentEditable
      ) return;
      const k = e.key.toLowerCase();
      if (k === "h") openHome();
      if (k === "e") openExplore();
      if (k === "f") openFollowing();
      if (k === "m") openMeOrCreate();
      if (k === "o" && hasProfile) openMyProfile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasProfile, openExplore, openFollowing, openMeOrCreate, openMyProfile, openHome]);

  return (
    <Flex direction="column" gap="4" style={{ width: 280, flex: 1, minHeight: 0 }}>
      <Box style={flatCard}>
        <Heading size="3">Menu</Heading>
        <Text size="1" color="gray">
          Shortcuts: <b>H</b>/<b>E</b>/<b>F</b>/<b>M</b>/<b>O</b>
        </Text>
      </Box>

      <Flex direction="column" gap="2">
        <NavButton emoji="🏠" label="Home" sub="Your feed" onClick={openHome} shortcut="H" />
        <NavButton
          emoji="🔍"
          label="Explore"
          sub="Discover public profiles"
          onClick={openExplore}
          shortcut="E"
          badge={counts?.suggestions}
        />
        <NavButton
          emoji="🧭"
          label="Following"
          sub="People you follow"
          onClick={openFollowing}
          shortcut="F"
          badge={counts?.following}
        />
      </Flex>

      <Separator my="2" />

      {hasProfile ? (
        <MiniProfileCard myProfileId={myProfileId} onOpenMyProfile={openMyProfile} />
      ) : (
        <Box style={flatCard}>
          <Button
            variant="soft"
            onClick={openMeOrCreate}
            style={{ justifyContent: "flex-start", width: "100%" }}
            aria-label="Create my profile"
          >
            <Flex align="center" gap="3">
              <span style={{ fontSize: 18 }} aria-hidden="true">➕</span>
              <Box>
                <Text weight="bold">Create my profile</Text>
                <Text size="1" color="gray" style={{ display: "block" }}>
                  Set username &amp; bio to get started
                </Text>
              </Box>
            </Flex>
          </Button>
        </Box>
      )}

      <Separator my="2" />

      <Box style={flatCard}>
        <Flex direction="column" gap="2">
          <AddressRow address={currentAddress} label="Connected" />
          {hasProfile && myProfileId && <AddressRow address={myProfileId} label="Profile" />}
        </Flex>
      </Box>
    </Flex>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Flex, Heading, IconButton, Dialog, Separator,
} from "@radix-ui/themes";
import {
  HomeIcon, RocketIcon, PersonIcon, HeartIcon, HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { ConnectButton } from "@mysten/dapp-kit";

function useIsDesktop(minWidth = 900) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= minWidth : true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= minWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [minWidth]);
  return isDesktop;
}

type Props = {
  activeTab: "home" | "explore" | "following" | "me" | { kind: string; id: string; };
  hasProfile: boolean;
  onHome(): void;
  onExplore(): void;
  onFollowing(): void;
  onMe(): void;
};

export function TopNav({
  activeTab, hasProfile, onHome, onExplore, onFollowing, onMe,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const isDesktop = useIsDesktop(900);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shadow = useMemo(
    () => (scrolled ? "0 8px 18px var(--black-a3)" : "0 2px 8px var(--black-a2)"),
    [scrolled]
  );

  const NavButtons = ({ vertical = false }: { vertical?: boolean }) => (
    <Flex direction={vertical ? "column" : "row"} gap="2" align={vertical ? "stretch" : "center"}>
      <Button variant={activeTab === "home" ? "solid" : "soft"} highContrast={activeTab === "home"} onClick={onHome}>
        <HomeIcon /><span style={{ marginLeft: 6 }}>Home</span>
      </Button>
      <Button variant={activeTab === "explore" ? "solid" : "soft"} highContrast={activeTab === "explore"} onClick={onExplore}>
        <RocketIcon /><span style={{ marginLeft: 6 }}>Explore</span>
      </Button>
      <Button variant={activeTab === "following" ? "solid" : "soft"} highContrast={activeTab === "following"} onClick={onFollowing}>
        <HeartIcon /><span style={{ marginLeft: 6 }}>Following</span>
      </Button>
      <Button variant={activeTab === "me" ? "solid" : "soft"} highContrast={activeTab === "me"} onClick={onMe}>
        <PersonIcon /><span style={{ marginLeft: 6 }}>Me</span>
        {hasProfile && (
          <span aria-hidden style={{
            width: 8, height: 8, borderRadius: 999, background: "var(--green-9)", marginLeft: 8,
            boxShadow: "0 0 0 2px color-mix(in oklab, var(--color-panel), transparent 40%)",
          }}/>
        )}
      </Button>
    </Flex>
  );

  return (
    <Box
      asChild
      style={{
        position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)",
        background: "color-mix(in oklab, var(--color-panel), transparent 12%)",
        borderBottom: "1px solid var(--gray-a3)", boxShadow: shadow,
      }}
    >
      <header>
        <Flex px="4" py="2" justify="between" align="center" gap="3" wrap="nowrap">
          <Heading
            size="4"
            onClick={onHome}
            aria-label="Go to home"
            style={{
              background: "none", border: 0, cursor: "pointer", lineHeight: 1.2, padding: 0,
              color: "var(--accent-11)", textShadow: "0 1px 0 var(--black-a2)", whiteSpace: "nowrap",
            }}
          >
            OpenSui
          </Heading>

          {isDesktop ? (
            <Flex align="center" gap="3" style={{ whiteSpace: "nowrap" }}>
              <NavButtons />
              <ConnectButton />
            </Flex>
          ) : (
            <Flex align="center" gap="2">
              <Dialog.Root>
				<Dialog.Trigger>
					<IconButton variant="soft" aria-label="Open menu">
					<HamburgerMenuIcon />
					</IconButton>
				</Dialog.Trigger>

				<Dialog.Content
					aria-describedby={undefined}
					size="3"
					style={{ maxWidth: 420, width: "calc(100vw - 24px)" }}
				>
					<Dialog.Title>
					<Heading as="h1" size="4">Menu</Heading>
					</Dialog.Title>

					<Separator my="3" />

					<Flex direction="column" gap="3">
					<Dialog.Close>
						<div><NavButtons vertical /></div>
					</Dialog.Close>

					<Separator my="3" />
					<Box>
						<ConnectButton />
					</Box>
					</Flex>
				</Dialog.Content>
			  </Dialog.Root>
            </Flex>
          )}
        </Flex>
      </header>
    </Box>
  );
}

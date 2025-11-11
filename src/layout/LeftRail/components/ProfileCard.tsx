import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton, Box, Flex, Text, Tooltip, Separator, Avatar } from "@radix-ui/themes";
import { CopyIcon, CheckIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { PROFILE_TYPE_SUFFIX } from "@/config/constants";
import { isMoveObject } from "@/utils/move";
import { ipfsToGateway } from "@/utils/ipfs";
import { shortAddr } from "@/utils/strings";
import { copyToClipboard } from "@/utils/clipboard";

export function MiniProfileCard({
  myProfileId,
  onOpenMyProfile,
}: {
  myProfileId: string | null;
  onOpenMyProfile: () => void;
}) {
  if (!myProfileId) return null;

  const { data, isLoading } = useSuiClientQuery("getObject", {
    id: myProfileId,
    options: { showContent: true, showType: true },
  });

  const { username, description, avatarUrl } = useMemo(() => {
    const d = data?.data;
    if (!isMoveObject(d)) return { username: "", description: "", avatarUrl: "" };
    const typ = (d?.content as any)?.type as string | undefined;
    if (!typ || !typ.endsWith(PROFILE_TYPE_SUFFIX)) return { username: "", description: "", avatarUrl: "" };
    const f: any = (d!.content as any).fields;
    return {
      username: String(f.username ?? ""),
      description: String(f.description ?? ""),
      avatarUrl: String(f.avatar_url ?? ""),
    };
  }, [data?.data]);

  const initials = useMemo(() => {
    const clean = (username || "").trim();
    if (!clean) return "U";
    const parts = clean.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }, [username]);

  const avatarSrc = ipfsToGateway(avatarUrl);
  const shortId = shortAddr(myProfileId || undefined);

  const [copied, setCopied] = useState(false);
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, []);

  const copyId = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!myProfileId) return;
    const ok = await copyToClipboard(myProfileId);
    setCopied(ok);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setCopied(false), 1200);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenMyProfile();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Open my profile"
      onClick={onOpenMyProfile}
      onKeyDown={onKeyDown}
      p="3"
      style={{
        border: "1px solid var(--gray-a4)",
        borderRadius: 14,
        background: "var(--color-panel)",
        boxShadow: "0 6px 18px var(--black-a5)",
        transition:
          "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease",
        cursor: "pointer",
        outline: "none",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-8), 0 8px 22px var(--black-a6)";
        e.currentTarget.style.borderColor = "var(--accent-8)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 18px var(--black-a5)";
        e.currentTarget.style.borderColor = "var(--gray-a4)";
      }}
    >
      <Flex align="center" justify="between" gap="3" style={{ minWidth: 0 }}>
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Avatar
            src={isLoading ? undefined : avatarSrc}
            fallback={initials}
            radius="full"
            size="5"
            style={{ background: "white", boxShadow: "0 4px 10px var(--black-a5)" }}
          />
          <Box style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
              {username || "My Profile"}
            </Text>
            <Flex align="center" gap="2">
              <Text
                size="1"
                color="gray"
                style={{ wordBreak: "break-all", fontFamily: "monospace" }}
                title={myProfileId || ""}
              >
                {shortId}
              </Text>
              <Tooltip content={copied ? "Copied!" : "Copy ID"}>
                <IconButton
                  variant="soft"
                  size="1"
                  color="gray"
                  onClick={copyId}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Copy profile id"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </Tooltip>
            </Flex>
          </Box>
        </Flex>

        <ExternalLinkIcon style={{ opacity: 0.6 }} />
      </Flex>

      <Separator my="2" />

      <Text size="1" color="gray" style={{ display: "block", lineHeight: 1.5 }}>
        {description || "View and edit your profile on-chain."}
      </Text>
    </Box>
  );
}

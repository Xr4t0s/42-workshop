import { Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";
import { CheckIcon, CopyIcon, ReloadIcon } from "@radix-ui/react-icons";
import * as React from "react";

type Props = {
  followersCount: number | null;
  followingCount: number;
  copiedLink: boolean;
  onCopyLink: () => void;
  onRefresh: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
};

function ClickableStat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <Text size="2" color="gray">
        <b>{value}</b> {label}
      </Text>
    );
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: 8,
        outline: "none",
        transition:
          "transform 120ms ease, background 120ms ease, box-shadow 120ms ease, color 120ms ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-8)";
        e.currentTarget.style.background = "color-mix(in oklab, var(--accent-3), transparent 60%)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Text size="2" color="gray">
        <b>{value}</b> {label}
      </Text>
    </div>
  );
}

export function StatsBar({
  followersCount,
  followingCount,
  copiedLink,
  onCopyLink,
  onRefresh,
  onFollowersClick,
  onFollowingClick,
}: Props) {
  return (
    <Flex align="center" gap="3" mt="1" wrap="wrap">
      <ClickableStat
        label="followers"
        value={followersCount ?? "…"}
        onClick={onFollowersClick}
      />
      <ClickableStat
        label="following"
        value={followingCount}
        onClick={onFollowingClick}
      />

      <Tooltip content={copiedLink ? "Copied!" : "Copy profile link"}>
        <IconButton variant="soft" onClick={onCopyLink} aria-label="Copy profile link">
          {copiedLink ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip content="Refresh">
        <IconButton variant="soft" onClick={onRefresh} aria-label="Refresh">
          <ReloadIcon />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}

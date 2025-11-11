import { Avatar, Badge, Box, Flex, Text } from "@radix-ui/themes";
import { ipfsToGateway } from "@/utils/ipfs";
import type { FollowingRow } from "../hooks/useFollowingRows";

export function FollowingCard({
  r,
  onOpen,
}: {
  r: FollowingRow;
  onOpen: (id: string) => void;
}) {
  const avatarSrc = ipfsToGateway(r.avatar_url);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(r.profileId);
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(r.profileId)}
      onKeyDown={handleKey}
      p="3"
      style={{
        border: "1px solid var(--gray-a4)",
        borderRadius: 14,
        background:
          "linear-gradient(180deg, var(--color-panel), color-mix(in oklab, var(--color-panel), var(--gray-3) 7%))",
        boxShadow:
          "0 6px 18px var(--black-a3), inset 0 0 0 1px color-mix(in oklab, var(--gray-a4), transparent 40%)",
        cursor: "pointer",
        transition: "transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease",
        userSelect: "none",
        outline: "none",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 22px var(--black-a4), 0 0 0 2px var(--accent-8)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow =
          "0 6px 18px var(--black-a3), inset 0 0 0 1px color-mix(in oklab, var(--gray-a4), transparent 40%)";
      }}
    >
      <Flex align="center" gap="3" style={{ minWidth: 0 }}>
        <Avatar
          src={avatarSrc}
          fallback={(r.username || "??").slice(0, 2).toUpperCase()}
          size="3"
          radius="full"
          style={{ boxShadow: "0 6px 16px var(--black-a4)", background: "white" }}
        />
        <Box style={{ minWidth: 0 }}>
          <Flex align="center" gap="2" style={{ minWidth: 0 }}>
            <Text
              weight="bold"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "22ch" }}
            >
              {r.username || "Unnamed"}
            </Text>
            {!!r.username && (
              <Badge variant="soft" color="indigo">
                @{r.username.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}
              </Badge>
            )}
          </Flex>

          <Text
            size="2"
            color="gray"
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "46ch",
              marginTop: 2,
            }}
          >
            {r.description || "—"}
          </Text>

          <Text size="1" color="gray" style={{ wordBreak: "break-all", marginTop: 4 }}>
            {r.profileId}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

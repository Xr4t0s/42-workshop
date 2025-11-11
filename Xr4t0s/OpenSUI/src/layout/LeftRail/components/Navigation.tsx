import { useState } from "react";
import { Badge, Box, Flex, Text } from "@radix-ui/themes";
import { flatCard, flatCardHover, focusRing } from "../styles";

export function NavButton({
  emoji,
  label,
  sub,
  onClick,
  shortcut,
  badge,
  isActive = false,
}: {
  emoji: string;
  label: string;
  sub?: string;
  onClick: () => void;
  shortcut?: string;
  badge?: string | number;
  isActive?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Box
      asChild
      style={{
        ...flatCard,
        ...(hover ? flatCardHover : {}),
        ...(focused ? focusRing : {}),
        padding: 0,
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          all: "unset",
          display: "block",
          width: "100%",
          cursor: "pointer",
          padding: 12,
          borderRadius: "var(--radius-3)",
          background: isActive ? "var(--gray-2)" : undefined,
        }}
        aria-label={label}
      >
        <Flex align="center" gap="4" style={{ width: "100%" }}>
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "var(--gray-3)",
              fontSize: 18,
            }}
            aria-hidden="true"
          >
            {emoji}
          </Box>

          <Box style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <Text size="3" weight="bold" style={{ display: "block" }}>
              {label}
            </Text>
            {sub && (
              <Text size="1" color="gray" style={{ display: "block" }}>
                {sub}
              </Text>
            )}
          </Box>

          <Flex align="center" gap="2">
            {badge != null && (
              <Badge variant="soft" radius="full">
                {badge}
              </Badge>
            )}
            {shortcut && (
              <Box
                px="2"
                style={{
                  border: "1px solid var(--gray-a4)",
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: 1.2,
                  color: "var(--gray-11)",
                }}
                aria-label={`Shortcut ${shortcut}`}
              >
                {shortcut}
              </Box>
            )}
          </Flex>
        </Flex>
      </button>
    </Box>
  );
}

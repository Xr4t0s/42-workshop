import { Avatar, Badge, Box, Flex, Heading, Separator, Text } from "@radix-ui/themes";

type Props = {
  username: string;
  description: string;
  handle: string;
  avatarUrl?: string | null;
  avatarPreview?: string | null;
  initials: string;
};

export default function LivePreview({
  username, description, handle, avatarUrl, avatarPreview, initials
}: Props) {
  return (
    <Box
      flexBasis="40%"
      style={{
        minWidth: 280,
        border: "1px solid var(--gray-a4)",
        borderRadius: "var(--radius-3)",
        padding: 16,
        background: "linear-gradient(135deg, var(--gray-2), var(--gray-a2))",
      }}
    >
      <Flex align="center" gap="3">
        <Avatar
          src={avatarUrl || avatarPreview || undefined}
          fallback={initials}
          radius="full"
          size="7"
          style={{ boxShadow: "0 8px 24px var(--black-a3)" }}
        />
        <Box>
          <Flex align="center" gap="2">
            <Heading size="3" truncate>{username.trim() || "Ton nom"}</Heading>
            <Badge color="gray" variant="soft">{handle}</Badge>
          </Flex>
          <Text color="gray" size="2">Nouveau membre</Text>
        </Box>
      </Flex>

      <Separator my="3" />
      <Text style={{ whiteSpace: "pre-wrap" }}>{description || "Ta bio apparaîtra ici…"}</Text>
    </Box>
  );
}

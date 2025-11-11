import { Box, Text } from "@radix-ui/themes";

export function Bio({ description }: { description?: string }) {
  return (
    <Box mt="3" px="1">
      <Text style={{ whiteSpace: "pre-wrap" }}>{description || "No bio yet."}</Text>
    </Box>
  );
}

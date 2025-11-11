import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Separator, Skeleton, Text } from "@radix-ui/themes";
import { SectionCard } from "@/layout/SectionCard";
import { useFollowingRows } from "./hooks/useFollowingRows";
import { FollowingCard } from "./components/FollowingCard";
import { navigate } from "@/routes/router";

export function FollowingList() {
  const acc = useCurrentAccount();
  const { rows, loading } = useFollowingRows(acc?.address ?? null);

  return (
    <SectionCard style={{}}>
      <Flex align="center" justify="between" mb="2">
        <Heading size="3">Following</Heading>
      </Flex>
      <Separator my="2" />

      {loading ? (
        <Flex direction="column" gap="3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Flex key={i} align="center" gap="3">
              <Skeleton width="36px" height="36px" style={{ borderRadius: 999 }} />
              <Box style={{ flex: 1 }}>
                <Skeleton my="1" height="12px" />
                <Skeleton my="1" height="10px" />
              </Box>
            </Flex>
          ))}
        </Flex>
      ) : rows.length === 0 ? (
        <Text color="gray">You’re not following anyone yet.</Text>
      ) : (
        <Flex direction="column" gap="3">
          {rows.map((r) => (
            <FollowingCard key={r.profileId} r={r} onOpen={(id) => navigate({ name: "profile", id })} />
          ))}
        </Flex>
      )}
    </SectionCard>
  );
}

export default FollowingList;

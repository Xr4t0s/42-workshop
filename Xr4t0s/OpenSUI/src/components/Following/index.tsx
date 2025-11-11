import { Flex, Heading, Text } from "@radix-ui/themes";
// import { useFollowingRows } from "./hooks/useFollowingRows";
import { FollowingList } from "./FollowingList";

type ProfilesFollowingListProps = {
  myAddress: string | null;
  onOpen: (id: string) => void;
};

export function ProfilesFollowingList({ myAddress }: ProfilesFollowingListProps) {
  if (!myAddress) {
    return (
      <Flex direction="column" gap="2">
        <Heading size="3">Following</Heading>
        <Text color="gray">Connect your wallet to see who you follow.</Text>
      </Flex>
    );
  }

  return <FollowingList />;
}

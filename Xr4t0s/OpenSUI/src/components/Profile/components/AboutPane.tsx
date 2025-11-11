import { Flex, Text } from "@radix-ui/themes";
import { PROFILE_TYPE_SUFFIX } from "@/config/constants";

export function AboutPane({ owner, id }: { owner: string; id: string }) {
  return (
    <Flex direction="column" gap="2">
      <Text><b>Owner:</b> {owner}</Text>
      <Text><b>Profile ID:</b> {id}</Text>
      <Text><b>Type:</b> social{PROFILE_TYPE_SUFFIX.replace("::social","")}</Text>
    </Flex>
  );
}

import { Box, Flex, Text, TextArea } from "@radix-ui/themes";
import { DESC_MAX } from "@/config/constants";

type Props = {
  value: string;
  setValue: (v: string) => void;
  isOk: boolean;
};

export default function BioField({ value, setValue, isOk }: Props) {
  const left = DESC_MAX - value.length;

  return (
    <Box>
      <Flex align="baseline" justify="between">
        <Text weight="medium">Bio</Text>
        <Text size="1" color={left < 0 ? "red" : "gray"}>{left}</Text>
      </Flex>
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Quelques mots sur toi…"
        rows={4}
        aria-invalid={!isOk}
      />
      {!isOk && (
        <Text size="1" color="red" mt="1">
          La bio est requise (max {DESC_MAX} caractères).
        </Text>
      )}
    </Box>
  );
}

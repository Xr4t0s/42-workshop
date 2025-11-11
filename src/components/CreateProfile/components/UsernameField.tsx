import { Badge, Box, Flex, Text, Tooltip } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { USERNAME_MAX } from "@/config/constants";

type Props = {
  value: string;
  setValue: (v: string) => void;
  isOk: boolean;
  handle: string;
};

export default function UsernameField({ value, setValue, isOk, handle }: Props) {
  const left = USERNAME_MAX - value.length;

  return (
    <Box>
      <Flex align="baseline" justify="between">
        <Text weight="medium">Nom d’utilisateur</Text>
        <Text size="1" color={left < 0 ? "red" : "gray"}>{left}</Text>
      </Flex>
      <input
        className="border px-3 py-2 rounded w-full"
        placeholder="ex: kratos"
        value={value}
        maxLength={USERNAME_MAX}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={!isOk}
      />
      <Flex align="center" gap="2" mt="1">
        <Badge color="gray">{handle}</Badge>
        <Tooltip content="3–24 caractères, lettres/chiffres/underscore.">
          <InfoCircledIcon />
        </Tooltip>
      </Flex>
      {!isOk && (
        <Text size="1" color="red" mt="1">
          Le nom doit faire entre 3 et {USERNAME_MAX} caractères.
        </Text>
      )}
    </Box>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton, Box, Flex, Text, Tooltip } from "@radix-ui/themes";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import { shortAddr } from "@/utils/strings";
import { copyToClipboard } from "@/utils/clipboard";

export function AddressRow({
  address,
  label = "Connected",
}: {
  address?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short = useMemo(() => shortAddr(address), [address]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    setCopied(ok);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Flex align="center" justify="between" gap="2" aria-live="polite">
      <Box style={{ minWidth: 0 }}>
        <Text size="2" color="gray">{label}:</Text>
        <Text size="2" ml="2" style={{ wordBreak: "break-all" }}>{short}</Text>
      </Box>
      <Tooltip content={copied ? "Copied!" : "Copy address"}>
        <IconButton
          variant="soft"
          onClick={handleCopy}
          disabled={!address}
          aria-label="Copy address"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
      </Tooltip>
    </Flex>
  );
}

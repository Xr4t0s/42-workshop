import { Box, Button, Callout, Flex, Kbd, Text, TextArea } from "@radix-ui/themes";
import { useEffect } from "react";

type Props = {
  disabled: boolean;
  remaining: number;
  value: string;
  setValue: (v: string) => void;
  onPublish: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  error?: string | null;
  publishing: boolean;
};
export default function Composer({
  disabled, remaining, value, setValue, onPublish, composerRef, error, publishing
}: Props) {
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(200, el.scrollHeight) + "px";
  }, [value, composerRef]);

  const pct = Math.min(100, Math.max(0, (1 - Math.max(0, remaining) / (remaining + value.length || 1)) * 100));

  return (
    <Flex direction="column" gap="2" className="glass" style={{ padding: 12 }}>
      <TextArea
        ref={composerRef as any}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? "Connectez un wallet pour publier" : "Quoi de neuf ?"}
        rows={3}
        disabled={disabled || publishing}
        style={{
          background: "transparent",
          border: "1px solid var(--gray-a4)",
          borderRadius: 10,
          boxShadow: "inset 0 1px 0 var(--white-a2)",
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !disabled && remaining >= 0 && !publishing) {
            e.preventDefault(); onPublish();
          }
        }}
      />
      <Box style={{ height: 6, borderRadius: 999, background: "var(--gray-a3)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: remaining < 0 ? "var(--red-9)" : "linear-gradient(90deg, var(--accent-9), var(--accent-10))",
          transition: "width .2s ease",
        }} />
      </Box>
      <Flex align="center" justify="between">
        <Text size="1" color={remaining < 0 ? "red" : "gray"}>
          {remaining < 0 ? `Limite dépassée (${remaining})` : `${remaining} caractères restants`} · <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
        </Text>
        <Button highContrast disabled={disabled || remaining < 0 || publishing} onClick={onPublish} className="btn-ghost">
          {publishing ? "Publication…" : "Publier"}
        </Button>
      </Flex>
      {error && <Callout.Root color="red"><Callout.Text>{error}</Callout.Text></Callout.Root>}
    </Flex>
  );
}

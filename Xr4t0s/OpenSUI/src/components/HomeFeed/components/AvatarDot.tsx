import { Box } from "@radix-ui/themes";
import { shortAddr } from "@/utils";

export default function AvatarDot({ seed }: { seed: string }) {
  const label = shortAddr(seed);
  return (
    <Box style={{
      width: 36, height: 36, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid var(--gray-a5)", background: "var(--gray-a2)",
      fontSize: 11, fontWeight: 600, userSelect: "none",
    }}>
      {label.slice(0, 3)}
    </Box>
  );
}

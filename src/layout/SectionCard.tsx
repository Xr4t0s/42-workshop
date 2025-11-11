import { Box } from "@radix-ui/themes";
import type { CSSProperties, ReactNode } from "react";

export function SectionCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Box
      className={`glass ${className ?? ""}`}
      p="4"
      m="1"
      style={{
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </Box>
  );
}
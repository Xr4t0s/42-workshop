import { Box } from "@radix-ui/themes";

export function PageShell({
  children,
  bottomNav,
  header,
}: {
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  header?: React.ReactNode;
}) {
  const hasBottom = !!bottomNav;

  return (
    <Box
      className={`app-bg page-shell`}
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {header ? <Box className="page-shell__header">{header}</Box> : null}

      <Box
        className={`page-shell__main ${hasBottom ? "has-bottom" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          padding: "var(--space-4)",
          minWidth: 0,
        }}
      >
        {children}
      </Box>

      {hasBottom ? (
        <Box asChild className="page-shell__bottom">
          <div>{bottomNav}</div>
        </Box>
      ) : null}
    </Box>
  );
}

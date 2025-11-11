import { Box } from "@radix-ui/themes";
export default function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} p="3" className="glass" style={{ padding: 14 }}>
          <div className="skel" style={{ height: 18, marginBottom: 10 }} />
          <div className="skel" style={{ height: 14, width: "72%" }} />
        </Box>
      ))}
    </>
  );
}

export function fmtEpoch(ms: number) {
  if (!ms || ms < 10_000) return "il y a un instant";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

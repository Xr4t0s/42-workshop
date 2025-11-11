export const computeInitials = (username: string) => {
  const clean = username.trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
};

export const computeHandle = (username: string) => {
  const slug = username.trim().toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `@${slug}` : "@username";
};

export function normalizeAvatarUrl(url: string): string {
  const trim = url.trim();

  const cidOnly = /^[a-z0-9]{46,}|bafy[^\s]+$/i.test(trim);
  if (cidOnly) return `https://ipfs.io/ipfs/${trim}`;

  if (trim.startsWith("ipfs://")) {
    const path = trim.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${path}`;
  }

  if (trim.startsWith("ar://")) {
    const id = trim.replace("ar://", "");
    return `https://arweave.net/${id}`;
  }

  return trim;
}

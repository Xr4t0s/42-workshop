export function ipfsToGateway(url?: string | null, gateway = "https://ipfs.io"): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ipfs://")) {
    const rest = url.slice(7).replace(/^ipfs\//, "");
    return `${gateway.replace(/\/+$/, "")}/ipfs/${rest}`;
  }
  if (url.startsWith("ipns://")) {
    const rest = url.slice(7).replace(/^ipns\//, "");
    return `${gateway.replace(/\/+$/, "")}/ipns/${rest}`;
  }
  return url;
}

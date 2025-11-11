export async function uploadAvatarPinataFront(file: File, jwt: string): Promise<string> {
  if (!jwt.startsWith("Bearer ")) throw new Error("PINATA_JWT doit commencer par 'Bearer '");
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: jwt },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  const cid = data?.IpfsHash as string | undefined;
  if (!cid) throw new Error("Pinata: IpfsHash manquant");
  return `ipfs://${cid}`;
}

export async function resizeImage(
  file: File,
  maxWidth = 320,
  quality = 0.85
): Promise<File> {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await new Promise((r) => (img.onload = () => r(null)));

  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", quality)
  );
  return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
}

import { useRef, useState } from "react";
import { validateImage } from "@/components/CreateProfile/utils/validators";
import { normalizeAvatarUrl } from "@/components/CreateProfile/utils/format";

export function useAvatarUpload(uploadAvatar: (file: File) => Promise<string>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pickFile = () => fileInputRef.current?.click();

  const onPick = async (file: File) => {
    const v = validateImage(file);
    if (v) return setErrorMsg(v);
    setErrorMsg(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUrl(null);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await onPick(f);
  };

  const onUpload = async () => {
    if (!avatarFile) return;
    setUploadPending(true);
    try {
      const raw = await uploadAvatar(avatarFile);
      const normalized = normalizeAvatarUrl(raw);
      setAvatarUrl(normalized);
    } catch (e: any) {
      setErrorMsg(e?.message || "Échec de l’upload de l’avatar.");
    } finally {
      setUploadPending(false);
    }
  };

  return {
    fileInputRef,
    avatarFile, avatarPreview, avatarUrl,
    uploadPending, errorMsg, setErrorMsg,
    pickFile, onPick, onDrop, onUpload, setAvatarUrl
  };
}

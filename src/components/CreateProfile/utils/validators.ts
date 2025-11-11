import { AVATAR_URL_MAX, DESC_MAX, USERNAME_MAX } from "@/config/constants";

export const isUsernameOk = (v: string) => {
  const s = v.trim();
  return s.length >= 3 && s.length <= USERNAME_MAX;
};

export const isDescOk = (v: string) => {
  const s = v.trim();
  return s.length > 0 && s.length <= DESC_MAX;
};

export const validateImage = (file: File): string | null => {
  const okTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!okTypes.includes(file.type)) return "Format non supporté (png, jpg, webp, gif).";
  if (file.size > 2 * 1024 * 1024) return "Fichier trop lourd (max 2 Mo).";
  return null;
};

export const isAvatarUrlTooLong = (url?: string | null) =>
  !!url && url.length > AVATAR_URL_MAX;

import type { SuiObjectData } from "@mysten/sui/client";
import { isMoveObject } from "@/utils";

export function getProfileFields(data: SuiObjectData) {
  if (!isMoveObject(data)) {
    return {
      owner: "",
      username: "",
      description: "",
      avatar_url: "",
      cover_url: "",
      followers: [] as string[],
      followed: [] as string[],
    };
  }
  const f = (data.content as any).fields;
  return {
    owner: (f.owner as string) ?? "",
    username: (f.username as string) ?? "",
    description: (f.description as string) ?? "",
    avatar_url: (f.avatar_url as string) ?? "",
    cover_url: (f.cover_url as string) ?? "",
    followers: (f.followers as any[])?.map(String) ?? [],
    followed: (f.followed as any[])?.map(String) ?? [],
  };
}

export function extractProfileIdsFromRegistry(regObj: any): string[] {
  const move = regObj?.data?.content;
  if (!move || move.dataType !== "moveObject") return [];
  const arr = ((move as any).fields?.profiles as string[]) ?? [];
  const unique = Array.from(new Set(arr));
  return unique.filter((x) => typeof x === "string" && x.startsWith("0x"));
}

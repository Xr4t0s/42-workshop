import type {
  SuiClient,
  SuiObjectData,
  DynamicFieldPage,
  DynamicFieldInfo,
} from "@mysten/sui/client";
import { getTableId, isMoveObject, readVector } from "@/utils/move";
import { unique } from "@/utils/strings";

type SuiClientLike = {
  getDynamicFieldObject: SuiClient["getDynamicFieldObject"];
  getDynamicFields: SuiClient["getDynamicFields"];
};

export function getPostsOfTableIdFromRegistry(obj?: SuiObjectData | null): string | null {
  if (!isMoveObject(obj)) return null;
  try {
    const f: any = (obj.content as any).fields;
    return getTableId(f?.posts_of);
  } catch {
    return null;
  }
}

export async function readPostsVectorForProfile(
  suiClient: SuiClientLike,
  postsOfTableId: string,
  profileId: string
): Promise<string[]> {
  try {
    const entry: Awaited<ReturnType<SuiClient["getDynamicFieldObject"]>> =
      await suiClient.getDynamicFieldObject({
        parentId: postsOfTableId,
        name: { type: "address", value: profileId },
      });

    const d = entry?.data as SuiObjectData | null | undefined;
    if (!isMoveObject(d)) return [];
    const fields: any = (d.content as any).fields;
    const vec = readVector<string>(fields?.value);
    return vec.map(String).filter((s) => s.startsWith("0x"));
  } catch {
    return [];
  }
}

export async function listAllAuthors(
  suiClient: SuiClientLike,
  postsOfTableId: string
): Promise<string[]> {
  const authors: string[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page: DynamicFieldPage = await suiClient.getDynamicFields({
      parentId: postsOfTableId,
      cursor,
      limit: 200,
    });

    for (const df of page.data as DynamicFieldInfo[]) {
      const v = (df as DynamicFieldInfo).name?.value as unknown;
      if (typeof v === "string" && v.startsWith("0x")) authors.push(v);
    }

    if (!page.hasNextPage) break;
    cursor = page.nextCursor;
  }

  return unique(authors);
}

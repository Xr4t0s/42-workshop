import type { SuiObjectData } from "@mysten/sui/client";

export const isMoveObject = (o?: SuiObjectData | null): o is SuiObjectData =>
  !!o?.content && (o.content as any).dataType === "moveObject";

export const getType = (o?: SuiObjectData | null): string | undefined =>
  isMoveObject(o) ? (o!.content as any).type : undefined;

export function getTableId(maybeTable: any): string | null {
  if (!maybeTable) return null;
  const a = maybeTable?.fields?.id?.id;
  if (typeof a === "string") return a;
  const b = maybeTable?.id?.id;
  if (typeof b === "string") return b;
  return null;
}

export function readVector<T = any>(maybeVec: any): T[] {
  if (Array.isArray(maybeVec)) return maybeVec as T[];
  if (maybeVec?.fields?.contents) return maybeVec.fields.contents as T[];
  return [];
}

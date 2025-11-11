export const unique = <T,>(arr: T[]) => [...new Set(arr)];
export const shortAddr = (a?: string) =>
  !a ? "?" : a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

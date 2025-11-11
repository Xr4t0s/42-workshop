import { useEffect, useMemo, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import {
  Avatar, Badge, Box, Button, Dialog, Flex, IconButton,
  ScrollArea, Separator, Skeleton, Text, Tooltip,
} from "@radix-ui/themes";
import { CopyIcon } from "@radix-ui/react-icons";
import type { Profile } from "@/types/types";
import { ipfsToGateway, mapMoveToProfile, shortAddr } from "@/utils";

function useProfilesByIds(ids: string[]) {
  const suiClient = useSuiClient();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanIds = useMemo(
    () => Array.from(new Set(ids.filter((x) => typeof x === "string" && x.startsWith("0x")))),
    [ids]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cleanIds.length === 0) { setRows([]); return; }
      setLoading(true); setError(null);

      try {
        const CHUNK = 50;
        const out: Profile[] = [];
        for (let i = 0; i < cleanIds.length; i += CHUNK) {
          const slice = cleanIds.slice(i, i + CHUNK);
          const objs = await suiClient.multiGetObjects({
            ids: slice, options: { showType: true, showContent: true },
          });
          for (const obj of objs) {
            const prof = mapMoveToProfile(obj.data);
            if (prof) out.push(prof);
          }
        }
        out.sort((a, b) => (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" }));
        if (!cancelled) setRows(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load list");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cleanIds, suiClient]);

  return { rows, loading, error };
}

export function ProfilesModal({
  open, onOpenChange, title, ids, onOpenProfile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  ids: string[];
  onOpenProfile: (id: string) => void;
}) {
  const { rows, loading, error } = useProfilesByIds(ids);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        size="4"
        style={{
          maxWidth: 720, width: "100%", borderRadius: 16, background: "black",
          boxShadow: "0 18px 48px var(--black-a8)", border: "1px solid var(--gray-a5)",
        }}
      >
        <Dialog.Description style={{ display: "none" }}>
          List of profiles ({title})
        </Dialog.Description>

        <Flex align="center" justify="between" p="3">
          <Dialog.Title size="4">{title}</Dialog.Title>
          <Dialog.Close><Button variant="soft">Close</Button></Dialog.Close>
        </Flex>

        <Separator my="1" />

        <ScrollArea type="hover" scrollbars="vertical" style={{ maxHeight: "60vh" }}>
          <Box p="3">
            {loading ? (
              <Flex direction="column" gap="2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box key={i} p="3" style={{
                    border: "1px solid var(--gray-a5)", borderRadius: 12,
                    background: "color-mix(in oklab, var(--gray-3), var(--color-panel) 40%)",
                  }}>
                    <Skeleton height="48px" mb="2" />
                    <Skeleton height="12px" width="70%" />
                  </Box>
                ))}
              </Flex>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : rows.length === 0 ? (
              <Text color="gray">No profiles.</Text>
            ) : (
              <Flex direction="column" gap="2">
                {rows.map((r) => {
                  const avatarSrc = ipfsToGateway(r.avatarUrl);
                  const href = `/profile/${r.id}`;

                  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
                    e.preventDefault();
                    onOpenProfile(r.id);
                    onOpenChange(false);
                  };

                  const onCardKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenProfile(r.id);
                      onOpenChange(false);
                    }
                  };

                  return (
                    <Dialog.Close key={r.id}>
                      <a
                        href={href}
                        onClick={handleClick}
                        onKeyDown={onCardKeyDown}
                        tabIndex={0}
                        style={{
                          textDecoration: "none", color: "inherit", display: "block",
                          border: "1px solid var(--gray-a5)", borderRadius: 14,
                          background: "color-mix(in oklab, var(--color-panel), var(--gray-2) 20%)",
                          boxShadow: "0 4px 14px var(--black-a5)", cursor: "pointer",
                          transition: "all 120ms ease", outline: "none", padding: 12,
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-8)")}
                        onBlur={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px var(--black-a5)")}
                      >
                        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                          <Avatar
                            src={avatarSrc}
                            fallback={(r.username || "??").slice(0, 2).toUpperCase()}
                            size="3" radius="full"
                            style={{ boxShadow: "0 4px 10px var(--black-a5)", background: "white" }}
                          />
                          <Box style={{ minWidth: 0 }}>
                            <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                              <Text
                                weight="bold"
                                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "22ch" }}
                              >
                                {r.username || "Unnamed"}
                              </Text>
                              {!!r.username && (
                                <Badge variant="soft" color="indigo">
                                  @{r.username.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}
                                </Badge>
                              )}
                            </Flex>
                            <Text
                              size="2" color="gray"
                              style={{
                                display: "block", overflow: "hidden", textOverflow: "ellipsis",
                                whiteSpace: "nowrap", maxWidth: "44ch", marginTop: 2,
                              }}
                            >
                              {r.description || "—"}
                            </Text>
                            <Flex gap="2" mt="1" wrap="wrap" align="center">
                              <Text size="1" color="gray">ID: <b>{shortAddr(r.id)}</b></Text>
                              <Tooltip content="Copy ID">
                                <IconButton
                                  variant="soft"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(r.id);
                                  }}
                                >
                                  <CopyIcon />
                                </IconButton>
                              </Tooltip>
                            </Flex>
                          </Box>
                        </Flex>
                      </a>
                    </Dialog.Close>
                  );
                })}
              </Flex>
            )}
          </Box>
        </ScrollArea>
      </Dialog.Content>
    </Dialog.Root>
  );
}

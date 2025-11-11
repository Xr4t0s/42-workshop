import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Separator,
  Skeleton,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";

import { useNetworkVariable } from "@/config/networkConfig";
import { useMyProfileId } from "@/hooks/useMyProfileId";
import { SectionCard } from "@/layout/SectionCard";
import { ipfsToGateway } from "@/utils/ipfs";

type Row = {
  profileId: string;
  owner: string;
  username: string;
  description: string;
  avatar_url?: string;
};

type SortKey = "alpha" | "newest" | "random";

type Props = {
  onOpen?: (profileId: string) => void;
};

const CHUNK = 50;

export function ProfilesList({ onOpen }: Props) {
  const sui = useSuiClient();
  const profilesRegistryId = useNetworkVariable("profilesId");
  const { myProfileId } = useMyProfileId();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Date.now());

  const fetchProfiles = useCallback(async () => {
    if (!profilesRegistryId) return;
    setLoading(true);
    setError(null);

    try {
      const reg = await sui.getObject({
        id: profilesRegistryId,
        options: { showContent: true, showType: true },
      });
      const data = reg.data as SuiObjectData | undefined;
      const isMove = !!data?.content && (data.content as any).dataType === "moveObject";
      if (!isMove) throw new Error("Profiles registry invalide");

      const fields: any = (data!.content as any).fields;
      const ids: string[] = Array.isArray(fields.profiles)
        ? fields.profiles
        : fields.profiles?.fields?.contents ?? [];
      const uniqIds = Array.from(new Set(ids)).filter((x: any) => typeof x === "string");

      if (uniqIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const acc: Row[] = [];
      for (let i = 0; i < uniqIds.length; i += CHUNK) {
        const slice = uniqIds.slice(i, i + CHUNK);
        const objs = await sui.multiGetObjects({
          ids: slice,
          options: { showContent: true, showType: true },
        });

        for (const o of objs) {
          const d = o.data as SuiObjectData | undefined;
          if (!d?.content || (d.content as any).dataType !== "moveObject") continue;
          const f: any = (d.content as any).fields;
          acc.push({
            profileId: d.objectId!,
            owner: String(f.owner ?? ""),
            username: String(f.username ?? ""),
            description: String(f.description ?? ""),
            avatar_url: f.avatar_url ? String(f.avatar_url) : undefined,
          });
        }
      }

      setRows(acc);
      setShuffleSeed(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement des profils");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [sui, profilesRegistryId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const sortedRows = useMemo(() => {
    const r = [...rows];
    switch (sortKey) {
      case "alpha":
        r.sort((a, b) => (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" }));
        break;
      case "newest":
        r.sort((a, b) => b.profileId.localeCompare(a.profileId));
        break;
      case "random":
        const seed = shuffleSeed;
        r.sort((a, b) => {
          const ha = Math.imul((a.profileId.charCodeAt(2) || 0) + seed, 2654435761) >>> 0;
          const hb = Math.imul((b.profileId.charCodeAt(2) || 0) + seed, 2654435761) >>> 0;
          return (ha % 9973) - (hb % 9973);
        });
        break;
    }
    return r;
  }, [rows, sortKey, shuffleSeed]);

  return (
    <SectionCard>
      <Flex align="center" justify="between" mb="2">
        <Heading size="4">Profils</Heading>
        <Flex align="center" gap="2">
          <Tooltip content="Rafraîchir">
            <IconButton variant="soft" onClick={fetchProfiles} aria-label="Rafraîchir">
              <ReloadIcon />
            </IconButton>
          </Tooltip>

          <Text size="2" color="gray">Trier :</Text>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{
              background: "transparent",
              border: "1px solid var(--gray-a5)",
              borderRadius: 6,
              padding: "4px 8px",
              color: "var(--gray-12)",
            }}
            aria-label="Sélectionner l’ordre de tri"
          >
            <option value="alpha">A → Z</option>
            <option value="newest">Récents</option>
            <option value="random">Aléatoire</option>
          </select>
        </Flex>
      </Flex>

      <Separator my="2" />

      {loading ? (
        <Flex direction="column" gap="3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Flex key={i} align="center" gap="3">
              <Skeleton width="42px" height="42px" style={{ borderRadius: 999 }} />
              <Box style={{ flex: 1 }}>
                <Skeleton my="1" height="14px" />
                <Skeleton my="1" height="10px" />
              </Box>
              <Skeleton width="64px" height="26px" />
            </Flex>
          ))}
        </Flex>
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : sortedRows.length === 0 ? (
        <Text color="gray">Aucun profil trouvé.</Text>
      ) : (
        <Flex direction="column" gap="3">
          {sortedRows.map((r) => {
            const avatar = ipfsToGateway(r.avatar_url);
            const isMe = r.profileId === myProfileId;

            const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.(r.profileId);
              }
            };

            return (
              <Box
                key={r.profileId}
                role="button"
                tabIndex={0}
                onClick={() => onOpen?.(r.profileId)}
                onKeyDown={onKey}
                p="3"
                style={{
                  border: "1px solid var(--gray-a4)",
                  borderRadius: 10,
                  background: "var(--color-panel)",
                  boxShadow: "0 4px 12px var(--black-a4)",
                  cursor: "pointer",
                  transition: "transform .14s ease, box-shadow .14s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Flex align="center" justify="between" gap="3">
                  <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={r.username || "Profile avatar"}
                        width={42}
                        height={42}
                        className="avatar"
                        style={{ width: 42, height: 42 }}
                      />
                    ) : (
                      <Avatar size="3" fallback={r.username?.[0]?.toUpperCase() ?? "?"} />
                    )}

                    <Box style={{ minWidth: 0 }}>
                      <Text weight="bold" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.username || r.profileId}
                      </Text>
                      <Text size="1" color="gray" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60ch" }}>
                        {r.description || "—"}
                      </Text>
                      <Text size="1" color="gray" style={{ wordBreak: "break-all" }}>
                        {r.owner}
                      </Text>
                    </Box>
                  </Flex>

                  {isMe ? (
                    <Badge color="green">Moi</Badge>
                  ) : (
                    <Button
                      variant="soft"
                      size="1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen?.(r.profileId);
                      }}
                    >
                      Ouvrir
                    </Button>
                  )}
                </Flex>
              </Box>
            );
          })}
        </Flex>
      )}
    </SectionCard>
  );
}

export default ProfilesList;

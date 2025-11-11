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
import { ipfsToGateway } from "@/utils";

type Row = {
  profileId: string;
  owner: string;
  username: string;
  description: string;
  avatar_url?: string;
  followers: number;
  rank?: number;
};

type Props = {
  onOpen?: (profileId: string) => void;
  limit?: number;
};

function medalForRank(rank?: number) {
  if (!rank) return null;
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}
function badgeColorForRank(rank?: number): "gold" | "silver" | "bronze" | "indigo" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "indigo";
}
export function TopUsersRightRail({ onOpen, limit = 8 }: Props) {
  const sui = useSuiClient();
  const profilesRegistryId = useNetworkVariable("profilesId");
  const followersRegistryId = useNetworkVariable("followersRegistryId");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCountsTableId = useCallback(async (): Promise<string | null> => {
    if (!followersRegistryId) return null;
    const obj = await sui.getObject({
      id: followersRegistryId,
      options: { showContent: true, showType: true },
    });
    const move = (obj as any).data?.content;
    if (move?.dataType !== "moveObject") return null;
    const f = move.fields;
    const countsId: string | null =
      f.counts?.fields?.id?.id ?? f.counts?.id?.id ?? null;
    return countsId ?? null;
  }, [sui, followersRegistryId]);

  const getFollowersCount = useCallback(
    async (countsTableId: string, profileId: string): Promise<number> => {
      try {
        const df = await sui.getDynamicFieldObject({
          parentId: countsTableId,
          name: { type: "address", value: profileId },
        });
        const v = (df as any).data?.content?.fields?.value;
        return v ? Number(v) : 0;
      } catch {
        return 0;
      }
    },
    [sui]
  );

  const fetchProfilesVector = useCallback(async (): Promise<Pick<Row, "profileId" | "owner" | "username" | "description" | "avatar_url">[]> => {
    if (!profilesRegistryId) return [];
    const obj = await sui.getObject({
      id: profilesRegistryId,
      options: { showContent: true, showType: true },
    });
    const data = obj.data as SuiObjectData;
    if (!data || (data.content as any)?.dataType !== "moveObject")
      return [];
    const fields: any = (data.content as any).fields;
    const vectorProfiles: string[] = fields.profiles ?? [];
    const out: Pick<Row, "profileId" | "owner" | "username" | "description" | "avatar_url">[] = [];

    const CHUNK = 50;
    for (let i = 0; i < vectorProfiles.length; i += CHUNK) {
      const slice = vectorProfiles.slice(i, i + CHUNK);
      const objs = await sui.multiGetObjects({
        ids: slice,
        options: { showContent: true, showType: true },
      });
      for (const o of objs) {
        const d = o.data as SuiObjectData;
        if ((d?.content as any)?.dataType !== "moveObject") continue;
        const f: any = (d!.content as any).fields;
        out.push({
          profileId: d!.objectId!,
          owner: String(f.owner),
          username: String(f.username ?? ""),
          description: String(f.description ?? ""),
          avatar_url: f.avatar_url ? String(f.avatar_url) : undefined,
        });
      }
    }
    return out;
  }, [sui, profilesRegistryId]);

  const load = useCallback(async () => {
    if (!profilesRegistryId) return;
    setLoading(true);
    setError(null);
    try {
      const [countsTableId, baseProfiles] = await Promise.all([
        fetchCountsTableId(),
        fetchProfilesVector(),
      ]);

      let enriched: Row[] = [];
      if (countsTableId) {
        const BATCH = 40;
        const withCounts: Row[] = [];
        for (let i = 0; i < baseProfiles.length; i += BATCH) {
          const slice = baseProfiles.slice(i, i + BATCH);
          const counts = await Promise.all(
            slice.map((p) => getFollowersCount(countsTableId, p.profileId))
          );
          for (let j = 0; j < slice.length; j++) {
            const p = slice[j];
            withCounts.push({
              ...p,
              followers: counts[j] ?? 0,
            });
          }
        }
        enriched = withCounts;
      } else {
        enriched = baseProfiles.map((p) => ({ ...p, followers: 0 }));
      }

      enriched.sort((a, b) => b.followers - a.followers);
      enriched = enriched.map((r, idx) => ({ ...r, rank: idx + 1 }));

      setRows(enriched);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }, [profilesRegistryId, fetchCountsTableId, fetchProfilesVector, getFollowersCount]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => rows.slice(0, limit), [rows, limit]);

  return (
    <Box
      style={{
        position: "sticky",
        top: 16,
        border: "1px solid var(--gray-a4)",
        borderRadius: 12,
        padding: 12,
        background: "var(--color-panel)",
        boxShadow: "0 10px 30px var(--black-a5)",
      }}
    >
      <Flex align="center" justify="between" mb="2">
        <Heading size="3">Top Users</Heading>
        <Tooltip content="Rafraîchir">
          <IconButton variant="soft" size="1" onClick={load}>
            <ReloadIcon />
          </IconButton>
        </Tooltip>
      </Flex>

      <Separator my="2" />

      {loading ? (
        <Flex direction="column" gap="3">
          {Array.from({ length: limit }).map((_, i) => (
            <Flex key={i} align="center" gap="3">
              <Skeleton width="36px" height="36px" style={{borderRadius: "full"}} />
              <Box style={{ flex: 1 }}>
                <Skeleton my="1" height="12px" />
                <Skeleton my="1" height="10px" />
              </Box>
              <Skeleton width="58px" height="22px" />
            </Flex>
          ))}
        </Flex>
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : visible.length === 0 ? (
        <Text color="gray">Aucun utilisateur</Text>
      ) : (
        <Flex direction="column" gap="2">
          {visible.map((r) => {
            const avatar = ipfsToGateway(r.avatar_url);
            const medal = medalForRank(r.rank);
            const badgeColor = badgeColorForRank(r.rank);
            return (
              <Flex
                key={r.profileId}
                align="center"
                gap="3"
                p="2"
                style={{
                  borderRadius: 10,
                  transition: "background .15s ease, transform .12s ease",
                  cursor: "pointer",
                }}
                onClick={() => onOpen?.(r.profileId)}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a2)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={r.username}
                    width={36}
                    height={36}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--gray-a5)",
                    }}
                  />
                ) : (
                  <Avatar size="2" fallback={r.username?.[0]?.toUpperCase() ?? "?"} />
                )}

                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Flex align="center" gap="2" wrap="nowrap">
                    {medal && (
                      <Text size="2" style={{ lineHeight: 1 }}>{medal}</Text>
                    )}
                    <Text weight="bold" style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {r.username || r.profileId}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray" style={{
                    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"
                  }}>
                    {r.description?.length <= 25 ? `${r.description?.slice(0, 25)}` : `${r.description?.slice(0, 25)}...` || r.owner}
                  </Text>
                </Box>

                <Badge variant="soft" color={badgeColor as any}>
                  {r.followers} follower{r.followers > 1 ? "s" : ""}
                </Badge>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Separator my="2" />

      <Flex justify="end">
        <Button variant="soft" size="1" onClick={load}>
          <ReloadIcon />&nbsp;Mettre à jour
        </Button>
      </Flex>
    </Box>
  );
}

export default TopUsersRightRail;

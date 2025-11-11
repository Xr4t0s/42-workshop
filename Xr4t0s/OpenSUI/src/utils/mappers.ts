import type { SuiObjectData } from "@mysten/sui/client";
import { isMoveObject, getType, getTableId, readVector } from "@/utils/move";
import {
  PROFILE_TYPE_SUFFIX,
  PROFILES_TYPE_SUFFIX,
  FOLLOW_NFT_TYPE_SUFFIX,
  FOLLOWERS_REG_SUFFIX,
  POSTS_REG_SUFFIX,
  POST_TYPE_SUFFIX,
} from "@/config/constants";
import type {
  Profile, ProfilesRegistry, FollowersRegistry, PostsRegistry, Post, FollowNFT,
} from "@/types/types";

export function mapMoveToProfile(o?: SuiObjectData | null): Profile | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(PROFILE_TYPE_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    owner: String(f.owner),
    username: String(f.username || ""),
    description: String(f.description || ""),
    avatarUrl: String(f.avatar_url || ""),
    followers: readVector<string>(f.followers).map(String),
    followed: readVector<string>(f.followed).map(String),
  };
}

export function mapMoveToPost(o?: SuiObjectData | null): Post | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(POST_TYPE_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    authorProfileId: String(f.author_profile_id),
    author: String(f.author),
    content: String(f.content ?? ""),
    createdMs: Number(f.created_ms ?? 0),
    updatedMs: Number(f.updated_ms ?? 0),
  };
}

export function mapMoveToFollowNFT(o?: SuiObjectData | null): FollowNFT | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(FOLLOW_NFT_TYPE_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    follower: String(f.follower),
    followedProfileId: String(f.followed_profile_id),
  };
}

export function mapMoveToProfilesRegistry(o?: SuiObjectData | null): ProfilesRegistry | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(PROFILES_TYPE_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    profiles: readVector<string>(f.profiles).map(String),
    ownersTableId: getTableId(f.owners),
  };
}

export function mapMoveToFollowersRegistry(o?: SuiObjectData | null): FollowersRegistry | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(FOLLOWERS_REG_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    countsTableId: getTableId(f.counts),
  };
}

export function mapMoveToPostsRegistry(o?: SuiObjectData | null): PostsRegistry | null {
  if (!isMoveObject(o)) return null;
  const typ = getType(o);
  if (!typ?.endsWith(POSTS_REG_SUFFIX)) return null;
  const f: any = (o.content as any).fields;
  return {
    id: o.objectId!,
    postsOfTableId: getTableId(f.posts_of),
  };
}

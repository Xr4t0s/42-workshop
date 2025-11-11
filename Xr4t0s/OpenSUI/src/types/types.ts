import type { SuiObjectData } from "@mysten/sui/client";

export type MoveObj = SuiObjectData | null | undefined;

export type ObjectId = string;
export type Address = string;
export type UnixMs = number;

/** ——— Unitaires ——— */
export type Profile = {
  id: ObjectId;
  owner: Address;
  username: string;
  description: string;
  avatarUrl: string;
  followers: Address[];
  followed: Address[];
};

export type Post = {
  id: ObjectId;
  authorProfileId: Address;
  author: Address;
  content: string;
  createdMs: UnixMs;
  updatedMs: UnixMs;
};

export type FollowNFT = {
  id: ObjectId;
  follower: Address;
  followedProfileId: Address;
};

export type ProfilesRegistry = {
  id: ObjectId;
  profiles: Address[];
  ownersTableId?: ObjectId | null;
};

export type FollowersRegistry = {
  id: ObjectId;
  countsTableId?: ObjectId | null;
};

export type PostsRegistry = {
  id: ObjectId;
  postsOfTableId?: ObjectId | null;
};

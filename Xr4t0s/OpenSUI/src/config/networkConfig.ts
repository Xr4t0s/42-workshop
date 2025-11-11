import { getFullnodeUrl } from "@mysten/sui/client";
import {
  MAINNET_SOCIAL_PACKAGE_ID,
  MAINNET_CREATE_PROFILE_PACKAGE_ID,
  MAINNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
  MAINNET_POSTS_REGISTRY_PACKAGE_ID,
  TESTNET_CREATE_PROFILE_PACKAGE_ID,
  TESTNET_SOCIAL_PACKAGE_ID,
  TESTNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
  TESTNET_POSTS_REGISTRY_PACKAGE_ID,
  TESTNET_LIKES_REGISTRY_PACKAGE_ID,
  TESTNET_COMMENT_REGISTRY_PACKAGE_ID,
  DEVNET_CREATE_PROFILE_PACKAGE_ID,
  DEVNET_SOCIAL_PACKAGE_ID,
  DEVNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
  DEVNET_POSTS_REGISTRY_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        socialPackageId: DEVNET_SOCIAL_PACKAGE_ID,
		profilesId: DEVNET_CREATE_PROFILE_PACKAGE_ID,
		followersRegistryId: DEVNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
		postsRegistryId: DEVNET_POSTS_REGISTRY_PACKAGE_ID,
		likesRegistryId: TESTNET_LIKES_REGISTRY_PACKAGE_ID,
		commentsRegistryId: TESTNET_COMMENT_REGISTRY_PACKAGE_ID
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        socialPackageId: TESTNET_SOCIAL_PACKAGE_ID,
		profilesId: TESTNET_CREATE_PROFILE_PACKAGE_ID,
		followersRegistryId: TESTNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
		postsRegistryId: TESTNET_POSTS_REGISTRY_PACKAGE_ID,
		likesRegistryId: TESTNET_LIKES_REGISTRY_PACKAGE_ID,
		commentsRegistryId: TESTNET_COMMENT_REGISTRY_PACKAGE_ID
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        socialPackageId: MAINNET_SOCIAL_PACKAGE_ID,
		profilesId: MAINNET_CREATE_PROFILE_PACKAGE_ID,
		followersRegistryId: MAINNET_FOLLOWERS_REGISTRY_PACKAGE_ID,
		postsRegistryId: MAINNET_POSTS_REGISTRY_PACKAGE_ID,
		likesRegistryId: TESTNET_LIKES_REGISTRY_PACKAGE_ID,
		commentsRegistryId: TESTNET_COMMENT_REGISTRY_PACKAGE_ID
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };

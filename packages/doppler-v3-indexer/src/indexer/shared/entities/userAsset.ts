import { Context } from "ponder:registry";
import { userAsset } from "ponder.schema";
import { Address } from "viem";

export const insertUserAssetIfNotExists = async ({
  userId,
  assetId,
  timestamp,
  context,
}: {
  userId: Address;
  assetId: Address;
  timestamp: bigint;
  context: Context;
}): Promise<typeof userAsset.$inferSelect> => {
  const { db, network } = context;
  const existingUserAsset = await db.find(userAsset, {
    userId: userId,
    assetId: assetId,
    chainId: BigInt(network.chainId),
  });

  if (existingUserAsset) {
    return existingUserAsset;
  }

  return await db.insert(userAsset).values({
    userId,
    lastInteraction: timestamp,
    createdAt: timestamp,
    assetId,
    balance: 0n,
    chainId: BigInt(network.chainId),
  });
};

export const updateUserAsset = async ({
  userId,
  assetId,
  context,
  update,
}: {
  userId: Address;
  assetId: Address;
  context: Context;
  update: Partial<typeof userAsset.$inferInsert>;
}) => {
  const { db, network } = context;

  await db
    .update(userAsset, {
      userId,
      assetId,
      chainId: BigInt(network.chainId),
    })
    .set({
      ...update,
    });
};

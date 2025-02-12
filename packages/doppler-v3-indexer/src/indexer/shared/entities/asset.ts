import { Context } from "ponder:registry";
import { asset } from "ponder:schema";
import { Address } from "viem";
import { getAssetData } from "@app/utils/getAssetData";

export const insertAssetIfNotExists = async ({
  assetAddress,
  timestamp,
  context,
}: {
  assetAddress: Address;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const existingAsset = await db.find(asset, {
    address: assetAddress,
  });

  if (existingAsset) {
    return existingAsset;
  }

  const chainId = BigInt(network.chainId);
  const assetData = await getAssetData(assetAddress, context);

  const id = assetAddress.toLowerCase() as `0x${string}`;

  const isToken0 =
    assetAddress.toLowerCase() < assetData.numeraire.toLowerCase();

  return await db.insert(asset).values({
    ...assetData,
    poolAddress: assetData.pool,
    address: id,
    chainId,
    isToken0,
    createdAt: timestamp,
    migratedAt: null,
    migrated: false,
  });
};

export const updateAsset = async ({
  assetAddress,
  context,
  update,
}: {
  assetAddress: Address;
  context: Context;
  update?: Partial<typeof asset.$inferInsert>;
}) => {
  const { db } = context;

  await db
    .update(asset, {
      address: assetAddress,
    })
    .set({
      ...update,
    });
};

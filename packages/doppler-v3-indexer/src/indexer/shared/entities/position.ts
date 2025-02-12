import { Context } from "ponder:registry";
import { position } from "ponder.schema";
import { Address } from "viem";

export const insertPositionIfNotExists = async ({
  poolAddress,
  tickLower,
  tickUpper,
  liquidity,
  owner,
  timestamp,
  context,
}: {
  poolAddress: Address;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  owner: Address;
  timestamp: bigint;
  context: Context;
}): Promise<typeof position.$inferSelect> => {
  const { db, network } = context;
  const existingPosition = await db.find(position, {
    pool: poolAddress,
    tickLower: tickLower,
    tickUpper: tickUpper,
    chainId: BigInt(network.chainId),
  });

  if (existingPosition) {
    return existingPosition;
  }

  return await db.insert(position).values({
    owner,
    pool: poolAddress,
    tickLower,
    tickUpper,
    liquidity,
    createdAt: timestamp,
    chainId: BigInt(network.chainId),
  });
};

export const updatePosition = async ({
  poolAddress,
  tickLower,
  tickUpper,
  context,
  update,
}: {
  poolAddress: Address;
  tickLower: number;
  tickUpper: number;
  context: Context;
  update: Partial<typeof position.$inferInsert>;
}) => {
  const { db, network } = context;

  await db
    .update(position, {
      pool: poolAddress,
      tickLower,
      tickUpper,
      chainId: BigInt(network.chainId),
    })
    .set({
      ...update,
    });
};

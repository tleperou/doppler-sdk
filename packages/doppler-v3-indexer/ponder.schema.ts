import { onchainTable, primaryKey, relations } from "ponder";

/* TABLES */
export const user = onchainTable("user", (t) => ({
  address: t.hex().primaryKey(),
  createdAt: t.bigint().notNull(),
}));

export const token = onchainTable("token", (t) => ({
  address: t.hex().primaryKey(),
  chainId: t.bigint().notNull(),
  name: t.text().notNull(),
  symbol: t.text().notNull(),
  decimals: t.integer().notNull(),
  totalSupply: t.bigint().notNull(),
  isDerc20: t.boolean().notNull(),
  firstSeenAt: t.bigint().notNull(),
}));

export const asset = onchainTable("asset", (t) => ({
  address: t.hex().primaryKey(),
  pool: t.hex().notNull(),
  numeraire: t.hex().notNull(),
  timelock: t.hex().notNull(),
  governance: t.hex().notNull(),
  liquidityMigrator: t.hex().notNull(),
  poolInitializer: t.hex().notNull(),
  migrationPool: t.hex().notNull(),
  numTokensToSell: t.bigint().notNull(),
  integrator: t.hex().notNull(),
  createdAt: t.bigint().notNull(),
  migratedAt: t.bigint(),
}));

export const hourBucket = onchainTable("hour_buckets", (t) => ({
  id: t.text().primaryKey(),
  open: t.bigint().notNull(),
  close: t.bigint().notNull(),
  low: t.bigint().notNull(),
  high: t.bigint().notNull(),
  average: t.bigint().notNull(),
  count: t.integer().notNull(),
}));

export const position = onchainTable("position", (t) => ({
  id: t.text().primaryKey(),
  owner: t.text().notNull(),
  pool: t.hex().notNull(),
  tickLower: t.integer().notNull(),
  tickUpper: t.integer().notNull(),
  liquidity: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
}));

export const module = onchainTable("module", (t) => ({
  address: t.text().primaryKey(),
  state: t.integer().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

export const v3Pool = onchainTable("v3_pool", (t) => ({
  address: t.hex().primaryKey(),
  tick: t.integer().notNull(),
  sqrtPrice: t.bigint().notNull(),
  liquidity: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
  asset: t.hex().notNull(),
  baseToken: t.hex().notNull(),
  quoteToken: t.hex().notNull(),
  price: t.bigint().notNull(),
  initializer: t.hex(),
}));

export const v4Pool = onchainTable("v4_pool", (t) => ({
  hook: t.hex().primaryKey(),
  tick: t.integer().notNull(),
  sqrtPrice: t.bigint().notNull(),
  protocolFee: t.integer().notNull(),
  lpFee: t.integer().notNull(),
  liquidity: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
  asset: t.hex().notNull(),
  baseToken: t.hex().notNull(),
  quoteToken: t.hex().notNull(),
  price: t.bigint().notNull(),
  initializer: t.hex(),
}));

export const userAsset = onchainTable(
  "user_asset",
  (t) => ({
    userId: t.text().notNull(),
    assetId: t.text().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.assetId] }),
  })
);

/* RELATIONS */

// assets have one pool
export const assetRelations = relations(asset, ({ one, many }) => ({
  pool: one(v3Pool, { fields: [asset.pool], references: [v3Pool.address] }),
  userAssets: many(userAsset),
}));

// pools have many positions
export const poolRelations = relations(v3Pool, ({ one, many }) => ({
  positions: many(position),
  baseToken: one(token, {
    fields: [v3Pool.baseToken],
    references: [token.address],
  }),
  quoteToken: one(token, {
    fields: [v3Pool.quoteToken],
    references: [token.address],
  }),
  asset: one(asset, {
    fields: [v3Pool.asset],
    references: [asset.address],
  }),
}));

// positions have one pool
export const positionRelations = relations(position, ({ one }) => ({
  pool: one(v3Pool, { fields: [position.pool], references: [v3Pool.address] }),
}));

// users have many assets and positions
export const userRelations = relations(user, ({ many }) => ({
  userAssets: many(userAsset),
}));

// userAsset has one user and one asset
export const userAssetRelations = relations(userAsset, ({ one }) => ({
  user: one(user, { fields: [userAsset.userId], references: [user.address] }),
  asset: one(asset, {
    fields: [userAsset.assetId],
    references: [asset.address],
  }),
}));

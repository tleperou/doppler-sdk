import { onchainTable, primaryKey, relations } from "ponder";

export const assets = onchainTable("asset", (t) => ({
  id: t.text().primaryKey(),
  numeraire: t.text().notNull(),
  timelock: t.text().notNull(),
  governance: t.text().notNull(),
  liquidityMigrator: t.text().notNull(),
  poolInitializer: t.text().notNull(),
  pool: t.text().notNull(),
  migrationPool: t.text().notNull(),
  numTokensToSell: t.bigint().notNull(),
  totalSupply: t.bigint().notNull(),
  integrator: t.text().notNull(),
  createdAt: t.timestamp().notNull(),
  migratedAt: t.timestamp(),
}));

export const v3Pools = onchainTable("v3_pool", (t) => ({
  id: t.text().primaryKey(),
  tick: t.integer().notNull(),
  sqrtPrice: t.bigint().notNull(),
  liquidity: t.bigint().notNull(),
  createdAt: t.timestamp().notNull(),
}));

// assets have one pool
export const assetRelations = relations(assets, ({ one, many }) => ({
  pool: one(v3Pools, { fields: [assets.pool], references: [v3Pools.id] }),
  userAssets: many(userAssets),
}));

export const positions = onchainTable("position", (t) => ({
  id: t.text().primaryKey(),
  owner: t.text().notNull(),
  pool: t.text().notNull(),
  tickLower: t.integer().notNull(),
  tickUpper: t.integer().notNull(),
  liquidity: t.bigint().notNull(),
  createdAt: t.timestamp().notNull(),
}));

// pools have many positions
export const poolRelations = relations(v3Pools, ({ many }) => ({
  positions: many(positions),
}));

// positions have one pool
export const positionRelations = relations(positions, ({ one }) => ({
  pool: one(v3Pools, { fields: [positions.pool], references: [v3Pools.id] }),
}));

export const modules = onchainTable("module", (t) => ({
  id: t.text().primaryKey(),
  state: t.integer().notNull(),
  lastUpdated: t.timestamp().notNull(),
}));

export const users = onchainTable("user", (t) => ({
  id: t.text().primaryKey(),
  address: t.text().notNull(),
  createdAt: t.timestamp().notNull(),
}));

// users have many assets and positions
export const userRelations = relations(users, ({ many }) => ({
  userAssets: many(userAssets),
}));

export const userAssets = onchainTable(
  "user_asset",
  (t) => ({
    id: t.text().primaryKey(),
    userId: t.text().notNull(),
    assetId: t.text().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.assetId] }),
  })
);

export const userAssetRelations = relations(userAssets, ({ one }) => ({
  user: one(users, { fields: [userAssets.userId], references: [users.id] }),
  asset: one(assets, { fields: [userAssets.assetId], references: [assets.id] }),
}));

import { onchainTable } from "ponder";

export const assets = onchainTable("assets", (t) => ({
  id: t.text().primaryKey(),
  numeraire: t.text().notNull(),
  pool: t.text().notNull(),
  timelock: t.text().notNull(),
  governance: t.text().notNull(),
  liquidityMigrator: t.text().notNull(),
  migrationPool: t.text().notNull(),
  poolInitializer: t.text().notNull(),
  createdAt: t.timestamp().notNull(),
  migratedAt: t.timestamp(),
}));

export const modules = onchainTable("modules", (t) => ({
  id: t.text().primaryKey(),
  state: t.integer().notNull(),
  lastUpdated: t.timestamp().notNull(),
}));

export const owners = onchainTable("owners", (t) => ({
  id: t.text().primaryKey(),
  address: t.text().notNull(),
  since: t.timestamp().notNull(),
}));

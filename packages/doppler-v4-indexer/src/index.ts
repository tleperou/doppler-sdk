import { ponder } from "ponder:registry";
import {asset} from "../ponder.schema";
import {getAssetData, getPoolData, getPoolID} from "@app/utils";
import {addresses} from "@app/types";

ponder.on('PoolManager:Initialize', async ({ event, context }) => {
    console.debug(`PoolManager:Initialize`);
});

/*
 * This event is emitted when a new airlock is created.
 * We use this event to fetch the asset data and persist it in the database.
 */
ponder.on('Airlock:Create', async ({ event, context }) => {
    const { asset: assetTokenAddr, initializer: poolInitializerAddress } = event.args;

    // Exclude the airlocks created by pool initializer v3
    // Do it before fetching the asset data to save some time and execution cycle
    if(poolInitializerAddress != addresses.v4Initializer){
        console.debug(`Skipping airlock ${assetTokenAddr} created by ${poolInitializerAddress}`);
        return;
    }

    // Fetch the asset data and pool ID
    const assetData = await getAssetData(assetTokenAddr, context);
    if(!assetData){
        console.error(`Error fetching asset data for ${assetTokenAddr}`);
        return;
    }
    const poolId = await getPoolID(assetData.pool, context);
    if(!poolId){
        console.error(`Error fetching pool ID for ${assetData.pool}`);
        return;
    }

    // Persist the asset entity
    await context.db.insert(asset).values({
        address: assetTokenAddr,
        pool_id: poolId,
        pool_address: assetData.pool,
        numeraire: assetData.numeraire,
        num_tokens_to_sell: assetData.numTokensToSell,
        timelock_address: assetData.timelock,
        governance_address: assetData.governance,
        liquidity_migrator_address: assetData.liquidityMigrator,
        pool_initializer_address: assetData.poolInitializer,
        migration_pool_address: assetData.migrationPool,
        integrator_address: assetData.integrator,
        created_at: event.block.timestamp,
        migrated_at: null,
    }).onConflictDoNothing();

    // Get the pool data out of the hook address
    const poolData = await getPoolData(poolId, addresses.stateView, context);
});

/*
    * This event is emitted when an airlock is migrated.
    * We use this event to update the asset entity with the migration timestamp.
    * But we can also use this event to fetch the asset data and update the entity with the new data.
    * And if the entity doesn't exist, we can create it.
 */
ponder.on('Airlock:Migrate', async ({ event, context }) => {
    const { asset: assetTokenAddr } = event.args;

    // Fetch the asset data
    const assetData = await getAssetData(assetTokenAddr, context);
    if(!assetData){
        console.error(`Error fetching asset data for ${assetTokenAddr}`);
        return;
    }

    // Exclude the airlocks migrated by pool initializer v3
    if(assetData.poolInitializer != addresses.v4Initializer){
        console.debug(`Skipping airlock ${assetTokenAddr} migrated by ${assetData.poolInitializer}`);
        return;
    }

    // Get the pool ID
    const poolId = await getPoolID(assetData.pool, context);
    if(!poolId){
        console.error(`Error fetching pool ID for ${assetData.pool}`);
        return;
    }

    // Update the asset entity
    await context.db.insert(asset).values({
        address: assetTokenAddr,
        pool_id: poolId,
        pool_address: assetData.pool,
        numeraire: assetData.numeraire,
        num_tokens_to_sell: assetData.numTokensToSell,
        timelock_address: assetData.timelock,
        governance_address: assetData.governance,
        liquidity_migrator_address: assetData.liquidityMigrator,
        pool_initializer_address: assetData.poolInitializer,
        migration_pool_address: assetData.migrationPool,
        integrator_address: assetData.integrator,
        created_at: event.block.timestamp,
        migrated_at: event.block.timestamp,
    }).onConflictDoUpdate((row) => ({
        migrated_at: event.block.timestamp
    }));
})

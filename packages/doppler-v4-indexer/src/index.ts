import { ponder } from "ponder:registry";
import {asset} from "../ponder.schema";
import {getAssetData, getPoolData, getPoolID} from "@app/utils";
import {addresses} from "@app/types";

ponder.on('PoolManager:Initialize', async ({ event, context }) => {
    console.debug(`PoolManager:Initialize`);
});

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

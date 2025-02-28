import { ponder } from "ponder:registry";
import { executeScheduledJobs } from "./shared/scheduledJobs";

/**
 * Block handlers that run periodically to ensure volume data and metrics are up-to-date
 * These are triggered by the block configuration in ponder.config.ts
 */

// Handler for unichainSepolia network
ponder.on(
  "MetricRefresherUnichainSepolia:block",
  async ({ event, context }) => {
    console.log(
      `Running comprehensive refresh for unichainSepolia at block ${event.block.number}`
    );
    
    const startTime = Date.now();
    
    try {
      // Execute combined refresh job
      await executeScheduledJobs({
        context,
        currentTimestamp: BigInt(event.block.timestamp),
      });
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`UnichainSepolia refresh completed in ${duration.toFixed(2)}s`);
    } catch (error) {
      console.error(`Error in unichainSepolia refresh job: ${error}`);
      // Log error but don't throw to prevent handler from failing completely
    }
  }
);

// Handler for unichain network
ponder.on("MetricRefresherUnichain:block", async ({ event, context }) => {
  console.log(
    `Running comprehensive refresh for unichain at block ${event.block.number}`
  );
  
  const startTime = Date.now();
  
  try {
    // Execute combined refresh job
    await executeScheduledJobs({
      context,
      currentTimestamp: BigInt(event.block.timestamp),
    });
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Unichain refresh completed in ${duration.toFixed(2)}s`);
  } catch (error) {
    console.error(`Error in unichain refresh job: ${error}`);
    // Log error but don't throw to prevent handler from failing completely
  }
});

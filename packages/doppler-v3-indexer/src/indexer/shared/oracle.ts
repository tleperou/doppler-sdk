import { ethPrice } from "ponder.schema";
import { Context } from "ponder:registry";
import { and, gte, lte } from "drizzle-orm";

export const fetchEthPrice = async (timestamp: bigint, context: Context) => {
  const { db } = context;
  const price = await db.sql.query.ethPrice.findFirst({
    where: and(
      gte(ethPrice.timestamp, timestamp - 10n * 60n),
      lte(ethPrice.timestamp, timestamp)
    ),
  });

  return price;
};

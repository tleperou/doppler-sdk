import { Context } from "ponder:registry";
import { fetchEthPrice } from "../indexer/shared/oracle";
import { WAD, CHAINLINK_ETH_DECIMALS } from "../utils/constants";

export const computeDollarLiquidity = async ({
  assetBalance,
  quoteBalance,
  price,
  timestamp,
  context,
}: {
  assetBalance: bigint;
  quoteBalance: bigint;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const ethPrice = await fetchEthPrice(timestamp, context);

  let assetLiquidity;
  let numeraireLiquidity;
  if (ethPrice?.price) {
    assetLiquidity =
      (((assetBalance * price) / WAD) * ethPrice.price) /
      CHAINLINK_ETH_DECIMALS;
    numeraireLiquidity =
      (quoteBalance * ethPrice.price) / CHAINLINK_ETH_DECIMALS;
  } else {
    assetLiquidity = 0n;
    numeraireLiquidity = 0n;
  }

  return assetLiquidity + numeraireLiquidity;
};

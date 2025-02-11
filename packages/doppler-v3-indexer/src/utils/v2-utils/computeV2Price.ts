import { WAD } from "../constants";

export const computeV2Price = async ({
  assetBalance,
  quoteBalance,
}: {
  assetBalance: bigint;
  quoteBalance: bigint;
}) => {
  return (quoteBalance * WAD) / assetBalance;
};

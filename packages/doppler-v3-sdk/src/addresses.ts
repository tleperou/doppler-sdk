import { Address } from "viem";
import { DopplerV3Addresses } from "./types";

export const DOPPLER_V3_ADDRESSES: { [chainId: number]: DopplerV3Addresses } = {
  // unichain sepolia
  1301: {
    airlock: "0x651ab94B4777e2e4cdf96082d90C65bd947b73A4" as Address,
    tokenFactory: "0xC5E5a19a2ee32831Fcb8a81546979AF43936EbaA" as Address,
    v3Initializer: "0x7Fb9a622186B4660A5988C223ebb9d3690dD5007" as Address,
    governanceFactory: "0x1E4332EEfAE9e4967C2D186f7b2d439D778e81cC" as Address,
    liquidityMigrator: "0x44C448E38A2C3D206c9132E7f645510dFbBC946b" as Address,
    universalRouter: "0xf70536B3bcC1bD1a972dc186A2cf84cC6da6Be5D" as Address,
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address,
    quoterV2: "0x6Dd37329A1A225a6Fca658265D460423DCafBF89" as Address,
  },
};

import { Address } from "viem";
import { DopplerV3Addresses } from "./types";

export const DOPPLER_V3_ADDRESSES: { [chainId: number]: DopplerV3Addresses } = {
  // unichain sepolia
  1301: {
    airlock: "0x2a6a1881b5cda2c444782a713d3979670df2206f" as Address,
    tokenFactory: "0xf713fd0f91517a9f22b268b6f8d8deb88e8fea5b" as Address,
    v3Initializer: "0xdf6f19077cba70fb4f43fa609247ad7dda7a9a1c" as Address,
    universalRouter: "0x34d5a9624c340f2cf4a2a0edc64f6fcadd65d475" as Address,
    governanceFactory: "0x9442c17048b2c8bdd8ffdea1ac1d98e25106517b" as Address,
    liquidityMigrator: "0xa87301f5efc1e39b72c9e84114893a981e09277b" as Address,
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address,
    quoterV2: "0x6Dd37329A1A225a6Fca658265D460423DCafBF89" as Address,
  },
};

import { createConfig } from "ponder";
import { Address, http } from "viem";
import { AirlockABI } from "./abis/AirlockABI";
import { unichainSepolia } from "viem/chains";

const addresses = {
  airlock: "0xc95B1d01445b90d1C0C8d285f0143D132f2593cc" as Address,
  tokenFactory: "0xf00193Fa5c9085436Bd5215D1b49C908A89dCFDf" as Address,
  uniswapV4Initializer: "0x1DE0912cF8C620774AaA818a0f4e086c865B9d61" as Address,
  uniswapV3Initializer: "0xA5b67F1cF60095ec9074814f962540702d68917b" as Address,
  governanceFactory: "0x5f706A9A46BE314AF3001b8ABDD024f6dAEE5145" as Address,
  migrator: "0x2f1bC69586Cc5300df0Fc917f2A1D2a547043C8B" as Address,
};

export default createConfig({
  networks: {
    unichainSepolia: {
      chainId: 1301,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  contracts: {
    Airlock: {
      network: "unichainSepolia",
      abi: AirlockABI,
      address: addresses.airlock,
      startBlock: 7178680,
    },
  },
});

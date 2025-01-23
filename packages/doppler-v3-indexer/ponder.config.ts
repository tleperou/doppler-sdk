import { createConfig, factory } from "ponder";
import { Address, getAbiItem, http } from "viem";
import { AirlockABI } from "./abis/AirlockABI";
import { UniswapV3PoolABI } from "./abis/UniswapV3PoolABI";
import { DERC20ABI } from "./abis/DERC20ABI";

const addresses = {
  airlock: "0x69224c3523999331E01C8B7d1DCc295343CEE26a" as Address,
  tokenFactory: "0xaF7333D5B1D12170867078ed84387B9dD3B33d67" as Address,
  v3Initializer: "0x003CaB286014EB585363ab2661dDC1307aE1E977" as Address,
  governanceFactory: "0xd0DE88aff74eC9D52A3e4F565844fDE378386BaA" as Address,
  liquidityMigrator: "0x76309FA8c4D006aa50b5E3417cfca395BBf9B50A" as Address,
};

export default createConfig({
  networks: {
    unichainSepolia: {
      chainId: 1301,
      transport: http(process.env.PONDER_RPC_UNICHAIN_SEPOLIA),
    },
  },
  contracts: {
    UniswapV3Pool: {
      abi: UniswapV3PoolABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.airlock,
        event: getAbiItem({ abi: AirlockABI, name: "Create" }),
        parameter: "poolOrHook",
      }),
      startBlock: 10742701,
    },
    DERC20: {
      abi: DERC20ABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.airlock,
        event: getAbiItem({ abi: AirlockABI, name: "Create" }),
        parameter: "asset",
      }),
      startBlock: 10742701,
    },
    Airlock: {
      abi: AirlockABI,
      network: "unichainSepolia",
      address: addresses.airlock,
      startBlock: 10742701,
    },
  },
});

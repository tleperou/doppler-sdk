import { createConfig, factory } from "ponder";
import { Address, getAbiItem, http } from "viem";
import { AirlockABI } from "./abis/AirlockABI";
import { UniswapV3PoolABI } from "./abis/UniswapV3PoolABI";
import { DERC20ABI } from "./abis/DERC20ABI";

const addresses = {
  airlock: "0x53dd5d05b440513F2565E4b372e1cdeDB6C4B0a9" as Address,
  tokenFactory: "0x92E5c7d5152d9C8A0F193F71ec8f24332Cb58f14" as Address,
  v3Initializer: "0xd6616FCEb1501efb4f9b2DE0180cFd8766eA7C80" as Address,
  governanceFactory: "0x541C932232195F30ac2423024c9F298809433618" as Address,
  liquidityMigrator: "0x5ACf6e39a0A351c32202403BEF0A93215F742FC0" as Address,
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
      startBlock: 9427770,
    },
    DERC20: {
      abi: DERC20ABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.airlock,
        event: getAbiItem({ abi: AirlockABI, name: "Create" }),
        parameter: "asset",
      }),
      startBlock: 9427770,
    },
    Airlock: {
      abi: AirlockABI,
      network: "unichainSepolia",
      address: addresses.airlock,
      startBlock: 9427770,
    },
  },
});

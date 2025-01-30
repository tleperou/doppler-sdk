import { createConfig, factory } from "ponder";
import { getAbiItem, http } from "viem";
import {
  UniswapV3InitializerABI,
  UniswapV4InitializerABI,
  UniswapV3PoolABI,
  AirlockABI,
  DERC20ABI,
  DopplerABI,
  PoolManagerABI,
} from "./src/abis";
import { addresses } from "./src/types/addresses";

const unichainSepoliaChainId = 1301;
const startingBlock = 11410729;

export default createConfig({
  networks: {
    unichainSepolia: {
      chainId: unichainSepoliaChainId,
      transport: http(process.env.PONDER_RPC_UNICHAIN_SEPOLIA),
    },
  },
  contracts: {
    Airlock: {
      abi: AirlockABI,
      network: "unichainSepolia",
      address: addresses.shared.airlock,
      startBlock: startingBlock,
    },
    UniswapV3Initializer: {
      abi: UniswapV3InitializerABI,
      network: "unichainSepolia",
      address: addresses.v3.v3Initializer,
      startBlock: startingBlock,
    },
    UniswapV4Initializer: {
      abi: UniswapV4InitializerABI,
      network: "unichainSepolia",
      address: addresses.v4.v4Initializer,
      startBlock: startingBlock,
    },
    DERC20: {
      abi: DERC20ABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.shared.airlock,
        event: getAbiItem({ abi: AirlockABI, name: "Create" }),
        parameter: "asset",
      }),
      startBlock: startingBlock,
    },
    UniswapV3Pool: {
      abi: UniswapV3PoolABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.v3.v3Initializer,
        event: getAbiItem({ abi: UniswapV3InitializerABI, name: "Create" }),
        parameter: "poolOrHook",
      }),
      startBlock: startingBlock,
    },
    PoolManager: {
      abi: PoolManagerABI,
      network: "unichainSepolia",
      address: addresses.v4.poolManager,
      startBlock: startingBlock,
    },
    UniswapV4Pool: {
      abi: DopplerABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.v4.v4Initializer,
        event: getAbiItem({ abi: UniswapV4InitializerABI, name: "Create" }),
        parameter: "poolOrHook",
      }),
      startBlock: startingBlock,
    },
  },
});

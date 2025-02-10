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
const mainnetChainId = 1;

const unichainSepoliaStartingBlock = 11932039;
const mainnetStartingBlock = 21782000;

export default createConfig({
  networks: {
    unichainSepolia: {
      chainId: unichainSepoliaChainId,
      transport: http(process.env.PONDER_RPC_URL_1301),
    },
    mainnet: {
      chainId: mainnetChainId,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  blocks: {
    ChainlinkEthPriceFeed: {
      network: "mainnet",
      startBlock: mainnetStartingBlock,
      interval: (60 * 5) / 12, // every 5 minutes
    },
  },
  contracts: {
    Airlock: {
      abi: AirlockABI,
      network: "unichainSepolia",
      address: addresses.shared.airlock,
      startBlock: unichainSepoliaStartingBlock,
    },
    UniswapV3Initializer: {
      abi: UniswapV3InitializerABI,
      network: "unichainSepolia",
      address: addresses.v3.v3Initializer,
      startBlock: unichainSepoliaStartingBlock,
    },
    UniswapV4Initializer: {
      abi: UniswapV4InitializerABI,
      network: "unichainSepolia",
      address: addresses.v4.v4Initializer,
      startBlock: unichainSepoliaStartingBlock,
    },
    DERC20: {
      abi: DERC20ABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.v3.v3Initializer,
        event: getAbiItem({ abi: UniswapV3InitializerABI, name: "Create" }),
        parameter: "asset",
      }),
      startBlock: unichainSepoliaStartingBlock,
    },
    UniswapV3Pool: {
      abi: UniswapV3PoolABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.v3.v3Initializer,
        event: getAbiItem({ abi: UniswapV3InitializerABI, name: "Create" }),
        parameter: "poolOrHook",
      }),
      startBlock: unichainSepoliaStartingBlock,
    },
    PoolManager: {
      abi: PoolManagerABI,
      network: "unichainSepolia",
      address: addresses.v4.poolManager,
      startBlock: unichainSepoliaStartingBlock,
    },
    UniswapV4Pool: {
      abi: DopplerABI,
      network: "unichainSepolia",
      address: factory({
        address: addresses.v4.v4Initializer,
        event: getAbiItem({ abi: UniswapV4InitializerABI, name: "Create" }),
        parameter: "poolOrHook",
      }),
      startBlock: unichainSepoliaStartingBlock,
    },
  },
});

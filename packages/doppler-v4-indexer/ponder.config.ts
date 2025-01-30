import { createConfig, factory } from "ponder";
import {getAbiItem, http} from "viem";

import {airlockAbi, derc20Abi, poolManagerAbi} from "@app/abis";
import {addresses} from "@app/types";

const chainId = 1301;
const startingBlock = 11399810;

export default createConfig({
    networks: {
        unichainSepolia: {
            chainId: chainId,
            transport: http(process.env.PONDER_RPC_UNICHAIN_SEPOLIA),
        },
    },
    contracts: {
        PoolManager: {
            abi: poolManagerAbi,
            network: "unichainSepolia",
            address: factory({
                address: addresses.poolManager,
                event: getAbiItem({ abi: airlockAbi, name: "Create" }),
                parameter: "poolOrHook",
            }),
            startBlock: startingBlock,
        },
        DERC20: {
            abi: derc20Abi,
            network: "unichainSepolia",
            address: factory({
                address: addresses.airlock,
                event: getAbiItem({ abi: airlockAbi, name: "Create" }),
                parameter: "asset",
            }),
            startBlock: startingBlock,
        },
        Airlock: {
            abi: airlockAbi,
            network: "unichainSepolia",
            address: addresses.airlock,
            startBlock: startingBlock,
        },
    },
});

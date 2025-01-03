import { createConfig, factory } from "ponder";
import { Address, getAbiItem, http } from "viem";
import { AirlockABI } from "./abis/AirlockABI";
import { UniswapV3PoolABI } from "./abis/UniswapV3PoolABI";

const addresses = {
  airlock: "0x0EC7a97C0Bf6cB52C882E23ae66FBD3a914989f5" as Address,
  tokenFactory: "0xbFDB42D11705c21B2C5b9358ae2BB1DF6fc4E828" as Address,
  uniswapV3Initializer: "0x11ab5b5432915C8fcA64d6FeE97CAEbF70c8702B" as Address,
  governanceFactory: "0x7bdA8541cecb830fd3b29433A59c8c1de2DFE929" as Address,
  migrator: "0x3b5660fAD6A586c06CBd32a138A423F25cE4a8F9" as Address,
  stateView: "0xdE04C804dc75E90D8a64e5589092a1D6692EFA45" as Address,
  quoter: "0xfe6Cf50c4cfe801dd2AEf9c1B3ce24f551944df8" as Address,
  customRouter: "0x335101dfaeFaA13eded1212Fd120376411d22788" as Address,
};

export default createConfig({
  networks: {
    unichainSepolia: {
      chainId: 1301,
      transport: http(process.env.PONDER_RPC_URL_1),
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
      startBlock: 9072310,
    },

    Airlock: {
      abi: AirlockABI,
      network: "unichainSepolia",
      address: addresses.airlock,
      startBlock: 9072310,
    },
  },
});

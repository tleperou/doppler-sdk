import { Address } from "viem";

export type DopplerAddresses = {
  v3: V3Addresses;
  v4: V4Addresses;
  shared: SharedAddresses;
  oracle: OracleAddresses;
};

export type SharedAddresses = {
  airlock: Address;
  tokenFactory: Address;
  universalRouter: Address;
  governanceFactory: Address;
  migrator: Address;
  weth: Address;
};

export type V4Addresses = {
  dopplerDeployer: Address;
  v4Initializer: Address;
  stateView: Address;
  poolManager: Address;
};

export type V3Addresses = {
  v3Initializer: Address;
};

export type OracleAddresses = {
  mainnetEthUsdc: Address;
  weth: Address;
  usdc: Address;
  chainlinkEth: Address;
};

export const v3Addresses: V3Addresses = {
  v3Initializer: "0xdf6f19077cba70fb4f43fa609247ad7dda7a9a1c" as Address,
};

export const v4Addresses: V4Addresses = {
  poolManager: "0x9F18932969e072e642a0c73D98b97Abf99276e82" as Address,
  dopplerDeployer: "0x03414fe5722fe0c699f9dcab97fb28133df2a86a" as Address,
  v4Initializer: "0xca01bec6faeef04351a1f5b4045883e5f91a97b3" as Address,
  stateView: "0x02dc4a94f68b0f76046cdeb0e202d8854e203ec3" as Address,
};

export const sharedAddresses: SharedAddresses = {
  airlock: "0x2a6a1881b5cda2c444782a713d3979670df2206f" as Address,
  tokenFactory: "0xf713fd0f91517a9f22b268b6f8d8deb88e8fea5b" as Address,
  universalRouter: "0x34d5a9624c340f2cf4a2a0edc64f6fcadd65d475" as Address,
  governanceFactory: "0x9442c17048b2c8bdd8ffdea1ac1d98e25106517b" as Address,
  migrator: "0xa87301f5efc1e39b72c9e84114893a981e09277b" as Address,
  weth: "0x4200000000000000000000000000000000000006" as Address,
};

export const oracleAddresses: OracleAddresses = {
  mainnetEthUsdc: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640" as Address,
  weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address,
  usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
  chainlinkEth: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" as Address,
};

export const addresses: DopplerAddresses = {
  v3: v3Addresses,
  v4: v4Addresses,
  shared: sharedAddresses,
  oracle: oracleAddresses,
};

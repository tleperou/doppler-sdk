import { PublicClient, WalletClient, TestClient } from 'viem';

export type Clients = {
  publicClient: PublicClient;
  walletClient: WalletClient;
  testClient: TestClient;
};

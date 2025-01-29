import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

export const INDEXER_URL = import.meta.env.VITE_INDEXER_GRAPHQL;

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  isDerc20: boolean;
};

export type Pool = {
  id: string;
  token0: Token;
  token1: Token;
  feeTier: number;
};

export type Position = {
  id: string;
  owner: string;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
};

const tokensQuery = gql`
  query Tokens {
    tokens {
      items {
        address
        name
        symbol
        decimals
        isDerc20
      }
    }
  }
`;

const v3PoolsQuery = gql`
  query V3Pools($poolInitializer: String) {
    v3Pools(where: { initializer: $poolInitializer }) {
      items {
        id
        asset {
          ...assetFields
        }
        baseToken {
          ...tokenFields
        }
        quoteToken {
          ...tokenFields
        }
      }
    }
  }
  fragment tokenFields on token {
    address
    name
    symbol
    decimals
    isDerc20
  }
  fragment assetFields on asset {
    address
    numeraire
    timelock
    governance
    migrationPool
    liquidityMigrator
    poolInitializer
    numTokensToSell
    integrator
    createdAt
    migratedAt
  }
`;

const positionsQuery = gql`
  query Positions($owner: String!) {
    positions(where: { owner: $owner }) {
      id
      owner
      liquidity
      tickLower
      tickUpper
    }
  }
`;

const hourBucketsQuery = gql`
  query HourBuckets($poolId: String!) {
    hourBuckets(where: { pool: $poolId }) {
      id
      open
      close
      low
      high
      average
      count
    }
  }
`;

export const useTokens = () =>
  useQuery({
    queryKey: ["indexer", "tokens"],
    queryFn: () => request(INDEXER_URL, tokensQuery),
  });

export const useV3Pools = (poolInitializer?: string) =>
  useQuery({
    queryKey: ["indexer", "v3Pools", poolInitializer],
    queryFn: () => request(INDEXER_URL, v3PoolsQuery, { poolInitializer }),
  });

export const usePositions = (owner: string) =>
  useQuery({
    queryKey: ["indexer", "positions", owner],
    queryFn: () => request(INDEXER_URL, positionsQuery, { owner }),
    enabled: !!owner,
  });

export const useHourBuckets = (poolId: string) =>
  useQuery({
    queryKey: ["indexer", "hourBuckets", poolId],
    queryFn: () => request(INDEXER_URL, hourBucketsQuery, { poolId }),
  });

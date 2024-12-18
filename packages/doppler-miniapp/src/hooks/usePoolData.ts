import { useQuery } from "@tanstack/react-query";
import { Address, erc20Abi } from "viem";
import { AssetData, ReadDerc20, ReadFactory } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";
import { TokenData } from "../utils/token";

type MarketDetails = {
  assetData: AssetData;
  asset: TokenData;
  numeraire: TokenData;
};

const fetchPositionData = async (marketDetails: MarketDetails) => {
  const assetData = await publicClient.readContract({
    address: addresses.airlock,
    abi: AirlockABI,
    functionName: "getAssetData",
    args: [id as Address],
  });

  const initializer = assetData[4];
  const pool = assetData[5];

  const poolData = await publicClient.readContract({
    address: pool,
    abi: uniswapV3PoolAbi,
    functionName: "slot0",
  });
  const tick = poolData[1];

  setCurrentTick(Number(tick));

  const poolMintEvents = await publicClient.getLogs({
    address: pool,
    event: parseAbiItem(
      "event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)"
    ),
    fromBlock: 0n,
    toBlock: "latest",
    args: {
      owner: initializer as Address,
    },
  });
  const positions = poolMintEvents.map((event) => ({
    tickLower: event.args?.tickLower ?? 0,
    tickUpper: event.args?.tickUpper ?? 0,
    liquidity: event.args?.amount ?? 0n,
  }));

  return positions;
};

const fetchMarketDetails = async (airlock: Address, assetAddress: Address) => {
  const drift = getDrift();
  const readFactory = new ReadFactory(airlock, drift);
  const assetData = await readFactory.getAssetData(assetAddress);

  const readAsset = new ReadDerc20(assetAddress, drift);
  const readNumeraire = new ReadDerc20(assetData.numeraire, drift);
  const poolBalance = await readAsset.getBalanceOf(assetData.pool);

  const [
    assetName,
    assetSymbol,
    assetDecimals,
    assetTotalSupply,
    numeraireName,
    numeraireSymbol,
    numeraireDecimals,
  ] = await Promise.all([
    readAsset.getName(),
    readAsset.getSymbol(),
    readAsset.getDecimals(),
    readAsset.getTotalSupply(),
    readNumeraire.getName(),
    readNumeraire.getSymbol(),
    readNumeraire.getDecimals(),
  ]);

  const marketDetails: MarketDetails = {
    assetData,
    asset: {
      address: assetAddress,
      name: assetName,
      symbol: assetSymbol,
      decimals: assetDecimals,
      totalSupply: assetTotalSupply,
      poolBalance,
    },
    numeraire: {
      address: assetData.numeraire,
      name: numeraireName,
      symbol: numeraireSymbol,
      decimals: numeraireDecimals,
    },
  };

  return marketDetails;
};

export function useMarketDetails(airlock: Address, assetAddress: Address) {
  const marketDetailsQuery = useQuery({
    queryKey: ["market-details", assetAddress],
    queryFn: async () => {
      return fetchMarketDetails(airlock, assetAddress);
    },
  });

  const poolsQuery = useQuery({
    queryKey: [
      "pools",
      creationsQuery.data?.map((pc) => pc.asset.contract.address),
    ],
    queryFn: async () => {
      const poolDatas = await Promise.all(
        creationsQuery?.data?.map(async (creationData) => {
          return getPoolCreationData(creationData);
        }) ?? []
      );
      return poolDatas;
    },
    enabled: !!creationsQuery.data,
  });

  return {
    isLoading: poolsQuery.isLoading || creationsQuery.isLoading,
    error: poolsQuery.error || creationsQuery.error,
    data: poolsQuery.data,
  };
}

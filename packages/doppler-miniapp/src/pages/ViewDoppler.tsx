import { useParams } from "react-router-dom";
import { addresses } from "../addresses";
import { AirlockABI } from "../abis/AirlockABI";
import { usePublicClient } from "wagmi";
import { useConfig } from "wagmi";
import { Address, erc20Abi, formatEther, parseAbiItem } from "viem";
import { useEffect, useState } from "react";
import LiquidityChart from "../components/LiquidityChart";
import { uniswapV3PoolAbi } from "../abis/UniswapV3PoolABI";
import { trimPaddedAddress } from "../utils/address";
import { TokenData } from "../utils/token";
import TokenName from "../components/TokenName";

interface Position {
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

type MarketDetails = {
  asset: TokenData;
  numeraire: TokenData;
};

function ViewDoppler() {
  const { id } = useParams();
  const config = useConfig();
  const publicClient = usePublicClient({ config });

  const [positions, setPositions] = useState<Position[]>([]);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [marketDetails, setMarketDetails] = useState<MarketDetails>();

  const fetchPositionData = async () => {
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

    setPositions(positions);
    setIsLoading(false);
  };

  const fetchMarketDetails = async () => {
    const assetAddress = trimPaddedAddress(id as Address) as Address;
    const assetData = await publicClient.readContract({
      address: addresses.airlock,
      abi: AirlockABI,
      functionName: "getAssetData",
      args: [assetAddress],
    });

    const numeraireAddress = assetData[0];
    const pool = assetData[5];

    const poolBalance = await publicClient.readContract({
      address: assetAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [pool],
    });

    const [
      assetName,
      assetSymbol,
      assetDecimals,
      assetTotalSupply,
      numeraireName,
      numeraireSymbol,
      numeraireDecimals,
    ] = await Promise.all([
      publicClient.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "name",
      }),
      publicClient.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
      publicClient.readContract({
        address: numeraireAddress,
        abi: erc20Abi,
        functionName: "name",
      }),
      publicClient.readContract({
        address: numeraireAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: numeraireAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    const marketDetails: MarketDetails = {
      asset: {
        address: assetAddress,
        name: assetName,
        symbol: assetSymbol,
        decimals: assetDecimals,
        totalSupply: assetTotalSupply,
        poolBalance,
      },
      numeraire: {
        address: numeraireAddress,
        name: numeraireName,
        symbol: numeraireSymbol,
        decimals: numeraireDecimals,
      },
    };
    setMarketDetails(marketDetails);
  };

  useEffect(() => {
    fetchMarketDetails();
    fetchPositionData();
  }, []);

  return (
    <div className="view-doppler">
      <h3 className="page-title">
        <TokenName
          name={marketDetails?.asset.name ?? ""}
          symbol={marketDetails?.asset.symbol ?? ""}
          showSymbol={false}
        />{" "}
        /{" "}
        <TokenName
          name={marketDetails?.numeraire.name ?? ""}
          symbol={marketDetails?.numeraire.symbol ?? ""}
          showSymbol={false}
        />
      </h3>
      {isLoading ? (
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Loading chart data...</p>
        </div>
      ) : (
        <LiquidityChart positions={positions} currentTick={currentTick} />
      )}
      <div className="doppler-info">
        {marketDetails && (
          <>
            <div className="market-stats">
              <div className="stat-item">
                <label>Total Supply</label>
                <span>
                  {formatEther(marketDetails.asset.totalSupply ?? 0n)}
                </span>
              </div>
              <div className="stat-item">
                <label>Tokens Sold</label>
                <span>
                  {(
                    Number(formatEther(marketDetails.asset.totalSupply ?? 0n)) -
                    Number(formatEther(marketDetails.asset.poolBalance ?? 0n))
                  ).toFixed(0)}
                </span>
              </div>
              <div className="stat-item">
                <label>Current Tick</label>
                <span>{currentTick}</span>
              </div>
            </div>
            <a
              href={`https://app.uniswap.org/swap?chain=unichainsepolia&inputCurrency=NATIVE&outputCurrency=${marketDetails.asset.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trade-button"
            >
              Trade
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewDoppler;

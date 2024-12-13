import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBlockNumber, usePublicClient } from "wagmi";
import { addresses } from "../addresses";
import { parseAbiItem, Address, Hex, erc20Abi, formatEther } from "viem";
import { trimPaddedAddress } from "../utils/address";
import { config } from "../wagmi";
import { AirlockABI } from "../abis/AirlockABI";
import TokenName from "../components/TokenName";

type TokenData = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  poolBalance?: bigint;
};

type AssetData = {
  numeraire: Address;
  timelock: Address;
  governance: Address;
  liquidityMigrator: Address;
  poolInitializer: Address;
  pool: Address;
  migrationPool: Address;
};

type CreateEvent = {
  asset: TokenData;
  numeraire: TokenData;
  blockNumber: bigint;
  transactionHash: string;
};

function HomePage() {
  const [dopplers, setDopplers] = useState<CreateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient({ config });
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const fetchDopplers = async () => {
    try {
      const logs = await publicClient.getLogs({
        address: addresses.airlock,
        event: parseAbiItem("event Create(address asset, address numeraire)"),
        fromBlock: 0n,
        toBlock: "latest",
      });

      const formattedDopplers = await Promise.all(
        logs.map(async (log) => {
          const assetAddress = trimPaddedAddress(log.data) as Address;
          const numeraireAddress = trimPaddedAddress(
            log.topics[1] as Hex
          ) as Address;

          const assetData = await publicClient.readContract({
            address: addresses.airlock,
            abi: AirlockABI,
            functionName: "getAssetData",
            args: [assetAddress],
          });

          console.log("initializer", assetData[4]);
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

          return {
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
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          };
        })
      );

      // Sort by block number, newest first
      formattedDopplers.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setDopplers(formattedDopplers);
    } catch (error) {
      console.error("Failed to fetch Dopplers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDopplers();
  }, [blockNumber, publicClient]);

  return (
    <div className="home-page">
      <div className="doppler-actions">
        <div className="recent-dopplers">
          <h2>Recent Markets</h2>
          {isLoading ? (
            <div className="loading-content">
              <div className="loading-spinner" />
              <p>Loading Dopplers...</p>
            </div>
          ) : dopplers.length === 0 ? (
            <p>No Dopplers found</p>
          ) : (
            <div className="doppler-list">
              {dopplers.map((doppler) => (
                <div key={doppler.transactionHash} className="doppler-item">
                  <Link
                    to={`/doppler/${doppler.asset.address}`}
                    className="doppler-link"
                  >
                    <div className="doppler-info">
                      <span className="doppler-address">
                        <TokenName
                          name={doppler.asset.name}
                          symbol={doppler.asset.symbol}
                        />{" "}
                        /{" "}
                        <TokenName
                          name={doppler.numeraire.name}
                          symbol={doppler.numeraire.symbol}
                        />
                      </span>
                      <span className="doppler-address">
                        Tokens Sold:{" "}
                        {Number(
                          formatEther(doppler.asset.poolBalance ?? 0n)
                        ).toFixed(0)}{" "}
                        / {formatEther(doppler.asset.totalSupply ?? 0n)}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

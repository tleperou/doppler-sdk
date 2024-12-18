import { Navigate, useParams } from "react-router-dom";
import { addresses } from "../addresses";
import { Address, formatEther } from "viem";
import LiquidityChart from "../components/LiquidityChart";
import TokenName from "../components/TokenName";
import { usePoolData } from "../hooks/usePoolData";

function ViewDoppler() {
  const { id } = useParams();
  const { airlock } = addresses;

  if (!id || !/^0x[a-fA-F0-9]{40}$/.test(id)) {
    return <Navigate to="/" />;
  }

  const { data: poolData, isLoading } = usePoolData(airlock, id as Address);

  return (
    <div className="view-doppler">
      <h3 className="page-title">
        <TokenName
          name={poolData?.marketDetails.asset.name ?? ""}
          symbol={poolData?.marketDetails.asset.symbol ?? ""}
          showSymbol={false}
        />{" "}
        /{" "}
        <TokenName
          name={poolData?.marketDetails.numeraire.name ?? ""}
          symbol={poolData?.marketDetails.numeraire.symbol ?? ""}
          showSymbol={false}
        />
      </h3>
      {isLoading ? (
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Loading chart data...</p>
        </div>
      ) : (
        <LiquidityChart
          positions={poolData?.positions ?? []}
          currentTick={poolData?.slot0.tick ?? 0}
        />
      )}
      <div className="doppler-info">
        {poolData?.marketDetails && (
          <>
            <div className="market-stats">
              <div className="stat-item">
                <label>Total Supply</label>
                <span>
                  {formatEther(poolData.marketDetails.asset.totalSupply ?? 0n)}
                </span>
              </div>
              <div className="stat-item">
                <label>Tokens Sold</label>
                <span>
                  {(
                    Number(
                      formatEther(
                        poolData.marketDetails.asset.totalSupply ?? 0n
                      )
                    ) -
                    Number(
                      formatEther(
                        poolData.marketDetails.asset.poolBalance ?? 0n
                      )
                    )
                  ).toFixed(0)}
                </span>
              </div>
              <div className="stat-item">
                <label>Current Tick</label>
                <span>{poolData?.slot0.tick ?? 0}</span>
              </div>
            </div>
            <a
              href={`https://app.uniswap.org/swap?chain=unichainsepolia&inputCurrency=NATIVE&outputCurrency=${poolData?.marketDetails.asset.token.contract.address}`}
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

import { useState } from "react";
import { addresses } from "../addresses";
import { useReadContract, useAccount, useWalletClient } from "wagmi";
import { MigratorABI } from "../abis/MigratorABI";
import { ReadWriteFactory, CreateV3PoolParams } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";

const TICK_SPACING = 60;

function roundToTickSpacing(tick: number): number {
  return Math.round(tick / TICK_SPACING) * TICK_SPACING;
}

function DeployDoppler() {
  const account = useAccount();
  const { data: walletClient } = useWalletClient(account);
  const [initialSupply, setInitialSupply] = useState("");
  const [numTokensToSell, setNumTokensToSell] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [startTick, setStartTick] = useState("");
  const [endTick, setEndTick] = useState("");
  const [numPositions, setNumPositions] = useState("");
  const [maxShareToBeSold, setMaxShareToBeSold] = useState("");
  const [maxShareToBond, setMaxShareToBond] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    tokenFactory,
    governanceFactory,
    v3Initializer,
    liquidityMigrator,
    airlock,
  } = addresses;

  const { data: weth } = useReadContract({
    abi: MigratorABI,
    address: addresses.liquidityMigrator,
    functionName: "weth",
  });

  const handleStartTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTick(e.target.value);
  };

  const handleEndTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTick(e.target.value);
  };

  const handleNumPositionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumPositions(e.target.value);
  };

  const handleMaxShareToBeSoldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMaxShareToBeSold(e.target.value);
  };

  const handleMaxShareToBondChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMaxShareToBond(e.target.value);
  };

  const handleMaxShareToBondBlur = () => {
    if (maxShareToBond) {
      setMaxShareToBond(maxShareToBond);
    }
  };

  const handleMaxShareToSoldBlur = () => {
    if (maxShareToBeSold) {
      setMaxShareToBeSold(maxShareToBeSold);
    }
  };

  const handleNumPositionsBlur = () => {
    if (numPositions) {
      setNumPositions(numPositions);
    }
  };

  const handleStartTickBlur = () => {
    if (startTick) {
      const value = Number(startTick);
      const roundedValue = roundToTickSpacing(value);
      setStartTick(roundedValue.toString());
    }
  };

  const handleEndTickBlur = () => {
    if (endTick) {
      const value = Number(endTick);
      const roundedValue = roundToTickSpacing(value);
      setEndTick(roundedValue.toString());
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    if (!walletClient) throw new Error("Wallet client not found");
    e.preventDefault();
    setIsDeploying(true);
    try {
      if (!weth) throw new Error("WETH address not loaded");
      if (!account.address) throw new Error("Account address not found");

      const createV3PoolParams: CreateV3PoolParams = {
        integrator: account.address,
        userAddress: account.address,
        numeraire: weth,
        contracts: {
          tokenFactory,
          governanceFactory,
          v3Initializer,
          liquidityMigrator,
        },
        tokenConfig: {
          name: tokenName,
          symbol: tokenSymbol,
          tokenURI: `https://pure.xyz/token/${tokenName}`,
        },
        v3PoolConfig: "default",
        vestingConfig: "default",
        saleConfig: "default",
      };

      const drift = getDrift(walletClient);
      const rwFactory = new ReadWriteFactory(airlock, drift);
      const createData = await rwFactory.encodeCreateData(createV3PoolParams);
      await rwFactory.create(createData);
    } catch (error) {
      console.error("Deployment failed:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="deploy-doppler">
      <h3 className="page-title">Deploy Market</h3>
      <form onSubmit={handleDeploy} className="deploy-form">
        <div className="form-group">
          <label htmlFor="tokenName">Token Name</label>
          <input
            type="text"
            id="tokenName"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            required
            placeholder="Enter token name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tokenSymbol">Token Symbol</label>
          <input
            type="text"
            id="tokenSymbol"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            required
            placeholder="Enter token symbol"
          />
        </div>

        <div className="form-group">
          <label className="advanced-toggle">
            <input
              type="checkbox"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
            />
            Show Advanced Options
          </label>
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label htmlFor="initialSupply">
                Initial Supply (in tokens)
                <button
                  type="button"
                  className="inline-default-button"
                  onClick={() => {
                    setInitialSupply("1000000000");
                    setNumTokensToSell("1000000000");
                  }}
                >
                  use default
                </button>
              </label>
              <input
                type="number"
                id="initialSupply"
                value={initialSupply}
                onChange={(e) => setInitialSupply(e.target.value)}
                required
                placeholder="Enter initial token supply"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="numTokensToSell">Number of Tokens to Sell</label>
              <input
                type="number"
                id="numTokensToSell"
                value={numTokensToSell}
                onChange={(e) => setNumTokensToSell(e.target.value)}
                required
                placeholder="Enter number of tokens to sell"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTick">
                Start Tick (will be rounded to nearest {TICK_SPACING})
              </label>
              <input
                type="number"
                id="startTick"
                value={startTick}
                onChange={handleStartTickChange}
                onBlur={handleStartTickBlur}
                required
                placeholder={`Enter start tick (multiple of ${TICK_SPACING})`}
              />
              {startTick && Number(startTick) % TICK_SPACING !== 0 && (
                <span className="error-message">
                  Start tick must be divisible by {TICK_SPACING}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endTick">
                End Tick (will be rounded to nearest {TICK_SPACING})
              </label>
              <input
                type="number"
                id="endTick"
                value={endTick}
                onChange={handleEndTickChange}
                onBlur={handleEndTickBlur}
                required
                placeholder={`Enter end tick (multiple of ${TICK_SPACING})`}
              />
              {endTick && Number(endTick) % TICK_SPACING !== 0 && (
                <span className="error-message">
                  End tick must be divisible by {TICK_SPACING}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="numPositions">Number of Positions</label>
              <input
                type="number"
                id="numPositions"
                value={numPositions}
                onChange={handleNumPositionsChange}
                onBlur={handleNumPositionsBlur}
                required
                placeholder={`Enter number of positions`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxShareToBeSold">Max Share to Be Sold</label>
              <input
                type="number"
                id="maxShareToBeSold"
                value={maxShareToBeSold}
                onChange={handleMaxShareToBeSoldChange}
                onBlur={handleMaxShareToSoldBlur}
                required
                placeholder={`Enter max share to be sold`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxShareToBond">Max Share to Bond</label>
              <input
                type="number"
                id="maxShareToBond"
                value={maxShareToBond}
                onChange={handleMaxShareToBondChange}
                onBlur={handleMaxShareToBondBlur}
                required
                placeholder={`Enter max share to bond`}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="deploy-button"
          disabled={
            isDeploying ||
            !tokenName ||
            !tokenSymbol ||
            (showAdvanced &&
              (!startTick ||
                !endTick ||
                Number(startTick) % TICK_SPACING !== 0 ||
                Number(endTick) % TICK_SPACING !== 0 ||
                !numPositions ||
                !maxShareToBeSold ||
                !initialSupply ||
                !numTokensToSell ||
                !maxShareToBond))
          }
        >
          {isDeploying ? "Deploying..." : "Deploy Doppler"}
        </button>
      </form>
    </div>
  );
}

export default DeployDoppler;

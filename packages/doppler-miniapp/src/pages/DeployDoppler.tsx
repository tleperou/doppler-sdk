import { useState } from "react";
import { addresses } from "../addresses";
import { encodeAbiParameters, parseEther, Hex } from "viem";
import { useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { AirlockABI } from "../abis/AirlockABI";
import { MigratorABI } from "../abis/MigratorABI";

const TICK_SPACING = 60;

function roundToTickSpacing(tick: number): number {
  return Math.round(tick / TICK_SPACING) * TICK_SPACING;
}

function DeployDoppler() {
  const [initialSupply, setInitialSupply] = useState("");
  const [numTokensToSell, setNumTokensToSell] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [startTick, setStartTick] = useState("");
  const [endTick, setEndTick] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const DEFAULT_START_TICK = 167520;
  const DEFAULT_END_TICK = 200040;

  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();

  const { data: weth } = useReadContract({
    abi: MigratorABI,
    address: addresses.migrator,
    functionName: "weth",
  });

  const handleStartTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTick(e.target.value);
  };

  const handleEndTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTick(e.target.value);
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

  const generateRandomSalt = () => {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return `0x${Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    try {
      // Encode the various data fields
      const tokenFactoryData = encodeAbiParameters(
        [
          { type: "string" },
          { type: "string" },
          { type: "address[]" },
          { type: "uint256[]" },
        ],
        [tokenName, tokenSymbol, [], []]
      );

      const governanceFactoryData = encodeAbiParameters(
        [{ type: "string" }],
        [tokenName]
      );

      const poolInitializerData = encodeAbiParameters(
        [{ type: "uint24" }, { type: "int24" }, { type: "int24" }],
        [
          3000,
          showAdvanced ? Number(startTick) : DEFAULT_START_TICK,
          showAdvanced ? Number(endTick) : DEFAULT_END_TICK,
        ]
      );

      // Generate a random salt
      const salt = generateRandomSalt();
      if (!weth) throw new Error("WETH address not loaded");

      await publicClient.simulateContract({
        address: addresses.airlock,
        abi: AirlockABI,
        functionName: "create",
        args: [
          parseEther(initialSupply),
          parseEther(numTokensToSell),
          weth,
          addresses.tokenFactory,
          tokenFactoryData,
          addresses.governanceFactory,
          governanceFactoryData,
          addresses.uniswapV3Initializer,
          poolInitializerData,
          addresses.migrator,
          "0x",
          salt as Hex,
        ],
      });

      writeContract({
        address: addresses.airlock,
        abi: AirlockABI,
        functionName: "create",
        args: [
          parseEther(initialSupply),
          parseEther(numTokensToSell),
          weth,
          addresses.tokenFactory,
          tokenFactoryData,
          addresses.governanceFactory,
          governanceFactoryData,
          addresses.uniswapV3Initializer,
          poolInitializerData,
          addresses.migrator,
          "0x", // empty bytes for liquidityMigratorData
          salt as Hex,
        ],
      });
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
            </>
          )}
        </div>

        <button
          type="submit"
          className="deploy-button"
          disabled={
            isDeploying ||
            !initialSupply ||
            !numTokensToSell ||
            !tokenName ||
            !tokenSymbol ||
            (showAdvanced &&
              (!startTick ||
                !endTick ||
                Number(startTick) % TICK_SPACING !== 0 ||
                Number(endTick) % TICK_SPACING !== 0))
          }
        >
          {isDeploying ? "Deploying..." : "Deploy Doppler"}
        </button>
      </form>
    </div>
  );
}

export default DeployDoppler;

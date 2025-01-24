import { Navigate, useParams } from "react-router-dom";
import { addresses } from "../addresses";
import { Address, formatEther, parseEther } from "viem";
import LiquidityChart from "../components/LiquidityChart";
import TokenName from "../components/TokenName";
import { usePoolData } from "../hooks/usePoolData";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useState } from "react";
import { PermitSingle, SwapRouter02Encoder } from "doppler-v3-sdk";
import { CommandBuilder, getPermitSignature } from "doppler-v3-sdk";
import { universalRouterAbi } from "../abis/UniversalRouterABI";

function ViewDoppler() {
  const { id } = useParams();
  const account = useAccount();
  const { data: walletClient } = useWalletClient(account);
  const publicClient = usePublicClient();
  const { airlock, v3Initializer, universalRouter } = addresses;

  if (!id || !/^0x[a-fA-F0-9]{40}$/.test(id)) {
    return <Navigate to="/" />;
  }

  const { data, isLoading } = usePoolData(
    airlock,
    v3Initializer,
    id as Address
  );

  const { asset, numeraire, assetData, poolData } = data;

  const [numeraireAmount, setNumeraireAmount] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [activeField, setActiveField] = useState<"numeraire" | "asset">(
    "numeraire"
  );

  async function handleSwap() {
    if (!walletClient?.account || !numeraire?.token || !asset?.token) return;

    const block = await publicClient.getBlock();

    const isSellingNumeraire = activeField === "numeraire";
    const amount = isSellingNumeraire
      ? parseEther(numeraireAmount)
      : parseEther(assetAmount);

    const permit: PermitSingle = {
      details: {
        token: isSellingNumeraire
          ? numeraire.token.contract.address
          : asset.token.contract.address,
        amount: amount,
        expiration: block.timestamp + 3600n, // 1 hour
        nonce: 0n, // Gets populated by getPermitSignature
      },
      spender: universalRouter,
      sigDeadline: block.timestamp + 3600n,
    };

    // TODO: check if we need the signature?
    const signature = await getPermitSignature(
      permit,
      publicClient.chain.id,
      addresses.permit2,
      publicClient,
      walletClient
    );

    const isToken0 =
      numeraire.token.contract.address < asset.token.contract.address;
    const zeroForOne = isSellingNumeraire ? isToken0 : !isToken0;
    const pathArray = zeroForOne
      ? [numeraire.token.contract.address, asset.token.contract.address]
      : [asset.token.contract.address, numeraire.token.contract.address];
    const path = new SwapRouter02Encoder().encodePathExactInput(pathArray);

    const builder = new CommandBuilder()
      .addWrapEth(universalRouter, amount)
      .addPermit2Permit(permit, signature)
      .addV3SwapExactIn(walletClient.account.address, amount, 0n, path, false); // TODO: set amountOutMinimum

    const [commands, inputs] = builder.build();

    const { request } = await publicClient.simulateContract({
      address: universalRouter,
      abi: universalRouterAbi,
      functionName: "execute",
      args: [commands, inputs],
      account: walletClient.account,
      value: amount,
    });

    const txHash = await walletClient.writeContract({
      ...request,
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    return receipt;
  }

  const handleAmountChange = async (
    value: string,
    field: "numeraire" | "asset"
  ) => {
    setActiveField(field);
    try {
      if (field === "numeraire") {
        setNumeraireAmount(value);
      } else if (field === "asset") {
        setAssetAmount(value);
      } else {
        setNumeraireAmount("");
        setAssetAmount("");
      }
    } catch (error) {
      console.error("Swap simulation failed:", error);
    }
  };

  return (
    <div className="view-doppler">
      <h3 className="page-title">
        <TokenName
          name={asset?.name ?? ""}
          symbol={asset?.symbol ?? ""}
          showSymbol={false}
        />{" "}
        /{" "}
        <TokenName
          name={numeraire?.name ?? ""}
          symbol={numeraire?.symbol ?? ""}
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
          currentTick={poolData?.slot0?.tick ?? 0}
        />
      )}
      <div className="doppler-info">
        {assetData && numeraire && (
          <>
            <div className="market-stats">
              <div className="stat-item">
                <label>Total Supply</label>
                <span>{formatEther(asset?.totalSupply ?? 0n)}</span>
              </div>
              <div className="stat-item">
                <label>Tokens Sold</label>
                <span>
                  {(
                    Number(formatEther(asset?.totalSupply ?? 0n)) -
                    Number(formatEther(poolData?.poolBalance ?? 0n))
                  ).toFixed(0)}
                </span>
              </div>
              <div className="stat-item">
                <label>Current Tick</label>
                <span>{poolData?.slot0?.tick ?? 0}</span>
              </div>
              <div className="stat-item">
                <label>Target Tick</label>
                <span>{poolData?.initializerState?.targetTick ?? 0}</span>
              </div>
            </div>
            <div className="swap-interface mt-8 p-4 border rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">Swap Tokens</h3>

              <div className="space-y-4">
                {/* Numeraire Input */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">
                    {numeraire?.name} ({numeraire?.symbol})
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={numeraireAmount}
                    onChange={(e) =>
                      handleAmountChange(e.target.value, "numeraire")
                    }
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isLoading}
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-gray-500">↓</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">
                    {asset?.name} ({asset?.symbol})
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={assetAmount}
                    onChange={(e) =>
                      handleAmountChange(e.target.value, "asset")
                    }
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isLoading}
                  />
                </div>

                <button
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!numeraireAmount && !assetAmount}
                  onClick={handleSwap}
                >
                  {activeField === "numeraire"
                    ? `Sell ${numeraire?.symbol} for ${asset?.symbol}`
                    : `Buy ${numeraire?.symbol} with ${asset?.symbol}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewDoppler;

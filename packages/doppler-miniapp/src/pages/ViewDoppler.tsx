import { Navigate, useParams } from "react-router-dom";
import { addresses } from "../addresses";
import { Address, formatEther, parseEther } from "viem";
import LiquidityChart from "../components/LiquidityChart";
import TokenName from "../components/TokenName";
import { usePoolData } from "../hooks/usePoolData";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useState } from "react";
import {
  PermitSingle,
  SwapRouter02Encoder,
  CommandBuilder,
  getPermitSignature,
} from "doppler-router";
import { universalRouterAbi } from "../abis/UniversalRouterABI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { getDrift } from "@/utils/drift";
import { ReadQuoter } from "doppler-v3-sdk";
import { Q192, decimalScale } from "../constants";

function ViewDoppler() {
  const { id } = useParams();
  const account = useAccount();
  const { data: walletClient } = useWalletClient(account);
  const publicClient = usePublicClient();
  const { airlock, v3Initializer, universalRouter, quoterV2 } = addresses;
  const drift = getDrift();

  const quoter = new ReadQuoter(quoterV2, drift);

  if (!id || !/^0x[a-fA-F0-9]{40}$/.test(id)) {
    return <Navigate to="/" />;
  }

  const { data, isLoading } = usePoolData(
    airlock,
    v3Initializer,
    id as Address
  );

  const { asset, numeraire, poolData } = data;

  const totalLiquidity =
    poolData?.positions &&
    poolData.positions
      .reduce((acc: number, position: { liquidity: bigint }) => {
        return acc + Number(formatEther(position.liquidity));
      }, 0)
      .toFixed(2);

  const ratioX192 =
    poolData?.slot0?.sqrtPriceX96 &&
    poolData?.slot0?.sqrtPriceX96 * poolData?.slot0?.sqrtPriceX96;
  const price =
    ratioX192 && ratioX192 > 0n
      ? formatEther((Q192 * BigInt(decimalScale)) / BigInt(ratioX192))
      : 0;

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
      // @ts-ignore
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
    if (!asset?.token.contract.address || !numeraire?.token.contract.address)
      return;
    try {
      if (field === "numeraire") {
        setNumeraireAmount(value);
        const inputValue = parseEther(value);
        const { amountOut } = await quoter.quoteExactInput({
          tokenIn: numeraire?.token.contract.address,
          tokenOut: asset?.token.contract.address,
          amountIn: inputValue,
          fee: 3000,
          sqrtPriceLimitX96: 0n,
        });

        const amountOutFixed = Number(formatEther(amountOut))
          .toFixed(2)
          .toString();

        setAssetAmount(amountOutFixed);
      } else if (field === "asset") {
        setAssetAmount(value);
        const inputValue = parseEther(value);
        const { amountOut } = await quoter.quoteExactInput({
          tokenIn: asset?.token.contract.address,
          tokenOut: numeraire?.token.contract.address,
          amountIn: inputValue,
          fee: 3000,
          sqrtPriceLimitX96: 0n,
        });

        const amountOutFixed = Number(formatEther(amountOut))
          .toFixed(2)
          .toString();

        setNumeraireAmount(amountOutFixed);
      } else {
        setNumeraireAmount("");
        setAssetAmount("");
      }
    } catch (error) {
      console.error("Swap simulation failed:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            <TokenName
              name={asset?.name ?? ""}
              symbol={asset?.symbol ?? ""}
              showSymbol={true}
            />{" "}
            /{" "}
            <TokenName
              name={numeraire?.name ?? ""}
              symbol={numeraire?.symbol ?? ""}
              showSymbol={true}
            />
          </h2>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Total Liquidity
                    </h3>
                    <p className="text-xl font-semibold">{totalLiquidity}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Current Price
                    </h3>
                    <p className="text-xl font-semibold">
                      1 {asset?.symbol} = {price} {numeraire?.symbol}
                    </p>
                  </div>
                </div>
              </div>
              <LiquidityChart
                positions={poolData?.positions ?? []}
                currentTick={poolData?.slot0?.tick ?? 0}
              />
            </Card>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Swap Tokens</h3>
                    <Separator />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeraireAmount">
                        {numeraire?.name} ({numeraire?.symbol})
                      </Label>
                      <Input
                        type="number"
                        id="numeraireAmount"
                        placeholder="0.0"
                        value={numeraireAmount}
                        onChange={(e) =>
                          handleAmountChange(e.target.value, "numeraire")
                        }
                        disabled={isLoading}
                        step="any"
                      />
                    </div>

                    <div className="relative">
                      <Separator className="absolute top-1/2 w-full" />
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-muted-foreground">
                          ↓
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assetAmount">
                        {asset?.name} ({asset?.symbol})
                      </Label>
                      <Input
                        type="number"
                        id="assetAmount"
                        placeholder="0.0"
                        value={assetAmount}
                        onChange={(e) =>
                          handleAmountChange(e.target.value, "asset")
                        }
                        disabled={isLoading}
                        step="any"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={!numeraireAmount && !assetAmount}
                      onClick={handleSwap}
                    >
                      {activeField === "numeraire"
                        ? `Sell ${numeraire?.symbol} for ${asset?.symbol}`
                        : `Buy ${numeraire?.symbol} with ${asset?.symbol}`}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewDoppler;

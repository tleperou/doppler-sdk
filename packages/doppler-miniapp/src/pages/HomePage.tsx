import { Link } from "react-router-dom";
import { addresses } from "../addresses";
import TokenName from "../components/TokenName";
import { usePoolCreationDatas } from "../hooks/usePoolCreationData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
// import { useState } from "react";

function HomePage() {
  const {
    data: poolDatas,
    isLoading: isPoolsLoading,
    error: poolDataError,
  } = usePoolCreationDatas(addresses.airlock);
  // const [sidebarOpen, setSidebarOpen] = useState(false);

  if (poolDataError) {
    throw poolDataError;
  }

  const getRandom24HChange = () => {
    const change = (Math.random() * 20 - 10).toFixed(2); // Random between -10% and +10%
    return {
      value: change,
      isPositive: parseFloat(change) > 0,
    };
  };

  return (
    <div className="home-page p-6 max-w-6xl mx-auto">
      <div className="doppler-actions">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Explore</h2>
          <Separator />

          {isPoolsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : poolDatas?.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-muted-foreground">No markets found</p>
              <Button asChild>
                <Link to="/create">Create New Market</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4">Token</th>
                    <th className="text-right p-4">Mcap</th>
                    <th className="text-right p-4">24H</th>
                    <th className="text-right p-4">Age</th>
                    <th className="text-right p-4">Holders</th>
                    <th className="text-right p-4">Volume</th>
                    <th className="text-right p-4">Liquidity</th>
                    <th className="text-right p-4">Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {poolDatas?.map((poolData) => {
                    const change = getRandom24HChange();
                    return (
                      <tr key={poolData.asset.address} className="border-t">
                        <td className="p-4">
                          <Link
                            to={`/doppler/${poolData.asset.address}`}
                            className="block hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <TokenName
                                name={poolData.asset.name}
                                symbol={poolData.asset.symbol}
                                showSymbol={false}
                              />
                              <div>
                                <div className="font-medium">
                                  {poolData.asset.symbol}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {poolData.asset.name}
                                </div>
                              </div>
                            </div>
                            <Progress
                              value={60}
                              className="h-1.5 mt-2 w-[200px]"
                            />
                          </Link>
                        </td>
                        <td className="text-right p-4">$123K</td>
                        <td
                          className={`text-right p-4 ${change.isPositive ? "text-green-500" : "text-red-500"}`}
                        >
                          {change.value}%
                        </td>
                        <td className="text-right p-4">2 days</td>
                        <td className="text-right p-4">1.2K</td>
                        <td className="text-right p-4">$456K</td>
                        <td className="text-right p-4">$789K</td>
                        <td className="text-right p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            // onClick={() => setSidebarOpen(true)}
                          >
                            Trade
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

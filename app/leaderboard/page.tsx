"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useReadContracts } from "wagmi";
import { frameBattlesContract } from "../contract";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, TrendingUp, Zap } from "lucide-react";

interface UserStats {
  totalBattles: bigint;
  wins: bigint;
  losses: bigint;
  totalStaked: bigint;
  totalWinnings: bigint;
}

export default function Leaderboard() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const router = useRouter();

  // Get top 20 users - we'll implement this once contract is deployed
  const { data: leaderboardData, isLoading } = useReadContracts({
    contracts: [
      {
        ...frameBattlesContract,
        functionName: 'getLeaderboard',
        args: [BigInt(20)],
      }
    ],
  });

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const calculateWinRate = (wins: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((wins * BigInt(100)) / total);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-24">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Leaderboard
            </h1>
          </div>
          <p className="text-xl text-foreground">
            Top battlers ranked by wins and performance
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && leaderboardData && leaderboardData[0]?.status === 'success' && (
          <div className="space-y-4">
            {(() => {
              const [addresses, stats] = leaderboardData[0].result as [readonly `0x${string}`[], readonly UserStats[]];
              
              if (!addresses || addresses.length === 0) {
                return (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                      <p className="text-foreground mb-6">
                        Be the first to compete and climb the leaderboard!
                      </p>
                      <Button onClick={() => router.push("/create-battle")} size="lg">
                        Start Your First Battle
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              return addresses.map((address, index) => {
                const userStats = stats[index];
                const winRate = calculateWinRate(userStats.wins, userStats.totalBattles);
                const rank = index + 1;

                return (
                  <Card 
                    key={address}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      rank === 1 ? 'border-yellow-500 border-2' : 
                      rank === 2 ? 'border-gray-400 border-2' : 
                      rank === 3 ? 'border-orange-600 border-2' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                          <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                            ${rank === 1 ? 'bg-yellow-500 text-yellow-950' : 
                              rank === 2 ? 'bg-gray-400 text-gray-950' : 
                              rank === 3 ? 'bg-orange-600 text-orange-950' : 
                              'bg-primary/10 text-primary'}
                          `}>
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xl font-bold font-mono">
                              {formatAddress(address)}
                            </p>
                            {rank <= 3 && (
                              <Badge variant="default">Top {rank}</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">Battles</p>
                              <p className="text-lg font-semibold text-foreground">{userStats.totalBattles.toString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Wins</p>
                              <p className="text-lg font-semibold text-green-600">{userStats.wins.toString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Losses</p>
                              <p className="text-lg font-semibold text-red-600">{userStats.losses.toString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Win Rate
                              </p>
                              <p className="text-lg font-semibold text-foreground">{winRate}%</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Total Won
                              </p>
                              <p className="text-lg font-semibold text-foreground">{(Number(userStats.totalWinnings) / 1e18).toFixed(4)} ETH</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

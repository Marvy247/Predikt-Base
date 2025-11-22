"use client";
import { useEffect, useCallback } from "react";
import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import { frameBattlesContract } from "./contract";
import { formatEther } from "viem";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingUp, Clock } from "lucide-react";

enum BattleStatus {
  Open = 0,
  Active = 1,
  Resolved = 2,
  Cancelled = 3
}

interface Battle {
  id: bigint;
  prediction: string;
  description: string;
  stakeAmount: bigint;
  challenger: `0x${string}`;
  opponent: `0x${string}`;
  endTime: bigint;
  status: BattleStatus;
  winner: `0x${string}`;
  createdAt: bigint;
  challengerSaysYes: boolean;
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const router = useRouter();

  // Get battle count first
  const { data: _battleCount, isLoading: isLoadingCount, error: countError, refetch: refetchCount } = useReadContract({
    ...frameBattlesContract,
    functionName: 'getBattlesCount',
  });



  // For now, we'll use getAllBattles if available, otherwise return empty
  // This is a temporary solution - we'll fetch individually if needed
  const { data: battlesData, isLoading: isLoadingBattles, error: battlesError, refetch: refetchBattles } = useReadContract({
    ...frameBattlesContract,
    functionName: 'getAllBattles',
  });

  const battles: Battle[] = React.useMemo(() => {
    if (!battlesData) return [];

    try {
      return (battlesData as unknown[]).map((b: unknown) => {
        const battle = b as Record<string, unknown>;
        return {
          id: battle.id as bigint,
          prediction: battle.prediction as string,
          description: battle.description as string,
          stakeAmount: battle.stakeAmount as bigint,
          challenger: battle.challenger as `0x${string}`,
          opponent: battle.opponent as `0x${string}`,
          endTime: battle.endTime as bigint,
          status: battle.status as BattleStatus,
          winner: battle.winner as `0x${string}`,
          createdAt: battle.createdAt as bigint,
          challengerSaysYes: battle.challengerSaysYes as boolean,
        };
      });
    } catch (err) {
      console.error('Error parsing battles:', err);
      return [];
    }
  }, [battlesData]);

  const isLoading = isLoadingCount || isLoadingBattles;
  const error = countError || battlesError;

  const refetch = useCallback(() => {
    refetchCount();
    refetchBattles();
  }, [refetchCount, refetchBattles]);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Refetch markets when component mounts or comes back into view
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refetch markets when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  const handleViewBattle = (battleId: bigint) => {
    router.push(`/battle/${battleId.toString()}`);
  };

  const getStatusBadge = (status: BattleStatus) => {
    switch (status) {
      case BattleStatus.Open:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Open</Badge>;
      case BattleStatus.Active:
        return <Badge variant="default">Active</Badge>;
      case BattleStatus.Resolved:
        return <Badge className="bg-green-600">Resolved</Badge>;
      case BattleStatus.Cancelled:
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-24">
        {/* Hero Section - Clean and Bold */}
        <div className="mb-12 text-center space-y-6 pt-8 animate-fadeIn">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:mt-7 font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600">
              PrediKt ⚔️
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-foreground">
              Hey <span className="text-primary">{context?.user?.displayName || "there"}</span>, ready to battle? 🎯
            </p>
            <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
              Challenge friends to 1v1 prediction duels. Stake CELO, prove you&apos;re right, and claim victory!
            </p>
          </div>

          {/* Quick Stats */}
          {battles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="px-6 py-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium text-foreground">Total Battles: </span>
                <span className="text-xl font-bold text-primary">{battles.length}</span>
              </div>
              <div className="px-6 py-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-sm font-medium text-foreground">Active Now: </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">{battles.filter(b => b.status === BattleStatus.Active).length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Battles Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Active Battles</h2>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {battles.length > 0 ? `${battles.length} battle${battles.length !== 1 ? 's' : ''} live` : 'No battles yet - be the first!'}
              </p>
            </div>
            <Button onClick={() => router.push("/create-battle")} size="lg" className="gap-2 hidden sm:flex">
              <Plus className="h-5 w-5" />
              Start Battle
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State - Only show if it's not just "no data" */}
          {error && !error.message.includes('returned no data') && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Error loading battles: {error.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Battles Grid */}
          {!isLoading && !error && battles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {battles.map((battle: Battle, index) => {
                const _isExpired = new Date(Number(battle.endTime) * 1000) < new Date();
                const hasOpponent = battle.opponent !== "0x0000000000000000000000000000000000000000";
                
                return (
                  <Card 
                    key={battle.id.toString()} 
                    className="group cursor-pointer battle-card-glow overflow-hidden border-2 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleViewBattle(battle.id)}
                  >
                    <CardHeader className="space-y-3 pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors duration-300 text-gray-900 dark:text-gray-100">
                          {battle.prediction}
                        </CardTitle>
                        {getStatusBadge(battle.status)}
                      </div>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                        {battle.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-6">
                      {/* Stake Amount - Prominent */}
                      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/20">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <div className="text-center">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Total Prize Pool</p>
                          <p className="text-2xl font-bold text-primary">{formatEther(battle.stakeAmount * BigInt(2))} ETH</p>
                        </div>
                      </div>

                      {/* Combatants */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">CHALLENGER</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{formatAddress(battle.challenger)}</p>
                          <Badge variant={battle.challengerSaysYes ? "default" : "destructive"} className="mt-2">
                            {battle.challengerSaysYes ? "✅ YES" : "❌ NO"}
                          </Badge>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">OPPONENT</p>
                          {hasOpponent && battle.status !== BattleStatus.Open ? (
                            <>
                              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{formatAddress(battle.opponent)}</p>
                              <Badge variant={!battle.challengerSaysYes ? "default" : "destructive"} className="mt-2">
                                {!battle.challengerSaysYes ? "✅ YES" : "❌ NO"}
                              </Badge>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 italic">Waiting...</p>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <Clock className="h-4 w-4" />
                          <span>Ends {new Date(Number(battle.endTime) * 1000).toLocaleDateString()}</span>
                        </div>
                        {battle.status === BattleStatus.Open && (
                          <Badge variant="outline" className="text-xs animate-pulse border-primary text-primary">
                            Open to Join!
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && battles.length === 0 && (
            <Card className="border-2 border-dashed animate-scaleIn">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-8xl mb-6">⚔️</div>
                <h3 className="text-2xl font-bold mb-3">No Battles Yet</h3>
                <p className="mb-8 max-w-md text-lg opacity-90">
                  Be the first to challenge someone to a prediction duel! Create a battle and stake your claim.
                </p>
                <Button 
                  onClick={() => router.push("/create-battle")} 
                  size="lg" 
                  className="gap-2 text-lg px-8 py-6"
                >
                  <Plus className="h-6 w-6" />
                  Start Your First Battle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => router.push("/create-battle")}
        className="fixed bottom-6 right-6 md:hidden w-16 h-16 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full shadow-2xl hover:shadow-primary/50 active:scale-95 transition-all duration-300 flex items-center justify-center z-50 animate-pulse-glow"
        aria-label="Create Battle"
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
}
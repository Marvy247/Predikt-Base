"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { frameBattlesContract } from "../../contract";
import { formatEther } from "viem";
import { BASE_MAINNET_CHAIN_ID } from "../../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Swords, Clock, AlertCircle, Trophy, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { toast } from "sonner";

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

export default function BattleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { address, chain } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { switchChain } = useSwitchChain();

  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [resolutionChoice, setResolutionChoice] = useState<boolean | null>(null);

  const { data: battleData, isLoading, error, refetch } = useReadContract({
    ...frameBattlesContract,
    functionName: 'getBattle',
    args: [BigInt(id as string)],
  });

  const battle: Battle | undefined = battleData ? {
    id: battleData[0],
    prediction: battleData[1],
    description: battleData[2],
    stakeAmount: battleData[3],
    challenger: battleData[4],
    opponent: battleData[5],
    endTime: battleData[6],
    status: battleData[7],
    winner: battleData[8],
    createdAt: battleData[9],
    challengerSaysYes: battleData[10],
  } : undefined;

  const handleBack = () => {
    router.push("/");
  };

  const ensureBaseNetwork = async () => {
    if (chain?.id !== BASE_MAINNET_CHAIN_ID) {
      setIsSwitchingChain(true);
      try {
        await switchChain({ chainId: BASE_MAINNET_CHAIN_ID });
        setIsSwitchingChain(false);
        toast.success("Network switched to Celo");
        return true;
      } catch (err) {
        console.error("Failed to switch to Celo network:", err);
        toast.error("Failed to switch network");
        setIsSwitchingChain(false);
        return false;
      }
    }
    return true;
  };

  const handleAcceptBattle = async () => {
    if (!battle || !address) return;

    if (!(await ensureBaseNetwork())) return;

    toast.loading("Accepting battle...");
    
    try {
      writeContract({
        ...frameBattlesContract,
        functionName: 'acceptBattle',
        args: [battle.id],
        value: battle.stakeAmount,
        chainId: BASE_MAINNET_CHAIN_ID,
        gas: BigInt(300000),
      }, {
        onSuccess: () => {
          toast.success("Battle accepted! Let&apos;s go! ⚔️");
          refetch();
        },
        onError: (err) => {
          console.error("Accept battle error:", err);
          toast.error("Failed to accept battle: " + err.message);
        }
      });
    } catch (err) {
      console.error("Transaction preparation error:", err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error("Error: " + errorMsg);
    }
  };

  const handleResolveBattle = async () => {
    if (!battle || !address || resolutionChoice === null) {
      toast.error("Please select the outcome");
      return;
    }

    if (!(await ensureBaseNetwork())) return;

    toast.loading("Resolving battle...");
    
    try {
      writeContract({
        ...frameBattlesContract,
        functionName: 'resolveBattle',
        args: [battle.id, resolutionChoice],
        chainId: BASE_MAINNET_CHAIN_ID,
        gas: BigInt(300000),
      }, {
        onSuccess: () => {
          toast.success("Battle resolved! Winner gets paid! 🏆");
          refetch();
        },
        onError: (err) => {
          console.error("Resolve battle error:", err);
          toast.error("Failed to resolve battle: " + err.message);
        }
      });
    } catch (err) {
      console.error("Transaction preparation error:", err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error("Error: " + errorMsg);
    }
  };

  const handleCancelBattle = async () => {
    if (!battle || !address) return;

    if (!(await ensureBaseNetwork())) return;

    toast.loading("Cancelling battle...");
    
    try {
      writeContract({
        ...frameBattlesContract,
        functionName: 'cancelBattle',
        args: [battle.id],
        chainId: BASE_MAINNET_CHAIN_ID,
        gas: BigInt(200000),
      }, {
        onSuccess: () => {
          toast.success("Battle cancelled and stake refunded");
          refetch();
        },
        onError: (err) => {
          console.error("Cancel battle error:", err);
          toast.error("Failed to cancel battle: " + err.message);
        }
      });
    } catch (err) {
      console.error("Transaction preparation error:", err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error("Error: " + errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="max-w-5xl mx-auto p-4 space-y-6 pt-20 md:pt-24">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="max-w-5xl mx-auto p-4 space-y-6 pt-20 md:pt-24">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6 flex flex-col items-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Battle not found</h3>
              <p className="text-gray-700 dark:text-gray-300">{error?.message || "This battle doesn't exist"}</p>
              <Button onClick={handleBack} className="mt-6">Back to Battles</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isExpired = new Date(Number(battle.endTime) * 1000) < new Date();
  const isChallenger = address?.toLowerCase() === battle.challenger.toLowerCase();
  const isOpponent = address?.toLowerCase() === battle.opponent.toLowerCase();
  const _isParticipant = isChallenger || isOpponent;
  const canAccept = battle.status === BattleStatus.Open && !isChallenger && address;
  const canResolve = battle.status === BattleStatus.Active && isChallenger && isExpired;
  const canCancel = battle.status === BattleStatus.Open && isChallenger;
  const hasOpponent = battle.opponent !== "0x0000000000000000000000000000000000000000";

  const getStatusBadge = () => {
    switch (battle.status) {
      case BattleStatus.Open:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">⏳ Open</Badge>;
      case BattleStatus.Active:
        return <Badge variant="default">⚔️ Active</Badge>;
      case BattleStatus.Resolved:
        return <Badge variant="default" className="bg-green-600">🏆 Resolved</Badge>;
      case BattleStatus.Cancelled:
        return <Badge variant="secondary">❌ Cancelled</Badge>;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-5xl mx-auto p-4 space-y-6 pt-20 md:pt-24">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Battles
        </Button>

        {/* Battle Info Card */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Swords className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl">{battle.prediction}</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-800 dark:text-gray-200">{battle.description}</CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Combatants */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Challenger */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">CHALLENGER</p>
                </div>
                <p className="font-mono text-base mb-2 font-semibold text-gray-900 dark:text-gray-100">{formatAddress(battle.challenger)}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={battle.challengerSaysYes ? "default" : "destructive"}>
                    {battle.challengerSaysYes ? "✅ YES" : "❌ NO"}
                  </Badge>
                  {isChallenger && <Badge variant="outline" className="text-xs">You</Badge>}
                </div>
              </div>

              {/* Opponent */}
              <div className={`p-4 rounded-lg ${
                hasOpponent && battle.status !== BattleStatus.Open 
                  ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20" 
                  : "bg-muted/50 border border-border"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">OPPONENT</p>
                </div>
                {hasOpponent && battle.status !== BattleStatus.Open ? (
                  <>
                    <p className="font-mono text-base mb-2 font-semibold text-gray-900 dark:text-gray-100">{formatAddress(battle.opponent)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={!battle.challengerSaysYes ? "default" : "destructive"}>
                        {!battle.challengerSaysYes ? "✅ YES" : "❌ NO"}
                      </Badge>
                      {isOpponent && <Badge variant="outline" className="text-xs">You</Badge>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 italic">Waiting for opponent...</p>
                )}
              </div>
            </div>

            {/* Battle Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stake</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatEther(battle.stakeAmount)} ETH</p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Winner Gets</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatEther(battle.stakeAmount * BigInt(2) * BigInt(975) / BigInt(1000))} ETH</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ends</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {new Date(Number(battle.endTime) * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Winner Display */}
            {battle.status === BattleStatus.Resolved && battle.winner !== "0x0000000000000000000000000000000000000000" && (
              <div className="p-6 rounded-lg bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30">
                <div className="flex items-center justify-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">WINNER</p>
                    <p className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">{formatAddress(battle.winner)}</p>
                    {address?.toLowerCase() === battle.winner.toLowerCase() && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">🎉 You won!</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Card */}
        {canAccept && (
          <Card>
            <CardHeader>
              <CardTitle>Accept This Battle?</CardTitle>
              <CardDescription>
                Stake {formatEther(battle.stakeAmount)} ETH to accept this challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAcceptBattle}
                disabled={isPending || isSwitchingChain}
                size="lg"
                className="w-full gap-2"
              >
                <Swords className="h-5 w-5" />
                {isSwitchingChain ? "Switching Network..." : isPending ? "Accepting..." : `Accept Battle (${formatEther(battle.stakeAmount)} ETH)`}
              </Button>
            </CardContent>
          </Card>
        )}

        {canResolve && (
          <Card>
            <CardHeader>
              <CardTitle>Resolve Battle</CardTitle>
              <CardDescription>
                Did your prediction come true? Select the outcome to resolve this battle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={resolutionChoice === true ? "default" : "outline"}
                  onClick={() => setResolutionChoice(true)}
                  className="h-16"
                >
                  ✅ YES - Prediction came true
                </Button>
                <Button
                  variant={resolutionChoice === false ? "default" : "outline"}
                  onClick={() => setResolutionChoice(false)}
                  className="h-16"
                >
                  ❌ NO - Prediction didn&apos;t happen
                </Button>
              </div>
              <Button
                onClick={handleResolveBattle}
                disabled={resolutionChoice === null || isPending || isSwitchingChain}
                size="lg"
                className="w-full"
              >
                {isSwitchingChain ? "Switching Network..." : isPending ? "Resolving..." : "Resolve Battle"}
              </Button>
            </CardContent>
          </Card>
        )}

        {canCancel && (
          <Card>
            <CardHeader>
              <CardTitle>Cancel Battle</CardTitle>
              <CardDescription>
                No opponent yet? Cancel and get your stake back.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCancelBattle}
                disabled={isPending || isSwitchingChain}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                {isSwitchingChain ? "Switching Network..." : isPending ? "Cancelling..." : "Cancel Battle & Refund"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {battle.status === BattleStatus.Active && !isExpired && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center py-12">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Battle In Progress</h3>
              <p className="text-muted-foreground">
                Wait for the end time to resolve this battle
              </p>
            </CardContent>
          </Card>
        )}

        {battle.status === BattleStatus.Cancelled && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Battle Cancelled</h3>
              <p className="text-muted-foreground">
                This battle was cancelled by the challenger
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract, useSwitchChain, useAccount } from "wagmi";
import { BASE_MAINNET_CHAIN_ID } from "../constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, Swords, Sparkles, Target, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { frameBattlesContract } from "../contract";
import { parseEther } from "viem";
import { FarcasterUserSearch } from "../components/FarcasterUserSearch";

export default function CreateBattle() {
  const router = useRouter();
  const { writeContract, isPending } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const { chain, isConnected, address } = useAccount();

  const [prediction, setPrediction] = useState("");
  const [description, setDescription] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [endDate, setEndDate] = useState("");
  const [challengerSaysYes, setChallengerSaysYes] = useState(true);
  const [specificOpponent, setSpecificOpponent] = useState("");
  const [opponentUsername, setOpponentUsername] = useState("");
  const [error, setError] = useState("");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateForm = () => {
    if (!prediction.trim()) return "Prediction is required";
    if (!description.trim()) return "Description is required";
    if (!endDate) return "End date is required";
    const endDateTime = new Date(endDate);
    const minEndTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    if (endDateTime <= minEndTime) return "Battle must last at least 1 hour";
    // Removed minimum stake validation - allow any amount > 0
    if (specificOpponent && specificOpponent.length > 0 && !specificOpponent.startsWith("0x")) {
      return "Opponent address must start with 0x";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if wallet is connected
    if (!isConnected || !address) {
      const errorMsg = "Please connect your wallet first";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (chain?.id !== BASE_MAINNET_CHAIN_ID) {
      setIsSwitchingChain(true);
      try {
        await switchChain({ chainId: BASE_MAINNET_CHAIN_ID });
        setIsSwitchingChain(false);
        toast.success("Network switched to Base");
      } catch (err) {
        const errorMsg = `Failed to switch to Base network: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsSwitchingChain(false);
        return;
      }
    }

    const endTime = Math.floor(new Date(endDate).getTime() / 1000);
    const stakeInWei = parseEther(stakeAmount);
    const opponentAddress = specificOpponent.trim() || "0x0000000000000000000000000000000000000000";

    const loadingToast = toast.loading("Creating battle...");
    
    try {
      writeContract({
        ...frameBattlesContract,
        functionName: 'createBattle',
        args: [
          prediction.trim(),
          description.trim(),
          BigInt(endTime),
          challengerSaysYes,
          opponentAddress as `0x${string}`
        ],
        value: stakeInWei,
        chainId: BASE_MAINNET_CHAIN_ID,
        gas: BigInt(500000),
      }, {
        onSuccess: () => {
          toast.dismiss(loadingToast);
          toast.success("Battle created! Challenge sent! ⚔️");
          setTimeout(() => router.push("/"), 1000);
        },
        onError: (err) => {
          console.error("Create battle error:", err);
          toast.dismiss(loadingToast);
          setError(err.message);
          toast.error("Failed to create battle: " + err.message);
        }
      });
    } catch (err) {
      console.error("Transaction preparation error:", err);
      toast.dismiss(loadingToast);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error("Error: " + errorMsg);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  const handleSelectUser = (address: string, username: string) => {
    setSpecificOpponent(address);
    setOpponentUsername(username);
  };

  const handleClearUser = () => {
    setSpecificOpponent("");
    setOpponentUsername("");
  };

  const isStep1Valid = prediction.trim().length >= 10 && description.trim().length >= 20;
  const isStep2Valid = true; // Opponent selection is optional
  const isStep3Valid = stakeAmount && parseFloat(stakeAmount) > 0 && endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-3xl mx-auto p-4 space-y-6 pt-20 md:pt-24">
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2"
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Battles
        </Button>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 md:w-24 h-1 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {currentStep === 1 && <Sparkles className="h-6 w-6 text-primary" />}
                {currentStep === 2 && <Target className="h-6 w-6 text-primary" />}
                {currentStep === 3 && <TrendingUp className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  {currentStep === 1 && "What's Your Prediction?"}
                  {currentStep === 2 && "Who's Your Opponent?"}
                  {currentStep === 3 && "Set the Stakes"}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {currentStep === 1 && "Make a bold prediction about the future"}
                  {currentStep === 2 && "Choose who to challenge (or leave open)"}
                  {currentStep === 3 && "Time limit and stake amount"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Prediction Details */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                    <Label htmlFor="prediction" className="text-base font-semibold">
                      Your Prediction
                    </Label>
                    <Input
                      id="prediction"
                      type="text"
                      placeholder="e.g., ETH will hit $5k by end of month"
                      value={prediction}
                      onChange={(e) => setPrediction(e.target.value)}
                      maxLength={150}
                      className="text-lg h-12"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        💡 Be specific and clear
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prediction.length}/150
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold">
                      Add Context & Details
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="What's your reasoning? Any specific conditions or criteria? Add all the details here..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="text-base"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        📝 Help others understand your prediction
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {description.length}/500
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Your Stance</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setChallengerSaysYes(true)}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          challengerSaysYes
                            ? 'border-green-500 bg-green-500/10 scale-105'
                            : 'border-muted hover:border-green-500/50'
                        }`}
                      >
                        <div className="text-4xl mb-2">✅</div>
                        <div className="font-bold text-lg">YES</div>
                        <div className="text-sm text-muted-foreground">It will happen</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChallengerSaysYes(false)}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          !challengerSaysYes
                            ? 'border-red-500 bg-red-500/10 scale-105'
                            : 'border-muted hover:border-red-500/50'
                        }`}
                      >
                        <div className="text-4xl mb-2">❌</div>
                        <div className="font-bold text-lg">NO</div>
                        <div className="text-sm text-muted-foreground">It won&apos;t happen</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Opponent */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <FarcasterUserSearch
                    onSelectUser={handleSelectUser}
                    selectedUsername={opponentUsername}
                    onClear={handleClearUser}
                  />
                  
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">
                      <strong>💡 Pro tip:</strong> If you leave this blank, anyone on Farcaster can accept your challenge!
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Stakes & Timeline */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                    <Label htmlFor="stakeAmount" className="text-base font-semibold">
                      Stake Amount (ETH)
                    </Label>
                    <div className="relative">
                      <Input
                        id="stakeAmount"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder="0.01"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="text-xl h-14 pl-12"
                        autoFocus
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">
                        Ξ
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['0.01', '0.05', '0.1', '0.5'].map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setStakeAmount(amount)}
                          className={stakeAmount === amount ? 'border-primary bg-primary/10' : ''}
                        >
                          {amount} ETH
                        </Button>
                      ))}
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                      <p className="text-sm font-semibold mb-1">💰 Prize Pool</p>
                      <p className="text-2xl font-bold text-primary">
                        {(parseFloat(stakeAmount || '0') * 2).toFixed(3)} ETH
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Winner takes {((1 - 0.025) * 100).toFixed(1)}% (2.5% platform fee)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="endDate" className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Battle Deadline
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                      className="text-base h-12"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1 Day', hours: 24 },
                        { label: '3 Days', hours: 72 },
                        { label: '1 Week', hours: 168 },
                      ].map(({ label, hours }) => (
                        <Button
                          key={label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const date = new Date(Date.now() + hours * 60 * 60 * 1000);
                            setEndDate(date.toISOString().slice(0, 16));
                          }}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⏰ When should we determine who won?
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20 space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Swords className="h-5 w-5" />
                      Battle Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prediction:</span>
                        <p className="font-semibold">{prediction}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Your stance:</span>
                        <span className="font-semibold ml-2">
                          {challengerSaysYes ? '✅ YES' : '❌ NO'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opponent:</span>
                        <span className="font-semibold ml-2">
                          {opponentUsername ? `@${opponentUsername}` : 'Anyone can join'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prize pool:</span>
                        <span className="font-semibold ml-2">
                          {(parseFloat(stakeAmount || '0') * 2).toFixed(3)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-shake">
                  <span className="text-destructive text-lg">⚠️</span>
                  <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1"
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1"
                    size="lg"
                    disabled={
                      (currentStep === 1 && !isStep1Valid) ||
                      (currentStep === 2 && !isStep2Valid)
                    }
                  >
                    Continue
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isPending || isSwitchingChain || !isStep3Valid}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {isSwitchingChain ? (
                      "Switching Network..."
                    ) : isPending ? (
                      "Creating Battle..."
                    ) : (
                      <>
                        <Swords className="h-5 w-5" />
                        Start Battle! ⚔️
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Step {currentStep} of 3 - {
            currentStep === 1 ? "Tell us your prediction" :
            currentStep === 2 ? "Choose your opponent" :
            "Set stakes and deadline"
          }</p>
        </div>
      </div>
    </div>
  );
}

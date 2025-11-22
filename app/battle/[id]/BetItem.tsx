"use client";
import { useReadContract } from "wagmi";
import { predictionMarketContract } from "../../contract";
import { formatEther } from "viem";
import styles from "./page.module.css";

export function BetItem({ betId }: { betId: bigint }) {
  const { data: bet, isLoading, error } = useReadContract({
    ...predictionMarketContract,
    functionName: 'bets',
    args: [betId],
  });

  if (isLoading) {
    return <div className={styles.betItem}>Loading bet...</div>;
  }

  if (error) {
    return <div className={styles.betItem}>Error loading bet: {error.message}</div>;
  }

  if (!bet) {
    return null;
  }

  return (
    <div className={styles.betItem}>
      <span className={styles.betUser}>{bet[1]}</span>
      <span className={styles.betOption}>Option {bet[2].toString()}</span>
      <span className={styles.betAmount}>{formatEther(bet[3])} ETH</span>
    </div>
  );
}

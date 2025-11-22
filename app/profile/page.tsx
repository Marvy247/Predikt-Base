"use client";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Bet {
  id: string;
  marketId: string;
  userFid: number;
  option: string;
  amount: number;
  timestamp: string;
}

interface Market {
  id: string;
  title: string;
  description: string;
  options: string[];
  endDate: string;
  totalVolume: number;
  status: 'active' | 'resolved';
  createdBy?: number;
}

const mockMarkets: Market[] = [
  {
    id: "1",
    title: "Will ETH reach $10,000 by EOY 2024?",
    description: "Predict if Ethereum will hit $10k before December 31st, 2024",
    options: ["Yes", "No"],
    endDate: "2024-12-31",
    totalVolume: 2.5,
    status: "active"
  },
  {
    id: "2",
    title: "Will Bitcoin ETF inflows exceed $50B in 2024?",
    description: "Will total inflows to Bitcoin ETFs surpass $50 billion this year?",
    options: ["Yes", "No"],
    endDate: "2024-12-31",
    totalVolume: 1.8,
    status: "active"
  },
  {
    id: "3",
    title: "Will Farcaster reach 1M daily active users?",
    description: "Will Farcaster achieve 1 million daily active users in 2024?",
    options: ["Yes", "No"],
    endDate: "2024-12-31",
    totalVolume: 0.9,
    status: "active"
  }
];

export default function Profile() {
  const { context } = useMiniKit();
  const router = useRouter();

  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [totalBetAmount, setTotalBetAmount] = useState(0);
  const [totalMarketsCreated, setTotalMarketsCreated] = useState(0);

  useEffect(() => {
    // Load user bets
    const storedBets = JSON.parse(localStorage.getItem("bets") || "[]");
    const userFid = context?.user?.fid;
    if (userFid) {
      const userBetsData = storedBets.filter((bet: Bet) => bet.userFid === userFid);
      setUserBets(userBetsData);

      // Calculate total bet amount
      const total = userBetsData.reduce((sum: number, bet: Bet) => sum + bet.amount, 0);
      setTotalBetAmount(total);
    }

    // Load markets (both mock and user-created)
    const storedMarkets = JSON.parse(localStorage.getItem("markets") || "[]");
    const allMarkets = [...mockMarkets, ...storedMarkets];
    setMarkets(allMarkets);

    // Count markets created by user
    const userCreatedMarkets = storedMarkets.filter((market: Market) => market.createdBy === userFid);
    setTotalMarketsCreated(userCreatedMarkets.length);
  }, [context?.user?.fid]);

  const handleBack = () => {
    router.push("/");
  };

  const handleViewMarket = (marketId: string) => {
    router.push(`/market/${marketId}`);
  };

  const getMarketTitle = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    return market?.title || "Unknown Market";
  };

  const getMarketStatus = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    return market?.status || "unknown";
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={handleBack} type="button">
        ✕
      </button>

      <div className={styles.content}>
        <div className={styles.profileHeader}>
          <h1 className={styles.title}>Your Profile</h1>
          <p className={styles.greeting}>
            Hey {context?.user?.displayName || "there"}, here&apos;s your prediction activity
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalBetAmount.toFixed(2)}</div>
            <div className={styles.statLabel}>Total Bet Amount (ETH)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{userBets.length}</div>
            <div className={styles.statLabel}>Total Bets Placed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalMarketsCreated}</div>
            <div className={styles.statLabel}>Markets Created</div>
          </div>
        </div>

        <div className={styles.betsSection}>
          <h2 className={styles.sectionTitle}>Your Bets</h2>
          {userBets.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven&apos;t placed any bets yet.</p>
              <button onClick={handleBack} className={styles.exploreButton}>
                Explore Markets
              </button>
            </div>
          ) : (
            <div className={styles.betsList}>
              {userBets.map((bet) => (
                <div key={bet.id} className={styles.betCard} onClick={() => handleViewMarket(bet.marketId)}>
                  <div className={styles.betHeader}>
                    <h3 className={styles.marketTitle}>{getMarketTitle(bet.marketId)}</h3>
                    <span className={`${styles.status} ${styles[getMarketStatus(bet.marketId)]}`}>
                      {getMarketStatus(bet.marketId)}
                    </span>
                  </div>
                  <div className={styles.betDetails}>
                    <div className={styles.betInfo}>
                      <span className={styles.option}>Bet on: {bet.option}</span>
                      <span className={styles.amount}>{bet.amount} ETH</span>
                    </div>
                    <div className={styles.timestamp}>
                      {new Date(bet.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalMarketsCreated > 0 && (
          <div className={styles.createdMarketsSection}>
            <h2 className={styles.sectionTitle}>Markets You Created</h2>
            <div className={styles.marketsList}>
              {markets
                .filter(market => market.createdBy === context?.user?.fid)
                .map((market) => (
                  <div key={market.id} className={styles.marketCard} onClick={() => handleViewMarket(market.id)}>
                    <h3 className={styles.marketTitle}>{market.title}</h3>
                    <p className={styles.marketDescription}>{market.description}</p>
                    <div className={styles.marketStats}>
                      <span className={styles.volume}>Volume: {market.totalVolume} ETH</span>
                      <span className={styles.endDate}>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

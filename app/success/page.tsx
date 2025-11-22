"use client";

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();
  
  const handleShare = async () => {
    try {
      const text = `Yay! I just joined the waitlist for ${minikitConfig.miniapp.name.toUpperCase()}! `;
      
      const result = await composeCastAsync({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || ""]
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button" onClick={handleClose}>
        ✕
      </button>
      
      <div className={styles.content}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmarkStem}></div>
              <div className={styles.checkmarkKick}></div>
            </div>
          </div>
          
          <h1 className={styles.title}>Welcome to the {minikitConfig.miniapp.name.toUpperCase()}!</h1>
          
          <p className={styles.subtitle}>
            You&apos;re in! We&apos;ll notify you as soon as we launch.<br />
            Get ready to experience the future of onchain marketing.
          </p>

          <div className={styles.actions}>
            <button onClick={handleShare} className={styles.shareButton}>
              SHARE
            </button>
            <button onClick={handleClose} className={styles.closePageButton}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

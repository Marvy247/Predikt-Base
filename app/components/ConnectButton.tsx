"use client";
import { useEffect, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectButton() {
  const [hideConnectBtn, setHideConnectBtn] = useState(false);
  const { connect } = useConnect();

  useEffect(() => {
    // Check if user is using MiniPay wallet
    interface EthereumProvider {
      isMiniPay?: boolean;
    }
    
    if (typeof window !== "undefined" && window.ethereum && (window.ethereum as EthereumProvider).isMiniPay) {
      // User is using MiniPay so hide connect wallet button
      setHideConnectBtn(true);
      
      // Auto-connect to MiniPay wallet
      connect({ 
        connector: injected({ target: "metaMask" }) 
      });
    }
  }, [connect]);

  // Don't render button if inside MiniPay
  if (hideConnectBtn) {
    return null;
  }

  return (
    <div className="connect-wallet-wrapper">
      <ConnectWallet />
      <style jsx global>{`
        /* Hide avatar image */
        .connect-wallet-wrapper img,
        .connect-wallet-wrapper svg[aria-label*="avatar"],
        .ockConnectWallet_Container img {
          display: none !important;
        }
        
        /* Restyle button */
        .connect-wallet-wrapper button,
        .ockConnectWallet_Container button {
          height: 40px !important;
          padding: 0 20px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s ease !important;
        }
        
        .connect-wallet-wrapper button:hover,
        .ockConnectWallet_Container button:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .connect-wallet-wrapper button span {
          white-space: nowrap !important;
        }

        /* Hide all identity components (avatar/name display) */
        .ockConnectWallet_Container div[class*="Identity"],
        .ockIdentity {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

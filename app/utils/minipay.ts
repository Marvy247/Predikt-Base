/**
 * MiniPay Utility Functions
 * Helper functions to detect and work with MiniPay wallet
 */

// Type definition for Ethereum provider
interface EthereumProvider {
  isMiniPay?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * Check if the user is currently using MiniPay wallet
 */
export function isMiniPayWallet(): boolean {
  if (typeof window === "undefined") return false;
  
  return !!(window.ethereum && window.ethereum.isMiniPay);
}

/**
 * Check if MiniPay is available (installed/present)
 */
export function isMiniPayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  return !!(window.ethereum);
}

/**
 * Get the user's MiniPay address if connected
 */
export async function getMiniPayAddress(): Promise<string | null> {
  if (!isMiniPayWallet()) return null;
  
  try {
    const accounts = await window.ethereum?.request({ 
      method: 'eth_accounts' 
    }) as string[];
    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting MiniPay address:", error);
    return null;
  }
}

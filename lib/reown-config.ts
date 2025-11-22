import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, type AppKitNetwork } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

if (!projectId) {
  console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

// Create Wagmi Adapter
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const queryClient = new QueryClient()

// Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: base,
  metadata: {
    name: 'PrediKt',
    description: '1v1 Prediction Duels on Farcaster',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://predikt.app',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/blue-icon.png` : 'https://predikt.app/blue-icon.png']
  },
  features: {
    analytics: true,
    socials: false,
    email: false,
    emailShowWallets: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': 'hsl(var(--primary))',
    '--w3m-border-radius-master': '8px'
  }
})

export const config = wagmiAdapter.wagmiConfig

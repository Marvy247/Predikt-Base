const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },

  baseBuilder: {
    ownerAddress: "0x56B6cfF409B0d7aF6FF318DEBC2F388Ff6663547"
  },

  miniapp: {
    version: "1",
    name: "PrediKt",
    subtitle: "Challenge Friends to Prediction Duels",
    description: "1v1 prediction battles on Farcaster - challenge friends, stake CELO, prove you're right! 🎯",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["prediction", "battles", "pvp", "challenge", "crypto", "farcaster", "social", "predikt"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Challenge. Predict. Win.",
    ogTitle: "PrediKt - 1v1 Prediction Duels",
    ogDescription: "Challenge friends to prediction battles and stake CELO on who's right!",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

0x56B6cfF409B0d7aF6FF318DEBC2F388Ff6663547
import { createAppKit } from '@reown/appkit'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5'
import { TonAdapter } from '@reown/appkit-adapter-ton'

import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import { mainnet, sepolia, bsc, polygon, monad } from '@reown/appkit/networks'
import { ton, tonTestnet } from '@reown/appkit/networks'

// 0. Create the Ethers adapter
export const ethersAdapter = new Ethers5Adapter()

// 1. Create Solana adapter
const solanaWeb3JsAdapter = new SolanaAdapter()

// 2. Create TON adapter
const tonAdapter = new TonAdapter()

// 3. Get projectId from https://dashboard.reown.com
const projectId = 'a5498791a3ace64d6c1fb542a5a659bf'

// 4. Set up the metadata - Optional
const metadata = {
  name: 'zEnvelope',
  description: 'zEnvelope App',
  url: 'https://zenvelope.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 5. Create the AppKit instance
console.log("Initializing AppKit with adapters:", { ethersAdapter, solanaWeb3JsAdapter, tonAdapter });
const modal = createAppKit({
  adapters: [ethersAdapter, solanaWeb3JsAdapter, tonAdapter],
  networks: [
    mainnet, sepolia, bsc, polygon, monad,
    solana, solanaTestnet, solanaDevnet,
    ton, tonTestnet
  ],
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

export { modal };

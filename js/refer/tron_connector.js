import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron';

const projectId = 'a5498791a3ace64d6c1fb542a5a659bf'; // Using the same projectId as AppKit

export const tronWallet = new WalletConnectWallet({
    network: WalletConnectChainID.Mainnet,
    options: {
        projectId: projectId,
        // relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
            name: 'zEnvelope',
            description: 'zEnvelope App',
            url: window.location.origin,
            icons: ['https://avatars.githubusercontent.com/u/179229932']
        }
    }
});

export async function connectTronWallet() {
    try {
        const { address } = await tronWallet.connect();
        console.log('Connected TRON address:', address);
        return address;
    } catch (error) {
        console.error('Tron wallet connection failed:', error);
        throw error;
    }
}

export const CHAIN_CONFIG = {
    // Ethereum Mainnet
    1: {
        name: 'Ethereum',
        type: 'evm',
        contractAddress: '0x1518ea2170660381c61DD8Aac4B97d242344a627',
        rpcUrl: 'https://ethereum-rpc.publicnode.com',
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'ETH'
    },
    // Sepolia Testnet
    11155111: {
        name: 'Sepolia',
        type: 'evm',
        contractAddress: '0x79d0532F61E1922DF5199E0487c0D64562DAAE88',
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        explorerUrl: 'https://sepolia.etherscan.io',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'ETH'
    },
    // BNB Smart Chain
    56: {
        name: 'BNB Chain',
        type: 'evm',
        contractAddress: '0xe728f3F581Df57aFC16b8BE7c050b90797d81b5f',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        explorerUrl: 'https://bscscan.com',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'BNB'
    },
    // Polygon
    137: {
        name: 'Polygon',
        type: 'evm',
        contractAddress: '0xe728f3F581Df57aFC16b8BE7c050b90797d81b5f',
        rpcUrl: 'https://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'POL'
    },
    // Base
    8453: {
        name: 'Base',
        type: 'evm',
        contractAddress: '0x79d0532F61E1922DF5199E0487c0D64562DAAE88',
        rpcUrl: 'https://mainnet.base.org',
        explorerUrl: 'https://basescan.org',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'ETH'
    },
    // Monad (Placeholder ID)
    143: {
        name: 'Monad',
        type: 'evm',
        contractAddress: '0xe728f3F581Df57aFC16b8BE7c050b90797d81b5f',
        rpcUrl: 'https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a',
        explorerUrl: 'https://explorer.monad.xyz',
        apiUrl: 'https://api.etherscan.io/v2/api',
        currency: 'MON'
    },
    // Solana
    'solana': {
        name: 'Solana',
        type: 'solana',
        contractAddress: '2BQGTYBozUfUwNBjtMJxgrzbVPzgiFB2gpKfdkCM9k1d',
        rpcUrl: 'https://api.devnet.solana.com',
        // rpcUrl: 'https://api.mainnet-beta.solana.com',
        // rpcUrl: 'https://rpc.ankr.com/solana/8ef907fdef25f2c26860c4cc9d8b0ed76552a28b94008c2a4f39987f7468c308',
        // rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=0131513a-ccee-4a11-a8d6-de1ccc6cec17',
        explorerUrl: 'https://explorer.solana.com',
        currency: 'SOL'
    },
    // TON
    'ton': {
        name: 'TON',
        type: 'ton',
        contractAddress: 'EQByRRttY1jkAq7ZQQrL_Qr_ZRdv12QGS5Dda7XTRvHAo7Mc',
        // rpcUrl: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        rpcUrl: 'https://toncenter.com/api/v2/jsonRPC',
        // apiUrl: 'https://testnet.toncenter.com/api/v3',
        // apiUrl2: 'https://testnet.toncenter.com/api/v2',
        apiUrl: 'https://toncenter.com/api/v3',
        apiUrl2: 'https://toncenter.com/api/v2',
        explorerUrl: 'https://tonscan.org',
        currency: 'TON'
    },
    // Tron
    'tron': {
        name: 'Tron',
        type: 'tron',
        contractAddress: 'TUsZK3mv9LSomfi4UahGFb3aeBgEWTSUjW',
        // rpcUrl: 'https://api.trongrid.io',
        rpcUrl: 'https://api.shasta.trongrid.io',
        explorerUrl: 'https://tronscan.org',
        currency: 'TRX'
    }
};

export const SUPPORTED_EVM_CHAINS = [
    {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-rpc.publicnode.com'],
        blockExplorerUrls: ['https://etherscan.io']
    },
    {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    {
        chainId: '0x38',
        chainName: 'BNB Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed.binance.org'],
        blockExplorerUrls: ['https://bscscan.com']
    },
    {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com']
    },
    {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org']
    }
];

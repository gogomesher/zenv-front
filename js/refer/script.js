import { modal, tonAdapter, tonConnectUI } from './wallet_connector.js';
import { connectTronWallet } from './tron_connector.js';
import { CHAIN_CONFIG, SUPPORTED_EVM_CHAINS } from './chain_config.js';
import { t } from './i18n.js';

console.log('Script loaded');
console.log('Modal imported:', modal);

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const TRC20_ABI = [
    { "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// Common Tokens (Sepolia defaults, can be expanded)
const COMMON_TOKENS = [
    { address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", symbol: "WETH", decimals: 18 },
    { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", decimals: 6 },
    { address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", symbol: "USDT", decimals: 6 },
    { address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6", symbol: "DAI", decimals: 18 }
];

let currentAccount = null;
let currentChainId = null;
let zEnvelopeAddress = null;

// Subscribe to state changes
modal.subscribeState(async state => {
    console.log("AppKit State Update Received:", state);

    // Try to get account info from state or helper methods
    let isConnected = state.isConnected;
    let address = state.address;
    let chainId = state.selectedNetworkId;

    // If state doesn't have account info, try getAccount()
    if (isConnected === undefined || address === undefined) {
        try {
            const account = modal.getAccount();
            console.log("Fetched account info:", account);
            if (account) {
                isConnected = account.isConnected;
                address = account.address;
            }
        } catch (e) {
            console.warn("Failed to get account info:", e);
        }
    }

    console.log(`State details - Connected: ${isConnected}, Address: ${address}, ChainID: ${chainId}`);

    if (isConnected && address) {
        // Determine if EVM or Solana
        // AppKit might return chainId as number for EVM and string for Solana (CAIP-2)
        // But we need to map it to our CHAIN_CONFIG keys.

        let configChainId = chainId;
        let provider = null;

        // Parse Chain ID (remove namespace if present)
        if (typeof chainId === 'string' && chainId.includes(':')) {
            const parts = chainId.split(':');
            // Check for known namespaces
            if (parts[0] === 'eip155') {
                configChainId = Number(parts[1]);
            } else {
                // For solana, ton, etc., we might keep the string or parse differently
                // But our logic below handles 'solana' prefix check on the original chainId? 
                // Actually, let's use the raw chainId for non-EVM checks first.
            }
        } else {
            configChainId = Number(chainId);
        }

        // Check if it's Solana (using original chainId string or parsed)
        if (typeof chainId === 'string' && chainId.startsWith('solana')) {
            configChainId = 'solana';
            provider = modal.getProvider('solana');
        } else if (typeof chainId === 'string' && (chainId.startsWith('ton') || chainId === '-239' || chainId === '-3')) {
            // TON mainnet: -239, TON testnet: -3
            configChainId = 'ton';
            try {
                provider = await modal.getWalletProvider('ton');
                console.log("TON Provider from modal.getWalletProvider:", provider);
            } catch (e) {
                console.warn("Failed to get TON provider via getWalletProvider:", e);
                provider = modal.getProvider('ton');
            }
        } else {
            // Assume EVM if parsed configChainId is a number
            if (!isNaN(configChainId)) {
                provider = modal.getProvider('eip155');
            }
        }

        console.log(`Processing connection for ChainID: ${configChainId}, Provider found: ${!!provider}`);
        await handleConnection(provider, address, configChainId);
    } else {
        console.log("Wallet not connected or address missing, handling disconnect.");
        handleDisconnect();
    }
});

async function handleConnection(provider, address, chainId) {
    currentChainId = chainId;
    currentAccount = address;
    console.log('Connected account:', currentAccount);

    // Update button text immediately to show truncated address
    const verifyBtn = document.querySelector('.verify-btn');
    if (verifyBtn) {
        const shortAddress = currentAccount.substring(0, 6) + '...' + currentAccount.substring(currentAccount.length - 4);
        verifyBtn.textContent = shortAddress;
        verifyBtn.removeAttribute('data-i18n'); // Prevent i18n from overwriting address
        console.log('Updated verify button text to:', shortAddress);
    }

    const chainConfig = CHAIN_CONFIG[currentChainId];

    // Update network display
    const networkDisplay = document.getElementById('network-display');

    if (!chainConfig) {
        console.warn(`Unsupported network: ${currentChainId}.`);
        showNotification(t('unsupported_network'), 'error');

        if (networkDisplay) {
            networkDisplay.textContent = t('unknown_network');
            networkDisplay.style.display = 'inline-block';
        }
        return;
    }

    if (networkDisplay) {
        console.log('Updating network display to:', chainConfig.name);
        networkDisplay.textContent = chainConfig.name;
        networkDisplay.style.display = 'inline-block';
    } else {
        console.error('Network display element not found!');
    }

    zEnvelopeAddress = chainConfig.contractAddress;
    // Ensure we update the global currentChainId to the resolved one
    currentChainId = chainId;
    console.log(`Connected to ${chainConfig.name} (${currentChainId}). Contract: ${zEnvelopeAddress}`);

    if (!zEnvelopeAddress) {
        showNotification(t('contract_not_deployed', { name: chainConfig.name }), 'warning');
    }

    if (chainConfig.type === 'evm') {
        if (typeof ethers !== 'undefined' && provider) {
            // Use "any" to allow network changes and prevent "network changed" errors
            window.ethersProvider = new ethers.providers.Web3Provider(provider, "any");
            window.ethersSigner = window.ethersProvider.getSigner();

            // Force network refresh
            // Note: AppKit might handle this differently, but keeping for safety
            if (provider.on) {
                provider.on("chainChanged", (newChainId) => {
                    window.location.reload();
                });
            }

            await updateUserAssets();

            // Auto-scan for tokens if API is available
            if (chainConfig.apiUrl) {
                await scanForTokens();
            }
        }
    } else if (chainConfig.type === 'solana') {
        console.log("Connected to Solana");
        // Handle Solana specific logic here
        window.solanaProvider = provider;
        await updateSolanaAssets();
    } else if (chainConfig.type === 'ton') {
        console.log("Connected to TON");
        console.log("TON Provider:", provider);
        window.tonProvider = provider;
        await updateTonAssets();
    } else if (chainConfig.type === 'tron') {
        console.log("Connected to Tron");
        // window.tronProvider = provider; 
        await updateTronAssets();
    }

    showNotification(t('connected_to', { name: chainConfig.name }), 'success');
}

// Common Tron Tokens to avoid RPC calls for metadata
const COMMON_TRON_TOKENS = {
    "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t": { symbol: "USDT", decimals: 6 },
    "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8": { symbol: "USDC", decimals: 6 },
    "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7": { symbol: "WIN", decimals: 6 },
    "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmW87aC": { symbol: "JST", decimals: 18 },
    "TF17BgPaCUuecvQqBUL0JIGraV30OcSFJD": { symbol: "SUN", decimals: 18 },
    "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S": { symbol: "BTT", decimals: 18 },
    "TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT": { symbol: "USDJ", decimals: 18 },
    "TUpMhErZL2fhh4sVNULAbNSenncvxuMfeK": { symbol: "TUSD", decimals: 18 },
};

async function updateTronAssets() {
    console.log("Starting updateTronAssets...");
    const tokenSelect = document.getElementById('token-address');

    if (!currentAccount) {
        console.warn("Missing account for Tron asset update");
        return;
    }

    tokenSelect.innerHTML = `<option value="" disabled selected>${t('loading_assets')}</option>`;

    const chainConfig = CHAIN_CONFIG['tron'];

    // Determine TronScan API URL based on RPC URL
    let tronScanApiUrl = 'https://apilist.tronscan.org';
    if (chainConfig.rpcUrl.includes('shasta')) {
        tronScanApiUrl = 'https://shastapi.tronscan.org';
    } else if (chainConfig.rpcUrl.includes('nile')) {
        tronScanApiUrl = 'https://nileapi.tronscan.org';
    }

    try {
        tokenSelect.innerHTML = ''; // Clear loading
        let assetsFound = 0;

        // 1. Fetch TRX Balance (using TronWeb or TronGrid)
        let trxBalance = 0;
        if (window.tronWeb && window.tronWeb.ready) {
            try {
                const balance = await window.tronWeb.trx.getBalance(currentAccount);
                trxBalance = balance / 1000000;
            } catch (e) {
                console.warn("Failed to get TRX balance via TronWeb:", e);
            }
        }

        if (trxBalance === 0) {
            // Fallback to TronGrid
            try {
                const apiUrl = `${chainConfig.rpcUrl}/v1/accounts/${currentAccount}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    trxBalance = (data.data[0].balance || 0) / 1000000;
                }
            } catch (e) {
                console.warn("Failed to get TRX balance via TronGrid:", e);
            }
        }

        if (trxBalance > 0) {
            addOption(tokenSelect, "TRX", `TRX (${trxBalance.toFixed(4)})`);
            assetsFound++;
        }

        // 2. Fetch TRC20 Tokens using TronScan API (Preferred as it gives metadata)
        try {
            const scanUrl = `${tronScanApiUrl}/api/account?address=${currentAccount}`;
            console.log("Scanning tokens via:", scanUrl);
            const response = await fetch(scanUrl);
            const data = await response.json();

            if (data && data.trc20token_balances) {
                for (const token of data.trc20token_balances) {
                    const balance = Number(token.balance);
                    const decimals = token.tokenDecimal || 18; // Default to 18 if missing

                    // Filter out zero balance or very small dust
                    if (balance > 0) {
                        const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(4);
                        const symbol = token.tokenAbbr || token.tokenName || "Unknown";
                        const address = token.tokenId; // tokenId is contract address for TRC20

                        addOption(tokenSelect, address, `${symbol} (${formattedBalance})`);
                        assetsFound++;
                    }
                }
            }
        } catch (scanError) {
            console.warn("TronScan API failed, falling back to TronGrid:", scanError);

            // Fallback: Use TronGrid (original logic)
            const apiUrl = `${chainConfig.rpcUrl}/v1/accounts/${currentAccount}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                const account = data.data[0];
                if (account.trc20 && account.trc20.length > 0) {
                    for (const tokenObj of account.trc20) {
                        const contractAddress = Object.keys(tokenObj)[0];
                        const balanceRaw = tokenObj[contractAddress];

                        if (Number(balanceRaw) > 0) {
                            let symbol = "Unknown";
                            let decimals = 18;

                            // Try to get metadata
                            if (COMMON_TRON_TOKENS[contractAddress]) {
                                symbol = COMMON_TRON_TOKENS[contractAddress].symbol;
                                decimals = COMMON_TRON_TOKENS[contractAddress].decimals;
                            } else if (window.tronWeb && window.tronWeb.ready) {
                                try {
                                    const contract = await window.tronWeb.contract().at(contractAddress);
                                    symbol = await contract.symbol().call();
                                    decimals = await contract.decimals().call();
                                } catch (e) { }
                            }

                            const formattedBalance = (Number(balanceRaw) / Math.pow(10, Number(decimals))).toFixed(4);
                            addOption(tokenSelect, contractAddress, `${symbol} (${formattedBalance})`);
                            assetsFound++;
                        }
                    }
                }
            }
        }

        if (assetsFound > 0) {
            // Add placeholder
            const placeholder = document.createElement('option');
            placeholder.value = "";
            placeholder.disabled = true;
            placeholder.selected = true;
            placeholder.setAttribute('data-i18n', 'select_token');
            placeholder.textContent = t('select_token');
            tokenSelect.insertBefore(placeholder, tokenSelect.firstChild);
        } else {
            tokenSelect.innerHTML = `<option value="" disabled selected>${t('insufficient_balance')}</option>`;
        }

    } catch (error) {
        console.error("Failed to fetch Tron assets:", error);
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('load_failed')}</option>`;
    }
}

async function updateTonAssets() {
    console.log("Starting updateTonAssets...");
    const tokenSelect = document.getElementById('token-address');

    if (!currentAccount || !currentChainId) {
        console.warn("Missing account or chain ID for TON asset update");
        return;
    }

    tokenSelect.innerHTML = `<option value="" disabled selected>${t('loading_assets')}</option>`;

    const chainConfig = CHAIN_CONFIG[currentChainId];
    if (!chainConfig || !chainConfig.rpcUrl) {
        console.warn("No RPC URL for TON");
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('cannot_load_assets')}</option>`;
        return;
    }

    try {
        console.log("Fetching TON balance from:", chainConfig.rpcUrl);
        // Toncenter API v2
        const response = await fetch(chainConfig.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                jsonrpc: '2.0',
                method: 'getAddressBalance',
                params: { address: currentAccount }
            })
        });

        const data = await response.json();
        console.log("TON RPC Response:", data);

        if (data.ok && data.result) {
            const nanotons = data.result;
            const tonBalance = Number(nanotons) / 1000000000; // 1 TON = 10^9 nanotons
            console.log("TON Balance:", tonBalance);

            tokenSelect.innerHTML = ''; // Clear loading

            if (tonBalance > 0) {
                addOption(tokenSelect, "TON", `TON (${tonBalance.toFixed(4)})`);

                const placeholder = document.createElement('option');
                placeholder.value = "";
                placeholder.disabled = true;
                placeholder.selected = true;
                placeholder.setAttribute('data-i18n', 'select_token');
                placeholder.textContent = t('select_token');
                tokenSelect.insertBefore(placeholder, tokenSelect.firstChild);
            } else {
                tokenSelect.innerHTML = `<option value="" disabled selected>${t('insufficient_balance_ton')}</option>`;
            }
        } else {
            console.error("Invalid RPC response structure:", data);
            throw new Error("Invalid RPC response");
        }

    } catch (error) {
        console.error("Failed to fetch TON assets:", error);
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('load_failed')}</option>`;
    }
}

async function updateSolanaAssets() {
    console.log("Starting updateSolanaAssets...");
    const tokenSelect = document.getElementById('token-address');

    console.log("Current Account:", currentAccount);
    console.log("Current Chain ID:", currentChainId);

    if (!currentAccount || !currentChainId) {
        console.warn("Missing account or chain ID for Solana asset update");
        return;
    }

    tokenSelect.innerHTML = `<option value="" disabled selected>${t('loading_assets')}</option>`;

    const chainConfig = CHAIN_CONFIG[currentChainId];
    console.log("Chain Config:", chainConfig);

    if (!chainConfig || !chainConfig.rpcUrl) {
        console.warn("No RPC URL for Solana");
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('cannot_load_assets')}</option>`;
        return;
    }

    try {
        console.log("Fetching SOL balance from:", chainConfig.rpcUrl);
        const connection = new solanaWeb3.Connection(chainConfig.rpcUrl, 'confirmed');
        const walletPublicKey = new solanaWeb3.PublicKey(currentAccount);

        // 1. Fetch SOL Balance
        const solBalanceRaw = await connection.getBalance(walletPublicKey);
        const solBalance = solBalanceRaw / 1000000000; // 1 SOL = 10^9 lamports
        console.log("SOL Balance:", solBalance);

        tokenSelect.innerHTML = ''; // Clear loading

        let assetsFound = 0;

        if (solBalance > 0) {
            addOption(tokenSelect, "SOL", `SOL (${solBalance.toFixed(4)})`);
            assetsFound++;
        }

        // 2. Fetch SPL Tokens
        try {
            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            const response = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
                programId: TOKEN_PROGRAM_ID
            });

            console.log("SPL Tokens found:", response.value.length);

            // Aggregate balances by mint address
            const tokenBalances = new Map();

            for (const { account } of response.value) {
                const parsedInfo = account.data.parsed.info;
                const mintAddress = parsedInfo.mint;
                const tokenAmount = parsedInfo.tokenAmount;
                const uiAmount = tokenAmount.uiAmount;

                if (uiAmount > 0) {
                    const currentBalance = tokenBalances.get(mintAddress) || 0;
                    tokenBalances.set(mintAddress, currentBalance + uiAmount);
                }
            }

            // Add options for aggregated balances
            for (const [mintAddress, balance] of tokenBalances) {
                // Try to get symbol (simplified, as metadata requires Metaplex)
                // We'll use truncated Mint address as symbol for now
                const shortMint = mintAddress.substring(0, 4) + '...' + mintAddress.substring(mintAddress.length - 4);
                // Format balance to avoid long decimals if necessary, though uiAmount is usually fine
                const formattedBalance = parseFloat(balance.toFixed(6));
                addOption(tokenSelect, mintAddress, `${shortMint} (${formattedBalance})`);
                assetsFound++;
            }
        } catch (tokenError) {
            console.warn("Failed to fetch SPL tokens:", tokenError);
        }

        if (assetsFound > 0) {
            // Add default placeholder
            const placeholder = document.createElement('option');
            placeholder.value = "";
            placeholder.disabled = true;
            placeholder.selected = true;
            placeholder.setAttribute('data-i18n', 'select_token');
            placeholder.textContent = t('select_token');
            tokenSelect.insertBefore(placeholder, tokenSelect.firstChild);
        } else {
            tokenSelect.innerHTML = `<option value="" disabled selected>${t('insufficient_balance_sol')}</option>`;
        }

    } catch (error) {
        console.error("Failed to fetch Solana assets:", error);
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('load_failed')}</option>`;
    }
}

function handleDisconnect() {
    console.log('Disconnected');
    currentAccount = null;
    currentChainId = null;
    zEnvelopeAddress = null;
    const verifyBtn = document.querySelector('.verify-btn');
    if (verifyBtn) {
        verifyBtn.setAttribute('data-i18n', 'connect_wallet'); // Restore i18n
        verifyBtn.textContent = t('connect_wallet');
    }

    const networkDisplay = document.getElementById('network-display');
    if (networkDisplay) {
        networkDisplay.style.display = 'none';
    }

    const tokenSelect = document.getElementById('token-address');
    if (tokenSelect) {
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('option_connect_first')}</option>`;
    }
}

async function scanForTokens() {
    if (!currentAccount || !window.ethersProvider) {
        console.log('Wallet not connected, skipping scan');
        return;
    }

    const statusSpan = document.getElementById('scan-status');
    if (statusSpan) statusSpan.textContent = t('scanning_tokens');

    const tokenSelect = document.getElementById('token-address');

    try {
        let tokenAddresses = [];
        const maxRetries = 2;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const chainConfig = CHAIN_CONFIG[currentChainId];
                if (!chainConfig || !chainConfig.apiUrl) {
                    console.warn("No API URL configured for this chain, skipping scan");
                    return;
                }

                // Use generic Etherscan-compatible API structure
                // Note: We use the V1-like structure (without chainid param) which is standard for BscScan, PolygonScan, etc.
                const apiKey = "YFEBIVGRSFZDHR1JQK436R42GU5KM57WVC"; // Default key, might need specific keys for other networks
                const apiUrl = `${chainConfig.apiUrl}?chainid=${currentChainId}&module=account&action=tokentx&address=${currentAccount}&page=1&offset=100&sort=desc&apikey=${apiKey}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.status === "0" && data.message === "No transactions found") {
                    tokenAddresses = [];
                    break; // Success, just no tokens
                }

                if (data.status !== "1") {
                    throw new Error(data.result || data.message || "Etherscan API error");
                }

                const transactions = data.result || [];
                tokenAddresses = [...new Set(transactions.map(tx => tx.contractAddress))];
                console.log("Scanned via Etherscan:", tokenAddresses);
                break; // Success

            } catch (apiError) {
                console.warn(`Scan attempt ${attempt + 1} failed:`, apiError);
                if (attempt === maxRetries - 1) {
                    if (statusSpan) statusSpan.textContent = t('scan_failed_retry');
                    throw new Error(t('scan_failed_retry'));
                }
                // Wait 1s before retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (statusSpan) statusSpan.textContent = ''; // Clear status message

        if (tokenSelect) {
            // Remove "Loading assets..." option
            for (let i = 0; i < tokenSelect.options.length; i++) {
                if (tokenSelect.options[i].text === t('loading_assets')) {
                    tokenSelect.remove(i);
                    break;
                }
            }

            for (const address of tokenAddresses) {
                // Skip if already in common tokens or already in dropdown
                if (COMMON_TOKENS.some(t => t.address.toLowerCase() === address.toLowerCase())) continue;

                // Check if already added to dropdown
                let exists = false;
                for (let i = 0; i < tokenSelect.options.length; i++) {
                    if (tokenSelect.options[i].value.toLowerCase() === address.toLowerCase()) {
                        exists = true;
                        break;
                    }
                }
                if (exists) continue;

                try {
                    // Verify it's an ERC20 and get balance
                    const contract = new ethers.Contract(address, ERC20_ABI, window.ethersProvider);
                    const [name, symbol, decimals, balance] = await Promise.all([
                        contract.name().catch(() => "Unknown"),
                        contract.symbol().catch(() => "???"),
                        contract.decimals().catch(() => 18),
                        contract.balanceOf(currentAccount).catch(() => ethers.BigNumber.from(0))
                    ]);

                    if (balance.gt(0)) {
                        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
                        const option = document.createElement('option');
                        option.value = address;
                        option.textContent = `${symbol} (${formattedBalance})`;
                        tokenSelect.appendChild(option);
                        foundCount++;
                    }
                } catch (e) {
                    console.warn("Failed to check token:", address, e);
                }
            }

            // Check if any tokens are available (common or scanned)
            if (tokenSelect.options.length === 0 || (tokenSelect.options.length === 1 && tokenSelect.options[0].disabled)) {
                const placeholder = document.createElement('option');
                placeholder.value = "";
                placeholder.disabled = true;
                placeholder.selected = true;
                placeholder.textContent = t('no_tokens_found');
                tokenSelect.insertBefore(placeholder, tokenSelect.firstChild);
            }
        }
    } catch (error) {
        console.error("Scan failed:", error);
        if (statusSpan) statusSpan.textContent = t('scan_failed_retry');
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    const go = new Go();
    const response = await fetch('js/sha1.wasm');
    const buffer = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(buffer, go.importObject);
    go.run(result.instance);

    // Check wallet connection status on load
    // Web3Modal handles this via subscribeProvider

    // Listen for MetaMask account changes
    // Web3Modal handles this via subscribeProvider

    // Wallet connection button
    const verifyBtn = document.getElementById('connect-wallet-btn') || document.querySelector('.verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            connectToWallet();
        });
    }

    // Token select change handler removed (custom token logic removed)
    /*
    const tokenSelect = document.getElementById('token-address');
    const customTokenWrapper = document.getElementById('custom-token-wrapper');
    tokenSelect.addEventListener('change', function () {
        if (this.value === 'custom') {
            customTokenWrapper.style.display = 'block';
            document.getElementById('custom-token-address').required = true;
        } else {
            customTokenWrapper.style.display = 'none';
            document.getElementById('custom-token-address').required = false;
            document.getElementById('custom-token-balance').style.display = 'none';
        }
    });
    */

    // Scan tokens button removed, auto-scan implemented
    /*
    const scanBtn = document.getElementById('scan-tokens-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', scanForTokens);
    }
    */

    // scanForTokens moved to global scope

    // Custom token input handler removed
    /*
    const customTokenInput = document.getElementById('custom-token-address');
    ...
    */

    // Form submission handling
    const form = document.getElementById('envelope-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();


        // Get form values
        let tokenAddress = document.getElementById('token-address').value;
        if (tokenAddress === 'custom') {
            tokenAddress = document.getElementById('custom-token-address').value;
            if (!ethers.utils.isAddress(tokenAddress)) {
                showNotification(t('invalid_token_address'), 'error');
                return;
            }
        }

        const amount = document.getElementById('amount').value;
        const recipientCount = document.getElementById('recipient-count').value;
        const distributionType = document.getElementById('distribution-type').value;
        const password = document.getElementById('password').value;
        const validity = document.getElementById('validity').value;

        // Validate form
        if (!tokenAddress || !amount || !recipientCount || !password) {
            showNotification(t('fill_required_fields'), 'error');
            return;
        }

        // Show loading state on button
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('processing')}`;
        submitBtn.disabled = true;

        // Real contract call
        (async () => {
            try {
                if (!currentAccount) {
                    showNotification(t('wallet_not_connected'), 'error');
                    throw new Error(t('wallet_not_connected'));
                }

                if (!zEnvelopeAddress) {
                    showNotification(t('network_not_supported'), 'error');
                    throw new Error(t('contract_not_configured'));
                }

                const chainConfig = CHAIN_CONFIG[currentChainId];
                if (!chainConfig) throw new Error("Unknown chain config");

                // Get password hash from wasm
                const pkbResponse = await fetch('js/pkb');
                const pkbBuffer = await pkbResponse.arrayBuffer();
                const pkbContent = new Uint8Array(pkbBuffer);
                const hashedPassword = "0x" + goSha256(password, pkbContent);
                const validityInSeconds = validity ? validity * 3600 : 86400;

                console.log("hashedPassword = ", hashedPassword);

                if (chainConfig.type === 'tron') {
                    await handleTronCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds);
                } else if (chainConfig.type === 'evm') {
                    await handleEvmCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds);
                } else if (chainConfig.type === 'solana') {
                    await handleSolanaCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds);
                } else if (chainConfig.type === 'ton') {
                    await handleTonCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds);
                } else {
                    throw new Error("Unsupported chain type: " + chainConfig.type);
                }

            } catch (error) {
                console.error('创建红包失败:', error);
                showNotification(`${t('create_failed')} ${error.message}`, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        })();
    });
});

async function handleEvmCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds) {
    const submitBtn = document.querySelector('.submit-btn');
    console.log("Creating EVM Envelope with Address:", zEnvelopeAddress);

    // Ensure parameters are of correct type
    const recipientCountInt = parseInt(recipientCount, 10);
    const distributionTypeInt = parseInt(distributionType, 10);
    const validityInSecondsInt = parseInt(validityInSeconds, 10);

    console.log("Parameters:", {
        tokenAddress,
        amount,
        recipientCount: recipientCountInt,
        distributionType: distributionTypeInt,
        hashedPassword,
        validityInSeconds: validityInSecondsInt
    });

    if (isNaN(recipientCountInt) || recipientCountInt <= 0) {
        throw new Error("Invalid recipient count");
    }

    const zEnvelopeContract = new ethers.Contract(zEnvelopeAddress, zEnvelopeABI, window.ethersSigner);

    let serviceFee;
    try {
        serviceFee = await zEnvelopeContract.serviceFee();
        console.log("Service Fee:", serviceFee.toString());
    } catch (error) {
        console.error("Failed to fetch service fee:", error);
        throw new Error("Failed to fetch service fee from contract");
    }

    if (tokenAddress && tokenAddress !== 'ETH') {
        // ERC20 Logic
        const erc20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, window.ethersSigner);
        const decimals = await erc20Contract.decimals();
        const amountWei = ethers.utils.parseUnits(amount, decimals);

        // Check allowance
        const allowance = await erc20Contract.allowance(currentAccount, zEnvelopeAddress);

        if (allowance.lt(amountWei)) {
            showNotification(t('approval_required'), 'info');
            const approveTx = await erc20Contract.approve(zEnvelopeAddress, amountWei);
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('approving')}`;
            await approveTx.wait();
            showNotification(t('approval_success'), 'info');
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('creating')}`;
        }

        showNotification(t('creating_envelope'), 'info');

        console.log("Calling createERC20Envelope with:", {
            tokenAddress,
            amountWei: amountWei.toString(),
            hashedPassword,
            validityInSeconds: validityInSecondsInt,
            recipientCount: recipientCountInt,
            distributionType: distributionTypeInt,
            value: serviceFee.toString()
        });

        const tx = await zEnvelopeContract.createERC20Envelope(
            tokenAddress,
            amountWei,
            hashedPassword,
            validityInSecondsInt,
            recipientCountInt,
            distributionTypeInt,
            { value: serviceFee }
        );
        await handleTransactionReceipt(tx);

    } else {
        // Native Token Logic
        const amountWei = ethers.utils.parseEther(amount);
        showNotification(t('creating_envelope'), 'info');

        const totalValue = amountWei.add(serviceFee);

        console.log("Calling createEnvelope with:", {
            hashedPassword,
            validityInSeconds: validityInSecondsInt,
            recipientCount: recipientCountInt,
            distributionType: distributionTypeInt,
            value: totalValue.toString()
        });

        const tx = await zEnvelopeContract.createEnvelope(
            hashedPassword,
            validityInSecondsInt,
            recipientCountInt,
            distributionTypeInt,
            { value: totalValue }
        );
        await handleTransactionReceipt(tx);
    }
}

async function handleTronCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds) {
    const submitBtn = document.querySelector('.submit-btn');
    const tronWeb = window.tronWeb;
    // Use explicit ABI to avoid fetching issues
    const zEnvelopeContract = tronWeb.contract(zEnvelopeABI, zEnvelopeAddress);
    const serviceFee = await zEnvelopeContract.serviceFee().call();

    if (tokenAddress && tokenAddress !== 'TRX') {
        // TRC20 Logic
        // Use explicit TRC20 ABI
        const tokenContract = tronWeb.contract(TRC20_ABI, tokenAddress);
        const decimals = await tokenContract.decimals().call();
        const decimalsNum = Number(decimals);
        const amountWei = ethers.utils.parseUnits(amount, decimalsNum);

        // Check allowance
        const allowance = await tokenContract.allowance(currentAccount, zEnvelopeAddress).call();
        const allowanceBn = ethers.BigNumber.from(allowance.toString());

        if (allowanceBn.lt(amountWei)) {
            showNotification(t('approval_required'), 'info');
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('approving')}`;
            await tokenContract.approve(zEnvelopeAddress, amountWei.toString()).send();
            showNotification(t('approval_success'), 'info');
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('creating')}`;
        }

        showNotification(t('creating_envelope'), 'info');
        const txId = await zEnvelopeContract.createERC20Envelope(
            tokenAddress,
            amountWei.toString(),
            hashedPassword,
            validityInSeconds,
            recipientCount,
            distributionType
        ).send({
            callValue: serviceFee,
            feeLimit: 1000000000 // 1000 TRX
        });
        await handleTronTransactionReceipt(txId);

    } else {
        // TRX Logic
        const amountWei = ethers.utils.parseUnits(amount, 6); // TRX has 6 decimals
        showNotification(t('creating_envelope'), 'info');

        const serviceFeeBn = ethers.BigNumber.from(serviceFee.toString());
        const totalValue = amountWei.add(serviceFeeBn);

        const txId = await zEnvelopeContract.createEnvelope(
            hashedPassword,
            validityInSeconds,
            recipientCount,
            distributionType
        ).send({
            callValue: totalValue.toString(),
            feeLimit: 1000000000 // 1000 TRX
        });
        await handleTronTransactionReceipt(txId);
    }
}

async function handleTronTransactionReceipt(txId) {
    const submitBtn = document.querySelector('.submit-btn');
    showNotification(t('create_success'), 'success');
    console.log("Tron Tx ID:", txId);

    // Wait for confirmation loop
    let receipt = null;
    for (let i = 0; i < 10; i++) {
        try {
            receipt = await window.tronWeb.trx.getTransactionInfo(txId);
            if (receipt && receipt.id) break;
        } catch (e) { }
        await new Promise(r => setTimeout(r, 3000));
    }

    if (receipt) {
        const resultMessage = document.getElementById('result-message');
        const envelopeIdSpan = document.getElementById('envelope-id');

        envelopeIdSpan.textContent = "Created (Check History)";
        resultMessage.style.display = 'block';
        resultMessage.scrollIntoView({ behavior: 'smooth' });
    }

    submitBtn.innerHTML = t('btn_create');
    submitBtn.disabled = false;
}

async function handleSolanaCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds) {
    const submitBtn = document.querySelector('.submit-btn');

    try {
        // Get Solana connection and wallet
        if (!window.solana || !window.solana.isConnected) {
            throw new Error("Solana wallet not connected");
        }

        const connection = new solanaWeb3.Connection(CHAIN_CONFIG['solana'].rpcUrl, 'confirmed');
        const walletPublicKey = new solanaWeb3.PublicKey(currentAccount);

        // Get global state PDA
        const [globalStatePda] = solanaWeb3.PublicKey.findProgramAddressSync(
            [Buffer.from('global_state')],
            new solanaWeb3.PublicKey(zEnvelopeAddress)
        );

        // Fetch global state to get next envelope ID
        const globalStateAccount = await connection.getAccountInfo(globalStatePda);
        if (!globalStateAccount) {
            throw new Error("Solana program not initialized");
        }

        // Parse next_envelope_id from global state
        const globalStateData = globalStateAccount.data;
        const nextEnvelopeIdOffset = 8 + 32 + 32 + 8 + 8 + 8; // Skip discriminator and other fields
        // Use Buffer.readBigUInt64LE for safety with Buffer slices
        const nextEnvelopeId = globalStateData.readBigUInt64LE(nextEnvelopeIdOffset);
        console.log("Next Envelope ID:", nextEnvelopeId.toString());

        // Derive envelope PDA
        const envelopeIdBuffer = Buffer.alloc(8);
        envelopeIdBuffer.writeBigUInt64LE(nextEnvelopeId);
        const [envelopePda] = solanaWeb3.PublicKey.findProgramAddressSync(
            [Buffer.from('envelope'), envelopeIdBuffer],
            new solanaWeb3.PublicKey(zEnvelopeAddress)
        );
        console.log("Derived Envelope PDA:", envelopePda.toBase58());

        // Convert password hash to Buffer
        const passwordHashBuffer = Buffer.from(hashedPassword.slice(2), 'hex');

        // Get admin address from global state
        const adminPubkey = new solanaWeb3.PublicKey(globalStateData.slice(8, 40));
        const programId = new solanaWeb3.PublicKey(zEnvelopeAddress);

        let createInstruction;
        let instructions = [];

        if (tokenAddress && tokenAddress !== 'SOL') {
            // --- SPL Token Envelope ---
            showNotification(t('creating_envelope'), 'info');

            const mintPubkey = new solanaWeb3.PublicKey(tokenAddress);
            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            const SYSVAR_RENT_PUBKEY = new solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111');

            // 1. Get Token Decimals
            const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
            const decimals = mintInfo.value.data.parsed.info.decimals;
            const amountTokens = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

            // 2. Derive Addresses
            // Helper to find ATA
            const findAssociatedTokenAddress = (walletAddress, tokenMintAddress) => {
                return solanaWeb3.PublicKey.findProgramAddressSync(
                    [
                        walletAddress.toBuffer(),
                        TOKEN_PROGRAM_ID.toBuffer(),
                        tokenMintAddress.toBuffer()
                    ],
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )[0];
            };

            // Find user's actual token account
            // We query all accounts by Program ID (like updateSolanaAssets) to ensure consistency
            const allUserTokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
                programId: TOKEN_PROGRAM_ID
            });

            // Filter for the selected mint and sort by balance
            const matchingAccounts = allUserTokenAccounts.value.filter(item =>
                item.account.data.parsed.info.mint === tokenAddress
            ).sort((a, b) => {
                const balanceA = a.account.data.parsed.info.tokenAmount.uiAmount || 0;
                const balanceB = b.account.data.parsed.info.tokenAmount.uiAmount || 0;
                return balanceB - balanceA; // Descending
            });

            let creatorTokenAccount;
            if (matchingAccounts.length > 0) {
                creatorTokenAccount = matchingAccounts[0].pubkey;
                console.log("Found user token account:", creatorTokenAccount.toBase58(), "Balance:", matchingAccounts[0].account.data.parsed.info.tokenAmount.uiAmount);
            } else {
                // If no account found, we cannot proceed as we need an initialized account
                throw new Error(t('insufficient_balance'));
            }

            const adminAta = findAssociatedTokenAddress(adminPubkey, mintPubkey);

            // Envelope Token Vault PDA
            const [envelopeTokenVaultPda] = solanaWeb3.PublicKey.findProgramAddressSync(
                [Buffer.from('envelope_vault'), envelopePda.toBuffer()],
                programId
            );

            // Check Service Fee Rate
            const erc20ServiceFeeRate = globalStateData.readBigUInt64LE(80); // Offset 80
            console.log("ERC20 Service Fee Rate:", erc20ServiceFeeRate.toString());

            let targetAdminTokenAccount = adminAta;

            if (erc20ServiceFeeRate === BigInt(0)) {
                // If fee is 0, use creator token account as placeholder for admin ATA to avoid "AccountNotInitialized" error
                targetAdminTokenAccount = creatorTokenAccount;
            } else {
                // If fee > 0, we MUST use adminAta.
                // Check if adminAta exists (is initialized).
                const adminAtaInfo = await connection.getAccountInfo(adminAta);
                if (!adminAtaInfo) {
                    console.log("Admin ATA not initialized. Adding creation instruction.");
                    // Create Admin ATA (Payer: User)
                    // Associated Token Program Create Instruction
                    const createAtaIx = new solanaWeb3.TransactionInstruction({
                        keys: [
                            { pubkey: walletPublicKey, isSigner: true, isWritable: true }, // Payer
                            { pubkey: adminAta, isSigner: false, isWritable: true }, // ATA
                            { pubkey: adminPubkey, isSigner: false, isWritable: false }, // Owner
                            { pubkey: mintPubkey, isSigner: false, isWritable: false }, // Mint
                            { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                        ],
                        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
                        data: Buffer.alloc(0) // Opcode 0 = Create
                    });
                    instructions.push(createAtaIx);
                }
            }
            console.log("Target Admin Token Account:", targetAdminTokenAccount.toBase58());

            // 3. Build Instruction
            // Instruction format: [discriminator: 8] [validity: 8] [recipients: 8] [dist_type: 1] [amount: 8] [password_hash_len: 4] [password_hash: N]
            const createIxData = Buffer.alloc(8 + 8 + 8 + 1 + 8 + 4 + passwordHashBuffer.length);

            // Discriminator for create_spl_envelope (first 8 bytes of sha256("global:create_spl_envelope"))
            // Calculated: ea74df6ab1df757d
            const createSplEnvelopeDiscriminator = Buffer.from([0xea, 0x74, 0xdf, 0x6a, 0xb1, 0xdf, 0x75, 0x7d]);
            createSplEnvelopeDiscriminator.copy(createIxData, 0);

            let offset = 8;
            createIxData.writeBigUInt64LE(BigInt(validityInSeconds), offset);
            offset += 8;
            createIxData.writeBigUInt64LE(BigInt(recipientCount), offset);
            offset += 8;
            createIxData.writeUInt8(parseInt(distributionType), offset);
            offset += 1;
            createIxData.writeBigUInt64LE(BigInt(amountTokens), offset);
            offset += 8;
            createIxData.writeUInt32LE(passwordHashBuffer.length, offset);
            offset += 4;
            passwordHashBuffer.copy(createIxData, offset);

            createInstruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: globalStatePda, isSigner: false, isWritable: true },
                    { pubkey: envelopePda, isSigner: false, isWritable: true },
                    { pubkey: envelopeTokenVaultPda, isSigner: false, isWritable: true },
                    { pubkey: mintPubkey, isSigner: false, isWritable: false },
                    { pubkey: walletPublicKey, isSigner: true, isWritable: true },
                    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: adminPubkey, isSigner: false, isWritable: true },
                    { pubkey: targetAdminTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                programId: programId,
                data: new Uint8Array(createIxData)
            });

            instructions.push(createInstruction);

        } else {
            // --- Native SOL Envelope ---
            showNotification(t('creating_envelope'), 'info');

            // Convert amount to lamports
            const amountLamports = Math.floor(parseFloat(amount) * solanaWeb3.LAMPORTS_PER_SOL);

            // Instruction format: [discriminator: 8] [validity: 8] [recipients: 8] [dist_type: 1] [amount: 8] [password_hash_len: 4] [password_hash: N]
            const createIxData = Buffer.alloc(8 + 8 + 8 + 1 + 8 + 4 + passwordHashBuffer.length);

            // Discriminator for create_envelope (first 8 bytes of sha256("global:create_envelope"))
            // Calculated: 0219c2b4ee1fea14
            const createEnvelopeDiscriminator = Buffer.from([0x02, 0x19, 0xc2, 0xb4, 0xee, 0x1f, 0xea, 0x14]);
            createEnvelopeDiscriminator.copy(createIxData, 0);

            let offset = 8;
            createIxData.writeBigUInt64LE(BigInt(validityInSeconds), offset);
            offset += 8;
            createIxData.writeBigUInt64LE(BigInt(recipientCount), offset);
            offset += 8;
            createIxData.writeUInt8(parseInt(distributionType), offset);
            offset += 1;
            createIxData.writeBigUInt64LE(BigInt(amountLamports), offset);
            offset += 8;
            createIxData.writeUInt32LE(passwordHashBuffer.length, offset);
            offset += 4;
            passwordHashBuffer.copy(createIxData, offset);

            createInstruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: globalStatePda, isSigner: false, isWritable: true },
                    { pubkey: envelopePda, isSigner: false, isWritable: true },
                    { pubkey: walletPublicKey, isSigner: true, isWritable: true },
                    { pubkey: adminPubkey, isSigner: false, isWritable: true },
                    { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: programId,
                data: new Uint8Array(createIxData)
            });

            // For native SOL, we don't need extra instructions
            instructions = [createInstruction];
        }

        // Send transactions
        // Transaction 1: Create Envelope (and optionally create Admin ATA)
        const latestBlockhash = await connection.getLatestBlockhash();
        const messageV0_1 = new solanaWeb3.TransactionMessage({
            payerKey: walletPublicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: instructions,
        }).compileToV0Message();
        const tx1 = new solanaWeb3.VersionedTransaction(messageV0_1);

        // Sign and send Tx1
        const signedTx1 = await window.solana.signTransaction(tx1);
        const sig1 = await connection.sendRawTransaction(signedTx1.serialize(), { skipPreflight: true });
        console.log("Solana Tx1 (Create) Signature:", sig1);

        showNotification(t('creating_envelope'), 'info');
        const confirm1 = await connection.confirmTransaction({
            signature: sig1,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');

        if (confirm1.value.err) {
            throw new Error("Transaction 1 failed: " + JSON.stringify(confirm1.value.err));
        }

        // Debug: Check if envelope account exists and log data
        const envelopeAccountInfo = await connection.getAccountInfo(envelopePda, 'confirmed');
        if (!envelopeAccountInfo) {
            console.error("Envelope account not found after creation!");
        } else {
            console.log("Envelope account created. Data length:", envelopeAccountInfo.data.length);
            // Try to read ID from envelope account (offset 8)
            if (envelopeAccountInfo.data.length >= 16) {
                const idInAccount = envelopeAccountInfo.data.readBigUInt64LE(8);
                console.log("ID in Envelope Account:", idInAccount.toString());
            }
        }

        await handleSolanaTransactionReceipt(sig1, nextEnvelopeId.toString());
    } catch (error) {
        console.error("Solana envelope creation error:", error);
        throw error;
    }
}

async function handleTonTransactionResult1(txBoc, contractAddress) {
    const submitBtn = document.querySelector('.submit-btn');
    const chainConfig = CHAIN_CONFIG['ton'];

    showNotification(t('create_success'), 'success');
    console.log("TON Transaction BOC:", txBoc);

    // Try to get envelope ID by querying the contract's state
    let envelopeId = "Pending";

    try {
        const isTestnet = chainConfig.rpcUrl.includes('testnet');
        const apiBase = isTestnet
            ? 'https://testnet.toncenter.com/api/v2'
            : 'https://toncenter.com/api/v2';

        // Wait for the transaction to be processed
        await new Promise(r => setTimeout(r, 5000));

        // Try to get recent transactions to find the envelope ID from events
        const txResponse = await fetch(`${apiBase}/getTransactions?address=${contractAddress}&limit=5`);
        const txData = await txResponse.json();
        console.log("TON Recent Transactions:", txData);

        if (txData.ok && txData.result && txData.result.length > 0) {
            // Look for EventEnvelopeCreated in recent transactions
            for (const tx of txData.result) {
                if (tx.out_msgs && tx.out_msgs.length > 0) {
                    for (const outMsg of tx.out_msgs) {
                        // Try to parse the message body for envelope ID
                        if (outMsg.message) {
                            console.log("Out message:", outMsg.message);
                        }
                    }
                }
            }
        }

        // Alternative: Query contract state directly using getAccountState
        // The nextEnvelopeId is stored in contract data
        // For now, we'll show a pending message and let the backend handle it

    } catch (error) {
        console.warn("Failed to get envelope ID from contract:", error);
    }

    const resultMessage = document.getElementById('result-message');
    const envelopeIdSpan = document.getElementById('envelope-id');

    // Show transaction was successful, ID will be available from backend
    envelopeIdSpan.textContent = envelopeId === "Pending" ? t('pending_check_wallet') || "Pending (Check Wallet)" : envelopeId;
    resultMessage.style.display = 'block';
    resultMessage.scrollIntoView({ behavior: 'smooth' });

    submitBtn.innerHTML = t('btn_create');
    submitBtn.disabled = false;
}

async function handleSolanaTransactionReceipt(signature, envelopeId) {
    const submitBtn = document.querySelector('.submit-btn');
    showNotification(t('create_success'), 'success');
    console.log("Solana Envelope ID:", envelopeId);

    const resultMessage = document.getElementById('result-message');
    const envelopeIdSpan = document.getElementById('envelope-id');

    envelopeIdSpan.textContent = envelopeId;
    resultMessage.style.display = 'block';
    resultMessage.scrollIntoView({ behavior: 'smooth' });

    submitBtn.innerHTML = t('btn_create');
    submitBtn.disabled = false;
}

async function handleTransactionReceipt(tx) {
    const submitBtn = document.querySelector('.submit-btn');
    const receipt = await tx.wait();
    showNotification(t('create_success'), 'success');

    // Find and parse the EnvelopeCreated event
    const event = receipt.events?.find(e => e.event === 'EnvelopeCreated');
    if (event) {
        const envelopeId = event.args.envelopeId.toString();
        console.log('Created envelope with ID:', envelopeId);

        // Display the envelope ID on the page
        const resultMessage = document.getElementById('result-message');
        const envelopeIdSpan = document.getElementById('envelope-id');

        envelopeIdSpan.textContent = envelopeId;
        resultMessage.style.display = 'block';

        // Scroll to result
        resultMessage.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error('Could not find EnvelopeCreated event in transaction receipt');
    }

    // Reset button
    submitBtn.innerHTML = t('btn_create');
    submitBtn.disabled = false;
}

// Check wallet connection status on page load
async function checkWalletConnection() {
    // Handled by Web3Modal
}

// Handle accounts changed event
async function handleAccountsChanged(accounts) {
    // Handled by Web3Modal
}

// Handle chain changed event
function handleChainChanged(chainId) {
    // Handled by Web3Modal
}

// Connect to wallet function
async function connectToWallet() {
    const modal = document.getElementById('wallet-select-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Initialize wallet selection modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('wallet-select-modal');
    const closeBtn = document.getElementById('close-select-modal');
    const appKitBtn = document.getElementById('select-appkit');
    const tronBtn = document.getElementById('select-tron');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (appKitBtn) {
        appKitBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            import('./wallet_connector.js').then(module => {
                if (module.modal) {
                    module.modal.open();
                } else {
                    showNotification(t('web3modal_init_failed'), 'error');
                }
            });
        });
    }

    if (tronBtn) {
        tronBtn.addEventListener('click', async () => {
            modal.style.display = 'none';
            await connectToTron();
        });
    }

    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

async function connectToTron() {
    try {
        // Prioritize TronLink (injected wallet)
        if (window.tronWeb && window.tronWeb.ready) {
            console.log("TronLink detected and ready");
            const address = window.tronWeb.defaultAddress.base58;
            if (address) {
                await handleConnection(null, address, 'tron');
                return;
            }
        } else if (window.tronWeb) {
            console.log("TronLink detected but not ready, requesting accounts...");
            const res = await window.tronWeb.request({ method: 'tron_requestAccounts' });
            if (res.code === 200) {
                // Wait a moment for tronWeb to update
                setTimeout(async () => {
                    if (window.tronWeb.defaultAddress.base58) {
                        await handleConnection(null, window.tronWeb.defaultAddress.base58, 'tron');
                    }
                }, 500);
                return;
            }
        }

        // Fallback to WalletConnect
        console.log("TronLink not available or failed, falling back to WalletConnect");
        const address = await connectTronWallet();
        if (address) {
            await handleConnection(null, address, 'tron');
        }
    } catch (error) {
        console.error("Tron connection error:", error);
        showNotification(t('connect_tron_failed') + error.message, 'error');
    }
}

async function connectToTon() {
    try {
        // Use AppKit modal for TON connection
        await modal.open({ view: 'Connect' });
    } catch (error) {
        console.error("TON connection error:", error);
        showNotification("TON Connection Failed: " + error.message, 'error');
    }
}

async function handleTonCreateEnvelope(tokenAddress, amount, recipientCount, distributionType, hashedPassword, validityInSeconds) {
    const submitBtn = document.querySelector('.submit-btn');
    showNotification(t('creating_envelope'), 'info');

    try {
        // Determine if we're on testnet or mainnet based on chain_config
        const chainConfig = CHAIN_CONFIG['ton'];
        const isTestnet = chainConfig.rpcUrl.includes('testnet');
        const networkId = isTestnet ? '-3' : '-239'; // -3 for testnet, -239 for mainnet
        const contractAddress = chainConfig.contractAddress;

        console.log("TON Network Config - isTestnet:", isTestnet, "networkId:", networkId);

        // 先获取当前的nextEnvelopeId，用于后续确认创建的红包ID
        let expectedEnvelopeId = null;
        try {
            const TonWeb = window.TonWeb;
            const apiBase = isTestnet
                ? 'https://testnet.toncenter.com/api/v2'
                : 'https://toncenter.com/api/v2';
            
            // 调用合约的get方法获取nextEnvelopeId
            const response = await fetch(`${apiBase}/runGetMethod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: contractAddress,
                    method: 'nextEnvelopeId',
                    stack: []
                })
            });
            const data = await response.json();
            console.log("[TON] nextEnvelopeId response:", data);
            
            if (data.ok && data.result && data.result.stack && data.result.stack.length > 0) {
                // stack[0] 是返回值，格式可能是 ["num", "0x1"] 或类似
                const stackItem = data.result.stack[0];
                if (Array.isArray(stackItem) && stackItem.length >= 2) {
                    expectedEnvelopeId = parseInt(stackItem[1], 16).toString();
                } else if (typeof stackItem === 'string') {
                    expectedEnvelopeId = parseInt(stackItem, 16).toString();
                }
            }
            console.log("[TON] Expected envelope ID:", expectedEnvelopeId);
        } catch (e) {
            console.warn("[TON] Failed to get nextEnvelopeId:", e);
        }

        // 获取TON钱包provider
        let activeTonProvider = null;
        let useTonConnectUI = false;

        // 1. 优先检查 tonConnectUI 是否早已连接 (复用连接)
        if (tonConnectUI && tonConnectUI.connected) {
            console.log("Using imported tonConnectUI (already connected)");
            activeTonProvider = tonConnectUI;
            useTonConnectUI = true;
        } else if (window.tonConnectUI && window.tonConnectUI.connected) {
            console.log("Using global window.tonConnectUI (already connected)");
            activeTonProvider = window.tonConnectUI;
            useTonConnectUI = true;
        } else if (window.tonProvider) {
            console.log("Using global window.tonProvider (already connected)");
            activeTonProvider = window.tonProvider;
            // Check if it's a TonConnectUI instance or a raw provider
            if (activeTonProvider.sendTransaction) {
                // It has sendTransaction, so it's likely usable directly
            }
        }

        // 2. 如果 tonConnectUI 未连接，尝试使用 AppKit 的 provider (避免再次弹窗)
        if (!activeTonProvider) {
            try {
                const provider = modal.getWalletProvider('ton');
                console.log("Checking AppKit TON Provider:", provider);

                if (provider && typeof provider.sendTransaction === 'function') {
                    console.log("Using provider from modal.getWalletProvider('ton')");
                    activeTonProvider = provider;
                    // 注意：这里不设置 useTonConnectUI = true，因为这是 AppKit provider
                }
            } catch (e) {
                console.warn("Failed to get provider from modal:", e);
            }
        }

        // 3. 如果 AppKit provider 也不可用，或者发送失败后回退，才尝试连接 tonConnectUI (会弹窗)
        if (!activeTonProvider) {
            console.log("No active provider found, trying to connect via TonConnectUI...");
            if (tonConnectUI) {
                try {
                    await tonConnectUI.openModal();
                    // 等待连接
                    await new Promise((resolve, reject) => {
                        const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
                            if (wallet) {
                                unsubscribe();
                                resolve(wallet);
                            }
                        });
                        setTimeout(() => {
                            unsubscribe();
                            reject(new Error("Connection timeout"));
                        }, 60000);
                    });
                    console.log("tonConnectUI connected successfully");
                    activeTonProvider = tonConnectUI;
                    useTonConnectUI = true;
                } catch (connectError) {
                    console.warn("tonConnectUI connection failed:", connectError);
                    throw new Error("Wallet connection failed or cancelled");
                }
            }
        }

        // 最后尝试使用tonAdapter
        if (!activeTonProvider && tonAdapter) {
            console.log("tonAdapter:", tonAdapter);
            console.log("tonAdapter keys:", Object.keys(tonAdapter));

            // 检查tonAdapter是否有内部的tonConnectUI
            if (tonAdapter.tonConnectUI && typeof tonAdapter.tonConnectUI.sendTransaction === 'function') {
                console.log("Using tonAdapter.tonConnectUI");
                activeTonProvider = tonAdapter.tonConnectUI;
                useTonConnectUI = true;
            } else if (typeof tonAdapter.sendTransaction === 'function') {
                // 直接使用tonAdapter.sendTransaction
                console.log("Using tonAdapter.sendTransaction directly");
                console.log("tonAdapter.availableConnectors:", tonAdapter.availableConnectors);
                console.log("tonAdapter.availableConnections:", tonAdapter.availableConnections);

                // 检查providerHandlers
                if (tonAdapter.providerHandlers) {
                    console.log("tonAdapter.providerHandlers:", tonAdapter.providerHandlers);
                    console.log("providerHandlers keys:", Object.keys(tonAdapter.providerHandlers));

                    // 尝试从providerHandlers获取实际的provider
                    for (const [key, handler] of Object.entries(tonAdapter.providerHandlers)) {
                        console.log(`providerHandler[${key}]:`, handler);
                        if (handler && typeof handler.sendTransaction === 'function') {
                            console.log(`Found sendTransaction in providerHandler[${key}]`);
                            activeTonProvider = handler;
                            break;
                        }
                    }
                }

                // 如果从providerHandlers没找到，使用tonAdapter本身
                if (!activeTonProvider) {
                    const originalSendTransaction = tonAdapter.sendTransaction.bind(tonAdapter);
                    activeTonProvider = {
                        sendTransaction: async (transaction) => {
                            console.log("Calling tonAdapter.sendTransaction with:", transaction);
                            const result = await originalSendTransaction(transaction);
                            console.log("tonAdapter.sendTransaction result:", result);
                            return result;
                        }
                    };
                }
            }
        }

        if (!activeTonProvider) {
            throw new Error("无法获取TON钱包Provider。请确保已安装TON钱包扩展或使用支持TON的钱包连接。");
        }

        console.log("Final activeTonProvider:", activeTonProvider);
        console.log("useTonConnectUI:", useTonConnectUI);

        const TonWeb = window.TonWeb;
        if (!TonWeb) {
            throw new Error("TonWeb library not found. Please make sure the library is loaded.");
        }

        // Helper for CRC32
        const crc32 = (str) => {
            let crc = -1;
            for (let i = 0; i < str.length; i++) {
                let c = str.charCodeAt(i);
                for (let j = 0; j < 8; j++) {
                    if ((crc ^ c) & 1) {
                        crc = (crc >>> 1) ^ 0xEDB88320;
                    } else {
                        crc = (crc >>> 1);
                    }
                    c = c >>> 1;
                }
            }
            return (crc ^ -1) >>> 0;
        };

        if (tokenAddress === 'TON' || !tokenAddress) {
            // Native TON
            // Opcode: CreateEnvelope - from Tact compilation report (ton/dist/tact_ZEnvelope.md)
            // TL-B: create_envelope#c4d90d4c passwordHash:^string validity:uint32 numberOfRecipients:uint32 distributionType:uint8
            const opcode = 0xc4d90d4c;

            // DEBUG: Log serialization details
            console.log("[DEBUG] TON Message Serialization:");
            console.log("  Opcode:", "0x" + opcode.toString(16));
            console.log("  passwordHash length:", hashedPassword.length);
            console.log("  validity:", validityInSeconds);
            console.log("  recipientCount:", recipientCount);
            console.log("  distributionType:", distributionType);

            // Build message cell
            // Tact message structure: opcode(32) + fields in definition order
            // Field order: passwordHash(String) + validity(32) + numberOfRecipients(32) + distributionType(8)

            const cell = new TonWeb.boc.Cell();
            cell.bits.writeUint(opcode, 32);

            // For Tact, String is serialized as a Cell reference using snake format
            // This handles strings that exceed cell capacity
            const passwordCell = new TonWeb.boc.Cell();
            writeStringSnake(passwordCell, hashedPassword);
            cell.refs.push(passwordCell);

            // Write remaining primitive fields after the String reference
            cell.bits.writeUint(validityInSeconds, 32);      // validity: Int as uint32
            cell.bits.writeUint(recipientCount, 32);         // numberOfRecipients: Int as uint32
            cell.bits.writeUint(parseInt(distributionType), 8); // distributionType: Int as uint8

            console.log("  Main cell bits used:", cell.bits.cursor);
            console.log("  Password cell refs:", passwordCell.refs.length);

            const amountNano = TonWeb.utils.toNano(amount.toString());
            // Add service fee + gas (0.1 TON)
            const totalToSend = amountNano.add(TonWeb.utils.toNano('0.1'));

            // 准备交易
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min
                messages: [
                    {
                        address: contractAddress,
                        amount: totalToSend.toString(),
                        payload: TonWeb.utils.bytesToBase64(await cell.toBoc())
                    }
                ]
            };

            // 总是添加network参数，以防万一
            transaction.network = networkId;

            console.log("Preparing TON Transaction:", JSON.stringify(transaction, null, 2));

            // 发送交易
            try {
                const result = await activeTonProvider.sendTransaction(transaction);
                console.log("TON Transaction Result:", result);

                if (!result) {
                    throw new Error("Transaction failed or cancelled (empty result)");
                }

                // 检查是否有hash或boc
                if ((!result.hash && !result.boc) || result.hash === "") {
                    console.warn("Transaction result has empty hash/boc, but no error thrown. This might be a simulation or wallet issue.");
                    // 有些钱包可能不返回hash，但交易已发送。或者用户取消了但没有抛出错误。
                    // 我们尝试检查boc
                    if (result.boc) {
                        console.log("Found BOC, proceeding...");
                    } else {
                        // 如果连BOC都没有，那可能真的失败了
                        throw new Error("Transaction result missing hash and boc");
                    }
                }

                // 处理交易结果，解析事件获取envelopeId
                await handleTonTransactionResult(result, contractAddress);
                return;
            } catch (error) {
                console.error("TON sendTransaction error:", error);
                throw error;
            }
        } else {
            // Jetton token logic
            const tonWeb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', { apiKey: 'f6f28cb833c5e439c9c0b6c80f97c7c0a5e5a5e5a5e5a5e5a5e5a5e5a5e5a5e5' }));

            const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonWeb.provider, {
                address: tokenAddress
            });
            const userAddress = currentAccount; // Address string
            const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(userAddress));
            const jettonWallet = jettonWalletAddress.toString(true, true, true);

            // Payload for notification
            const payloadCell = new TonWeb.boc.Cell();
            payloadCell.bits.writeUint(validityInSeconds, 32);
            payloadCell.bits.writeUint(recipientCount, 32);
            payloadCell.bits.writeUint(parseInt(distributionType), 8);
            writeStringSnake(payloadCell, hashedPassword);

            const forwardPayload = payloadCell;

            // Jetton Transfer Body
            const bodyCell = new TonWeb.boc.Cell();
            bodyCell.bits.writeUint(0xf8a7ea5, 32); // Opcode TokenTransfer
            bodyCell.bits.writeUint(0, 64); // queryId
            bodyCell.bits.writeCoins(TonWeb.utils.toNano(amount.toString())); // amount (assuming 9 decimals for now, ideally fetch decimals)
            bodyCell.bits.writeAddress(new TonWeb.utils.Address(contractAddress)); // destination
            bodyCell.bits.writeAddress(new TonWeb.utils.Address(userAddress)); // responseDestination
            bodyCell.bits.writeBit(false); // customPayload null
            bodyCell.bits.writeCoins(TonWeb.utils.toNano('0.1')); // forwardTonAmount
            bodyCell.bits.writeBit(true); // forwardPayload as reference
            bodyCell.refs.push(forwardPayload);

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: jettonWallet,
                        amount: TonWeb.utils.toNano('0.15').toString(), // Gas
                        payload: TonWeb.utils.bytesToBase64(await bodyCell.toBoc())
                    }
                ]
            };

            // 如果是使用AppKit的provider，可能需要添加network参数
            if (tonAdapter === activeTonProvider) {
                transaction.network = networkId;
            }

            console.log("Sending TON Transaction (Jetton):", JSON.stringify(transaction, null, 2));

            try {
                const result = await activeTonProvider.sendTransaction(transaction);
                console.log("TON Jetton Transaction Result:", result);

                if (!result || (result.hash === '' && !result.boc)) {
                    throw new Error("Transaction failed or cancelled (empty hash)");
                }

                await handleTonTransactionResult(result, contractAddress);
            } catch (error) {
                console.error("TON Jetton transaction error:", error);
                throw error;
            }
        }

    } catch (error) {
        console.error("TON Create Error:", error);
        showNotification(`${t('create_failed')} ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = t('btn_create');
        submitBtn.disabled = false;
    }
}

// Handle TON transaction result - parse EventEnvelopeCreated event to get envelopeId
async function handleTonTransactionResult(result, contractAddress) {
    const submitBtn = document.querySelector('.submit-btn');
    console.log("[TON] Processing transaction result...");

    // EventEnvelopeCreated message structure from Tact:
    // message EventEnvelopeCreated {
    //     envelopeId: Int as uint256;
    //     creator: Address;
    //     tokenAddress: Address?;
    //     expiresAt: Int as uint32;
    //     numberOfRecipients: Int as uint32;
    //     distributionType: Int as uint8;
    // }

    try {
        showNotification(t('tx_sent_waiting') || 'Transaction sent, waiting for confirmation...', 'info');

        const chainConfig = CHAIN_CONFIG['ton'];
        const isTestnet = chainConfig.rpcUrl.includes('testnet');
        const apiBase = isTestnet
            ? 'https://testnet.toncenter.com/api/v2'
            : 'https://toncenter.com/api/v2';

        const TonWeb = window.TonWeb;
        
        // 等待交易确认并查询事件
        let envelopeId = null;
        let attempts = 0;
        const maxAttempts = 20; // 最多等待40秒

        while (attempts < maxAttempts && envelopeId === null) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                // 查询合约的最近交易
                const txResponse = await fetch(`${apiBase}/getTransactions?address=${contractAddress}&limit=10`);
                const txData = await txResponse.json();
                console.log(`[TON] Attempt ${attempts}: Fetched ${txData.result?.length || 0} transactions`);

                if (txData.ok && txData.result && txData.result.length > 0) {
                    // 遍历最近的交易，查找EventEnvelopeCreated事件
                    for (const tx of txData.result) {
                        // 检查out_msgs中的外部消息（事件通过emit发送为外部消息）
                        if (tx.out_msgs && tx.out_msgs.length > 0) {
                            for (const outMsg of tx.out_msgs) {
                                // 检查是否是外部消息（事件）
                                // 外部消息的destination通常为空或特殊地址
                                if (outMsg.destination === '' || !outMsg.destination) {
                                    // 尝试解析消息体
                                    if (outMsg.msg_data && outMsg.msg_data.body) {
                                        try {
                                            const bodyBase64 = outMsg.msg_data.body;
                                            const bodyBytes = TonWeb.utils.base64ToBytes(bodyBase64);
                                            const bodyCell = TonWeb.boc.Cell.oneFromBoc(bodyBytes);
                                            const slice = bodyCell.beginParse();
                                            
                                            // 读取opcode (32 bits)
                                            // EventEnvelopeCreated的opcode需要从Tact编译结果获取
                                            // 通常是消息名称的CRC32
                                            const opcode = slice.loadUint(32).toNumber();
                                            console.log("[TON] Found external message with opcode:", "0x" + opcode.toString(16));
                                            
                                            // EventEnvelopeCreated opcode: 计算 "EventEnvelopeCreated" 的 CRC32
                                            // 或者从编译报告中获取
                                            // 尝试解析envelopeId (uint256)
                                            const parsedEnvelopeId = slice.loadUint(256);
                                            console.log("[TON] Parsed envelopeId:", parsedEnvelopeId.toString());
                                            
                                            // 验证这是一个有效的envelopeId（大于0的整数）
                                            if (parsedEnvelopeId.gt(new TonWeb.utils.BN(0))) {
                                                envelopeId = parsedEnvelopeId.toString();
                                                console.log("[TON] Found EventEnvelopeCreated, envelopeId:", envelopeId);
                                                break;
                                            }
                                        } catch (parseErr) {
                                            console.log("[TON] Failed to parse message:", parseErr.message);
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                        if (envelopeId) break;
                    }
                }
            } catch (pollErr) {
                console.warn(`[TON] Polling attempt ${attempts} failed:`, pollErr);
            }
        }

        if (envelopeId) {
            // 成功获取envelopeId，使用与EVM/Solana一致的显示方式
            console.log("[TON] Red packet created successfully! Envelope ID:", envelopeId);
            showNotification(t('create_success'), 'success');

            const resultMessage = document.getElementById('result-message');
            const envelopeIdSpan = document.getElementById('envelope-id');

            envelopeIdSpan.textContent = envelopeId;
            resultMessage.style.display = 'block';
            resultMessage.scrollIntoView({ behavior: 'smooth' });
        } else {
            // 交易已发送但无法解析事件
            console.log("[TON] Transaction sent but couldn't parse EventEnvelopeCreated event.");
            showNotification(t('create_success_no_id') || 'Red packet created! Check transaction for details.', 'success');
            
            const resultMessage = document.getElementById('result-message');
            const envelopeIdSpan = document.getElementById('envelope-id');
            envelopeIdSpan.textContent = t('pending_check_wallet') || "Pending (Check Wallet)";
            resultMessage.style.display = 'block';
            resultMessage.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        console.error("[TON] Error processing transaction result:", error);
        showNotification(t('create_success_parse_error') || 'Transaction sent! Error parsing result.', 'warning');
    } finally {
        submitBtn.innerHTML = t('btn_create');
        submitBtn.disabled = false;
    }
}

// Show success modal with envelope ID
function showEnvelopeSuccessModal(envelopeId, chainType) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'envelope-success-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'envelope-success-modal';
    modal.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Chain icon and name
    const chainInfo = {
        'ton': { name: 'TON', color: '#0098EA', icon: '💎' },
        'evm': { name: 'EVM', color: '#627EEA', icon: '⟠' },
        'tron': { name: 'TRON', color: '#FF0013', icon: '🔴' },
        'solana': { name: 'Solana', color: '#9945FF', icon: '◎' }
    };
    const chain = chainInfo[chainType] || chainInfo['evm'];

    modal.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 20px;">🧧</div>
        <h2 style="color: #fff; margin-bottom: 10px; font-size: 24px;">${t('envelope_created_success') || 'Red Packet Created!'}</h2>
        <p style="color: #aaa; margin-bottom: 30px;">${chain.icon} ${chain.name}</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <p style="color: #888; font-size: 14px; margin-bottom: 10px;">${t('envelope_id') || 'Envelope ID'}</p>
            <p style="color: ${chain.color}; font-size: 18px; font-weight: bold; word-break: break-all;" id="envelope-id-display">${envelopeId}</p>
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="copy-envelope-id-btn" style="
                background: linear-gradient(135deg, ${chain.color} 0%, ${chain.color}aa 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
            ">${t('copy_id') || 'Copy ID'}</button>
            <button id="close-success-modal-btn" style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
            ">${t('close') || 'Close'}</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('copy-envelope-id-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(envelopeId).then(() => {
            showNotification(t('copied_to_clipboard') || 'Copied to clipboard!', 'success');
        });
    });

    document.getElementById('close-success-modal-btn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Function to fetch and update user's assets in the dropdown
async function updateUserAssets() {
    const tokenSelect = document.getElementById('token-address');
    const provider = window.ethersProvider;
    const signer = window.ethersSigner;

    if (!provider || !signer || typeof ethers === 'undefined') {
        console.log("Ethers provider not initialized or Ethers.js not loaded. Cannot fetch assets.");
        tokenSelect.innerHTML = `<option value="" disabled selected>${t('option_connect_first')}</option>`;
        return;
    }

    const userAddress = await signer.getAddress();
    tokenSelect.innerHTML = `<option value="" disabled selected>${t('loading_assets')}</option>`;
    let assetsFound = 0;

    try {
        // 1. Add Native Option
        const chainConfig = CHAIN_CONFIG[currentChainId];
        const currencySymbol = chainConfig ? chainConfig.currency : 'ETH';
        const ethBalance = await provider.getBalance(userAddress);
        if (ethBalance.gt(0)) {
            addOption(tokenSelect, "ETH", `${currencySymbol} (${ethers.utils.formatEther(ethBalance).substring(0, 8)})`);
            assetsFound++;
        }

        // 2. Check common tokens
        for (const token of COMMON_TOKENS) {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
            try {
                const balance = await tokenContract.balanceOf(userAddress);
                if (balance.gt(0)) {
                    addOption(tokenSelect, token.address, `${token.symbol} (${ethers.utils.formatUnits(balance, token.decimals).substring(0, 8)})`);
                    assetsFound++;
                }
            } catch (error) {
                console.error(`无法获取 ${token.symbol} 的余额:`, error);
            }
        }
    } catch (error) {
        console.error("检查代币余额时出错:", error);
    }

    if (assetsFound > 0) {
        // If assets found, select the first one by default (or keep "Select" placeholder)
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.setAttribute('data-i18n', 'select_token');
        placeholder.textContent = t('select_token');
        tokenSelect.insertBefore(placeholder, tokenSelect.firstChild);
    }
    // If no assets found, we wait for the scan to finish.
    // The "Loading assets..." option is already there.
}

// Helper function to add options to a select element
function addOption(selectElement, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    selectElement.appendChild(option);
}

function writeStringSnake(cell, str) {
    const CELL_LIMIT = 1023;
    let currentCell = cell;
    let strOffset = 0;

    while (strOffset < str.length) {
        // Calculate available bits
        // cell.bits.cursor is the current bit position in TonWeb
        const cursor = currentCell.bits.cursor;
        const availableBits = CELL_LIMIT - cursor;
        const availableBytes = Math.floor(availableBits / 8);

        if (availableBytes <= 0) {
            // Current cell is full (or almost full), create a new one
            const nextCell = new TonWeb.boc.Cell();
            currentCell.refs.push(nextCell);
            currentCell = nextCell;
            continue;
        }

        const bytesToWrite = Math.min(availableBytes, str.length - strOffset);
        const chunk = str.substr(strOffset, bytesToWrite);
        currentCell.bits.writeString(chunk);
        strOffset += bytesToWrite;
    }
}

const zEnvelopeABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_verifier",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "ECDSAInvalidSignature",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "length",
                "type": "uint256"
            }
        ],
        "name": "ECDSAInvalidSignatureLength",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "ECDSAInvalidSignatureS",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "claimer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "EnvelopeClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "expiresAt",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "numberOfRecipients",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "distributionType",
                "type": "uint8"
            }
        ],
        "name": "EnvelopeCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            }
        ],
        "name": "EnvelopeFullyClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "recoverer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "EnvelopeRecovered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "oldValidity",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newValidity",
                "type": "uint256"
            }
        ],
        "name": "EnvelopeValidityUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "requestHash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            }
        ],
        "name": "PasswordVerificationFailed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "claimer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "envelopeId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "passwordHash",
                "type": "bytes"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "encryptedPassword",
                "type": "bytes"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "requestHash",
                "type": "bytes32"
            }
        ],
        "name": "PasswordVerificationWithClaimRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "oldRate",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newRate",
                "type": "uint256"
            }
        ],
        "name": "ServiceFeeRateUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "oldFee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newFee",
                "type": "uint256"
            }
        ],
        "name": "ServiceFeeUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "ServiceFeeWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "oldVerifier",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newVerifier",
                "type": "address"
            }
        ],
        "name": "VerifierUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_envelopeId",
                "type": "uint256"
            }
        ],
        "name": "autoReturnExpiredEnvelope",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_envelopeId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_encryptedPassword",
                "type": "bytes"
            }
        ],
        "name": "claimEnvelopeWithPassword",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "envelopeId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "requestHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct zEnvelope.Claim",
                "name": "_claim",
                "type": "tuple"
            },
            {
                "internalType": "bytes",
                "name": "_signature",
                "type": "bytes"
            }
        ],
        "name": "confirmClaimWithPassword",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_passwordHash",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "_validity",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_numberOfRecipients",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_distributionType",
                "type": "uint8"
            }
        ],
        "name": "createERC20Envelope",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "_passwordHash",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "_validity",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_numberOfRecipients",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_distributionType",
                "type": "uint8"
            }
        ],
        "name": "createEnvelope",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "envelopeValidity",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "envelopes",
        "outputs": [
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "passwordHash",
                "type": "bytes"
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "remainingAmount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "claimed",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "createdAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expiresAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "numberOfRecipients",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "claimedRecipientsCount",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "distributionType",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "erc20ServiceFeeRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_requestHash",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "_envelopeId",
                "type": "uint256"
            }
        ],
        "name": "failClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_envelopeId",
                "type": "uint256"
            }
        ],
        "name": "getEnvelopeInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "passwordHash",
                        "type": "bytes"
                    },
                    {
                        "internalType": "address",
                        "name": "tokenAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "remainingAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "claimed",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "createdAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expiresAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "numberOfRecipients",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "claimedRecipientsCount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "distributionType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct zEnvelope.Envelope",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "hasClaimed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextEnvelopeId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "pendingClaims",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_envelopeId",
                "type": "uint256"
            }
        ],
        "name": "recoverUnclaimedEnvelope",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "serviceFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_rate",
                "type": "uint256"
            }
        ],
        "name": "setERC20ServiceFeeRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_serviceFee",
                "type": "uint256"
            }
        ],
        "name": "setServiceFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_newValidity",
                "type": "uint256"
            }
        ],
        "name": "updateEnvelopeValidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_newVerifier",
                "type": "address"
            }
        ],
        "name": "updateVerifier",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "verifier",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawServiceFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Simple notification function
function showNotification(message, type) {
    // For now, use alert as fallback, or console
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
        alert(`${message}`);
    } else {
        // Optional: Implement a better UI notification
        // For success/info, maybe just log or use a toast if available
        // But to match user expectation of "showing" something:
        // alert(`${type.toUpperCase()}: ${message}`); 
        // Let's stick to alert for error, and maybe console for others to avoid spam, 
        // unless it's a critical success message.
        if (type === 'success') alert(message);
    }
}

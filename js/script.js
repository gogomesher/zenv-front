
import { modal } from './wallet_connector.js';
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
        } else if (typeof chainId === 'string' && (chainId.startsWith('ton') || chainId === '-239')) {
            configChainId = 'ton';
            provider = modal.getProvider('ton');
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
        window.tonProvider = provider;
        await updateTonAssets();
    } else if (chainConfig.type === 'tron') {
        console.log("Connected to Tron");
        // window.tronProvider = provider; 
        await updateTronAssets();
    }

    showNotification(t('connected_to', { name: chainConfig.name }), 'success');
}

async function updateTronAssets() {
    console.log("Starting updateTronAssets...");
    const tokenSelect = document.getElementById('token-address');

    if (!currentAccount) {
        console.warn("Missing account for Tron asset update");
        return;
    }

    tokenSelect.innerHTML = `<option value="" disabled selected>${t('loading_assets')}</option>`;

    const chainConfig = CHAIN_CONFIG['tron'];

    try {
        // 1. Fetch Account Info (TRX + TRC20 balances)
        // Using TronGrid API
        const apiUrl = `${chainConfig.rpcUrl}/v1/accounts/${currentAccount}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {
            // If account not found on chain (new account), it might return success:false or just empty data
            console.warn("Tron account info fetch failed or account inactive:", data);
            tokenSelect.innerHTML = `<option value="" disabled selected>${t('insufficient_balance_trx')}</option>`;
            return;
        }

        const account = data.data[0]; // data.data is an array

        tokenSelect.innerHTML = ''; // Clear loading
        let assetsFound = 0;

        // TRX Balance
        if (account && account.balance) {
            const trxBalance = account.balance / 1000000; // 6 decimals
            if (trxBalance > 0) {
                addOption(tokenSelect, "TRX", `TRX (${trxBalance.toFixed(4)})`);
                assetsFound++;
            }
        }

        // TRC20 Tokens
        // account.trc20 is an array of objects: [{"TR7...": "1000"}, ...]
        if (account && account.trc20 && account.trc20.length > 0) {
            for (const tokenObj of account.trc20) {
                const contractAddress = Object.keys(tokenObj)[0];
                const balanceRaw = tokenObj[contractAddress];

                if (Number(balanceRaw) > 0) {
                    let symbol = "Unknown";
                    let decimals = 18; // Default
                    let formattedBalance = balanceRaw;

                    // Optimization: Check known tokens
                    if (contractAddress === "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t") { // USDT
                        symbol = "USDT";
                        decimals = 6;
                    } else if (contractAddress === "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8") { // USDC
                        symbol = "USDC";
                        decimals = 6;
                    } else {
                        // Try to fetch metadata if possible
                        if (window.tronWeb && window.tronWeb.ready) {
                            try {
                                const contract = await window.tronWeb.contract().at(contractAddress);
                                symbol = await contract.symbol().call();
                                decimals = await contract.decimals().call();
                            } catch (e) {
                                console.warn("Failed to fetch token info for", contractAddress, e);
                                symbol = contractAddress.substring(0, 6) + "...";
                            }
                        } else {
                             symbol = contractAddress.substring(0, 6) + "...";
                        }
                    }

                    // Format balance
                    if (decimals === 6) {
                        formattedBalance = (Number(balanceRaw) / 1000000).toFixed(4);
                    } else if (decimals === 18) {
                        formattedBalance = (Number(balanceRaw) / 1e18).toFixed(4);
                    } else {
                        formattedBalance = (Number(balanceRaw) / Math.pow(10, decimals)).toFixed(4);
                    }

                    addOption(tokenSelect, contractAddress, `${symbol} (${formattedBalance})`);
                    assetsFound++;
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
        // Fetch SOL Balance
        const response = await fetch(chainConfig.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [currentAccount]
            })
        });

        const data = await response.json();
        console.log("Solana RPC Response:", data);

        if (data.result && data.result.value !== undefined) {
            const lamports = data.result.value;
            const solBalance = lamports / 1000000000; // 1 SOL = 10^9 lamports
            console.log("SOL Balance:", solBalance);

            tokenSelect.innerHTML = ''; // Clear loading

            if (solBalance > 0) {
                addOption(tokenSelect, "SOL", `SOL (${solBalance.toFixed(4)})`);

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
        } else {
            console.error("Invalid RPC response structure:", data);
            throw new Error("Invalid RPC response");
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
    const response = await fetch('js/sha256.wasm');
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

                // zEnvelopeAddress is already set in handleProviderChange
                const zEnvelopeContract = new ethers.Contract(zEnvelopeAddress, zEnvelopeABI, window.ethersSigner);

                // Get password hash from wasm
                const pkbResponse = await fetch('js/pkb');
                const pkbBuffer = await pkbResponse.arrayBuffer();
                const pkbContent = new Uint8Array(pkbBuffer);
                const hashedPassword = "0x" + goSha256(password, pkbContent);

                const validityInSeconds = validity ? validity * 3600 : 86400; // Convert hours to seconds, default to 24 hours

                if (tokenAddress && tokenAddress !== 'ETH') {
                    // ERC20 Logic
                    const erc20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, window.ethersSigner);
                    const decimals = await erc20Contract.decimals();
                    const amountWei = ethers.utils.parseUnits(amount, decimals);

                    // Check allowance
                    const allowance = await erc20Contract.allowance(currentAccount, zEnvelopeAddress);

                    if (allowance.lt(amountWei)) {
                        // Step 1: Approve
                        showNotification(t('approval_required'), 'info');
                        const approveTx = await erc20Contract.approve(zEnvelopeAddress, amountWei); // Approve exact amount

                        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('approving')}`;
                        await approveTx.wait();

                        showNotification(t('approval_success'), 'info');
                        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('creating')}`;
                        // Continue to Step 2 automatically
                    }

                    // Step 2: Create ERC20 envelope (Allowance is sufficient)
                    showNotification(t('creating_envelope'), 'info');

                    // Fetch service fee
                    const serviceFee = await zEnvelopeContract.serviceFee();
                    console.log("Service fee:", serviceFee.toString());

                    const tx = await zEnvelopeContract.createERC20Envelope(
                        tokenAddress,
                        amountWei,
                        hashedPassword,
                        validityInSeconds,
                        recipientCount,
                        distributionType,
                        { value: serviceFee }
                    );
                    await handleTransactionReceipt(tx);

                } else {
                    // Native Token Logic (ETH, BNB, MATIC, etc.)
                    const amountWei = ethers.utils.parseEther(amount);
                    showNotification(t('creating_envelope'), 'info');

                    // Fetch service fee
                    const serviceFee = await zEnvelopeContract.serviceFee();
                    console.log("Service fee:", serviceFee.toString());

                    // Calculate total value (amount + serviceFee)
                    const totalValue = amountWei.add(serviceFee);

                    const tx = await zEnvelopeContract.createEnvelope(
                        hashedPassword,
                        validityInSeconds,
                        recipientCount,
                        distributionType,
                        { value: totalValue }
                    );
                    await handleTransactionReceipt(tx);
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

import { modal, tonAdapter, tonConnectUI } from './wallet_connector.js';
import { connectTronWallet } from './tron_connector.js';
import { CHAIN_CONFIG, SUPPORTED_EVM_CHAINS } from './chain_config.js';
import { t } from './i18n.js';
import * as solanaWeb3 from '@solana/web3.js';

let currentAccount = null;
let ethersProvider;
let ethersSigner;
let currentChainId = null;
let zEnvelopeAddress = null;

// Subscribe to state changes
modal.subscribeState(async state => {
    console.log("AppKit State:", state);

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

    // If chainId is missing, try to get it from network state
    if (chainId === undefined) {
        try {
            // AppKit doesn't have a direct getNetwork() that returns simple ID in all versions,
            // but let's try to see if we can infer it or if it comes in a later update.
            // For now, we rely on state.selectedNetworkId. 
            // If it's still undefined, we might be in a disconnected state or loading.
        } catch (e) {
            console.warn("Failed to get network info:", e);
        }
    }

    if (isConnected && address) {
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
            }
        } else {
            configChainId = Number(chainId);
        }

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

        await handleConnection(provider, address, configChainId);
    } else {
        handleDisconnect();
    }
});

async function handleConnection(provider, address, chainId) {
    currentChainId = chainId;
    currentAccount = address;
    console.log('Connected account:', currentAccount);

    const verifyBtn = document.querySelector('.verify-btn');
    if (verifyBtn) {
        verifyBtn.textContent = currentAccount.substring(0, 6) + '...' + currentAccount.substring(currentAccount.length - 4);
        verifyBtn.removeAttribute('data-i18n'); // Prevent i18n from overwriting address
    }

    const chainConfig = CHAIN_CONFIG[currentChainId];
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

    // Update network display
    if (networkDisplay) {
        networkDisplay.textContent = chainConfig.name;
        networkDisplay.style.display = 'inline-block';
    }

    zEnvelopeAddress = chainConfig.contractAddress;
    console.log(`Connected to ${chainConfig.name} (${currentChainId}). Contract: ${zEnvelopeAddress}`);

    if (!zEnvelopeAddress) {
        showNotification(t('contract_not_deployed', { name: chainConfig.name }), 'warning');
    }

    if (chainConfig.type === 'evm') {
        if (typeof ethers !== 'undefined' && provider) {
            ethersProvider = new ethers.providers.Web3Provider(provider, "any");
            ethersSigner = ethersProvider.getSigner();

            if (provider.on) {
                provider.on("chainChanged", (newChainId) => {
                    window.location.reload();
                });
            }
        }
    } else if (chainConfig.type === 'solana') {
        console.log("Connected to Solana");
        window.solanaProvider = provider;
    } else if (chainConfig.type === 'ton') {
        console.log("Connected to TON");
        window.tonProvider = provider;
    }

    showNotification(t('connected_to', { name: chainConfig.name }), 'success');
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

    // Check for envelopeId in URL (support both query params and hash params, case-insensitive)
    function getEnvelopeIdFromUrl() {
        // 1. Check query string (search)
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('envelopeId')) return searchParams.get('envelopeId');
        if (searchParams.get('envelopeid')) return searchParams.get('envelopeid');

        // 2. Check hash (e.g. #envelopeId=123 or #/receive?envelopeId=123)
        if (window.location.hash) {
            // Handle hash like #envelopeId=123
            const hash = window.location.hash.substring(1); // Remove #
            const hashParams = new URLSearchParams(hash);
            if (hashParams.get('envelopeId')) return hashParams.get('envelopeId');
            if (hashParams.get('envelopeid')) return hashParams.get('envelopeid');

            // Handle hash like #/receive?envelopeId=123
            if (hash.includes('?')) {
                const hashQuery = hash.split('?')[1];
                const hashQueryParams = new URLSearchParams(hashQuery);
                if (hashQueryParams.get('envelopeId')) return hashQueryParams.get('envelopeId');
                if (hashQueryParams.get('envelopeid')) return hashQueryParams.get('envelopeid');
            }
        }
        return null;
    }
    const envelopeIdFromUrl = getEnvelopeIdFromUrl();
    if (envelopeIdFromUrl) {
        document.getElementById('envelope-id').value = envelopeIdFromUrl;
    }

    // Wallet connection button
    const verifyBtn = document.querySelector('.verify-btn');
    verifyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        connectToWallet();
    });

    // Form submission handling
    const form = document.getElementById('receive-form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Get form values
        const envelopeId = document.getElementById('envelope-id').value;
        const password = document.getElementById('password').value;
        const pkbResponse = await fetch('js/pkb');
        if (!pkbResponse.ok) {
            throw new Error(`Failed to fetch pkb: ${pkbResponse.statusText}`);
        }
        const pkbBuffer = await pkbResponse.arrayBuffer();
        const pkbContent = new Uint8Array(pkbBuffer);
        console.log("pkbContent length:", pkbContent.length);

        const hashedPassword = "0x" + goSha256(password, pkbContent);
        console.log("Hashed Password (Hex):", hashedPassword);

        // Validate form
        if (!envelopeId) {
            showNotification(t('enter_envelope_id'), 'error');
            return;
        }

        if (!currentAccount) {
            showNotification(t('wallet_not_connected'), 'error');
            return;
        }

        if (!zEnvelopeAddress) {
            showNotification(t('network_not_supported'), 'error');
            return;
        }

        // Reset error info
        document.getElementById('error-info').style.display = 'none';
        document.getElementById('asset-info').style.display = 'none';

        // Show loading state on button
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('claiming')}`;
        submitBtn.disabled = true;

        try {
            const chainConfig = CHAIN_CONFIG[currentChainId];
            if (chainConfig.type === 'evm') {
                await handleEvmClaim(envelopeId, hashedPassword, zEnvelopeAddress);
            } else if (chainConfig.type === 'solana') {
                await handleSolanaClaim(envelopeId, hashedPassword, zEnvelopeAddress);
            } else if (chainConfig.type === 'ton') {
                await handleTonClaim(envelopeId, hashedPassword, zEnvelopeAddress);
            } else {
                throw new Error(t('network_not_supported'));
            }
        } catch (error) {
            console.error('领取红包失败:', error);
            if (error.getLogs) {
                try {
                    const logs = await error.getLogs();
                    console.log("Transaction Logs:", logs);
                } catch (e) {
                    console.log("Could not get logs:", e);
                }
            }

            showNotification(`${t('claim_failed')} ${error.message}`, 'error');
        } finally {
            // 重置按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

async function handleEvmClaim(envelopeId, hashedPassword, zEnvelopeAddress) {
    const zEnvelopeContract = new ethers.Contract(zEnvelopeAddress, zEnvelopeABI, ethersSigner);

    // 1. 检查红包ID是否有效
    showNotification(t('verifying_id'), 'info');
    const nextId = await zEnvelopeContract.nextEnvelopeId();
    if (parseInt(envelopeId) <= 0 || parseInt(envelopeId) >= nextId) {
        showNotification(t('invalid_id'), 'error');
        return;
    }

    // 3. 发送领取请求交易
    // Get current block number to filter events later
    const startBlock = await ethersProvider.getBlockNumber();
    console.log("Starting claim at block:", startBlock);

    const tx = await zEnvelopeContract.claimEnvelopeWithPassword(
        envelopeId,
        hashedPassword // 用户输入的加密后口令
    );
    showNotification(t('claim_request_submitted'), 'info');
    await tx.wait(); // 等待请求被打包

    showNotification(t('tx_confirmed_waiting'), 'info');

    // 2. 等待最终的领取成功事件或超时 (改为轮询机制)
    let receivedAmount;
    const maxAttempts = 40; // 40 * 3s = 120s timeout
    let attempts = 0;

    await new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
            attempts++;
            try {
                console.log(`Polling attempt ${attempts}/${maxAttempts}...`);

                // Try to filter events by envelopeId (indexed param 1)
                // This is often more reliable than filtering by address if RPCs have issues with address encoding
                // Convert envelopeId to hex string for the filter topic (Ethers v5 requirement for some providers)
                const envelopeIdTopic = ethers.utils.hexZeroPad(ethers.BigNumber.from(envelopeId).toHexString(), 32);

                // 1. Check for EnvelopeClaimed
                const claimedFilter = zEnvelopeContract.filters.EnvelopeClaimed(envelopeIdTopic);
                // Check from startBlock to avoid picking up old events
                const claimedEvents = await zEnvelopeContract.queryFilter(claimedFilter, startBlock);

                const myClaimEvent = claimedEvents.find(e => {
                    // Case-insensitive comparison
                    return e.args.claimer.toLowerCase() === currentAccount.toLowerCase();
                });

                if (myClaimEvent) {
                    console.log("Found my claim event:", myClaimEvent);
                    receivedAmount = myClaimEvent.args.amount;
                    clearInterval(pollInterval);
                    resolve();
                    return;
                }

                // 2. Check for PasswordVerificationFailed
                const failedFilter = zEnvelopeContract.filters.PasswordVerificationFailed();
                // Check from startBlock to avoid picking up old events
                const failedEvents = await zEnvelopeContract.queryFilter(failedFilter, startBlock);

                const myFailureEvent = failedEvents.find(e => {
                    return e.args.envelopeId.toString() === envelopeId;
                });

                if (myFailureEvent) {
                    console.log("Found failure event:", myFailureEvent);
                    clearInterval(pollInterval);

                    // Show error UI
                    const errorInfoDiv = document.getElementById('error-info');
                    const errorDetailsDiv = document.getElementById('error-details');
                    errorDetailsDiv.innerHTML = t('password_verify_failed');
                    errorInfoDiv.style.display = 'block';

                    reject(new Error(t('password_verify_failed')));
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    reject(new Error(t('claim_timeout')));
                }
            } catch (err) {
                console.error("Polling error:", err);
                // Don't reject immediately on polling error, just wait for next tick
            }
        }, 3000); // Poll every 3 seconds
    });

    // 获取并显示资产信息
    const finalEnvelopeInfo = await zEnvelopeContract.getEnvelopeInfo(envelopeId);
    const tokenName = await getTokenName(finalEnvelopeInfo.tokenAddress);
    const assetInfoDiv = document.getElementById('asset-info');
    const assetDetailsP = document.getElementById('asset-details');

    let detailsHtml = `${t('token')}: ${tokenName}<br>
                       ${t('amount')}: ${ethers.utils.formatUnits(receivedAmount, 18)}`;

    assetDetailsP.innerHTML = detailsHtml;
    assetInfoDiv.style.display = 'block';

    // 显示成功消息
    showNotification(t('claim_success'), 'success');
}

async function handleSolanaClaim(envelopeId, hashedPassword, programAddress) {
    console.log(`Attempting to claim Solana envelope #${envelopeId} from program ${programAddress}`);

    if (!window.solanaProvider) {
        throw new Error("Solana wallet not connected");
    }

    // Helper to concat Uint8Arrays
    function concatBytes(arrays) {
        let totalLength = 0;
        for (const arr of arrays) {
            totalLength += arr.length;
        }
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    // Helper for hex to bytes
    function hexToBytes(hex) {
        if (hex.startsWith('0x')) hex = hex.slice(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    const connection = new solanaWeb3.Connection(CHAIN_CONFIG['solana'].rpcUrl, 'confirmed');
    const walletPublicKey = new solanaWeb3.PublicKey(currentAccount);
    const programId = new solanaWeb3.PublicKey(programAddress);

    // Derive PDAs
    const [globalStatePda] = solanaWeb3.PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("global_state")],
        programId
    );

    const envelopeIdBn = BigInt(envelopeId);
    const envelopeIdBuffer = new Uint8Array(8);
    new DataView(envelopeIdBuffer.buffer).setBigUint64(0, envelopeIdBn, true); // LE

    const [envelopePda] = solanaWeb3.PublicKey.findProgramAddressSync(
        [new TextEncoder().encode('envelope'), envelopeIdBuffer],
        programId
    );

    const [pendingClaimPda] = solanaWeb3.PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("pending_claim"), envelopePda.toBuffer(), walletPublicKey.toBuffer()],
        programId
    );

    const [claimStatusPda] = solanaWeb3.PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("claim_status"), envelopePda.toBuffer(), walletPublicKey.toBuffer()],
        programId
    );

    // Prepare instruction data
    // Discriminator: f6cf5f99b06d61ff
    const discriminator = new Uint8Array([0xf6, 0xcf, 0x5f, 0x99, 0xb0, 0x6d, 0x61, 0xff]);

    // Encrypted Password: Vec<u8> (4 bytes length + bytes)
    const encryptedPasswordBytes = hexToBytes(hashedPassword);
    const lengthBuffer = new Uint8Array(4);
    new DataView(lengthBuffer.buffer).setUint32(0, encryptedPasswordBytes.length, true); // LE

    const data = concatBytes([
        discriminator,
        lengthBuffer,
        encryptedPasswordBytes
    ]);

    // Check instruction arguments in lib.rs:
    // pub fn claim_envelope_with_password(ctx: Context<ClaimEnvelopeWithPassword>, envelope_id: u64, encrypted_password: Vec<u8>)
    // Anchor serializes arguments in order.

    const keys = [
        { pubkey: globalStatePda, isSigner: false, isWritable: true },
        { pubkey: envelopePda, isSigner: false, isWritable: true },
        { pubkey: pendingClaimPda, isSigner: false, isWritable: true },
        { pubkey: walletPublicKey, isSigner: true, isWritable: true },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const transaction = new solanaWeb3.Transaction();
    transaction.add(new solanaWeb3.TransactionInstruction({
        keys: keys,
        programId: programId,
        data: data
    }));

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash({ commitment: 'confirmed' });
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;

    // Sign and send
    // Use AppKit provider if available, or window.solana
    // window.solanaProvider is set in handleConnection

    let signature;
    if (window.solanaProvider.signTransaction) {
        const signedTx = await window.solanaProvider.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 5
        });
    } else {
        // Fallback to sendTransaction if signTransaction not available (e.g. some adapters)
        signature = await window.solanaProvider.sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 5
        });
    }

    console.log("Claim Transaction Sent:", signature);
    showNotification(t('claim_request_submitted'), 'info');

    const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
    });

    if (confirmation.value.err) {
        throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err));
    }

    showNotification(t('tx_confirmed_waiting'), 'info');

    // Polling logic
    const maxAttempts = 40; // 120s
    let attempts = 0;

    await new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
            attempts++;
            try {
                console.log(`Polling attempt ${attempts}/${maxAttempts}...`);

                // Check PendingClaim
                const pendingAccountInfo = await connection.getAccountInfo(pendingClaimPda);

                if (pendingAccountInfo) {
                    // Still pending
                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        reject(new Error(t('claim_timeout')));
                    }
                    return;
                }

                // PendingClaim is gone, check ClaimStatus
                const claimStatusAccountInfo = await connection.getAccountInfo(claimStatusPda);

                clearInterval(pollInterval);

                if (claimStatusAccountInfo) {
                    // Success
                    // ClaimStatus account does NOT store amount in current contract version.
                    // We must fetch the transaction that created ClaimStatus to get the EnvelopeClaimed event.

                    // 1. Get signatures for ClaimStatus account
                    const signatures = await connection.getSignaturesForAddress(claimStatusPda, { limit: 1 });
                    if (signatures.length === 0) {
                        console.warn("No signatures found for ClaimStatus, cannot fetch amount.");
                        resolve(); // Should not happen if account exists
                        return;
                    }

                    const txSignature = signatures[0].signature;
                    const tx = await connection.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });

                    let amount = BigInt(0);

                    if (tx && tx.meta && tx.meta.logMessages) {
                        // Parse logs for EnvelopeClaimed event
                        // Event Discriminator for EnvelopeClaimed: sha256("event:EnvelopeClaimed")[..8]
                        // "event:EnvelopeClaimed" -> bb27799a428b6c03
                        // Discriminator: [0xbb, 0x27, 0x79, 0x9a, 0x42, 0x8b, 0x6c, 0x03]

                        for (const log of tx.meta.logMessages) {
                            if (log.startsWith("Program data: ")) {
                                const dataBase64 = log.substring("Program data: ".length);
                                try {
                                    const binaryString = atob(dataBase64);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }

                                    // Check discriminator
                                    if (bytes.length >= 8 &&
                                        bytes[0] === 0xbb && bytes[1] === 0x27 && bytes[2] === 0x79 && bytes[3] === 0x9a &&
                                        bytes[4] === 0x42 && bytes[5] === 0x8b && bytes[6] === 0x6c && bytes[7] === 0x03) {

                                        // Found EnvelopeClaimed event
                                        // Layout: Discriminator (8) + EnvelopeId (8) + Claimer (32) + Amount (8)
                                        const amountOffset = 8 + 8 + 32;
                                        if (bytes.length >= amountOffset + 8) {
                                            amount = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(amountOffset, true);
                                            console.log("Found amount from event:", amount);
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error parsing log data:", e);
                                }
                            }
                        }
                    }

                    // Fetch Envelope to get Token Mint
                    const envelopeAccountInfo = await connection.getAccountInfo(envelopePda);
                    let tokenName = "SOL";
                    let decimals = 9;

                    if (envelopeAccountInfo) {
                        // Decode Envelope
                        // Discriminator (8) + ID (8) + Creator (32) + PasswordHash (4+len) + TokenMint (1+32?) ...

                        let offset = 8 + 8 + 32;
                        const passwordHashLen = new DataView(envelopeAccountInfo.data.buffer, envelopeAccountInfo.data.byteOffset, envelopeAccountInfo.data.byteLength).getUint32(offset, true);
                        offset += 4 + passwordHashLen;

                        const tokenMintOption = envelopeAccountInfo.data[offset];
                        offset += 1;

                        if (tokenMintOption === 1) {
                            const mintAddressBytes = envelopeAccountInfo.data.slice(offset, offset + 32);
                            const mintAddress = new solanaWeb3.PublicKey(mintAddressBytes);

                            // Fetch Mint Info to get decimals
                            const mintInfo = await connection.getAccountInfo(mintAddress);
                            if (mintInfo) {
                                const decimalsOffset = 4 + 32 + 8;
                                decimals = mintInfo.data[decimalsOffset];
                                tokenName = "Unknown Token";
                                tokenName = mintAddress.toBase58().substring(0, 4) + "..." + mintAddress.toBase58().substring(mintAddress.toBase58().length - 4);
                            }
                        }
                    }

                    // Display Asset Info
                    const assetInfoDiv = document.getElementById('asset-info');
                    const assetDetailsP = document.getElementById('asset-details');

                    // Format amount
                    const amountStr = (Number(amount) / Math.pow(10, decimals)).toFixed(decimals).replace(/\.?0+$/, "");

                    let detailsHtml = `${t('token')}: ${tokenName}<br>
                                       ${t('amount')}: ${amountStr}`;

                    assetDetailsP.innerHTML = detailsHtml;
                    assetInfoDiv.style.display = 'block';

                    resolve();
                } else {
                    // Failed (PendingClaim gone but ClaimStatus not created)
                    const errorInfoDiv = document.getElementById('error-info');
                    const errorDetailsDiv = document.getElementById('error-details');
                    errorDetailsDiv.innerHTML = t('password_verify_failed');
                    errorInfoDiv.style.display = 'block';

                    reject(new Error(t('password_verify_failed')));
                }
            } catch (err) {
                console.error("Polling error:", err);
                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    reject(err);
                }
            }
        }, 3000);
    });

    showNotification(t('claim_success'), 'success');
}

async function handleTonClaim(envelopeId, hashedPassword, zEnvelopeAddress) {
    console.log(`Attempting to claim TON envelope #${envelopeId}`);

    const chainConfig = CHAIN_CONFIG['ton'];
    const isTestnet = chainConfig.rpcUrl.includes('testnet');
    const networkId = isTestnet ? '-3' : '-239';
    const contractAddress = chainConfig.contractAddress;

    // 获取TON钱包provider - 参考script.js中的handleTonCreateEnvelope
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
        console.log("Using global window.tonProvider");
        activeTonProvider = window.tonProvider;
        if (activeTonProvider.sendTransaction) {
            // 可以直接使用
        } else if (activeTonProvider.tonConnectUI && typeof activeTonProvider.tonConnectUI.sendTransaction === 'function') {
            activeTonProvider = activeTonProvider.tonConnectUI;
            useTonConnectUI = true;
        }
    }

    // 2. 尝试使用 AppKit 的 provider
    if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
        try {
            const provider = modal.getWalletProvider('ton');
            console.log("Checking AppKit TON Provider:", provider);
            if (provider && typeof provider.sendTransaction === 'function') {
                console.log("Using provider from modal.getWalletProvider('ton')");
                activeTonProvider = provider;
            }
        } catch (e) {
            console.warn("Failed to get provider from modal:", e);
        }
    }

    // 3. 尝试使用tonAdapter
    if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
        if (tonAdapter) {
            console.log("Checking tonAdapter:", tonAdapter);
            if (tonAdapter.tonConnectUI && typeof tonAdapter.tonConnectUI.sendTransaction === 'function') {
                console.log("Using tonAdapter.tonConnectUI");
                activeTonProvider = tonAdapter.tonConnectUI;
                useTonConnectUI = true;
            } else if (typeof tonAdapter.sendTransaction === 'function') {
                console.log("Using tonAdapter.sendTransaction directly");
                if (tonAdapter.providerHandlers) {
                    for (const [key, handler] of Object.entries(tonAdapter.providerHandlers)) {
                        if (handler && typeof handler.sendTransaction === 'function') {
                            console.log(`Found sendTransaction in providerHandler[${key}]`);
                            activeTonProvider = handler;
                            break;
                        }
                    }
                }
                if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
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
    }

    // 4. 最后尝试 window.ton
    if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
        if (window.ton && typeof window.ton.sendTransaction === 'function') {
            console.log("Using window.ton");
            activeTonProvider = window.ton;
        }
    }

    // 5. 如果仍然没有provider，尝试通过tonConnectUI连接
    if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
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

    if (!activeTonProvider || typeof activeTonProvider.sendTransaction !== 'function') {
        throw new Error("无法获取TON钱包Provider。请确保已安装TON钱包扩展或使用支持TON的钱包连接。");
    }

    console.log("Final activeTonProvider:", activeTonProvider);
    console.log("useTonConnectUI:", useTonConnectUI);

    try {
        const TonWeb = window.TonWeb;
        if (!TonWeb) {
            throw new Error("TonWeb library not found.");
        }

        // 先验证红包是否存在
        const apiBase = isTestnet
            ? 'https://testnet.toncenter.com/api/v2'
            : 'https://toncenter.com/api/v2';

        try {
            console.log("Verifying envelope exists...");
            const response = await fetch(`${apiBase}/runGetMethod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: contractAddress,
                    method: 'getEnvelope',
                    stack: [
                        ["num", envelopeId]
                    ]
                })
            });
            const data = await response.json();
            console.log("getEnvelope response:", data);

            if (!data.ok) {
                throw new Error(`红包 #${envelopeId} 不存在或已过期`);
            }

            // 检查返回的stack是否有效
            if (!data.result || !data.result.stack || data.result.stack.length === 0) {
                throw new Error(`红包 #${envelopeId} 不存在`);
            }

            console.log("Envelope exists, proceeding with claim...");
        } catch (verifyError) {
            console.error("Envelope verification failed:", verifyError);
            throw new Error(`验证红包失败: ${verifyError.message}`);
        }

        // ClaimEnvelope 消息的 opcode
        // 根据 Tact 编译规则: opcode = crc32("ClaimEnvelope") & 0x7fffffff | 0x80000000
        // 或者从编译输出获取: claim_envelope#e159c068
        const opcode = 0xe159c068; // ClaimEnvelope opcode

        console.log("ClaimEnvelope opcode:", "0x" + opcode.toString(16));
        console.log("EnvelopeId:", envelopeId);
        console.log("EncryptedPassword:", hashedPassword);
        console.log("EncryptedPassword length:", hashedPassword.length);

        // 构建消息 Cell
        // Tact 消息结构: opcode(32) + 字段按定义顺序
        // ClaimEnvelope: envelopeId(uint256) + encryptedPassword(String as ref)
        // 
        // TON Cell 限制: 最多 1023 bits 和 4 个引用
        // opcode(32) + uint256(256) = 288 bits，在限制内

        const cell = new TonWeb.boc.Cell();
        cell.bits.writeUint(opcode, 32);

        // 写入 envelopeId (uint256 = 256 bits)
        // 由于 envelopeId 通常是小数字，我们分段写入以避免 BN 问题
        // const envelopeIdNum = parseInt(envelopeId);

        // 写入 256 bits: 先写高192位(0)，再写低64位
        // cell.bits.writeUint(0, 192); // 高192位为0
        // cell.bits.writeUint(envelopeIdNum, 64); // 低64位为实际值
        cell.bits.writeUint(envelopeId, 256);

        // encryptedPassword 是 String 类型，在 Tact 中序列化为 Cell reference
        // 使用 snake format 将长字符串分割到多个 Cell 中
        // 参考 script.js 中 CreateEnvelope 的 passwordHash 处理方式
        const passwordCell = new TonWeb.boc.Cell();

        // 使用改进的 writeStringSnake 函数，确保正确处理长字符串
        // hashedPassword 格式: "0x" + 64个十六进制字符 = 66个字符 = 528 bits
        // 一个 Cell 最多 1023 bits，所以单个 Cell 应该够用
        // 但为了安全起见，我们仍然使用 snake format
        writeStringSnake(passwordCell, hashedPassword);
        cell.refs.push(passwordCell);

        console.log("Message cell bits used:", cell.bits.cursor);
        console.log("Message cell refs count:", cell.refs.length);
        console.log("Password cell bits used:", passwordCell.bits.cursor);
        console.log("Password cell refs count:", passwordCell.refs.length);

        // 准备交易
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min (与script.js一致)
            messages: [
                {
                    address: contractAddress,
                    amount: TonWeb.utils.toNano('0.1').toString(), // Gas
                    payload: TonWeb.utils.bytesToBase64(await cell.toBoc())
                }
            ]
        };

        // 总是添加network参数
        transaction.network = networkId;

        console.log("Sending TON Claim Transaction:", JSON.stringify(transaction, null, 2));

        try {
            const result = await activeTonProvider.sendTransaction(transaction);
            console.log("TON Claim Result:", result);

            if (!result) {
                throw new Error("Transaction failed or cancelled (empty result)");
            }

            // 检查是否有hash或boc
            if ((!result.hash && !result.boc) || result.hash === "") {
                console.warn("Transaction result has empty hash/boc, but no error thrown.");
                if (result.boc) {
                    console.log("Found BOC, proceeding...");
                } else {
                    throw new Error("Transaction result missing hash and boc");
                }
            }

            showNotification(t('claim_request_submitted'), 'info');
            showNotification(t('tx_confirmed_waiting'), 'info');

            // 轮询监听 EventEnvelopeClaimed 事件
            // TON 事件通过 external out messages 发出，需要轮询合约交易来获取
            const maxAttempts = 40; // 40 * 3s = 120s timeout
            let attempts = 0;
            let claimedAmount = null;

            // 记录开始时间，用于过滤旧交易
            const claimStartTime = Math.floor(Date.now() / 1000);
            console.log("Claim start time:", claimStartTime);

            // 保存初始的 claimedRecipientsCount 用于比较
            let initialClaimedCount = null;
            try {
                const initResponse = await fetch(`${apiBase}/runGetMethod`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: contractAddress,
                        method: 'getEnvelope',
                        stack: [["num", envelopeId]]
                    })
                });
                const initData = await initResponse.json();
                if (initData.ok && initData.result && initData.result.stack) {
                    // Envelope 结构返回为 tuple，解析 claimedRecipientsCount
                    // 根据合约定义顺序: creator, passwordHash, tokenAddress, totalAmount, 
                    // remainingAmount, claimed, createdAt, expiresAt, numberOfRecipients, 
                    // claimedRecipientsCount, distributionType
                    const stack = initData.result.stack;
                    console.log("Initial envelope state:", stack);
                    // claimedRecipientsCount 是第10个字段 (索引9)
                    if (stack.length > 9 && stack[9][0] === 'num') {
                        initialClaimedCount = parseInt(stack[9][1], 16);
                        console.log("Initial claimedRecipientsCount:", initialClaimedCount);
                    }
                }
            } catch (e) {
                console.warn("Failed to get initial envelope state:", e);
            }

            await new Promise((resolve, reject) => {
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        console.log(`Polling attempt ${attempts}/${maxAttempts}...`);

                        // 方法1: 检查用户账户是否收到了来自合约的转账
                        // 这是最可靠的方式，因为成功领取一定会有转账
                        try {
                            const userTxResponse = await fetch(`${apiBase}/getTransactions?address=${currentAccount}&limit=10`);
                            const userTxData = await userTxResponse.json();

                            if (userTxData.ok && userTxData.result) {
                                for (const tx of userTxData.result) {
                                    // 检查是否是来自合约的转账
                                    if (tx.in_msg && tx.in_msg.source) {
                                        const sourceAddr = tx.in_msg.source;
                                        // TON 地址比较需要规范化，可能是 bounceable/non-bounceable 格式
                                        if (sourceAddr.includes(contractAddress.split(':').pop()) ||
                                            contractAddress.includes(sourceAddr.split(':').pop())) {
                                            // 检查交易时间是否在领取请求之后
                                            const txTime = tx.utime || 0;
                                            if (txTime >= claimStartTime - 10) { // 允许10秒误差
                                                const value = tx.in_msg.value;
                                                if (value && parseInt(value) > 0) {
                                                    claimedAmount = value;
                                                    console.log("Found incoming transfer from contract:", claimedAmount, "at time:", txTime);
                                                    clearInterval(pollInterval);
                                                    resolve();
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (userTxError) {
                            console.warn("Error checking user transactions:", userTxError);
                        }

                        // 方法2: 检查合约的 claimedRecipientsCount 是否增加
                        try {
                            const envelopeResponse = await fetch(`${apiBase}/runGetMethod`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    address: contractAddress,
                                    method: 'getEnvelope',
                                    stack: [["num", envelopeId]]
                                })
                            });
                            const envelopeData = await envelopeResponse.json();

                            if (envelopeData.ok && envelopeData.result && envelopeData.result.stack) {
                                const stack = envelopeData.result.stack;
                                console.log("Current envelope state:", stack);

                                // 解析 claimedRecipientsCount
                                if (stack.length > 9 && stack[9][0] === 'num') {
                                    const currentClaimedCount = parseInt(stack[9][1], 16);
                                    console.log("Current claimedRecipientsCount:", currentClaimedCount);

                                    if (initialClaimedCount !== null && currentClaimedCount > initialClaimedCount) {
                                        console.log("Claim confirmed! Count increased from", initialClaimedCount, "to", currentClaimedCount);

                                        // 从 envelope 信息计算领取金额
                                        // totalAmount 是第4个字段 (索引3)
                                        // numberOfRecipients 是第9个字段 (索引8)
                                        // distributionType 是第11个字段 (索引10)
                                        if (stack.length > 10) {
                                            const totalAmount = stack[3][0] === 'num' ? BigInt('0x' + stack[3][1]) : BigInt(0);
                                            const numberOfRecipients = stack[8][0] === 'num' ? parseInt(stack[8][1], 16) : 1;
                                            const distributionType = stack[10][0] === 'num' ? parseInt(stack[10][1], 16) : 0;

                                            if (distributionType === 0) {
                                                // 平均分配
                                                claimedAmount = (totalAmount / BigInt(numberOfRecipients)).toString();
                                                console.log("Calculated average amount:", claimedAmount);
                                            }
                                            // 随机分配无法精确计算，保持 null
                                        }

                                        clearInterval(pollInterval);
                                        resolve();
                                        return;
                                    }
                                }
                            }
                        } catch (stateError) {
                            console.warn("Error checking envelope state:", stateError);
                        }

                        // 方法3: 检查合约的外发消息 (events)
                        try {
                            const txResponse = await fetch(`${apiBase}/getTransactions?address=${contractAddress}&limit=20`);
                            const txData = await txResponse.json();

                            if (txData.ok && txData.result) {
                                for (const tx of txData.result) {
                                    // 只检查最近的交易
                                    const txTime = tx.utime || 0;
                                    if (txTime < claimStartTime - 10) continue;

                                    // 检查外发消息
                                    if (tx.out_msgs && tx.out_msgs.length > 0) {
                                        for (const outMsg of tx.out_msgs) {
                                            // 检查是否是发送给当前用户的消息
                                            if (outMsg.destination) {
                                                const destAddr = outMsg.destination;
                                                // 地址匹配
                                                if (destAddr.includes(currentAccount.split(':').pop()) ||
                                                    currentAccount.includes(destAddr.split(':').pop())) {
                                                    if (outMsg.value && parseInt(outMsg.value) > 0) {
                                                        claimedAmount = outMsg.value;
                                                        console.log("Found outgoing transfer to user:", claimedAmount);
                                                        clearInterval(pollInterval);
                                                        resolve();
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (txError) {
                            console.warn("Error checking contract transactions:", txError);
                        }

                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            // 如果超时但交易已发送，显示部分成功信息
                            console.warn("Claim polling timeout, transaction may still be processing");
                            resolve(); // 不要 reject，让用户看到交易已提交
                        }
                    } catch (err) {
                        console.error("Polling error:", err);
                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            reject(err);
                        }
                    }
                }, 3000); // 每3秒轮询一次
            });

            // 显示成功信息
            const assetInfoDiv = document.getElementById('asset-info');
            const assetDetailsP = document.getElementById('asset-details');

            let detailsHtml;
            if (claimedAmount) {
                // 将 nanoTON 转换为 TON (1 TON = 10^9 nanoTON)
                const amountInTon = (Number(claimedAmount) / 1e9).toFixed(4);
                detailsHtml = `${t('token')}: TON<br>
                               ${t('amount')}: ${amountInTon}`;
            } else {
                // 如果无法获取具体金额，显示通用成功消息
                detailsHtml = `${t('token')}: TON<br>
                               ${t('amount')}: -`;
            }

            assetDetailsP.innerHTML = detailsHtml;
            assetInfoDiv.style.display = 'block';

            showNotification(t('claim_success'), 'success');
        } catch (sendError) {
            console.error("TON sendTransaction error:", sendError);

            // 检查是否是用户取消
            if (sendError.message && (
                sendError.message.includes('cancelled') ||
                sendError.message.includes('canceled') ||
                sendError.message.includes('rejected') ||
                sendError.message.includes('not sent')
            )) {
                throw new Error("交易被取消。请重新尝试并在钱包中确认交易。");
            }
            throw sendError;
        }

    } catch (error) {
        console.error("TON Claim Error:", error);
        throw error;
    }
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

// 实现 @ton/core 的 storeStringRefTail 等价方法
// Tact 中 String 类型使用 tail 格式序列化到 Cell 引用中
// 这个方法将字符串写入 Cell，如果太长会自动创建链式 Cell 结构
function storeStringRefTail(cell, str) {
    const TonWeb = window.TonWeb;

    // 将字符串转换为 UTF-8 字节数组
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    console.log(`storeStringRefTail: string length = ${str.length}, bytes = ${bytes.length}`);

    // 递归写入字节到 Cell 链
    function writeBytes(cell, data, offset) {
        const CELL_BITS_LIMIT = 1023;
        const currentCursor = cell.bits.cursor;
        const availableBits = CELL_BITS_LIMIT - currentCursor;
        const availableBytes = Math.floor(availableBits / 8);

        const bytesToWrite = Math.min(availableBytes, data.length - offset);

        if (bytesToWrite > 0) {
            // 写入字节
            for (let i = 0; i < bytesToWrite; i++) {
                cell.bits.writeUint8(data[offset + i]);
            }
        }

        const remaining = data.length - offset - bytesToWrite;
        if (remaining > 0) {
            // 还有剩余数据，创建子 Cell
            const tailCell = new TonWeb.boc.Cell();
            writeBytes(tailCell, data, offset + bytesToWrite);
            cell.refs.push(tailCell);
        }
    }

    writeBytes(cell, bytes, 0);
    console.log(`storeStringRefTail: finished, cell bits = ${cell.bits.cursor}, refs = ${cell.refs.length}`);
}


async function getTokenName(tokenAddress) {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        const chainConfig = CHAIN_CONFIG[currentChainId];
        return chainConfig ? chainConfig.currency : "ETH";
    }
    try {
        const tokenAbi = ["function name() view returns (string)"];
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, ethersProvider);
        return await tokenContract.name();
    } catch (error) {
        console.error("Could not fetch token name for", tokenAddress, error);
        return tokenAddress; // Fallback to showing the address
    }
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

// Simple notification function
function showNotification(message, type) {
    alert(`${type.toUpperCase()}: ${message}`);
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

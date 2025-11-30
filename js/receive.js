import { modal } from './wallet_connector.js';
import { connectTronWallet } from './tron_connector.js';
import { CHAIN_CONFIG, SUPPORTED_EVM_CHAINS } from './chain_config.js';

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
    }

    const chainConfig = CHAIN_CONFIG[currentChainId];
    const networkDisplay = document.getElementById('network-display');

    if (!chainConfig) {
        console.warn(`Unsupported network: ${currentChainId}.`);
        showNotification('不支持的网络，请切换到支持的链', 'error');
        
        if (networkDisplay) {
            networkDisplay.textContent = '未知网络';
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
        showNotification(`该网络 (${chainConfig.name}) 暂未部署合约`, 'warning');
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

    showNotification(`已连接到 ${chainConfig.name}`, 'success');
}

function handleDisconnect() {
    console.log('Disconnected');
    currentAccount = null;
    currentChainId = null;
    zEnvelopeAddress = null;
    const verifyBtn = document.querySelector('.verify-btn');
    if (verifyBtn) {
        verifyBtn.textContent = '连接钱包';
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
	const response = await fetch('js/sha256.wasm');
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
		const pkbBuffer = await pkbResponse.arrayBuffer();
		const pkbContent = new Uint8Array(pkbBuffer);
		const hashedPassword = "0x" + goSha256(password, pkbContent);

		// Validate form
		if (!envelopeId) {
			showNotification('请输入红包 ID', 'error');
			return;
		}

		if (!currentAccount) {
			showNotification('请先连接钱包', 'error');
			return;
		}

		if (!zEnvelopeAddress) {
			showNotification('当前网络暂不支持或未配置合约地址', 'error');
			return;
		}

		// Reset error info
		document.getElementById('error-info').style.display = 'none';
		document.getElementById('asset-info').style.display = 'none';

		// Show loading state on button
		const submitBtn = document.querySelector('.submit-btn');
		const originalText = submitBtn.innerHTML;
		submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在领取...';
		submitBtn.disabled = true;

		try {
			const zEnvelopeContract = new ethers.Contract(zEnvelopeAddress, zEnvelopeABI, ethersSigner);

			// 1. 检查红包ID是否有效
			showNotification('正在验证红包ID...', 'info');
			const nextId = await zEnvelopeContract.nextEnvelopeId();
			if (parseInt(envelopeId) <= 0 || parseInt(envelopeId) >= nextId) {
				showNotification('无效的红包 ID', 'error');
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
			showNotification('已提交领取请求，等待交易确认...', 'info');
			await tx.wait(); // 等待请求被打包

			showNotification('交易已确认，等待后端验证...', 'info');

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
							errorDetailsDiv.innerHTML = "口令验证失败，请检查口令是否正确。";
							errorInfoDiv.style.display = 'block';

							reject(new Error('口令验证失败'));
							return;
						}

						if (attempts >= maxAttempts) {
							clearInterval(pollInterval);
							reject(new Error('领取超时，未检测到领取事件。请检查钱包余额。'));
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

			let detailsHtml = `代币: ${tokenName}<br>
                               数量: ${ethers.utils.formatUnits(receivedAmount, 18)}`;

			assetDetailsP.innerHTML = detailsHtml;
			assetInfoDiv.style.display = 'block';

			// 显示成功消息
			showNotification('红包领取成功！', 'success');

		} catch (error) {
			console.error('领取红包失败:', error);

			showNotification(`领取红包失败: ${error.message}`, 'error');
		} finally {
			// 重置按钮状态
			submitBtn.innerHTML = originalText;
			submitBtn.disabled = false;
		}
	});
});

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
					showNotification('Web3Modal 初始化失败', 'error');
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
		showNotification("连接波场失败: " + error.message, 'error');
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

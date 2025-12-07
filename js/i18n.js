const translations = {
    "zh-CN": {
        "title": "zEnvelope - 加密口令红包",
        "loading": "Loading...",
        "nav_send": "发红包",
        "nav_receive": "收红包",
        "connect_wallet": "连接钱包",
        "wallet_modal_title": "连接钱包",
        "wallet_connect": "Wallet Connect",
        "tron_link": "Tron (TronLink)",
        "create_header": "创建口令红包",
        "create_desc": "将代币放入信封，设置口令，分享给好友。",
        "create_success_title": "创建成功!",
        "create_success_id": "您的红包 ID 是:",
        "create_success_share": "请将此 ID 和口令分享给好友。",
        "label_token": "选择代币",
        "option_connect_first": "请先连接钱包",
        "label_amount": "总金额",
        "label_count": "红包个数",
        "placeholder_count": "例如: 10",
        "label_type": "红包类型",
        "option_equal": "人均红包",
        "option_random": "拼手气红包",
        "label_password": "设置口令",
        "placeholder_password_set": "设置领取口令",
        "label_validity": "有效期 (小时)",
        "placeholder_validity": "默认 24 小时",
        "btn_create": "创建红包",
        "receive_header": "领取口令红包",
        "receive_desc": "输入红包 ID 和口令，领取您的资产。",
        "receive_success_title": "成功领取红包！",
        "receive_error_title": "领取失败",
        "label_envelope_id": "红包 ID",
        "placeholder_envelope_id": "请输入红包 ID",
        "label_password_input": "口令",
        "placeholder_password_input": "请输入口令",
        "btn_claim": "领取红包",
        "footer_rights": "&copy; 2025 zEnvelope. All rights reserved.",
        
        // Dynamic messages
        "unsupported_network": "不支持的网络，请切换到支持的链",
        "unknown_network": "未知网络",
        "contract_not_deployed": "该网络 ({name}) 暂未部署合约",
        "connected_to": "已连接到 {name}",
        "loading_assets": "正在加载资产...",
        "insufficient_balance_trx": "余额不足 (0 TRX)",
        "select_token": "请选择代币",
        "insufficient_balance": "余额不足",
        "load_failed": "加载失败",
        "cannot_load_assets": "无法加载资产",
        "insufficient_balance_ton": "余额不足 (0 TON)",
        "insufficient_balance_sol": "余额不足 (0 SOL)",
        "scanning_tokens": "正在自动扫描代币...",
        "scan_failed_retry": "扫描失败，请重试",
        "no_tokens_found": "未发现任何可用代币",
        "invalid_token_address": "请输入有效的代币合约地址",
        "fill_required_fields": "请填写所有必填字段。",
        "processing": "处理中...",
        "wallet_not_connected": "钱包未连接",
        "contract_not_configured": "合约地址未配置",
        "network_not_supported": "当前网络暂不支持或未配置合约地址",
        "approval_required": "需要授权交易以允许合约转移您的代币",
        "approving": "正在授权...",
        "approval_success": "授权成功！正在创建红包...",
        "creating": "正在创建...",
        "creating_envelope": "正在创建红包...",
        "create_failed": "创建红包失败:",
        "create_success": "红包创建成功！",
        "web3modal_init_failed": "Web3Modal 初始化失败",
        "connect_tron_failed": "连接波场失败: ",
        "enter_envelope_id": "请输入红包 ID",
        "claiming": "正在领取...",
        "verifying_id": "正在验证红包ID...",
        "invalid_id": "无效的红包 ID",
        "claim_request_submitted": "已提交领取请求，等待交易确认...",
        "tx_confirmed_waiting": "交易已确认，等待后端验证...",
        "password_verify_failed": "口令验证失败，请检查口令是否正确。",
        "claim_timeout": "领取超时，未检测到领取事件。请检查钱包余额。",
        "claim_success": "红包领取成功！",
        "claim_failed": "领取红包失败: ",
        "token": "代币",
        "amount": "数量"
    },
    "en": {
        "title": "zEnvelope - Crypto Red Packet",
        "loading": "Loading...",
        "nav_send": "Send",
        "nav_receive": "Receive",
        "connect_wallet": "Wallet",
        "wallet_modal_title": "Connect Wallet",
        "wallet_connect": "Wallet Connect",
        "tron_link": "Tron (TronLink)",
        "create_header": "Create Red Packet",
        "create_desc": "Put tokens in an envelope, set a password, and share with friends.",
        "create_success_title": "Created Successfully!",
        "create_success_id": "Your Envelope ID is:",
        "create_success_share": "Please share this ID and password with your friends.",
        "label_token": "Select Token",
        "option_connect_first": "Please connect wallet first",
        "label_amount": "Total Amount",
        "label_count": "Number of Recipients",
        "placeholder_count": "e.g., 10",
        "label_type": "Packet Type",
        "option_equal": "Equal Amount",
        "option_random": "Random Amount",
        "label_password": "Set Password",
        "placeholder_password_set": "Set claim password",
        "label_validity": "Validity (Hours)",
        "placeholder_validity": "Default 24 hours",
        "btn_create": "Create Envelope",
        "receive_header": "Claim Red Packet",
        "receive_desc": "Enter Envelope ID and password to claim your assets.",
        "receive_success_title": "Claimed Successfully!",
        "receive_error_title": "Claim Failed",
        "label_envelope_id": "Envelope ID",
        "placeholder_envelope_id": "Enter Envelope ID",
        "label_password_input": "Password",
        "placeholder_password_input": "Enter Password",
        "btn_claim": "Claim Envelope",
        "footer_rights": "&copy; 2025 zEnvelope. All rights reserved.",

        // Dynamic messages
        "unsupported_network": "Unsupported network, please switch to a supported chain",
        "unknown_network": "Unknown Network",
        "contract_not_deployed": "Contract not deployed on this network ({name})",
        "connected_to": "Connected to {name}",
        "loading_assets": "Loading assets...",
        "insufficient_balance_trx": "Insufficient balance (0 TRX)",
        "select_token": "Select Token",
        "insufficient_balance": "Insufficient balance",
        "load_failed": "Load failed",
        "cannot_load_assets": "Cannot load assets",
        "insufficient_balance_ton": "Insufficient balance (0 TON)",
        "insufficient_balance_sol": "Insufficient balance (0 SOL)",
        "scanning_tokens": "Scanning for tokens...",
        "scan_failed_retry": "Scan failed, please retry",
        "no_tokens_found": "No available tokens found",
        "invalid_token_address": "Please enter a valid token contract address",
        "fill_required_fields": "Please fill in all required fields.",
        "processing": "Processing...",
        "wallet_not_connected": "Wallet not connected",
        "contract_not_configured": "Contract address not configured",
        "network_not_supported": "Current network not supported or contract address not configured",
        "approval_required": "Transaction approval required to allow contract to transfer your tokens",
        "approving": "Approving...",
        "approval_success": "Approval successful! Creating envelope...",
        "creating": "Creating...",
        "creating_envelope": "Creating envelope...",
        "create_failed": "Failed to create envelope:",
        "create_success": "Envelope created successfully!",
        "web3modal_init_failed": "Web3Modal initialization failed",
        "connect_tron_failed": "Failed to connect to Tron: ",
        "enter_envelope_id": "Please enter Envelope ID",
        "claiming": "Claiming...",
        "verifying_id": "Verifying Envelope ID...",
        "invalid_id": "Invalid Envelope ID",
        "claim_request_submitted": "Claim request submitted, waiting for confirmation...",
        "tx_confirmed_waiting": "Transaction confirmed, waiting for backend verification...",
        "password_verify_failed": "Password verification failed, please check your password.",
        "claim_timeout": "Claim timeout, no claim event detected. Please check wallet balance.",
        "claim_success": "Envelope claimed successfully!",
        "claim_failed": "Failed to claim envelope: ",
        "token": "Token",
        "amount": "Amount"
    }
};

let currentLang = localStorage.getItem('language') || 'en';

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('language', lang);
    updatePageContent();
}

function t(key, params = {}) {
    let text = translations[currentLang][key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function updatePageContent() {
    document.documentElement.lang = currentLang;
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLang][key];
            } else {
                element.innerHTML = translations[currentLang][key];
            }
        }
    });

    // Update specific elements that might need HTML structure preserved or special handling
    // (None for now, data-i18n should handle most)
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updatePageContent();
    
    const langBtn = document.getElementById('lang-toggle');
    const langText = document.getElementById('lang-text');

    if (langBtn && langText) {
        const updateBtnContent = () => {
            const langCode = currentLang === 'zh-CN' ? 'CN' : 'EN';
            langText.textContent = langCode;
        };
        updateBtnContent();

        langBtn.addEventListener('click', () => {
            const newLang = currentLang === 'zh-CN' ? 'en' : 'zh-CN';
            setLanguage(newLang);
            updateBtnContent();
        });
    }
});

// Export for module usage
export { t, setLanguage, currentLang };

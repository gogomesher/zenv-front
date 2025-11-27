import{ak as W,aj as x,a1 as L,$ as y,V as g,b0 as B,U as h,b1 as q,P as z,X as _,T,a3 as E,Q as Y,ae as b,a9 as X,aa as J,u as F,t as H,x as d,ai as Z,a8 as G,ah as Q}from"./chain_config-D8DYnceI.js";import{r as w}from"./class-map-gEppeFCC.js";import{o as R}from"./if-defined-B79U8La_.js";import{c as K}from"./index-CAF11AxJ.js";import"./index-CLIq9jXF.js";import"./index-BP5oJskm.js";import"./index-C69rkPZu.js";import"./index-PBU5SXPe.js";import"./index-BBtbNsVY.js";import"./index-OpFv50mv.js";import"./index-DSM72A0H.js";import"./index-DPpHED_0.js";import"./index-C7IIus8o.js";import"./async-directive-vLOJ1iU1.js";import"./index-S9s5RHv-.js";const i={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS"},A={[i.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[i.INVALID_RECIPIENT]:"Invalid recipient address",[i.INVALID_ASSET]:"Invalid asset specified",[i.INVALID_AMOUNT]:"Invalid payment amount",[i.UNKNOWN_ERROR]:"Unknown payment error occurred",[i.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[i.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[i.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[i.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[i.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[i.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[i.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status"};class c extends Error{get message(){return A[this.code]}constructor(e,a){super(A[e]),this.name="AppKitPayError",this.code=e,this.details=a,Error.captureStackTrace&&Error.captureStackTrace(this,c)}}const ee="https://rpc.walletconnect.org/v1/json-rpc";class te extends Error{}function ne(){const n=W.getSnapshot().projectId;return`${ee}?projectId=${n}`}async function M(n,e){const a=ne(),{sdkType:s,sdkVersion:r,projectId:o}=W.getSnapshot(),u={jsonrpc:"2.0",id:1,method:n,params:{...e||{},st:s,sv:r,projectId:o}},N=await(await fetch(a,{method:"POST",body:JSON.stringify(u),headers:{"Content-Type":"application/json"}})).json();if(N.error)throw new te(N.error.message);return N}async function V(n){return(await M("reown_getExchanges",n)).result}async function ae(n){return(await M("reown_getExchangePayUrl",n)).result}async function se(n){return(await M("reown_getExchangeBuyStatus",n)).result}const re=["eip155","solana"],ie={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function k(n,e){const{chainNamespace:a,chainId:s}=x.parseCaipNetworkId(n),r=ie[a];if(!r)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${a}`);let o=r.native.assetNamespace,u=r.native.assetReference;return e!=="native"&&(o=r.defaultTokenNamespace,u=e),`${`${a}:${s}`}/${o}:${u}`}function oe(n){const{chainNamespace:e}=x.parseCaipNetworkId(n);return re.includes(e)}async function ce(n){const{paymentAssetNetwork:e,activeCaipNetwork:a,approvedCaipNetworkIds:s,requestedCaipNetworks:r}=n,u=L.sortRequestedNetworks(s,r).find(P=>P.caipNetworkId===e);if(!u)throw new c(i.INVALID_PAYMENT_CONFIG);if(u.caipNetworkId===a.caipNetworkId)return;const p=y.getNetworkProp("supportsAllNetworks",u.chainNamespace);if(!(s?.includes(u.caipNetworkId)||p))throw new c(i.INVALID_PAYMENT_CONFIG);try{await y.switchActiveNetwork(u)}catch(P){throw new c(i.GENERIC_PAYMENT_ERROR,P)}}async function ue(n,e,a){if(e!==g.CHAIN.EVM)throw new c(i.INVALID_CHAIN_NAMESPACE);if(!a.fromAddress)throw new c(i.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const s=typeof a.amount=="string"?parseFloat(a.amount):a.amount;if(isNaN(s))throw new c(i.INVALID_PAYMENT_CONFIG);const r=n.metadata?.decimals??18,o=h.parseUnits(s.toString(),r);if(typeof o!="bigint")throw new c(i.GENERIC_PAYMENT_ERROR);return await h.sendTransaction({chainNamespace:e,to:a.recipient,address:a.fromAddress,value:o,data:"0x"})??void 0}async function le(n,e){if(!e.fromAddress)throw new c(i.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const a=n.asset,s=e.recipient,r=Number(n.metadata.decimals),o=h.parseUnits(e.amount.toString(),r);if(o===void 0)throw new c(i.GENERIC_PAYMENT_ERROR);return await h.writeContract({fromAddress:e.fromAddress,tokenAddress:a,args:[s,o],method:"transfer",abi:q.getERC20Abi(a),chainNamespace:g.CHAIN.EVM})??void 0}async function de(n,e){if(n!==g.CHAIN.SOLANA)throw new c(i.INVALID_CHAIN_NAMESPACE);if(!e.fromAddress)throw new c(i.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");const a=typeof e.amount=="string"?parseFloat(e.amount):e.amount;if(isNaN(a)||a<=0)throw new c(i.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!B.getProvider(n))throw new c(i.GENERIC_PAYMENT_ERROR,"No Solana provider available.");const r=await h.sendTransaction({chainNamespace:g.CHAIN.SOLANA,to:e.recipient,value:a,tokenMint:e.tokenMint});if(!r)throw new c(i.GENERIC_PAYMENT_ERROR,"Transaction failed.");return r}catch(s){throw s instanceof c?s:new c(i.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${s}`)}}const $=0,D="unknown",t=z({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),l={state:t,subscribe(n){return J(t,()=>n(t))},subscribeKey(n,e){return X(t,n,e)},async handleOpenPay(n){this.resetState(),this.setPaymentConfig(n),this.subscribeEvents(),this.initializeAnalytics(),t.isConfigured=!0,_.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:t.exchanges,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount}}}),await b.open({view:"Pay"})},resetState(){t.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},t.recipient="0x0",t.amount=0,t.isConfigured=!1,t.error=null,t.isPaymentInProgress=!1,t.isLoading=!1,t.currentPayment=void 0},setPaymentConfig(n){if(!n.paymentAsset)throw new c(i.INVALID_PAYMENT_CONFIG);try{t.paymentAsset=n.paymentAsset,t.recipient=n.recipient,t.amount=n.amount,t.openInNewTab=n.openInNewTab??!0,t.redirectUrl=n.redirectUrl,t.payWithExchange=n.payWithExchange,t.error=null}catch(e){throw new c(i.INVALID_PAYMENT_CONFIG,e.message)}},getPaymentAsset(){return t.paymentAsset},getExchanges(){return t.exchanges},async fetchExchanges(){try{t.isLoading=!0;const n=await V({page:$,asset:k(t.paymentAsset.network,t.paymentAsset.asset),amount:t.amount.toString()});t.exchanges=n.exchanges.slice(0,2)}catch{throw T.showError(A.UNABLE_TO_GET_EXCHANGES),new c(i.UNABLE_TO_GET_EXCHANGES)}finally{t.isLoading=!1}},async getAvailableExchanges(n){try{const e=n?.asset&&n?.network?k(n.network,n.asset):void 0;return await V({page:n?.page??$,asset:e,amount:n?.amount?.toString()})}catch{throw new c(i.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(n,e,a=!1){try{const s=Number(e.amount),r=await ae({exchangeId:n,asset:k(e.network,e.asset),amount:s.toString(),recipient:`${e.network}:${e.recipient}`});return _.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:n},configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:s},currentPayment:{type:"exchange",exchangeId:n},headless:a}}),a&&(this.initiatePayment(),_.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:t.paymentId||D,configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:s},currentPayment:{type:"exchange",exchangeId:n}}})),r}catch(s){throw s instanceof Error&&s.message.includes("is not supported")?new c(i.ASSET_NOT_SUPPORTED):new Error(s.message)}},async openPayUrl(n,e,a=!1){try{const s=await this.getPayUrl(n.exchangeId,e,a);if(!s)throw new c(i.UNABLE_TO_GET_PAY_URL);const o=n.openInNewTab??!0?"_blank":"_self";return L.openHref(s.url,o),s}catch(s){throw s instanceof c?t.error=s.message:t.error=A.GENERIC_PAYMENT_ERROR,new c(i.UNABLE_TO_GET_PAY_URL)}},subscribeEvents(){t.isConfigured||(h.subscribeKey("connections",n=>{n.size>0&&this.handlePayment()}),E.subscribeKey("caipAddress",n=>{const e=h.hasAnyConnection(g.CONNECTOR_ID.WALLET_CONNECT);n&&(e?setTimeout(()=>{this.handlePayment()},100):this.handlePayment())}))},async handlePayment(){t.currentPayment={type:"wallet",status:"IN_PROGRESS"};const n=E.state.caipAddress;if(!n)return;const{chainId:e,address:a}=x.parseCaipAddress(n),s=y.state.activeChain;if(!a||!e||!s||!B.getProvider(s))return;const o=y.state.activeCaipNetwork;if(o&&!t.isPaymentInProgress)try{this.initiatePayment();const u=y.getAllRequestedCaipNetworks(),p=y.getAllApprovedCaipNetworkIds();switch(await ce({paymentAssetNetwork:t.paymentAsset.network,activeCaipNetwork:o,approvedCaipNetworkIds:p,requestedCaipNetworks:u}),await b.open({view:"PayLoading"}),s){case g.CHAIN.EVM:t.paymentAsset.asset==="native"&&(t.currentPayment.result=await ue(t.paymentAsset,s,{recipient:t.recipient,amount:t.amount,fromAddress:a})),t.paymentAsset.asset.startsWith("0x")&&(t.currentPayment.result=await le(t.paymentAsset,{recipient:t.recipient,amount:t.amount,fromAddress:a})),t.currentPayment.status="SUCCESS";break;case g.CHAIN.SOLANA:t.currentPayment.result=await de(s,{recipient:t.recipient,amount:t.amount,fromAddress:a,tokenMint:t.paymentAsset.asset==="native"?void 0:t.paymentAsset.asset}),t.currentPayment.status="SUCCESS";break;default:throw new c(i.INVALID_CHAIN_NAMESPACE)}}catch(u){u instanceof c?t.error=u.message:t.error=A.GENERIC_PAYMENT_ERROR,t.currentPayment.status="FAILED",T.showError(t.error)}finally{t.isPaymentInProgress=!1}},getExchangeById(n){return t.exchanges.find(e=>e.id===n)},validatePayConfig(n){const{paymentAsset:e,recipient:a,amount:s}=n;if(!e)throw new c(i.INVALID_PAYMENT_CONFIG);if(!a)throw new c(i.INVALID_RECIPIENT);if(!e.asset)throw new c(i.INVALID_ASSET);if(s==null||s<=0)throw new c(i.INVALID_AMOUNT)},handlePayWithWallet(){const n=E.state.caipAddress;if(!n){Y.push("Connect");return}const{chainId:e,address:a}=x.parseCaipAddress(n),s=y.state.activeChain;if(!a||!e||!s){Y.push("Connect");return}this.handlePayment()},async handlePayWithExchange(n){try{t.currentPayment={type:"exchange",exchangeId:n};const{network:e,asset:a}=t.paymentAsset,s={network:e,asset:a,amount:t.amount,recipient:t.recipient},r=await this.getPayUrl(n,s);if(!r)throw new c(i.UNABLE_TO_INITIATE_PAYMENT);return t.currentPayment.sessionId=r.sessionId,t.currentPayment.status="IN_PROGRESS",t.currentPayment.exchangeId=n,this.initiatePayment(),{url:r.url,openInNewTab:t.openInNewTab}}catch(e){return e instanceof c?t.error=e.message:t.error=A.GENERIC_PAYMENT_ERROR,t.isPaymentInProgress=!1,T.showError(t.error),null}},async getBuyStatus(n,e){try{const a=await se({sessionId:e,exchangeId:n});return(a.status==="SUCCESS"||a.status==="FAILED")&&_.sendEvent({type:"track",event:a.status==="SUCCESS"?"PAY_SUCCESS":"PAY_ERROR",properties:{source:"pay",paymentId:t.paymentId||D,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount},currentPayment:{type:"exchange",exchangeId:t.currentPayment?.exchangeId,sessionId:t.currentPayment?.sessionId,result:a.txHash}}}),a}catch{throw new c(i.UNABLE_TO_GET_BUY_STATUS)}},async updateBuyStatus(n,e){try{const a=await this.getBuyStatus(n,e);t.currentPayment&&(t.currentPayment.status=a.status,t.currentPayment.result=a.txHash),(a.status==="SUCCESS"||a.status==="FAILED")&&(t.isPaymentInProgress=!1)}catch{throw new c(i.UNABLE_TO_GET_BUY_STATUS)}},initiatePayment(){t.isPaymentInProgress=!0,t.paymentId=crypto.randomUUID()},initializeAnalytics(){t.analyticsSet||(t.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",n=>{if(t.currentPayment?.status&&t.currentPayment.status!=="UNKNOWN"){const e={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[t.currentPayment.status];_.sendEvent({type:"track",event:e,properties:{source:"pay",paymentId:t.paymentId||D,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount},currentPayment:{type:t.currentPayment.type,exchangeId:t.currentPayment.exchangeId,sessionId:t.currentPayment.sessionId,result:t.currentPayment.result}}})}}))}},pe=F`
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }

  .token-display {
    padding: var(--wui-spacing-s) var(--wui-spacing-m);
    border-radius: var(--wui-border-radius-s);
    background-color: var(--wui-color-bg-125);
    margin-top: var(--wui-spacing-s);
    margin-bottom: var(--wui-spacing-s);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--wui-spacing-xs);
  }
`;var f=function(n,e,a,s){var r=arguments.length,o=r<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,a):s,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,a,s);else for(var p=n.length-1;p>=0;p--)(u=n[p])&&(o=(r<3?u(o):r>3?u(e,a,o):u(e,a))||o);return r>3&&o&&Object.defineProperty(e,a,o),o};let m=class extends H{constructor(){super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=l.state.exchanges,this.isLoading=l.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=E.state.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(l.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(l.subscribeKey("isLoading",e=>this.isLoading=e)),this.unsubscribe.push(E.subscribe(e=>this.connectedWalletInfo=e.connectedWalletInfo)),l.fetchExchanges()}get isWalletConnected(){return E.state.status==="connected"}render(){return d`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","l","l","l"]} gap="s">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="s">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const e=l.getPaymentAsset();this.networkName=e.network,this.tokenSymbol=e.metadata.symbol,this.amount=l.state.amount.toString()}renderPayWithWallet(){return oe(this.networkName)?d`<wui-flex flexDirection="column" gap="s">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:d``}renderPaymentHeader(){let e=this.networkName;if(this.networkName){const s=y.getAllRequestedCaipNetworks().find(r=>r.caipNetworkId===this.networkName);s&&(e=s.name)}return d`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="xs">
          <wui-text variant="large-700" color="fg-100">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="xxs">
            <wui-text variant="paragraph-600" color="fg-100">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${e?d`
                  <wui-text variant="small-500" color="fg-200"> on ${e} </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){const e=this.connectedWalletInfo?.name||"connected wallet";return d`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        data-testid="wallet-payment-option"
      >
        <wui-flex alignItems="center" gap="s">
          <wui-wallet-image
            size="sm"
            imageSrc=${R(this.connectedWalletInfo?.icon)}
            name=${R(this.connectedWalletInfo?.name)}
          ></wui-wallet-image>
          <wui-text variant="paragraph-500" color="inherit">Pay with ${e}</wui-text>
        </wui-flex>
      </wui-list-item>

      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="disconnect"
        @click=${this.onDisconnect}
        data-testid="disconnect-button"
        ?chevron=${!1}
      >
        <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
      </wui-list-item>
    `}renderDisconnectedView(){return d`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="walletPlaceholder"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="paragraph-500" color="inherit">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:this.exchanges.length===0?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="paragraph-500" color="fg-100">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(e=>d`
        <wui-list-item
          @click=${()=>this.onExchangePayment(e.id)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          ?disabled=${this.loadingExchangeId!==null}
        >
          <wui-flex alignItems="center" gap="s">
            ${this.loadingExchangeId===e.id?d`<wui-loading-spinner color="accent-100" size="md"></wui-loading-spinner>`:d`<wui-wallet-image
                  size="sm"
                  imageSrc=${R(e.imageUrl)}
                  name=${e.name}
                ></wui-wallet-image>`}
            <wui-text flexGrow="1" variant="paragraph-500" color="inherit"
              >Pay with ${e.name} <wui-spinner size="sm" color="fg-200"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){l.handlePayWithWallet()}async onExchangePayment(e){try{this.loadingExchangeId=e;const a=await l.handlePayWithExchange(e);a&&(await b.open({view:"PayLoading"}),L.openHref(a.url,a.openInNewTab?"_blank":"_self"))}catch(a){console.error("Failed to pay with exchange",a),T.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(e){e.stopPropagation();try{await h.disconnect()}catch{console.error("Failed to disconnect"),T.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}};m.styles=pe;f([w()],m.prototype,"amount",void 0);f([w()],m.prototype,"tokenSymbol",void 0);f([w()],m.prototype,"networkName",void 0);f([w()],m.prototype,"exchanges",void 0);f([w()],m.prototype,"isLoading",void 0);f([w()],m.prototype,"loadingExchangeId",void 0);f([w()],m.prototype,"connectedWalletInfo",void 0);m=f([K("w3m-pay-view")],m);const me=F`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }
`;var U=function(n,e,a,s){var r=arguments.length,o=r<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,a):s,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,a,s);else for(var p=n.length-1;p>=0;p--)(u=n[p])&&(o=(r<3?u(o):r>3?u(e,a,o):u(e,a))||o);return r>3&&o&&Object.defineProperty(e,a,o),o};const we=4e3;let I=class extends H{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=l.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return d`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center"> ${this.getStateIcon()} </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            ${this.loadingMessage}
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            ${this.subMessage}
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}updateMessages(){switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;case"in-progress":default:l.state.currentPayment?.type==="exchange"?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet");break}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();case"in-progress":default:return this.loaderTemplate()}}setupExchangeSubscription(){l.state.currentPayment?.type==="exchange"&&(this.exchangeSubscription=setInterval(async()=>{const e=l.state.currentPayment?.exchangeId,a=l.state.currentPayment?.sessionId;e&&a&&(await l.updateBuyStatus(e,a),l.state.currentPayment?.status==="SUCCESS"&&clearInterval(this.exchangeSubscription))},we))}setupSubscription(){l.subscribeKey("isPaymentInProgress",e=>{!e&&this.paymentState==="in-progress"&&(l.state.error||!l.state.currentPayment?.result?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{h.state.status!=="disconnected"&&b.close()},3e3))}),l.subscribeKey("error",e=>{e&&this.paymentState==="in-progress"&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const e=Z.state.themeVariables["--w3m-border-radius-master"],a=e?parseInt(e.replace("px",""),10):4,s=this.getPaymentIcon();return d`
      <wui-flex justifyContent="center" alignItems="center" style="position: relative;">
        ${s?d`<wui-wallet-image size="lg" imageSrc=${s}></wui-wallet-image>`:null}
        <wui-loading-thumbnail radius=${a*9}></wui-loading-thumbnail>
      </wui-flex>
    `}getPaymentIcon(){const e=l.state.currentPayment;if(e){if(e.type==="exchange"){const a=e.exchangeId;if(a)return l.getExchangeById(a)?.imageUrl}if(e.type==="wallet"){const a=E.state.connectedWalletInfo?.icon;if(a)return a;const s=y.state.activeChain;if(!s)return;const r=G.getConnectorId(s);if(!r)return;const o=G.getConnectorById(r);return o?Q.getConnectorImage(o):void 0}}}successTemplate(){return d`<wui-icon size="xl" color="success-100" name="checkmark"></wui-icon>`}errorTemplate(){return d`<wui-icon size="xl" color="error-100" name="close"></wui-icon>`}};I.styles=me;U([w()],I.prototype,"loadingMessage",void 0);U([w()],I.prototype,"subMessage",void 0);U([w()],I.prototype,"paymentState",void 0);I=U([K("w3m-pay-loading-view")],I);const ye=3e5;async function he(n){return l.handleOpenPay(n)}async function Oe(n,e=ye){if(e<=0)throw new c(i.INVALID_PAYMENT_CONFIG,"Timeout must be greater than 0");try{await he(n)}catch(a){throw a instanceof c?a:new c(i.UNABLE_TO_INITIATE_PAYMENT,a.message)}return new Promise((a,s)=>{let r=!1;const o=setTimeout(()=>{r||(r=!0,S(),s(new c(i.GENERIC_PAYMENT_ERROR,"Payment timeout")))},e);function u(){if(r)return;const C=l.state.currentPayment,v=l.state.error,j=l.state.isPaymentInProgress;if(C?.status==="SUCCESS"){r=!0,S(),clearTimeout(o),a({success:!0,result:C.result});return}if(C?.status==="FAILED"){r=!0,S(),clearTimeout(o),a({success:!1,error:v||"Payment failed"});return}v&&!j&&!C&&(r=!0,S(),clearTimeout(o),a({success:!1,error:v}))}const p=O("currentPayment",u),N=O("error",u),P=O("isPaymentInProgress",u),S=fe([p,N,P]);u()})}function Le(){return l.getExchanges()}function Me(){return l.state.currentPayment?.result}function Ye(){return l.state.error}function Ge(){return l.state.isPaymentInProgress}function O(n,e){return l.subscribeKey(n,e)}function fe(n){return()=>{n.forEach(e=>{try{e()}catch{}})}}const Ve={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},$e={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},We={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},Be={network:"eip155:1",asset:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},Fe={network:"eip155:10",asset:"0x0b2c639c533813f4aa9d7837caf62653d097ff85",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},He={network:"eip155:42161",asset:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},Ke={network:"eip155:137",asset:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},je={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},qe={network:"eip155:1",asset:"0xdAC17F958D2ee523a2206206994597C13D831ec7",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},ze={network:"eip155:10",asset:"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Xe={network:"eip155:42161",asset:"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Je={network:"eip155:137",asset:"0xc2132d05d31c914a87c6611c10748aeb04b58e8f",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Ze={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",metadata:{name:"Tether USD",symbol:"USDT",decimals:6}},Qe={network:"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",asset:"native",metadata:{name:"Solana",symbol:"SOL",decimals:9}};export{I as W3mPayLoadingView,m as W3mPayView,He as arbitrumUSDC,Xe as arbitrumUSDT,Ve as baseETH,We as baseSepoliaETH,$e as baseUSDC,Be as ethereumUSDC,qe as ethereumUSDT,Le as getExchanges,Ge as getIsPaymentInProgress,Ye as getPayError,Me as getPayResult,he as openPay,Fe as optimismUSDC,ze as optimismUSDT,Oe as pay,Ke as polygonUSDC,Je as polygonUSDT,Qe as solanaSOL,je as solanaUSDC,Ze as solanaUSDT};

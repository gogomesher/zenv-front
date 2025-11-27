import{u as _,t as w,bb as u,bc as R,ak as y,x as l,ae as k,$ as v,ah as M,X as N,Y as z,Z as V,Q as P,a1 as U,U as q,ai as Y,T as D,a6 as H}from"./chain_config-D8DYnceI.js";import{r as c,n as d}from"./class-map-gEppeFCC.js";import{o as m}from"./if-defined-B79U8La_.js";import{c as g}from"./index-CAF11AxJ.js";import"./index-OpFv50mv.js";import{O as E}from"./index-CDzzw6KV.js";import"./index-BP5oJskm.js";import"./index-BBtbNsVY.js";import"./index-DSM72A0H.js";import"./index-EZZbECL9.js";import"./index-Bdd7oWFu.js";import"./index-CLIq9jXF.js";import"./index-S9s5RHv-.js";import"./index-C7IIus8o.js";import"./index-YqlQsqF-.js";import"./ref-Dfiam_TO.js";import"./async-directive-vLOJ1iU1.js";import"./ConstantsUtil-Dmg8YACJ.js";const Q=_`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var W=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let O=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=u.state.paymentCurrency,this.currencies=u.state.paymentCurrencies,this.currencyImages=R.state.currencyImages,this.checked=E.state.isLegalCheckboxChecked,this.unsubscribe.push(u.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),R.subscribeKey("currencyImages",e=>this.currencyImages=e),E.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{termsConditionsUrl:e,privacyPolicyUrl:i}=y.state,r=y.state.features?.legalCheckbox,o=!!(e||i)&&!!r&&!this.checked;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${m(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.currencies.map(i=>l`
        <wui-list-item
          imageSrc=${m(this.currencyImages?.[i.id])}
          @click=${()=>this.selectCurrency(i)}
          variant="image"
          tabIdx=${m(e?-1:void 0)}
        >
          <wui-text variant="paragraph-500" color="fg-100">${i.id}</wui-text>
        </wui-list-item>
      `)}selectCurrency(e){e&&(u.setPaymentCurrency(e),k.close())}};O.styles=Q;W([c()],O.prototype,"selectedCurrency",void 0);W([c()],O.prototype,"currencies",void 0);W([c()],O.prototype,"currencyImages",void 0);W([c()],O.prototype,"checked",void 0);O=W([g("w3m-onramp-fiat-select-view")],O);const X=_`
  button {
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    border: none;
    outline: none;
    background-color: var(--wui-color-gray-glass-002);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--wui-spacing-s);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }

  .provider-image {
    width: var(--wui-spacing-3xl);
    min-width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    position: relative;
    overflow: hidden;
  }

  .provider-image::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  .network-icon {
    width: var(--wui-spacing-m);
    height: var(--wui-spacing-m);
    border-radius: calc(var(--wui-spacing-m) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
    transition: box-shadow var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: box-shadow;
  }

  button:hover .network-icon {
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-005),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var C=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let h=class extends w{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return l`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${m(this.name)} class="provider-image"></wui-visual>
        <wui-flex flexDirection="column" gap="4xs">
          <wui-text variant="paragraph-500" color="fg-100">${this.label}</wui-text>
          <wui-flex alignItems="center" justifyContent="flex-start" gap="l">
            <wui-text variant="tiny-500" color="fg-100">
              <wui-text variant="tiny-400" color="fg-200">Fees</wui-text>
              ${this.feeRange}
            </wui-text>
            <wui-flex gap="xxs">
              <wui-icon name="bank" size="xs" color="fg-150"></wui-icon>
              <wui-icon name="card" size="xs" color="fg-150"></wui-icon>
            </wui-flex>
            ${this.networksTemplate()}
          </wui-flex>
        </wui-flex>
        ${this.loading?l`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:l`<wui-icon name="chevronRight" color="fg-200" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){const i=v.getAllRequestedCaipNetworks()?.filter(r=>r?.assets?.imageId)?.slice(0,5);return l`
      <wui-flex class="networks">
        ${i?.map(r=>l`
            <wui-flex class="network-icon">
              <wui-image src=${m(M.getNetworkImage(r))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};h.styles=[X];C([d({type:Boolean})],h.prototype,"disabled",void 0);C([d()],h.prototype,"color",void 0);C([d()],h.prototype,"name",void 0);C([d()],h.prototype,"label",void 0);C([d()],h.prototype,"feeRange",void 0);C([d({type:Boolean})],h.prototype,"loading",void 0);C([d()],h.prototype,"onClick",void 0);h=C([g("w3m-onramp-provider-item")],h);const G=_`
  wui-flex {
    border-top: 1px solid var(--wui-color-gray-glass-005);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);
  }
`;var Z=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let S=class extends w{render(){const{termsConditionsUrl:e,privacyPolicyUrl:i}=y.state;return!e&&!i?null:l`
      <wui-flex
        .padding=${["m","s","s","s"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="s"
      >
        <wui-text color="fg-250" variant="small-400" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `}howDoesItWorkTemplate(){return l` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){N.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:z(v.state.activeChain)===V.ACCOUNT_TYPES.SMART_ACCOUNT}}),P.push("WhatIsABuy")}};S.styles=[G];S=Z([g("w3m-onramp-providers-footer")],S);var K=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let F=class extends w{constructor(){super(),this.unsubscribe=[],this.providers=u.state.providers,this.unsubscribe.push(u.subscribeKey("providers",e=>{this.providers=e}))}render(){return l`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(v.state.activeChain??"eip155")).map(e=>l`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){u.setSelectedProvider(e),P.push("BuyInProgress"),U.openHref(u.state.selectedProvider?.url||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),N.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:z(v.state.activeChain)===V.ACCOUNT_TYPES.SMART_ACCOUNT}})}};K([c()],F.prototype,"providers",void 0);F=K([g("w3m-onramp-providers-view")],F);const J=_`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var j=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let I=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=u.state.purchaseCurrencies,this.tokens=u.state.purchaseCurrencies,this.tokenImages=R.state.tokenImages,this.checked=E.state.isLegalCheckboxChecked,this.unsubscribe.push(u.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),R.subscribeKey("tokenImages",e=>this.tokenImages=e),E.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{termsConditionsUrl:e,privacyPolicyUrl:i}=y.state,r=y.state.features?.legalCheckbox,o=!!(e||i)&&!!r&&!this.checked;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${m(o?"disabled":void 0)}
      >
        ${this.currenciesTemplate(o)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.tokens.map(i=>l`
        <wui-list-item
          imageSrc=${m(this.tokenImages?.[i.symbol])}
          @click=${()=>this.selectToken(i)}
          variant="image"
          tabIdx=${m(e?-1:void 0)}
        >
          <wui-flex gap="3xs" alignItems="center">
            <wui-text variant="paragraph-500" color="fg-100">${i.name}</wui-text>
            <wui-text variant="small-400" color="fg-200">${i.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `)}selectToken(e){e&&(u.setPurchaseCurrency(e),k.close())}};I.styles=J;j([c()],I.prototype,"selectedCurrency",void 0);j([c()],I.prototype,"tokens",void 0);j([c()],I.prototype,"tokenImages",void 0);j([c()],I.prototype,"checked",void 0);I=j([g("w3m-onramp-token-select-view")],I);const ee=_`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-visual {
    width: var(--wui-wallet-image-size-lg);
    height: var(--wui-wallet-image-size-lg);
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    position: relative;
    overflow: hidden;
  }

  wui-visual::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity var(--wui-ease-out-power-2) var(--wui-duration-lg),
      transform var(--wui-ease-out-power-2) var(--wui-duration-lg);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
  }
`;var b=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let p=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=u.state.selectedProvider,this.uri=q.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(u.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){let e="Continue in external window";this.error?e="Buy failed":this.selectedOnRampProvider&&(e=`Buy in ${this.selectedOnRampProvider?.label}`);const i=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return l`
      <wui-flex
        data-error=${m(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${m(this.selectedOnRampProvider?.name)}
            size="lg"
            class="provider-image"
          >
          </wui-visual>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${e}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${i}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="fg-200">
          <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,U.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){return this.selectedOnRampProvider?.url?l`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=Y.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){if(!this.selectedOnRampProvider?.url){D.showError("No link found"),P.goBack();return}try{U.copyToClopboard(this.selectedOnRampProvider.url),D.showSuccess("Link copied")}catch{D.showError("Failed to copy")}}};p.styles=ee;b([c()],p.prototype,"intervalId",void 0);b([c()],p.prototype,"selectedOnRampProvider",void 0);b([c()],p.prototype,"uri",void 0);b([c()],p.prototype,"ready",void 0);b([c()],p.prototype,"showRetry",void 0);b([c()],p.prototype,"buffering",void 0);b([c()],p.prototype,"error",void 0);b([d({type:Boolean})],p.prototype,"isMobile",void 0);b([d()],p.prototype,"onRetry",void 0);p=b([g("w3m-buy-in-progress-view")],p);var te=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let L=class extends w{render(){return l`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","3xl","xl","3xl"]}
        alignItems="center"
        gap="xl"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="xs" alignItems="center">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Quickly and easily buy digital assets!
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Simply select your preferred onramp provider and add digital assets to your account
            using your credit card or bank transfer
          </wui-text>
        </wui-flex>
        <wui-button @click=${P.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};L=te([g("w3m-what-is-a-buy-view")],L);var B=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let T=class extends w{constructor(){super(),this.unsubscribe=[],this.namespace=v.state.activeChain,this.features=y.state.features,this.remoteFeatures=y.state.remoteFeatures,this.unsubscribe.push(y.subscribeKey("features",e=>this.features=e),y.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e),v.subscribeKey("activeChain",e=>this.namespace=e),v.subscribeKey("activeCaipNetwork",e=>{e?.chainNamespace&&(this.namespace=e?.chainNamespace)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" .padding=${["0","s","xl","s"]} gap="xs">
        ${this.onrampTemplate()} ${this.receiveTemplate()} ${this.depositFromExchangeTemplate()}
      </wui-flex>
    `}onrampTemplate(){if(!this.namespace)return null;const e=this.remoteFeatures?.onramp,i=H.ONRAMP_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace);return!e||!i?null:l`
      <wui-list-description
        @click=${this.onBuyCrypto.bind(this)}
        text="Buy crypto"
        icon="card"
        iconColor="success-100"
        iconBackgroundColor="success-100"
        data-testid="wallet-features-onramp-button"
      ></wui-list-description>
    `}depositFromExchangeTemplate(){return this.remoteFeatures?.payWithExchange?l`
      <wui-list-description
        @click=${this.onDepositFromExchange.bind(this)}
        text="Deposit from exchange"
        icon="download"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="wallet-features-deposit-from-exchange-button"
      ></wui-list-description>
    `:null}receiveTemplate(){return!this.features?.receive?null:l`
      <wui-list-description
        @click=${this.onReceive.bind(this)}
        text="Receive funds"
        icon="qrCode"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="wallet-features-receive-button"
      ></wui-list-description>
    `}onBuyCrypto(){P.push("OnRampProviders")}onReceive(){P.push("WalletReceive")}onDepositFromExchange(){P.push("PayWithExchange")}};B([c()],T.prototype,"namespace",void 0);B([c()],T.prototype,"features",void 0);B([c()],T.prototype,"remoteFeatures",void 0);T=B([g("w3m-fund-wallet-view")],T);const ie=_`
  :host {
    width: 100%;
  }

  wui-loading-spinner {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
  }

  .currency-container {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: var(--wui-spacing-1xs);
    height: 40px;
    padding: var(--wui-spacing-xs) var(--wui-spacing-1xs) var(--wui-spacing-xs)
      var(--wui-spacing-xs);
    min-width: 95px;
    border-radius: var(--FULL, 1000px);
    border: 1px solid var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    cursor: pointer;
  }

  .currency-container > wui-image {
    height: 24px;
    width: 24px;
    border-radius: 50%;
  }
`;var A=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let x=class extends w{constructor(){super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=this.currencies?.[0],this.currencyImages=R.state.currencyImages,this.tokenImages=R.state.tokenImages,this.unsubscribe.push(u.subscribeKey("purchaseCurrency",e=>{!e||this.type==="Fiat"||(this.selectedCurrency=this.formatPurchaseCurrency(e))}),u.subscribeKey("paymentCurrency",e=>{!e||this.type==="Token"||(this.selectedCurrency=this.formatPaymentCurrency(e))}),u.subscribe(e=>{this.type==="Fiat"?this.currencies=e.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=e.paymentCurrencies.map(this.formatPaymentCurrency)}),R.subscribe(e=>{this.currencyImages={...e.currencyImages},this.tokenImages={...e.tokenImages}}))}firstUpdated(){u.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.selectedCurrency?.symbol||"",i=this.currencyImages[e]||this.tokenImages[e];return l`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?l` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${()=>k.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${m(i)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:l`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};x.styles=ie;A([d({type:String})],x.prototype,"type",void 0);A([d({type:Number})],x.prototype,"value",void 0);A([c()],x.prototype,"currencies",void 0);A([c()],x.prototype,"selectedCurrency",void 0);A([c()],x.prototype,"currencyImages",void 0);A([c()],x.prototype,"tokenImages",void 0);x=A([g("w3m-onramp-input")],x);const re=_`
  :host > wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > wui-flex {
    border-radius: var(--wui-border-radius-l);
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`;var $=function(s,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,r);else for(var a=s.length-1;a>=0;a--)(o=s[a])&&(t=(n<3?o(t):n>3?o(e,i,t):o(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};const oe={USD:"$",EUR:"€",GBP:"£"},ne=[100,250,500,1e3];let f=class extends w{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=v.state.activeCaipAddress,this.loading=k.state.loading,this.paymentCurrency=u.state.paymentCurrency,this.paymentAmount=u.state.paymentAmount,this.purchaseAmount=u.state.purchaseAmount,this.quoteLoading=u.state.quotesLoading,this.unsubscribe.push(v.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),k.subscribeKey("loading",e=>{this.loading=e}),u.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center">
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <w3m-onramp-input
            type="Fiat"
            @inputChange=${this.onPaymentAmountChange.bind(this)}
            .value=${this.paymentAmount||0}
          ></w3m-onramp-input>
          <w3m-onramp-input
            type="Token"
            .value=${this.purchaseAmount||0}
            .loading=${this.quoteLoading}
          ></w3m-onramp-input>
          <wui-flex justifyContent="space-evenly" class="amounts-container" gap="xs">
            ${ne.map(e=>l`<wui-button
                  variant=${this.paymentAmount===e?"accent":"neutral"}
                  size="md"
                  textVariant="paragraph-600"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${oe[this.paymentCurrency?.id||"USD"]} ${e}`}</wui-button
                >`)}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?l`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="main"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:l`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||k.open({view:"OnRampProviders"})}openModal(){k.open({view:"Connect"})}async onPaymentAmountChange(e){u.setPaymentAmount(Number(e.detail)),await u.getQuote()}async selectPresetAmount(e){u.setPaymentAmount(e),await u.getQuote()}};f.styles=re;$([d({type:Boolean})],f.prototype,"disabled",void 0);$([c()],f.prototype,"caipAddress",void 0);$([c()],f.prototype,"loading",void 0);$([c()],f.prototype,"paymentCurrency",void 0);$([c()],f.prototype,"paymentAmount",void 0);$([c()],f.prototype,"purchaseAmount",void 0);$([c()],f.prototype,"quoteLoading",void 0);f=$([g("w3m-onramp-widget")],f);export{p as W3mBuyInProgressView,T as W3mFundWalletView,F as W3mOnRampProvidersView,O as W3mOnrampFiatSelectView,I as W3mOnrampTokensView,f as W3mOnrampWidget,L as W3mWhatIsABuyView};

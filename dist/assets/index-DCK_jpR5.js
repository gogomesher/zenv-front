import{l as T,n as I,x as c,r as M,C as R,b0 as p,a as S,R as U,O as B,E as Y,u as G,W as P}from"./index-B0RynRNr.js";import{n as u,r as A}from"./class-map-BKD9lMKe.js";import{U as k,c as D}from"./index-Brwreh6R.js";import{d as $,r as q,u as V,e as W}from"./updateLocale-Bqtx8hr2.js";import"./index-CLA-e8Vm.js";import"./index-eqXWN7Qt.js";import{o as H}from"./if-defined-BrvS5P3j.js";import"./index-CQdhTG8K.js";import"./index-C61pHmi_.js";$.extend(q);$.extend(V);const K={...W,name:"en-web3-modal",relativeTime:{future:"in %s",past:"%s ago",s:"%d sec",m:"1 min",mm:"%d min",h:"1 hr",hh:"%d hrs",d:"1 d",dd:"%d d",M:"1 mo",MM:"%d mo",y:"1 yr",yy:"%d yr"}},J=["January","February","March","April","May","June","July","August","September","October","November","December"];$.locale("en-web3-modal",K);const z={getMonthNameByIndex(e){return J[e]},getYear(e=new Date().toISOString()){return $(e).year()},getRelativeDateFromNow(e){return $(e).locale("en-web3-modal").fromNow(!0)},formatDate(e,t="DD MMM"){return $(e).format(t)}},Q=3,C=.1,X=["receive","deposit","borrow","claim"],Z=["withdraw","repay","burn"],v={getTransactionGroupTitle(e,t){const r=z.getYear(),n=z.getMonthNameByIndex(t);return e===r?n:`${n} ${e}`},getTransactionImages(e){const[t]=e;return e?.length>1?e.map(n=>this.getTransactionImage(n)):[this.getTransactionImage(t)]},getTransactionImage(e){return{type:v.getTransactionTransferTokenType(e),url:v.getTransactionImageURL(e)}},getTransactionImageURL(e){let t;const r=!!e?.nft_info,n=!!e?.fungible_info;return e&&r?t=e?.nft_info?.content?.preview?.url:e&&n&&(t=e?.fungible_info?.icon?.url),t},getTransactionTransferTokenType(e){if(e?.fungible_info)return"FUNGIBLE";if(e?.nft_info)return"NFT"},getTransactionDescriptions(e,t){const r=e?.metadata?.operationType,n=t||e?.transfers,s=n?.length>0,i=n?.length>1,o=s&&n?.every(O=>!!O?.fungible_info),[a,l]=n;let d=this.getTransferDescription(a),m=this.getTransferDescription(l);if(!s)return(r==="send"||r==="receive")&&o?(d=k.getTruncateString({string:e?.metadata.sentFrom,charsStart:4,charsEnd:6,truncate:"middle"}),m=k.getTruncateString({string:e?.metadata.sentTo,charsStart:4,charsEnd:6,truncate:"middle"}),[d,m]):[e.metadata.status];if(i)return n.map(O=>this.getTransferDescription(O));let N="";return X.includes(r)?N="+":Z.includes(r)&&(N="-"),d=N.concat(d),[d]},getTransferDescription(e){let t="";return e&&(e?.nft_info?t=e?.nft_info?.name||"-":e?.fungible_info&&(t=this.getFungibleTransferDescription(e)||"-")),t},getFungibleTransferDescription(e){return e?[this.getQuantityFixedValue(e?.quantity.numeric),e?.fungible_info?.symbol].join(" ").trim():null},mergeTransfers(e){if(e?.length<=1)return e;const r=this.filterGasFeeTransfers(e).reduce((s,i)=>{const o=i?.fungible_info?.name,a=s.find(({fungible_info:l,direction:d})=>o&&o===l?.name&&d===i.direction);if(a){const l=Number(a.quantity.numeric)+Number(i.quantity.numeric);a.quantity.numeric=l.toString(),a.value=(a.value||0)+(i.value||0)}else s.push(i);return s},[]);let n=r;return r.length>2&&(n=r.sort((s,i)=>(i.value||0)-(s.value||0)).slice(0,2)),n=n.sort((s,i)=>s.direction==="out"&&i.direction==="in"?-1:s.direction==="in"&&i.direction==="out"?1:0),n},filterGasFeeTransfers(e){const t=e.reduce((n,s)=>{const i=s?.fungible_info?.name;return i&&(n[i]||(n[i]=[]),n[i].push(s)),n},{}),r=[];return Object.values(t).forEach(n=>{if(n.length===1){const s=n[0];s&&r.push(s)}else{const s=n.filter(o=>o.direction==="in"),i=n.filter(o=>o.direction==="out");if(s.length===1&&i.length===1){const o=s[0],a=i[0];let l=!1;if(o&&a){const d=Number(o.quantity.numeric),m=Number(a.quantity.numeric);m<d*C?(r.push(o),l=!0):d<m*C&&(r.push(a),l=!0)}l||r.push(...n)}else{const o=this.filterGasFeesFromTokenGroup(n);r.push(...o)}}}),e.forEach(n=>{n?.fungible_info?.name||r.push(n)}),r},filterGasFeesFromTokenGroup(e){if(e.length<=1)return e;const t=e.map(a=>Number(a.quantity.numeric)),r=Math.max(...t),n=Math.min(...t),s=.01;if(n<r*s)return e.filter(l=>Number(l.quantity.numeric)>=r*s);const i=e.filter(a=>a.direction==="in"),o=e.filter(a=>a.direction==="out");if(i.length===1&&o.length===1){const a=i[0],l=o[0];if(a&&l){const d=Number(a.quantity.numeric),m=Number(l.quantity.numeric);if(m<d*C)return[a];if(d<m*C)return[l]}}return e},getQuantityFixedValue(e){return e?parseFloat(e).toFixed(Q):null}};var j;(function(e){e.approve="approved",e.bought="bought",e.borrow="borrowed",e.burn="burnt",e.cancel="canceled",e.claim="claimed",e.deploy="deployed",e.deposit="deposited",e.execute="executed",e.mint="minted",e.receive="received",e.repay="repaid",e.send="sent",e.sell="sold",e.stake="staked",e.trade="swapped",e.unstake="unstaked",e.withdraw="withdrawn"})(j||(j={}));const ee=T`
  :host > wui-flex {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 40px;
    height: 40px;
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.core.glass010};
    background-color: ${({tokens:e})=>e.core.glass010};
  }

  :host([data-no-images='true']) > wui-flex {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[3]} !important;
  }

  :host > wui-flex wui-image {
    display: block;
  }

  :host > wui-flex,
  :host > wui-flex wui-image,
  .swap-images-container,
  .swap-images-container.nft,
  wui-image.nft {
    border-top-left-radius: var(--local-left-border-radius);
    border-top-right-radius: var(--local-right-border-radius);
    border-bottom-left-radius: var(--local-left-border-radius);
    border-bottom-right-radius: var(--local-right-border-radius);
  }

  wui-icon {
    width: 20px;
    height: 20px;
  }

  .swap-images-container {
    position: relative;
    width: 40px;
    height: 40px;
    overflow: hidden;
  }

  .swap-images-container wui-image:first-child {
    position: absolute;
    width: 40px;
    height: 40px;
    top: 0;
    left: 0%;
    clip-path: inset(0px calc(50% + 2px) 0px 0%);
  }

  .swap-images-container wui-image:last-child {
    clip-path: inset(0px 0px 0px calc(50% + 2px));
  }

  wui-flex.status-box {
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(20%, 20%);
    border-radius: ${({borderRadius:e})=>e[4]};
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: 0 0 0 2px ${({tokens:e})=>e.theme.backgroundPrimary};
    overflow: hidden;
    width: 16px;
    height: 16px;
  }
`;var y=function(e,t,r,n){var s=arguments.length,i=s<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(e,t,r,n);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(i=(s<3?o(i):s>3?o(t,r,i):o(t,r))||i);return s>3&&i&&Object.defineProperty(t,r,i),i};let f=class extends I{constructor(){super(...arguments),this.images=[],this.secondImage={type:void 0,url:""}}render(){const[t,r]=this.images;this.images.length||(this.dataset.noImages="true");const n=t?.type==="NFT",s=r?.url?r.type==="NFT":n,i=n?"var(--apkt-borderRadius-3)":"var(--apkt-borderRadius-5)",o=s?"var(--apkt-borderRadius-3)":"var(--apkt-borderRadius-5)";return this.style.cssText=`
    --local-left-border-radius: ${i};
    --local-right-border-radius: ${o};
    `,c`<wui-flex> ${this.templateVisual()} ${this.templateIcon()} </wui-flex>`}templateVisual(){const[t,r]=this.images,n=t?.type;return this.images.length===2&&(t?.url||r?.url)?c`<div class="swap-images-container">
        ${t?.url?c`<wui-image src=${t.url} alt="Transaction image"></wui-image>`:null}
        ${r?.url?c`<wui-image src=${r.url} alt="Transaction image"></wui-image>`:null}
      </div>`:t?.url?c`<wui-image src=${t.url} alt="Transaction image"></wui-image>`:n==="NFT"?c`<wui-icon size="inherit" color="default" name="nftPlaceholder"></wui-icon>`:c`<wui-icon size="inherit" color="default" name="coinPlaceholder"></wui-icon>`}templateIcon(){let t="accent-primary",r;return r=this.getIcon(),this.status&&(t=this.getStatusColor()),r?c`
      <wui-flex alignItems="center" justifyContent="center" class="status-box">
        <wui-icon-box size="sm" color=${t} icon=${r}></wui-icon-box>
      </wui-flex>
    `:null}getDirectionIcon(){switch(this.direction){case"in":return"arrowBottom";case"out":return"arrowTop";default:return}}getIcon(){return this.onlyDirectionIcon?this.getDirectionIcon():this.type==="trade"?"swapHorizontal":this.type==="approve"?"checkmark":this.type==="cancel"?"close":this.getDirectionIcon()}getStatusColor(){switch(this.status){case"confirmed":return"success";case"failed":return"error";case"pending":return"inverse";default:return"accent-primary"}}};f.styles=[ee];y([u()],f.prototype,"type",void 0);y([u()],f.prototype,"status",void 0);y([u()],f.prototype,"direction",void 0);y([u({type:Boolean})],f.prototype,"onlyDirectionIcon",void 0);y([u({type:Array})],f.prototype,"images",void 0);y([u({type:Object})],f.prototype,"secondImage",void 0);f=y([D("wui-transaction-visual")],f);const te=T`
  :host {
    width: 100%;
  }

  :host > wui-flex:first-child {
    align-items: center;
    column-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    width: 100%;
  }

  :host > wui-flex:first-child wui-text:nth-child(1) {
    text-transform: capitalize;
  }

  wui-transaction-visual {
    width: 40px;
    height: 40px;
  }

  wui-flex {
    flex: 1;
  }

  :host wui-flex wui-flex {
    overflow: hidden;
  }

  :host .description-container wui-text span {
    word-break: break-all;
  }

  :host .description-container wui-text {
    overflow: hidden;
  }

  :host .description-separator-icon {
    margin: 0px 6px;
  }

  :host wui-text > span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
`;var w=function(e,t,r,n){var s=arguments.length,i=s<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(e,t,r,n);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(i=(s<3?o(i):s>3?o(t,r,i):o(t,r))||i);return s>3&&i&&Object.defineProperty(t,r,i),i};let h=class extends I{constructor(){super(...arguments),this.type="approve",this.onlyDirectionIcon=!1,this.images=[]}render(){return c`
      <wui-flex>
        <wui-transaction-visual
          .status=${this.status}
          direction=${H(this.direction)}
          type=${this.type}
          .onlyDirectionIcon=${this.onlyDirectionIcon}
          .images=${this.images}
        ></wui-transaction-visual>
        <wui-flex flexDirection="column" gap="1">
          <wui-text variant="lg-medium" color="primary">
            ${j[this.type]||this.type}
          </wui-text>
          <wui-flex class="description-container">
            ${this.templateDescription()} ${this.templateSecondDescription()}
          </wui-flex>
        </wui-flex>
        <wui-text variant="sm-medium" color="secondary"><span>${this.date}</span></wui-text>
      </wui-flex>
    `}templateDescription(){const t=this.descriptions?.[0];return t?c`
          <wui-text variant="md-regular" color="secondary">
            <span>${t}</span>
          </wui-text>
        `:null}templateSecondDescription(){const t=this.descriptions?.[1];return t?c`
          <wui-icon class="description-separator-icon" size="sm" name="arrowRight"></wui-icon>
          <wui-text variant="md-regular" color="secondary">
            <span>${t}</span>
          </wui-text>
        `:null}};h.styles=[M,te];w([u()],h.prototype,"type",void 0);w([u({type:Array})],h.prototype,"descriptions",void 0);w([u()],h.prototype,"date",void 0);w([u({type:Boolean})],h.prototype,"onlyDirectionIcon",void 0);w([u()],h.prototype,"status",void 0);w([u()],h.prototype,"direction",void 0);w([u({type:Array})],h.prototype,"images",void 0);h=w([D("wui-transaction-list-item")],h);const ie=T`
  wui-flex {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  wui-image {
    border-radius: ${({borderRadius:e})=>e[128]};
  }

  .fallback-icon {
    color: ${({tokens:e})=>e.theme.iconInverse};
    border-radius: ${({borderRadius:e})=>e[3]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  .direction-icon,
  .status-image {
    position: absolute;
    right: 0;
    bottom: 0;
    border-radius: ${({borderRadius:e})=>e[128]};
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  .direction-icon {
    padding: ${({spacing:e})=>e["01"]};
    color: ${({tokens:e})=>e.core.iconSuccess};

    background-color: color-mix(
      in srgb,
      ${({tokens:e})=>e.core.textSuccess} 30%,
      ${({tokens:e})=>e.theme.backgroundPrimary} 70%
    );
  }

  /* -- Sizes --------------------------------------------------- */
  :host([data-size='sm']) > wui-image:not(.status-image),
  :host([data-size='sm']) > wui-flex {
    width: 24px;
    height: 24px;
  }

  :host([data-size='lg']) > wui-image:not(.status-image),
  :host([data-size='lg']) > wui-flex {
    width: 40px;
    height: 40px;
  }

  :host([data-size='sm']) .fallback-icon {
    height: 16px;
    width: 16px;
    padding: ${({spacing:e})=>e[1]};
  }

  :host([data-size='lg']) .fallback-icon {
    height: 32px;
    width: 32px;
    padding: ${({spacing:e})=>e[1]};
  }

  :host([data-size='sm']) .direction-icon,
  :host([data-size='sm']) .status-image {
    transform: translate(40%, 30%);
  }

  :host([data-size='lg']) .direction-icon,
  :host([data-size='lg']) .status-image {
    transform: translate(40%, 10%);
  }

  :host([data-size='sm']) .status-image {
    height: 14px;
    width: 14px;
  }

  :host([data-size='lg']) .status-image {
    height: 20px;
    width: 20px;
  }

  /* -- Crop effects --------------------------------------------------- */
  .swap-crop-left-image,
  .swap-crop-right-image {
    position: absolute;
    top: 0;
    bottom: 0;
  }

  .swap-crop-left-image {
    left: 0;
    clip-path: inset(0px calc(50% + 1.5px) 0px 0%);
  }

  .swap-crop-right-image {
    right: 0;
    clip-path: inset(0px 0px 0px calc(50% + 1.5px));
  }
`;var _=function(e,t,r,n){var s=arguments.length,i=s<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(e,t,r,n);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(i=(s<3?o(i):s>3?o(t,r,i):o(t,r))||i);return s>3&&i&&Object.defineProperty(t,r,i),i};const F={sm:"xxs",lg:"md"};let x=class extends I{constructor(){super(...arguments),this.type="approve",this.size="lg",this.statusImageUrl="",this.images=[]}render(){return c`<wui-flex>${this.templateVisual()} ${this.templateIcon()}</wui-flex>`}templateVisual(){switch(this.dataset.size=this.size,this.type){case"trade":return this.swapTemplate();case"fiat":return this.fiatTemplate();case"unknown":return this.unknownTemplate();default:return this.tokenTemplate()}}swapTemplate(){const[t,r]=this.images;return this.images.length===2&&(t||r)?c`
        <wui-image class="swap-crop-left-image" src=${t} alt="Swap image"></wui-image>
        <wui-image class="swap-crop-right-image" src=${r} alt="Swap image"></wui-image>
      `:t?c`<wui-image src=${t} alt="Swap image"></wui-image>`:null}fiatTemplate(){return c`<wui-icon
      class="fallback-icon"
      size=${F[this.size]}
      name="dollar"
    ></wui-icon>`}unknownTemplate(){return c`<wui-icon
      class="fallback-icon"
      size=${F[this.size]}
      name="questionMark"
    ></wui-icon>`}tokenTemplate(){const[t]=this.images;return t?c`<wui-image src=${t} alt="Token image"></wui-image> `:c`<wui-icon
      class="fallback-icon"
      name=${this.type==="nft"?"image":"coinPlaceholder"}
    ></wui-icon>`}templateIcon(){return this.statusImageUrl?c`<wui-image
        class="status-image"
        src=${this.statusImageUrl}
        alt="Status image"
      ></wui-image>`:c`<wui-icon
      class="direction-icon"
      size=${F[this.size]}
      name=${this.getTemplateIcon()}
    ></wui-icon>`}getTemplateIcon(){return this.type==="trade"?"arrowClockWise":"arrowBottom"}};x.styles=[ie];_([u()],x.prototype,"type",void 0);_([u()],x.prototype,"size",void 0);_([u()],x.prototype,"statusImageUrl",void 0);_([u({type:Array})],x.prototype,"images",void 0);x=_([D("wui-transaction-thumbnail")],x);const re=T`
  :host > wui-flex:first-child {
    gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
  }

  wui-flex {
    display: flex;
    flex: 1;
  }
`;var ne=function(e,t,r,n){var s=arguments.length,i=s<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(e,t,r,n);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(i=(s<3?o(i):s>3?o(t,r,i):o(t,r))||i);return s>3&&i&&Object.defineProperty(t,r,i),i};let L=class extends I{render(){return c`
      <wui-flex alignItems="center">
        <wui-shimmer width="40px" height="40px" rounded></wui-shimmer>
        <wui-flex flexDirection="column" gap="1">
          <wui-shimmer width="124px" height="16px" rounded></wui-shimmer>
          <wui-shimmer width="60px" height="14px" rounded></wui-shimmer>
        </wui-flex>
        <wui-shimmer width="24px" height="12px" rounded></wui-shimmer>
      </wui-flex>
    `}};L.styles=[M,re];L=ne([D("wui-transaction-list-item-loader")],L);const se=T`
  :host {
    min-height: 100%;
  }

  .group-container[last-group='true'] {
    padding-bottom: ${({spacing:e})=>e[3]};
  }

  .contentContainer {
    height: 280px;
  }

  .contentContainer > wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: ${({borderRadius:e})=>e[3]};
  }

  .contentContainer > .textContent {
    width: 65%;
  }

  .emptyContainer {
    height: 100%;
  }
`;var b=function(e,t,r,n){var s=arguments.length,i=s<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(e,t,r,n);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(i=(s<3?o(i):s>3?o(t,r,i):o(t,r))||i);return s>3&&i&&Object.defineProperty(t,r,i),i};const E="last-transaction",oe=7;let g=class extends I{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.page="activity",this.caipAddress=R.state.activeCaipAddress,this.transactionsByYear=p.state.transactionsByYear,this.loading=p.state.loading,this.empty=p.state.empty,this.next=p.state.next,p.clearCursor(),this.unsubscribe.push(R.subscribeKey("activeCaipAddress",t=>{t&&this.caipAddress!==t&&(p.resetTransactions(),p.fetchTransactions(t)),this.caipAddress=t}),R.subscribeKey("activeCaipNetwork",()=>{this.updateTransactionView()}),p.subscribe(t=>{this.transactionsByYear=t.transactionsByYear,this.loading=t.loading,this.empty=t.empty,this.next=t.next}))}firstUpdated(){this.updateTransactionView(),this.createPaginationObserver()}updated(){this.setPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return c` ${this.empty?null:this.templateTransactionsByYear()}
    ${this.loading?this.templateLoading():null}
    ${!this.loading&&this.empty?this.templateEmpty():null}`}updateTransactionView(){p.resetTransactions(),this.caipAddress&&p.fetchTransactions(S.getPlainAddress(this.caipAddress))}templateTransactionsByYear(){return Object.keys(this.transactionsByYear).sort().reverse().map(r=>{const n=parseInt(r,10),s=new Array(12).fill(null).map((i,o)=>{const a=v.getTransactionGroupTitle(n,o),l=this.transactionsByYear[n]?.[o];return{groupTitle:a,transactions:l}}).filter(({transactions:i})=>i).reverse();return s.map(({groupTitle:i,transactions:o},a)=>{const l=a===s.length-1;return o?c`
          <wui-flex
            flexDirection="column"
            class="group-container"
            last-group="${l?"true":"false"}"
            data-testid="month-indexes"
          >
            <wui-flex
              alignItems="center"
              flexDirection="row"
              .padding=${["2","3","3","3"]}
            >
              <wui-text variant="md-medium" color="secondary" data-testid="group-title">
                ${i}
              </wui-text>
            </wui-flex>
            <wui-flex flexDirection="column" gap="2">
              ${this.templateTransactions(o,l)}
            </wui-flex>
          </wui-flex>
        `:null})})}templateRenderTransaction(t,r){const{date:n,descriptions:s,direction:i,images:o,status:a,type:l,transfers:d,isAllNFT:m}=this.getTransactionListItemProps(t);return c`
      <wui-transaction-list-item
        date=${n}
        .direction=${i}
        id=${r&&this.next?E:""}
        status=${a}
        type=${l}
        .images=${o}
        .onlyDirectionIcon=${m||d.length===1}
        .descriptions=${s}
      ></wui-transaction-list-item>
    `}templateTransactions(t,r){return t.map((n,s)=>{const i=r&&s===t.length-1;return c`${this.templateRenderTransaction(n,i)}`})}emptyStateActivity(){return c`<wui-flex
      class="emptyContainer"
      flexGrow="1"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      .padding=${["10","5","10","5"]}
      gap="5"
      data-testid="empty-activity-state"
    >
      <wui-icon-box color="default" icon="wallet" size="xl"></wui-icon-box>
      <wui-flex flexDirection="column" alignItems="center" gap="2">
        <wui-text align="center" variant="lg-medium" color="primary">No Transactions yet</wui-text>
        <wui-text align="center" variant="lg-regular" color="secondary"
          >Start trading on dApps <br />
          to grow your wallet!</wui-text
        >
      </wui-flex>
    </wui-flex>`}emptyStateAccount(){return c`<wui-flex
      class="contentContainer"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap="4"
      data-testid="empty-account-state"
    >
      <wui-icon-box icon="swapHorizontal" size="lg" color="default"></wui-icon-box>
      <wui-flex
        class="textContent"
        gap="2"
        flexDirection="column"
        justifyContent="center"
        flexDirection="column"
      >
        <wui-text variant="md-regular" align="center" color="primary">No activity yet</wui-text>
        <wui-text variant="sm-regular" align="center" color="secondary"
          >Your next transactions will appear here</wui-text
        >
      </wui-flex>
      <wui-link @click=${this.onReceiveClick.bind(this)}>Trade</wui-link>
    </wui-flex>`}templateEmpty(){return this.page==="account"?c`${this.emptyStateAccount()}`:c`${this.emptyStateActivity()}`}templateLoading(){return this.page==="activity"?Array(oe).fill(c` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `).map(t=>t):null}onReceiveClick(){U.push("WalletReceive")}createPaginationObserver(){const{projectId:t}=B.state;this.paginationObserver=new IntersectionObserver(([r])=>{r?.isIntersecting&&!this.loading&&(p.fetchTransactions(S.getPlainAddress(this.caipAddress)),Y.sendEvent({type:"track",event:"LOAD_MORE_TRANSACTIONS",properties:{address:S.getPlainAddress(this.caipAddress),projectId:t,cursor:this.next,isSmartAccount:G(R.state.activeChain)===P.ACCOUNT_TYPES.SMART_ACCOUNT}}))},{}),this.setPaginationObserver()}setPaginationObserver(){this.paginationObserver?.disconnect();const t=this.shadowRoot?.querySelector(`#${E}`);t&&this.paginationObserver?.observe(t)}getTransactionListItemProps(t){const r=z.formatDate(t?.metadata?.minedAt),n=v.mergeTransfers(t?.transfers),s=v.getTransactionDescriptions(t,n),i=n?.[0],o=!!i&&n?.every(l=>!!l.nft_info),a=v.getTransactionImages(n);return{date:r,direction:i?.direction,descriptions:s,isAllNFT:o,images:a,status:t.metadata?.status,transfers:n,type:t.metadata?.operationType}}};g.styles=se;b([u()],g.prototype,"page",void 0);b([A()],g.prototype,"caipAddress",void 0);b([A()],g.prototype,"transactionsByYear",void 0);b([A()],g.prototype,"loading",void 0);b([A()],g.prototype,"empty",void 0);b([A()],g.prototype,"next",void 0);g=b([D("w3m-activity-list")],g);

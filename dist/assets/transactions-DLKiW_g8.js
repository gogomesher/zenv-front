import{u as f,t as a,x as m}from"./chain_config-D8DYnceI.js";import{c as p}from"./index-Cd3y1h9a.js";import"./index-CVRcUqwi.js";import"./class-map-gEppeFCC.js";import"./updateLocale-29SaZsIG.js";import"./index-DHFsNE39.js";import"./if-defined-B79U8La_.js";import"./index-D5ZHVyzg.js";import"./index-B45DtCSQ.js";import"./index-CyGrdyG0.js";const u=f`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var d=function(o,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,r);else for(var c=o.length-1;c>=0;c--)(l=o[c])&&(t=(n<3?l(t):n>3?l(e,i,t):l(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let s=class extends a{render(){return m`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=u;s=d([p("w3m-transactions-view")],s);export{s as W3mTransactionsView};

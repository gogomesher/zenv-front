import{u as c,t as f,x as p}from"./chain_config-D8DYnceI.js";import{c as a}from"./index-CAF11AxJ.js";import"./index-C5g0gt_S.js";import"./class-map-gEppeFCC.js";import"./updateLocale-29SaZsIG.js";import"./index-S9s5RHv-.js";import"./index-BP5oJskm.js";import"./async-directive-vLOJ1iU1.js";import"./index-Bdd7oWFu.js";import"./if-defined-B79U8La_.js";import"./index-BBtbNsVY.js";import"./index-CSdExni1.js";const u=c`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var d=function(o,i,e,r){var n=arguments.length,t=n<3?i:r===null?r=Object.getOwnPropertyDescriptor(i,e):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,i,e,r);else for(var m=o.length-1;m>=0;m--)(l=o[m])&&(t=(n<3?l(t):n>3?l(i,e,t):l(i,e))||t);return n>3&&t&&Object.defineProperty(i,e,t),t};let s=class extends f{render(){return p`
      <wui-flex flexDirection="column" .padding=${["0","m","m","m"]} gap="s">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=u;s=d([a("w3m-transactions-view")],s);export{s as W3mTransactionsView};

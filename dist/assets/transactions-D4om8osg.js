import{o as c,n as f,x as p}from"./index-B0RynRNr.js";import{c as a}from"./index-D1DpIkmA.js";import"./index-MiDnh25m.js";import"./class-map-BKD9lMKe.js";import"./updateLocale-Bqtx8hr2.js";import"./index-B2xGJ35h.js";import"./index-BAa-drCU.js";import"./async-directive-B406kvJw.js";import"./index-zHpK0vul.js";import"./if-defined-BrvS5P3j.js";import"./index-Cn9rIZ3w.js";import"./index-Btu9FXa8.js";const d=c`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var u=function(o,i,e,r){var n=arguments.length,t=n<3?i:r===null?r=Object.getOwnPropertyDescriptor(i,e):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,i,e,r);else for(var m=o.length-1;m>=0;m--)(l=o[m])&&(t=(n<3?l(t):n>3?l(i,e,t):l(i,e))||t);return n>3&&t&&Object.defineProperty(i,e,t),t};let s=class extends f{render(){return p`
      <wui-flex flexDirection="column" .padding=${["0","m","m","m"]} gap="s">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=d;s=u([a("w3m-transactions-view")],s);export{s as W3mTransactionsView};

import{o as f,n as a,x as m}from"./index-B0RynRNr.js";import{c as p}from"./index-Brwreh6R.js";import"./index-DCK_jpR5.js";import"./class-map-BKD9lMKe.js";import"./updateLocale-Bqtx8hr2.js";import"./index-CLA-e8Vm.js";import"./if-defined-BrvS5P3j.js";import"./index-eqXWN7Qt.js";import"./index-CQdhTG8K.js";import"./index-C61pHmi_.js";const d=f`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var u=function(o,e,i,r){var n=arguments.length,t=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,r);else for(var c=o.length-1;c>=0;c--)(l=o[c])&&(t=(n<3?l(t):n>3?l(e,i,t):l(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let s=class extends a{render(){return m`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=d;s=u([p("w3m-transactions-view")],s);export{s as W3mTransactionsView};

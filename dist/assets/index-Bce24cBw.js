import{o as c,F as g,G as h,n as m,x as u}from"./index-B0RynRNr.js";import{n as d}from"./class-map-BKD9lMKe.js";import"./index-Cn9rIZ3w.js";import"./index-Btu9FXa8.js";import{c as x}from"./index-D1DpIkmA.js";import"./index-B2xGJ35h.js";const w=c`
  :host {
    display: block;
  }

  :host > button,
  :host > wui-flex {
    gap: var(--wui-spacing-xxs);
    padding: var(--wui-spacing-xs);
    padding-right: var(--wui-spacing-1xs);
    height: 40px;
    border-radius: var(--wui-border-radius-l);
    background: var(--wui-color-gray-glass-002);
    border-width: 0px;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
  }

  :host > button wui-image {
    width: 24px;
    height: 24px;
    border-radius: var(--wui-border-radius-s);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }
`;var p=function(r,e,o,s){var n=arguments.length,t=n<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,o):s,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,o,s);else for(var l=r.length-1;l>=0;l--)(a=r[l])&&(t=(n<3?a(t):n>3?a(e,o,t):a(e,o))||t);return n>3&&t&&Object.defineProperty(e,o,t),t};let i=class extends m{constructor(){super(...arguments),this.text="",this.loading=!1}render(){return this.loading?u` <wui-flex alignItems="center" gap="xxs" padding="xs">
        <wui-shimmer width="24px" height="24px"></wui-shimmer>
        <wui-shimmer width="40px" height="20px" borderRadius="4xs"></wui-shimmer>
      </wui-flex>`:u`
      <button>
        ${this.tokenTemplate()}
        <wui-text variant="paragraph-600" color="fg-100">${this.text}</wui-text>
      </button>
    `}tokenTemplate(){return this.imageSrc?u`<wui-image src=${this.imageSrc}></wui-image>`:u`
      <wui-icon-box
        size="sm"
        iconColor="fg-200"
        backgroundColor="fg-300"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `}};i.styles=[g,h,w];p([d()],i.prototype,"imageSrc",void 0);p([d()],i.prototype,"text",void 0);p([d({type:Boolean})],i.prototype,"loading",void 0);i=p([x("wui-token-button")],i);

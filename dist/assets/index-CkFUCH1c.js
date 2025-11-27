import{o as p,r as d,t as f,x as c}from"./chain_config-D8DYnceI.js";import{n as m}from"./class-map-gEppeFCC.js";import{c as h}from"./index-Cd3y1h9a.js";const x=p`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: ${({tokens:t})=>t.theme.borderPrimary};
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 8px;
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }
`;var u=function(t,r,o,n){var i=arguments.length,e=i<3?r:n===null?n=Object.getOwnPropertyDescriptor(r,o):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(t,r,o,n);else for(var l=t.length-1;l>=0;l--)(a=t[l])&&(e=(i<3?a(e):i>3?a(r,o,e):a(r,o))||e);return i>3&&e&&Object.defineProperty(r,o,e),e};let s=class extends f{constructor(){super(...arguments),this.text=""}render(){return c`${this.template()}`}template(){return this.text?c`<wui-text variant="md-regular" color="secondary">${this.text}</wui-text>`:null}};s.styles=[d,x];u([m()],s.prototype,"text",void 0);s=u([h("wui-separator")],s);

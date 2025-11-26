import{o as m,r as c,n as f,x as d}from"./index-B0RynRNr.js";import{n as u}from"./class-map-BKD9lMKe.js";import{o as h}from"./if-defined-BrvS5P3j.js";import{c as v}from"./index-Brwreh6R.js";import"./index-CNiZKeSm.js";const b=m`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var o=function(l,r,i,s){var a=arguments.length,e=a<3?r:s===null?s=Object.getOwnPropertyDescriptor(r,i):s,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(l,r,i,s);else for(var p=l.length-1;p>=0;p--)(n=l[p])&&(e=(a<3?n(e):a>3?n(r,i,e):n(r,i))||e);return a>3&&e&&Object.defineProperty(r,i,e),e};let t=class extends f{constructor(){super(...arguments),this.disabled=!1}render(){return d`
      <wui-input-text
        type="email"
        placeholder="Email"
        icon="mail"
        size="lg"
        .disabled=${this.disabled}
        .value=${this.value}
        data-testid="wui-email-input"
        tabIdx=${h(this.tabIdx)}
      ></wui-input-text>
      ${this.templateError()}
    `}templateError(){return this.errorMessage?d`<wui-text variant="sm-regular" color="error">${this.errorMessage}</wui-text>`:null}};t.styles=[c,b];o([u()],t.prototype,"errorMessage",void 0);o([u({type:Boolean})],t.prototype,"disabled",void 0);o([u()],t.prototype,"value",void 0);o([u()],t.prototype,"tabIdx",void 0);t=o([v("wui-email-input")],t);

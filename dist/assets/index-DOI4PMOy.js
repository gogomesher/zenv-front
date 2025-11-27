import{u as p,t as u,Q as f,ae as b,x as d}from"./chain_config-D8DYnceI.js";import{n as g,r as m}from"./class-map-gEppeFCC.js";import{c as v}from"./index-CAF11AxJ.js";import{T as l}from"./index-DC2MZbTQ.js";const T={interpolate(i,e,o){if(i.length!==2||e.length!==2)throw new Error("inputRange and outputRange must be an array of length 2");const n=i[0]||0,r=i[1]||0,t=e[0]||0,s=e[1]||0;return o<n?t:o>r?s:(s-t)/(r-n)*(o-n)+t}},w=p`
  :host {
    width: 100%;
    display: block;
  }
`;var c=function(i,e,o,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,o):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,o,n);else for(var a=i.length-1;a>=0;a--)(s=i[a])&&(t=(r<3?s(t):r>3?s(e,o,t):s(e,o))||t);return r>3&&t&&Object.defineProperty(e,o,t),t};let h=class extends u{constructor(){super(),this.unsubscribe=[],this.text="",this.open=l.state.open,this.unsubscribe.push(f.subscribeKey("view",()=>{l.hide()}),b.subscribeKey("open",e=>{e||l.hide()}),l.subscribeKey("open",e=>{this.open=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),l.hide()}render(){return d`
      <div
        @pointermove=${this.onMouseEnter.bind(this)}
        @pointerleave=${this.onMouseLeave.bind(this)}
      >
        ${this.renderChildren()}
      </div>
    `}renderChildren(){return d`<slot></slot> `}onMouseEnter(){const e=this.getBoundingClientRect();this.open||l.showTooltip({message:this.text,triggerRect:{width:e.width,height:e.height,left:e.left,top:e.top},variant:"shade"})}onMouseLeave(e){this.contains(e.relatedTarget)||l.hide()}};h.styles=[w];c([g()],h.prototype,"text",void 0);c([m()],h.prototype,"open",void 0);h=c([v("w3m-tooltip-trigger")],h);export{T as M};

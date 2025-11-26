import{o as p,n as u,R as f,a8 as g,x as d}from"./index-B0RynRNr.js";import{n as b,r as m}from"./class-map-BKD9lMKe.js";import{c as w}from"./index-Brwreh6R.js";import{T as l}from"./index-6GAnrxYc.js";const x={interpolate(r,e,t){if(r.length!==2||e.length!==2)throw new Error("inputRange and outputRange must be an array of length 2");const o=r[0]||0,i=r[1]||0,n=e[0]||0,s=e[1]||0;return t<o?n:t>i?s:(s-n)/(i-o)*(t-o)+n}},v=p`
  :host {
    width: 100%;
    display: block;
  }
`;var a=function(r,e,t,o){var i=arguments.length,n=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(r,e,t,o);else for(var c=r.length-1;c>=0;c--)(s=r[c])&&(n=(i<3?s(n):i>3?s(e,t,n):s(e,t))||n);return i>3&&n&&Object.defineProperty(e,t,n),n};let h=class extends u{constructor(){super(),this.unsubscribe=[],this.text="",this.open=l.state.open,this.unsubscribe.push(f.subscribeKey("view",()=>{l.hide()}),g.subscribeKey("open",e=>{e||l.hide()}),l.subscribeKey("open",e=>{this.open=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),l.hide()}render(){return d`
      <div
        @pointermove=${this.onMouseEnter.bind(this)}
        @pointerleave=${this.onMouseLeave.bind(this)}
      >
        ${this.renderChildren()}
      </div>
    `}renderChildren(){return d`<slot></slot> `}onMouseEnter(){const e=this.getBoundingClientRect();if(!this.open){const t=document.querySelector("w3m-modal"),o={width:e.width,height:e.height,left:e.left,top:e.top};if(t){const i=t.getBoundingClientRect();o.left=e.left-(window.innerWidth-i.width)/2,o.top=e.top-(window.innerHeight-i.height)/2}l.showTooltip({message:this.text,triggerRect:o,variant:"shade"})}}onMouseLeave(e){this.contains(e.relatedTarget)||l.hide()}};h.styles=[v];a([b()],h.prototype,"text",void 0);a([m()],h.prototype,"open",void 0);h=a([w("w3m-tooltip-trigger")],h);export{x as M};

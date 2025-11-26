import{l as c,r as l,n as u,x as f}from"./index-B0RynRNr.js";import{n as p}from"./class-map-BKD9lMKe.js";import{c as m}from"./index-Brwreh6R.js";const g=c`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${r=>r.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var h=function(r,e,o,s){var a=arguments.length,t=a<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,o):s,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,o,s);else for(var d=r.length-1;d>=0;d--)(n=r[d])&&(t=(a<3?n(t):a>3?n(e,o,t):n(e,o))||t);return a>3&&t&&Object.defineProperty(e,o,t),t};let i=class extends u{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,s=36-e,a=116+s,t=245+s,n=360+s*1.75;return f`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${a} ${t}"
          stroke-dashoffset=${n}
        />
      </svg>
    `}};i.styles=[l,g];h([p({type:Number})],i.prototype,"radius",void 0);i=h([m("wui-loading-thumbnail")],i);

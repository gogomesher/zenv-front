import{o as c,r as l,t as u,x as f}from"./chain_config-D8DYnceI.js";import{n as p}from"./class-map-gEppeFCC.js";import{c as m}from"./index-Cd3y1h9a.js";const g=c`
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
`;var h=function(r,e,o,s){var a=arguments.length,t=a<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,o):s,i;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,o,s);else for(var d=r.length-1;d>=0;d--)(i=r[d])&&(t=(a<3?i(t):a>3?i(e,o,t):i(e,o))||t);return a>3&&t&&Object.defineProperty(e,o,t),t};let n=class extends u{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,s=36-e,a=116+s,t=245+s,i=360+s*1.75;return f`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${a} ${t}"
          stroke-dashoffset=${i}
        />
      </svg>
    `}};n.styles=[l,g];h([p({type:Number})],n.prototype,"radius",void 0);n=h([m("wui-loading-thumbnail")],n);

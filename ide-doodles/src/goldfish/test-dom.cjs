// Minimal deterministic DOM/clock for exercising the injected scripts together.
// Layout is limited to their 96x72 sheep frames; CSS animation is not simulated.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function session(storage=new Map(),windowStorage=storage) {
  let now=0,next=1;
  const frames=new Map(),timers=new Map();
  class Event {
    constructor(type,options={}) {this.type=type;Object.assign(this,options);this.bubbles=!!options.bubbles;}
    preventDefault(){this.defaultPrevented=true;}
    stopPropagation(){this.stopped=true;}
    stopImmediatePropagation(){this.stopped=true;this.immediate=true;}
  }
  class Hub {
    constructor(){this.listeners=new Map();}
    addEventListener(type,fn,options={}) {
      const entries=this.listeners.get(type)||[];
      entries.push({fn,capture:options===true || !!options.capture,once:!!options.once,signal:options.signal});
      this.listeners.set(type,entries);
    }
    removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(e=>e.fn!==fn));}
    dispatchEvent(event) {
      event.target ||= this;
      const route=[this];
      if(this instanceof Element) {
        for(let node=this.parentNode;node;node=node.parentNode)route.push(node);
        route.push(document,window);
      }
      const invoke=(target,capture)=>{
        event.currentTarget=target;
        for(const listener of [...(target.listeners.get(event.type)||[])]) {
          if(listener.capture!==capture || listener.signal?.aborted)continue;
          listener.fn(event);
          if(listener.once)target.removeEventListener(event.type,listener.fn);
          if(event.immediate)break;
        }
      };
      for(const target of [...route].reverse()) {invoke(target,true);if(event.stopped)return !event.defaultPrevented;}
      for(const target of route) {
        invoke(target,false);if(event.stopped || !event.bubbles)break;
      }
      return !event.defaultPrevented;
    }
  }
  const style=()=>({setProperty(key,value){this[key]=String(value);},getPropertyValue(key){return this[key]||'';},removeProperty(key){delete this[key];}});
  function matches(element,selector) {
    if(selector.includes(','))return selector.split(',').some(part=>matches(element,part));
    const parts=selector.trim().split(/\s+/),last=parts.pop();
    const single=(el,s)=>{
      const id=s.match(/#([\w-]+)/)?.[1],classes=[...s.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);
      const tag=s.match(/^[a-z]+/i)?.[0];
      const attrs=[...s.matchAll(/\[([\w-]+)=["']([^"']+)["']\]/g)];
      return attrs.every(([,key,value])=>el.getAttribute(key)===value) && (!id || el.id===id) && (!tag || el.tagName===tag.toUpperCase()) && classes.every(c=>el.classList.contains(c));
    };
    if(!single(element,last))return false;
    let parent=element.parentNode;
    while(parts.length) {
      const part=parts.pop();while(parent && !single(parent,part))parent=parent.parentNode;
      if(!parent)return false;parent=parent.parentNode;
    }
    return true;
  }
  class Element extends Hub {
    constructor(tag) {
      super();this.tagName=tag.toUpperCase();this.style=style();this.children=[];this.dataset={};this.className='';this.attributes={};this.id='';
      this.classList={contains:c=>this.className.split(/\s+/).includes(c),
        add:(...cs)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...cs])].join(' ');},
        remove:(...cs)=>{this.className=this.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ');},
        toggle:(c,value)=>{value=value===undefined ? !this.classList.contains(c) : value;this.classList[value?'add':'remove'](c);return value;}};
      this.context=new Proxy({draws:[],clearRect:()=>{this.context.draws=[];},drawImage:(...args)=>this.context.draws.push(args)},
        {get:(target,key)=>key in target ? target[key] : ()=>{}});
    }
    append(...children){children.forEach(child=>this.appendChild(child));}
    appendChild(child){this.children.push(child);child.parentNode=this;return child;}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}
    get isConnected(){return this===document.body || this===document.head || !!this.parentNode?.isConnected;}
    setAttribute(key,value){this.attributes[key]=String(value);if(key==='id')this.id=String(value);}
    getAttribute(key){return this.attributes[key];}
    querySelectorAll(selector){return this.children.flatMap(child=>[...(selector.split(',').some(s=>matches(child,s)) ? [child] : []),...child.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){for(let el=this;el;el=el.parentNode)if(selector.split(',').some(s=>matches(el,s)))return el;return null;}
    getContext(){return this.context;}
    getBoundingClientRect(){
      const value=this.style.left || this.style.getPropertyValue(this.classList.contains('running') ? '--run-home' : '--home') || '0';
      const left=parseFloat(value)*(String(value).endsWith('%') ? window.innerWidth/100 : 1);
      const top=this.classList.contains('airborne') ? parseFloat(this.style.top)||0 : window.innerHeight-78;
      return {left,top,width:96,height:72,right:left+96,bottom:top+72};
    }
    getClientRects(){return this.isConnected ? [this.getBoundingClientRect()] : [];}
    setPointerCapture(id){this.pointer=id;}
    hasPointerCapture(id){return this.pointer===id;}
    releasePointerCapture(id){this.pointer=null;this.dispatchEvent(new Event('lostpointercapture',{pointerId:id}));}
    animate(){return {cancel(){}};}
    click(){this.dispatchEvent(new Event('click',{bubbles:true}));}
  }
  const window=new Hub(),document=new Hub();
  window.innerWidth=1000;window.innerHeight=700;
  document.head=new Element('head');document.body=new Element('body');document.hidden=false;
  document.createElement=tag=>new Element(tag);document.createElementNS=(_,tag)=>new Element(tag);
  document.querySelectorAll=selector=>[...document.head.querySelectorAll(selector),...document.body.querySelectorAll(selector)];
  document.querySelector=selector=>document.querySelectorAll(selector)[0]||null;
  document.getElementById=id=>document.querySelector('#'+id);
  const media=new Hub();media.matches=false;window.matchMedia=()=>media;
  const computed=element=>{
    const animal=element.parentNode,classes=animal?.classList,s=animal?.style;
    const key=classes?.contains('airborne') ? '--held-facing' : classes?.contains('foraging') ? '--forage-facing' : '--direction';
    const direction=Number(s?.getPropertyValue(key))||1;
    return {transform:'matrix('+direction+', 0, 0, 1, 0, 0)'};
  };
  const context=vm.createContext({window,document,innerWidth:1000,innerHeight:700,AbortController,
    MutationObserver:class {observe(){}disconnect(){}},CustomEvent:Event,matchMedia:window.matchMedia,getComputedStyle:computed,performance:{now:()=>now},
    sessionStorage:{getItem:key=>windowStorage.get(key)||null,setItem:(key,value)=>windowStorage.set(key,value)},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    requestAnimationFrame:fn=>{const id=next++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:(fn,delay)=>{const id=next++;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    setInterval:(fn,delay)=>{const id=next++;timers.set(id,{fn,at:now+delay,interval:delay});return id;},clearInterval:id=>timers.delete(id)});
  for(const file of ['modes','settings'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../world/'+file+'.js'),'utf8'),context);
  return {window,document,context,storage,media,
    load(file){
      let source=fs.readFileSync(path.join(__dirname,file),'utf8');
      if(file==='goldfish.js')source=source.replace('  function dispense(x,y) {','  window.fishState=()=>({fish,food,drag,adopted});\n  function dispense(x,y) {');
      vm.runInContext(source,context,{filename:file});
    },
    advance(ms){
      for(let i=0;i<ms;i+=20){
        now+=Math.min(20,ms-i);
        for(const [id,t] of [...timers])if(t.at<=now){if(t.interval)t.at+=t.interval;else timers.delete(id);t.fn();}
        const pending=[...frames];frames.clear();for(const [,fn] of pending)fn(now);
      }
    },
    event(target,type,options={}){const e=new Event(type,{bubbles:true,...options});target.dispatchEvent(e);return e;},
    pointer(target,type,x,y){return this.event(target,type,{button:0,buttons:type==='pointerup'?0:1,isPrimary:true,pointerId:1,clientX:x,clientY:y});},
    resize(w,h){context.innerWidth=window.innerWidth=w;context.innerHeight=window.innerHeight=h;this.event(window,'resize');},
    hide(value){document.hidden=value;this.event(document,'visibilitychange');}
  };
}
module.exports={session};

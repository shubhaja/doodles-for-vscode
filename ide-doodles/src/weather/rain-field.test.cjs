const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('rain engine renders, freezes for reduced motion, resumes and disposes',()=>{
  let renders=0,next=0;
  const frames=new Map(),events=new Map();
  const ctx=new Proxy({ellipse(...values){assert(values.every(Number.isFinite));assert(values[2]>0 && values[3]>0);},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),clearRect(){renders++;}}, {get:(o,k)=>o[k] || (()=>{})});
  const canvas=()=>({getContext:()=>ctx,remove(){this.removed=true;}});
  const host={appendChild(c){this.canvas=c;}};
  const reduced={matches:false,addEventListener:(k,f)=>events.set('motion',f),removeEventListener:()=>events.delete('motion')};
  const window={addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
  const document={hidden:false,documentElement:{},createElement:canvas,addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
  const context=vm.createContext({window,document,innerWidth:1000,innerHeight:700,matchMedia:()=>reduced,
    getComputedStyle:()=>({getPropertyValue:()=> '#e8a5aa'}),requestAnimationFrame:f=>(frames.set(++next,f),next),cancelAnimationFrame:id=>frames.delete(id)});
  for(const file of ['fine-rain.js','rain-field.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context);
  const rain=window.doodlesRainField(host);
  rain.setAmount(100);assert.equal(frames.size,1);
  const step=time=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(time));};
  for(let t=1;t<120000;t+=34)step(t);
  assert(renders>200);
  reduced.matches=true;events.get('motion')();assert.equal(frames.size,0);
  const frozen=renders;step(10001);assert.equal(renders,frozen);
  reduced.matches=false;events.get('motion')();assert.equal(frames.size,1);
  document.hidden=true;events.get('visibilitychange')();assert.equal(frames.size,0);
  document.hidden=false;events.get('visibilitychange')();assert.equal(frames.size,1);
  events.get('resize')();assert.equal(host.canvas.width,1000);
  rain.setAmount(0);assert.equal(frames.size,0);
  rain.setAmount(25);assert.equal(frames.size,1);
  rain.dispose();assert.equal(frames.size,0);assert.equal(events.size,0);assert(host.canvas.removed);
});

test('fine rain preserves the selected recipe, density and gusts change drawing without changing drop style',()=>{
  const lines=[];let start;
  const ctx={setTransform(){},clearRect(){lines.length=0;},beginPath(){},moveTo(x,y){start=[x,y];},lineTo(x,y){this.end=[x,y];},stroke(){lines.push({start,end:this.end,width:this.lineWidth,color:this.strokeStyle});}};
  const canvas={getContext:()=>ctx};
  const math=Object.create(Math);math.random=()=>.5;
  const context=vm.createContext({window:{},Math:math});
  vm.runInContext(fs.readFileSync(__dirname+'/fine-rain.js','utf8'),context);
  const {create,defaults}=context.window.doodlesFineRain;
  assert.deepEqual(JSON.parse(JSON.stringify(defaults)),{density:100,speed:470,length:8,width:1.2,opacity:44,wind:-8,depth:100,gust:19});
  const rain=create(canvas);rain.resize(500,300,3);assert.equal(canvas.width,1000);assert.equal(canvas.height,600);
  rain.draw(0,2);assert.equal(lines.length,600);const initial=structuredClone(lines[0]);
  rain.configure({gust:100});rain.draw(0,2);assert.notEqual(lines[0].start[0],initial.start[0]);assert.equal(lines[0].width,initial.width);assert.equal(lines[0].color,initial.color);assert.equal(lines[0].end[1]-lines[0].start[1],5);
  rain.draw(.02,2.02);assert.notEqual(lines[0].end[1],initial.end[1]);
  rain.configure({density:25});rain.draw(0,2);assert.equal(lines.length,150);
  rain.configure({density:0});rain.draw(0,2);assert.equal(lines.length,0);
  rain.resize(4000,3000);rain.configure({density:100});rain.draw(.02,3);assert.equal(lines.length,3600);
  assert(lines.every(line=>[...line.start,...line.end,line.width].every(Number.isFinite)));
});

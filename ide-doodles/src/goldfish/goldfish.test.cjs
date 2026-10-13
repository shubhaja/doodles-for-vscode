const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function persistentSession(storage, width=1000, height=700) {
  let frame, now=0;
  const handlers={};
  const canvas={style:{},setAttribute(){},remove(){},getContext:()=>new Proxy({}, {get:()=>()=>{}})};
  const window={addEventListener:(type,fn)=>handlers[type]=fn};
  const document={getElementById:()=>null,createElement:()=>canvas,body:{append(){}},addEventListener:window.addEventListener};
  const source=fs.readFileSync(__dirname+'/goldfish.js','utf8').replace('  function dispense(x,y) {',
    '  window.snapshot = () => ({fish,drag});\n  function dispense(x,y) {');
  vm.runInNewContext(source,{window,document,localStorage:storage,innerWidth:width,innerHeight:height,AbortController,
    matchMedia:()=>({matches:false}),performance:{now:()=>now},requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){}});
  const event=(x,y)=>({button:0,buttons:1,isPrimary:true,pointerId:1,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){}});
  return {fish:window.snapshot().fish,handlers,document,
    advance(ms) {for(let i=0;i<ms;i+=20) {now+=20;frame(now);}},
    pick(f) {handlers.pointerdown(event(f.x*2,f.y*2));},
    drop(x,y) {handlers.pointermove(event(x,y));handlers.pointerup(event(x,y));}};
}
function memoryStorage() {
  let value=null;
  return {getItem:()=>value,setItem:(_,next)=>{value=next;}};
}
test('reload preserves evolution and habitat, including resized windows and completed sheep', () => {
  const storage=memoryStorage(), first=persistentSession(storage);
  first.pick(first.fish[0]);first.drop(300,690);
  assert.equal(persistentSession(storage).fish[0].grounded,true,'landing is saved immediately');
  first.advance(150000);
  const age=first.fish[0].landAge;
  assert.ok(Math.abs(persistentSession(storage).fish[0].landAge-age)<1.1,'periodic saves protect progress');
  first.handlers.beforeunload();
  const next=persistentSession(storage,600,500), restored=next.fish[0];
  assert.equal(next.fish.length,3);
  assert.equal(restored.grounded,true);
  assert.equal(restored.landAge,age,'no offline evolution');
  assert.ok(Math.abs(restored.x-Math.max(24,Math.min(276,first.fish[0].x*0.6)))<1e-10,
    'rescaled positions retain enough margin for the whole animal');
  assert.equal(restored.y+20*restored.size,245);
  assert.ok(next.fish.slice(1).every(f=>!f.grounded && f.landAge===0));
  next.advance(160000);next.handlers.pagehide();
  assert.equal(persistentSession(storage).fish[0].landAge,300,'completed sheep survives reload');
});
test('reload during dragging preserves land animal; water release persists evolution reset', () => {
  const storage=memoryStorage(), session=persistentSession(storage), f=session.fish[0];
  session.pick(f);session.drop(300,690);session.advance(65000);
  const x=f.x, age=f.landAge;
  session.pick(f);session.advance(3000);session.handlers.pagehide();
  const restored=persistentSession(storage);
  assert.equal(restored.fish[0].grounded,true);
  assert.equal(restored.fish[0].landAge,age);
  assert.ok(Math.abs(restored.fish[0].x-x)<1e-10);
  restored.pick(restored.fish[0]);restored.drop(400,100);
  const water=persistentSession(storage).fish[0];
  assert.equal(water.grounded,false);assert.equal(water.landAge,0);
});
test('hidden windows save progress; bad or unavailable storage cannot break the fish', () => {
  const storage=memoryStorage(), session=persistentSession(storage);
  session.pick(session.fish[1]);session.drop(300,690);session.advance(12340);
  session.document.hidden=true;session.handlers.visibilitychange();
  assert.equal(persistentSession(storage).fish[1].landAge,session.fish[1].landAge);
  for (const value of ['{bad', 'null', '{"version":2,"fish":[]}', '{"version":1,"fish":[null,{"id":0,"x":"bad"}]}']) {
    storage.setItem('',value);
    const fresh=persistentSession(storage);
    assert.ok(fresh.fish.every(f=>!f.grounded && f.landAge===0));
    fresh.advance(1100);
  }
  const blocked=persistentSession({getItem(){throw Error('blocked');},setItem(){throw Error('full');}});
  blocked.advance(1100);blocked.handlers.pagehide();
  assert.equal(blocked.fish.length,3);
});
test('school wanders across the screen together and releases sparse mouth bubbles', () => {
  let frame, seed = 42, bubbleCount = 0, previousBubbles = new Set();
  const math = Object.create(Math);
  math.random = () => ((seed = (1664525*seed+1013904223)>>>0)/4294967296);
  const canvas = {style:{},setAttribute(){},getContext:()=>new Proxy({}, {get:()=>()=>{}})};
  const window = {addEventListener(){}};
  const document = {getElementById:()=>null,createElement:()=>canvas,body:{append(){}},addEventListener(){}};
  const source = fs.readFileSync(__dirname+'/goldfish.js','utf8').replace('  function dispense(x,y) {',
    '  window.snapshot = () => ({fish,bubbles});\n  function dispense(x,y) {');
  vm.runInNewContext(source, {window,document,Math:math,innerWidth:1000,innerHeight:700,AbortController,
    matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){}});
  let maxSpread = 0, minY = Infinity, maxY = 0, minX = Infinity, maxX = 0;
  for (let now=20; now<=240000; now+=20) {
    frame(now);
    const {fish,bubbles} = window.snapshot();
    assert.ok(fish.every(f=>f.y+28<=350/3),'fish stay within the top third');
    const cx = fish.reduce((sum,f)=>sum+f.x/3,0), cy = fish.reduce((sum,f)=>sum+f.y/3,0);
    minX=Math.min(minX,cx); maxX=Math.max(maxX,cx); minY=Math.min(minY,cy); maxY=Math.max(maxY,cy);
    for (const f of fish) for (const other of fish) maxSpread=Math.max(maxSpread,Math.hypot(f.x-other.x,f.y-other.y));
    for (const b of bubbles) if (!previousBubbles.has(b)) {
      bubbleCount++;
      assert.ok(fish.some(f => Math.hypot(b.x-f.x,b.y-f.y)<12),'bubble starts next to a fish mouth');
    }
    previousBubbles = new Set(bubbles);
    assert.ok(bubbles.length<=3,'ambient bubbles remain sparse');
  }
  assert.ok(maxSpread<180,`school stays together: ${maxSpread}`);
  assert.ok(maxX-minX>150 && maxY-minY>20,'school explores both axes within the top third');
  assert.ok(bubbleCount>20 && bubbleCount<65,`occasional bubbles: ${bubbleCount}`);
});
test('hold timing, cancellation, eating and one pinch per gesture', () => {
  let now = 0, frame;
  const rectangles = [];
  const handlers = {};
  const canvas = {style:{},setAttribute(){},getContext:()=>new Proxy({}, {get:(_,key)=>key==='fillRect' ? (...args)=>rectangles.push(args) : ()=>{}})};
  const window = {addEventListener:(type,fn)=>handlers[type]=fn};
  const document = {getElementById:()=>null,createElement:()=>canvas,body:{append(){}},addEventListener:window.addEventListener};
  const context = {window,document,innerWidth:1000,innerHeight:700,AbortController,
    matchMedia:()=>({matches:false}),performance:{now:()=>now},
    requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){}};
  const source = fs.readFileSync(__dirname+'/goldfish.js','utf8').replace('  function dispense(x,y) {', '  window.snapshot = () => ({food,fish,hold,sprites});\n  function dispense(x,y) {');
  const sounds=[];
  context.CustomEvent=class {constructor(type,{detail}){this.type=type;this.detail=detail;}};
  document.dispatchEvent=event=>sounds.push(event.detail.kind);
  vm.runInNewContext(source, context);
  const advance = ms => {for(let i=0;i<ms;i+=10) {now+=10;frame(now);}};
  const down = () => handlers.pointerdown({button:0,isPrimary:true,pointerId:1,clientX:500,clientY:220});
  const count = () => window.snapshot().food.length;
  assert.equal(window.snapshot().fish.length,3);
  assert.equal(window.snapshot().sprites.length,3);
  assert.ok(window.snapshot().sprites.every(poses=>poses.length===16));
  const school=window.snapshot().fish;
  school.forEach((f,i)=>{f.x=245+i*5;f.y=40;f.heading=0;f.target={x:450,y:40};f.wander=10;});
  advance(3000);
  assert.ok(Math.hypot(school[0].x-school[2].x,school[0].y-school[2].y)>20,'crowded fish separate');
  const before=school.map(f=>f.heading);
  advance(10);
  school.forEach((f,i)=>assert.ok(Math.abs(f.heading-before[i])<=0.012,'idle turns have bounded angular velocity'));
  rectangles.length=0;
  down(); advance(2990); assert.equal(count(),0);
  assert.equal(rectangles.length,0,'waiting to dispense draws no loading indicator');
  advance(10); assert.equal(count()+school.filter(f=>f.bite>0).length,12,'a pinch appears, including any immediately eaten pellets');
  assert.equal(sounds.filter(kind=>kind==='food-pop').length,1);
  advance(12000); assert.equal(count(),0,'fish eat the pellets before they expire');
  advance(3500); assert.equal(count(),0,'no repeated dispensing');
  assert.deepEqual(sounds,['food-pop','food-glub'],'one pop and one bubble phrase for the whole school');
  handlers.pointerup(); down(); advance(1000);
  handlers.pointermove({pointerId:1,buttons:1,clientX:520,clientY:350});
  advance(3100); assert.equal(count(),0);
  down(); advance(1000); handlers.pointerup(); advance(3100); assert.equal(count(),0);
  down(); advance(1000); handlers.blur(); advance(3100); assert.equal(count(),0);
  down(); advance(3000); assert.ok(count()>0,'can feed again after cancellation');
  handlers.pointerup();
  window.snapshot().food.length=0;
  handlers.pointerdown({button:0,isPrimary:true,pointerId:1,clientX:500,clientY:350});
  advance(3000);
  assert.equal(count(),12,'food can still be dropped below the swimming area');
  advance(5000);
  assert.ok(school.some(f=>f.y>350/3),'fish leave the idle band to chase food');
  advance(12000);
  assert.equal(count(),0,'fish eat food below the top third before it expires');
  handlers.pointerup();
  advance(60000);
  assert.ok(school.every(f=>f.y+28<=350/3),'fish return to the top third after feeding');
  context.innerHeight=400;
  handlers.resize();
  assert.ok(school.every(f=>f.y+28<=200/3),'resizing preserves the lower boundary');
});
test('individual dragging, floor feet, pickup, cancellation and resize', () => {
  let frame, now=0;
  const handlers={};
  const canvas={style:{},setAttribute(){},getContext:()=>new Proxy({}, {get:()=>()=>{}})};
  const window={addEventListener:(type,fn)=>handlers[type]=fn};
  const document={getElementById:()=>null,createElement:()=>canvas,body:{append(){}},addEventListener:window.addEventListener};
  const context={window,document,innerWidth:1000,innerHeight:700,AbortController,
    matchMedia:()=>({matches:false}),performance:{now:()=>now},requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){}};
  const source=fs.readFileSync(__dirname+'/goldfish.js','utf8').replace('  function dispense(x,y) {',
    '  window.snapshot = () => ({fish,food,drag});\n  function dispense(x,y) {');
  vm.runInNewContext(source,context);
  const event=(x,y)=>({button:0,buttons:1,isPrimary:true,pointerId:1,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){}});
  const advance=ms=>{for(let i=0;i<ms;i+=20) {now+=20;frame(now);}};
  const {fish}=window.snapshot(), f=fish[0];
  handlers.pointerdown(event(f.x*2,f.y*2));
  handlers.pointermove(event(300,690));
  advance(4000);
  assert.equal(window.snapshot().food.length,0,'dragging cannot feed');
  assert.equal(f.x,150,'held fish stays under pointer');
  handlers.pointerup(event(300,690));
  assert.equal(f.grounded,true);
  const startX=f.x;
  const y=f.y; advance(5000);
  assert.equal(f.y,y,'walking fish stays at floor height');
  assert.notEqual(f.x,startX,'floor fish walks sideways');
  assert.ok(fish.slice(1).every(other=>!other.grounded && other.y<120),'other fish keep swimming');
  context.innerHeight=500; handlers.resize();
  assert.equal(f.y+20*f.size,245,'feet remain on resized floor');
  handlers.pointerdown(event(f.x*2,f.y*2));
  handlers.pointermove(event(400,100)); handlers.keydown({key:'Escape'});
  assert.equal(f.grounded,true,'escape restores floor fish');
  handlers.pointerdown(event(f.x*2,(f.y+18*f.size)*2));
  handlers.pointermove(event(400,100)); handlers.pointerup(event(400,100));
  assert.equal(f.grounded,false,'can lift by the feet');
  assert.equal(f.landAge,0,'returning to water resets evolution');
  advance(60000);
  assert.ok(f.y+28<=250/3,'released fish rejoins swimming band');
  handlers.pointerdown(event(f.x*2,f.y*2));
  const originalY=f.y; handlers.pointermove(event(400,480)); handlers.blur();
  assert.equal(f.y,originalY,'blur restores swimming fish');
  handlers.pointerdown(event(f.x*2,f.y*2));
  handlers.pointermove(event(300,490)); handlers.pointerup(event(300,490));
  advance(150000);
  assert.ok(f.landAge>149 && f.landAge<151,'evolution advances with time on land');
  const age=f.landAge, heldX=f.x;
  handlers.pointerdown(event(f.x*2,f.y*2));
  advance(5000);
  assert.equal(f.landAge,age,'evolution pauses while held');
  assert.equal(f.x,heldX,'held animals stop walking');
  handlers.keydown({key:'Escape'});
  assert.ok(f.x>=24 && f.x<=476,'walking stays inside the viewport');
  f.x=24; f.facing=-1; f.resting=false; f.stroll=10;
  advance(100);
  assert.equal(f.facing,1,'walkers turn at the left edge');
  context.innerWidth=400; handlers.resize(); advance(100);
  assert.ok(f.x>=24 && f.x<=176,'walkers respect resized edges');
  f.evolution='sheep';
  advance(160000);
  assert.equal(f.landAge,300,'evolution finishes at sheep and stays there');
  assert.equal(f.kind,'sheep','completed animals permanently become sheep');
});

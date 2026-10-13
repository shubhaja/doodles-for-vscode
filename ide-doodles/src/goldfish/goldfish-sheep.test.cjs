const {test}=require('node:test'),assert=require('node:assert/strict');
const {session}=require('./test-dom.cjs');
const stateKey='doodles-goldfish-state-v1';
function loadPasture(s) {
  for(const file of ['sheep-overlay','disco-overlay','flower-foraging','sheep-run'])s.load('../sheep/'+file+'.js');
}
function evolve(s,index=0) {
  const f=s.window.fishState().fish[index];
  f.evolution='sheep';f.grounded=true;f.landAge=299.96;f.resting=true;f.stroll=10;
  s.advance(100);
  return s.document.querySelectorAll('#pasture-sheep .evolved').find(el=>el.dataset.evolutionId==='goldfish-'+index);
}
test('evolving fish gathers, jumps and crashes with the flock, then resumes evolution',()=>{
  const s=session();s.load('goldfish.js');loadPasture(s);
  const f=s.window.fishState().fish[0];
  Object.assign(f,{grounded:true,evolution:'sheep',landAge:140,x:400,y:300,heading:Math.PI,facing:-1});
  const flag=s.document.getElementById('doodles-mode-race');flag.click();s.advance(1300);
  const scenery=s.document.getElementById('pasture-run-scenery');
  assert.equal(scenery.dataset.phase,'running');
  assert.equal(f.x,102,'fourth runner uses the shared formation');
  assert.equal(f.kind,'fish');assert.equal(f.landAge,140,'evolution pauses while racing');
  assert.equal(s.document.querySelectorAll('#pasture-sheep .sheep').length,3,'keeps its canvas appearance');
  const ground=f.y;
  s.event(s.document.body,'keydown',{code:'Space'});s.advance(180);
  assert.ok(f.y<ground-15,'fish jumps with the flock');
  s.pointer(s.document.body,'pointerdown',f.x*2,f.y*2);
  assert.equal(s.window.fishState().drag,null,'race participants cannot be dragged out of formation');
  s.event(s.window,'beforeunload');
  const saved=JSON.parse(s.storage.get(stateKey)).fish[0];
  assert.equal(saved.x,.8,'race positions do not overwrite the pasture home');
  s.advance(4500);
  assert.equal(scenery.dataset.phase,'over','fish participates in the same collision course');
  const frozen=f.y;s.advance(300);assert.equal(f.y,frozen);
  s.event(s.document.body,'keydown',{code:'Space'});s.advance(300);
  assert.equal(scenery.dataset.phase,'running','retry retains the evolving runner');
  s.event(s.document.body,'keydown',{code:'Escape',key:'Escape'});
  assert.equal(f.x,400);assert.equal(f.facing,-1);
  s.advance(100);assert.ok(f.landAge>140,'evolution resumes after exiting');
});
test('fish landing during a race joins; swimming fish stays outside the formation',()=>{
  const s=session();loadPasture(s);s.load('goldfish.js');
  s.document.getElementById('doodles-mode-race').click();s.advance(1300);
  const [f,swimmer]=s.window.fishState().fish;
  Object.assign(f,{grounded:true,evolution:'sheep',landAge:20});
  s.advance(100);
  assert.equal(f.x,102);assert.equal(f.landAge,20);
  assert.equal(swimmer.grounded,false);
  const ground=f.y;
  s.event(s.document.body,'keydown',{code:'Space'});s.advance(180);
  assert.ok(f.y<ground-15);
  s.event(s.document.body,'keydown',{code:'Escape',key:'Escape'});s.advance(100);
  assert.ok(f.landAge>20);
});
test('completion transfers exactly one animal into the full flock and saves its new identity',()=>{
  const s=session();s.load('goldfish.js');s.load('../sheep/sheep-overlay.js');
  const sheep=evolve(s);
  assert.ok(sheep);
  assert.equal(s.document.querySelectorAll('#pasture-sheep .sheep').length,4);
  for(const part of ['.sheep-sprite','.sleep-eye','.sleep-zzz','.parachute'])assert.ok(sheep.querySelector(part),part);
  assert.equal(s.window.fishState().fish[0].kind,'sheep');
  assert.equal(s.document.getElementById('doodles-goldfish').context.draws.length,2,'canvas no longer draws the converted animal');
  s.advance(2500);s.event(s.document,'pasture-ready');
  assert.equal(s.document.querySelectorAll('#pasture-sheep .evolved').length,1,'handoff is idempotent');
  const saved=JSON.parse(s.storage.get(stateKey));
  assert.equal(saved.fish[0].kind,'sheep');assert.equal(saved.fish[0].landAge,300);
  const home=sheep.getBoundingClientRect().left;
  s.pointer(sheep,'pointerdown',home+60,600);
  assert.ok(sheep.classList.contains('held'),'native sheep pickup');
  assert.equal(s.window.fishState().drag,null,'fish handler leaves native sheep gestures alone');
  s.pointer(sheep,'pointerup',home+60,600);
  assert.ok(sheep.classList.contains('falling'),'native parachute descent');
  s.advance(5000);
  assert.ok(!sheep.classList.contains('airborne'));
  assert.equal(s.window.fishState().fish[0].kind,'sheep','pickup never turns completed sheep back into a fish');
  assert.equal(s.window.fishState().food.length,0,'holding a sheep does not dispense fish food');
  let slept=false;
  for(let i=0;i<110 && !slept;i++){s.advance(1000);slept=sheep.classList.contains('sleeping');}
  assert.ok(slept,'converted sheep uses the shared nap schedule');
});
test('new sheep joins an already open disco and remains in the shared disco roster',()=>{
  const s=session();s.load('goldfish.js');loadPasture(s);
  s.document.querySelector('#doodles-mode-disco').click();s.advance(1200);
  const sheep=evolve(s);
  assert.ok(sheep.classList.contains('disco'));
  s.document.querySelector('#doodles-mode-disco').click();
  assert.ok(!sheep.classList.contains('disco'));
  s.document.querySelector('#doodles-mode-disco').click();s.advance(1200);
  assert.ok(sheep.classList.contains('disco'));
});
test('evolved sheep races, jumps, exits normally and can forage',()=>{
  const s=session();s.load('goldfish.js');loadPasture(s);
  const sheep=evolve(s);
  const flag=s.document.getElementById('doodles-mode-race');flag.click();s.advance(1300);
  const scenery=s.document.getElementById('pasture-run-scenery');
  assert.equal(scenery.dataset.phase,'running');
  assert.ok(sheep.classList.contains('running'),'converted sheep enters the race roster');
  s.event(s.document.body,'keydown',{code:'Space'});s.advance(180);
  assert.ok(sheep.classList.contains('jumping'),'shared hop controller includes the converted animal');
  s.event(s.document.body,'keydown',{code:'Escape',key:'Escape'});
  assert.ok(!sheep.classList.contains('running'));
  assert.ok(!sheep.classList.contains('jumping'));
  // Make this sheep the only available forager, then let real flower scheduling run.
  for(const animal of s.document.querySelectorAll('#pasture-sheep .sheep'))if(animal!==sheep)animal.classList.add('airborne');
  s.advance(10500);
  assert.ok(sheep.classList.contains('foraging') || sheep.classList.contains('eating'),'flower jobs discover new flock members');
  s.document.querySelector('#doodles-mode-disco').click();s.advance(1200);
  assert.ok(sheep.classList.contains('disco'));
  assert.ok(!sheep.classList.contains('foraging'),'shared priority rules cancel foraging for disco');
});
test('converted identity and position restore in either script order, including legacy saves',()=>{
  const storage=new Map();const first=session(storage);first.load('goldfish.js');loadPasture(first);
  const sheep=evolve(first);
  sheep.style.setProperty('--home','720px');
  first.event(first.window,'beforeunload');
  for(const order of ['fish-first','sheep-first']) {
    const next=session(new Map(storage));
    if(order==='fish-first') {next.load('goldfish.js');loadPasture(next);}
    else {loadPasture(next);next.load('goldfish.js');}
    assert.equal(next.document.querySelectorAll('#pasture-sheep .evolved').length,1);
    assert.equal(next.document.querySelector('#pasture-sheep .evolved').getBoundingClientRect().left,720);
    next.advance(100);
    assert.equal(next.document.getElementById('doodles-goldfish').context.draws.length,2);
  }
  const legacy=JSON.parse(storage.get(stateKey));delete legacy.fish[0].kind;
  storage.set(stateKey,JSON.stringify(legacy));
  const next=session(storage);next.load('goldfish.js');next.advance(100);loadPasture(next);
  assert.equal(next.document.querySelectorAll('#pasture-sheep .evolved').length,1,'old completed forms migrate to real sheep');
  next.resize(400,500);
  assert.ok(next.document.querySelector('#pasture-sheep .evolved').classList.contains('evolved'));
  next.event(next.window,'beforeunload');
  const saved=JSON.parse(storage.get(stateKey));
  assert.ok(saved.fish[0].x<=1,'saved position is clamped for the smaller window');
});
test('all three fish convert independently and gather with the flock',()=>{
  const s=session();loadPasture(s);s.load('goldfish.js');
  const sheep=evolve(s,0);evolve(s,1);evolve(s,2);
  s.document.getElementById('doodles-mode-race').click();
  assert.ok(sheep.classList.contains('running'));
  s.advance(1500);
  assert.equal(s.document.querySelectorAll('#pasture-sheep .evolved').length,3);
  assert.equal(s.document.querySelectorAll('#pasture-sheep .sheep').length,6);
  assert.equal(s.document.getElementById('doodles-goldfish').context.draws.length,0);
  const positions=s.document.querySelectorAll('#pasture-sheep .sheep').map(el=>parseFloat(el.style.getPropertyValue('--run-home')));
  assert.equal(new Set(positions).size,6,'formation makes room for the whole flock');
  assert.ok(positions.every(x=>x>=0 && x<=904));
});

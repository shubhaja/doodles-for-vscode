const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');

test('exclusive lifecycle, toggle, unregister and failed entry return to everyday life',()=>{
  const s=session(),m=s.window.doodlesModes,calls=[];
  const register=id=>m.register({id,label:id,enter:()=>calls.push('enter '+id),exit:()=>calls.push('exit '+id)});
  register('a');const remove=register('b');
  m.activate('a');m.activate('a');m.activate('b');remove();
  assert.deepEqual(calls,['enter a','exit a','enter b','exit b']);
  assert.equal(m.snapshot().active,null);
  m.toggle('a');m.toggle('a');assert.equal(m.snapshot().active,null);
  assert.throws(()=>m.activate('missing'));
  m.register({id:'bad',label:'Bad',enter(){throw Error('failed');},exit(){calls.push('clean bad');}});
  m.activate('a');assert.throws(()=>m.activate('bad'),/failed/);
  assert.equal(m.snapshot().active,null);assert.equal(calls.at(-1),'clean bad');
});

test('rapid disco to race to eyes cancels delayed party and preserves pet storage',()=>{
  const s=session();s.load('goldfish.js');
  for(const file of ['sheep-overlay','disco-overlay','sheep-run'])s.load('../sheep/'+file+'.js');
  s.load('../terminal/terminal-eyes.js');
  const m=s.window.doodlesModes;
  assert.equal(s.document.getElementById('pasture-race-flag'),null);
  assert.equal(s.document.querySelector('.disco-hatch'),null);
  m.activate('disco');s.advance(200);m.activate('race');s.advance(1300);
  assert.equal(s.document.getElementById('pixel-disco').dataset.party,'false');
  assert.equal(s.document.body.classList.contains('pasture-running'),true);
  const before=JSON.stringify(s.window.fishState().fish.map(f=>[f.id,f.kind,f.landAge]));
  m.activate('god');
  assert.equal(s.document.body.classList.contains('pasture-running'),false);
  assert.equal(JSON.stringify(s.window.fishState().fish.map(f=>[f.id,f.kind,f.landAge])),before);
  assert.equal(s.document.getElementById('doodles-mode-god').getAttribute('aria-pressed'),'true');
  s.event(s.window,'pagehide');s.advance(1500);
  assert.equal(m.snapshot().active,null);
});

test('mode shortcuts leave editor Escape and Space alone',()=>{
  const s=session();s.load('../sheep/sheep-run.js');const m=s.window.doodlesModes;
  m.activate('race');const editor=s.document.createElement('textarea');s.document.body.appendChild(editor);
  for(const key of ['Escape','Space'])assert.equal(s.event(editor,'keydown',{key,code:key}).defaultPrevented,undefined);
  assert.equal(m.snapshot().active,'race');
  const button=s.document.getElementById('doodles-mode-race');
  assert.equal(s.event(button,'keydown',{key:'Escape'}).defaultPrevented,true);
  assert.equal(m.snapshot().active,null);
});

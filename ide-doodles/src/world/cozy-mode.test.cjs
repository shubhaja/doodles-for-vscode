const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');
const {createAppearance,DARK_COLORS,DARK_THEME}=require('./host-appearance');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('cozy gathers seated sheep, permits short naps and restores homes when switching',()=>{
  const s=session();s.context.Math=Object.create(Math);s.context.Math.random=()=>.5;
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');s.load('../sheep/sheep-overlay.js');
  s.load('../sheep/flower-foraging.js');s.load('../sheep/disco-overlay.js');
  const sheep=()=>s.document.querySelectorAll('.sheep');
  const homes=sheep().map(el=>el.style.getPropertyValue('--home'));
  s.window.doodlesModes.activate('cozy');s.advance(8000);
  assert.equal(s.document.getElementById('doodles-campfire').hidden,false);
  assert.ok(sheep().every(el=>el.classList.contains('cozy') && !el.classList.contains('cozy-gathering') && !el.classList.contains('sleeping')));
  const first=sheep()[0];assert.ok(parseFloat(first.style.getPropertyValue('--cozy-x'))>450);
  s.resize(500,600);s.advance(20);assert.ok(sheep().every(el=>parseFloat(el.style.getPropertyValue('--cozy-x'))<=404));
  s.advance(40000);assert.ok(sheep().some(el=>el.classList.contains('sleeping')));
  s.advance(10000);assert.ok(sheep().every(el=>!el.classList.contains('sleeping')));
  s.load('goldfish.js');const f=s.window.fishState().fish[0];
  Object.assign(f,{grounded:true,evolution:'sheep',landAge:299.99});s.advance(2000);
  assert.equal(s.document.querySelectorAll('.sheep.evolved').length,1);
  assert.ok(sheep().every(el=>el.classList.contains('cozy')));
  s.window.doodlesModes.activate('disco');s.advance(1200);
  assert.equal(s.document.getElementById('doodles-campfire').hidden,true);
  assert.equal(s.document.body.classList.contains('doodles-dark'),true);
  assert.equal(s.document.body.classList.contains('doodles-disco'),true);
  assert.ok(sheep().every(el=>!el.classList.contains('cozy') && !el.classList.contains('sleeping') && el.classList.contains('disco')));
  assert.deepEqual(sheep().slice(0,3).map(el=>el.style.getPropertyValue('--home')),homes);
});

test('late native bridge and fallback terminal colors restore without losing user changes',async()=>{
  const s=session(),calls=[];s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
  wrapper.xterm={options:{theme:{foreground:'#123456',background:'#abcdef'}}};s.document.body.append(wrapper);
  s.window.doodlesModes.activate('cozy');
  assert.equal(wrapper.xterm.options.theme.foreground,'#e2e8f5');
  wrapper.xterm.options.theme.cursor='#user';
  s.window.doodlesAppearance={local:true,setDarkMode:async value=>calls.push(value)};s.advance(1000);await flush();
  assert.deepEqual(calls,[true]);
  assert.equal(wrapper.xterm.options.theme.foreground,'#e2e8f5');
  wrapper.xterm.options.theme.background='#daytime';s.advance(1000);
  assert.equal(wrapper.xterm.options.theme.background,'#11182b');
  s.window.doodlesModes.activate(null);await flush();assert.deepEqual(calls,[true,false]);
  assert.equal(wrapper.xterm.options.theme.foreground,'#123456');
  assert.equal(wrapper.xterm.options.theme.cursor,'#user');
  assert.equal(s.document.body.classList.contains('doodles-dark-native'),false);
});

test('native theme restores owned colors, preserves user edits and recovers after reload',async()=>{
  const state=new Map(),values={colorTheme:'My Light Theme',colorCustomizations:{'editor.background':'#eeeeee',custom:'#abc'}};
  const vscode={ConfigurationTarget:{Global:1},workspace:{getConfiguration:()=>({inspect:key=>({globalValue:values[key]}),update:async(key,value)=>{values[key]=value;}})}};
  const context={globalState:{get:key=>state.get(key),update:async(key,value)=>state.set(key,value)}};
  const host=createAppearance(vscode,context);
  await host.setDark(true);assert.equal(values.colorTheme,DARK_THEME);
  assert.equal(values.colorCustomizations['editor.foreground'],DARK_COLORS['editor.foreground']);
  values.colorCustomizations['button.background']='#123456';
  await host.setDark(false);assert.equal(values.colorTheme,'My Light Theme');
  assert.equal(values.colorCustomizations['editor.background'],'#eeeeee');
  assert.equal(values.colorCustomizations['button.background'],'#123456');
  assert.equal(values.colorCustomizations.custom,'#abc');
  await host.setDark(true);values.colorTheme='User Chosen Theme';
  await createAppearance(vscode,context).setDark(false);
  assert.equal(values.colorTheme,'User Chosen Theme');assert.equal(state.get('doodlesDarkAppearance'),undefined);
});

test('God mode emits a distinct sound for opening and closing',()=>{
  const s=session(),sounds=[];s.load('../terminal/terminal-eyes.js');
  s.document.addEventListener('pasture-sound',event=>sounds.push(event.detail.kind));
  const button=s.document.getElementById('doodles-mode-god');
  assert.equal(button.textContent,'God mode');button.click();button.click();
  assert.deepEqual(sounds,['eyes-open','eyes-close']);
});

test('evolving land animals walk into cozy, keep growing, and retain their pasture homes',()=>{
  const s=session();s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.load('../sheep/sheep-overlay.js');s.load('goldfish.js');
  const f=s.window.fishState().fish[0];Object.assign(f,{grounded:true,evolution:'sheep',landAge:100,x:50,facing:1});
  s.window.doodlesModes.activate('cozy');s.advance(200);
  const x=f.x;assert.ok(x>50 && x<100,'walks gradually instead of teleporting');
  assert.equal(f.resting,false);assert.ok(f.landAge>100);
  const slot=s.window.doodlesGoldfishCozy.participants()[0];
  assert.equal(slot.classList.contains('cozy-gathering'),true);
  s.advance(12000);assert.equal(f.resting,true);assert.equal(slot.classList.contains('cozy-gathering'),false);
  s.event(s.window,'beforeunload');
  const saved=JSON.parse(s.storage.get('doodles-goldfish-state-v1')).fish[0];
  assert.equal(saved.x,.1,'saved home is separate from camp position');assert.ok(saved.landAge>100);
  f.landAge=299.99;const campX=f.x;s.advance(100);
  const sheep=s.document.querySelector('.sheep.evolved');assert.ok(sheep.classList.contains('cozy'));
  assert.ok(Math.abs(parseFloat(sheep.style.getPropertyValue('--cozy-x'))-(campX*2-48))<15,'handoff continues from the animal position');
  assert.equal(s.window.doodlesPasture.snapshot('goldfish-0').x,52,'handoff preserves the original home');
  s.window.doodlesModes.activate(null);assert.equal(s.document.body.classList.contains('doodles-dark'),false);
});

test('Cozy survives refresh but an explicit exit clears the restored choice',()=>{
  const storage=new Map();
  const load=()=>{const s=session(storage);s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');return s;};
  const first=load();first.window.doodlesModes.activate('cozy');first.event(first.window,'pagehide');
  const next=load();next.advance(20);assert.equal(next.window.doodlesModes.snapshot().active,'cozy');
  assert.equal(next.document.body.classList.contains('doodles-dark'),true);
  next.window.doodlesModes.activate(null);next.event(next.window,'pagehide');
  const last=load();last.advance(20);assert.equal(last.window.doodlesModes.snapshot().active,null);
});

test('terminal OSC overrides are reset and held until Cozy exits, including new panes',async()=>{
  const s=session(),writes=[],handlers=new Map(),disposed=[];
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.window.doodlesSky={setDarkMode:async()=>{}};
  s.window.doodlesModes.activate('cozy');await flush();
  const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
  wrapper.xterm={options:{theme:{background:'#eeeeee',foreground:'#333333'}},write:value=>writes.push(value),
    parser:{registerOscHandler:(code,fn)=>{handlers.set(code,fn);return {dispose:()=>disposed.push(code)};}}};
  s.document.body.append(wrapper);s.advance(1000);
  assert.ok(writes[0].includes(']111'));assert.equal(handlers.get(11)('#eeeeee'),true);assert.equal(handlers.get(11)('?'),false);
  assert.equal(wrapper.xterm.options.theme.background,'#11182b');
  s.window.doodlesModes.activate(null);assert.deepEqual(disposed,[10,11]);
  assert.equal(wrapper.xterm.options.theme.background,'#eeeeee');
});

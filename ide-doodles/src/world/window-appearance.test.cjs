const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');
const {createWindowAppearance,DARK_THEME}=require('./host-appearance');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('two windows share storage without sharing mode, mute, or theme changes',async()=>{
  const shared=new Map(),localA=new Map(),localB=new Map();
  const a=session(shared,localA),b=session(shared,localB);
  for(const s of [a,b]){s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');s.load('../sheep/pasture-audio.js');}
  a.window.doodlesModes.activate('cozy');
  a.document.getElementById('pasture-sound-toggle').click();
  assert.equal(b.window.doodlesModes.snapshot().active,null);
  assert.equal(localB.get('pasture-muted'),undefined);
  const reload=session(shared,localA);reload.load('../world/night-sky.js');reload.load('../world/cozy-mode.js');reload.advance(20);
  assert.equal(reload.window.doodlesModes.snapshot().active,'cozy');
  const another=session(shared,localB);another.load('../world/night-sky.js');another.load('../world/cozy-mode.js');another.advance(20);
  assert.equal(another.window.doodlesModes.snapshot().active,null);

  const themes=[{id:'light',settingsId:'Default Light Modern',type:'light'},{id:'dark',settingsId:DARK_THEME},{id:'chosen',settingsId:'Custom'}];
  const service=()=>({current:themes[0],calls:[],getColorThemes:()=>themes,getColorTheme(){return this.current;},
    async setColorTheme(id,target){assert.equal(target,'preview');this.calls.push(id);this.current=themes.find(t=>t.id===id);}});
  const first=service(),second=service(),host=createWindowAppearance(first);
  await host.setDarkMode(true);assert.equal(first.current.id,'dark');assert.equal(second.current.id,'light');
  await Promise.all([host.setDarkMode(false),host.setDarkMode(true),host.setDarkMode(false)]);
  assert.equal(first.current.id,'light');
  await host.setDarkMode(true);first.current=themes[2];await host.setDarkMode(false);
  assert.equal(first.current.id,'chosen');
});

test('Cozy keeps its colors until theme restoration completes and ignores stale exits',async()=>{
  const s=session(),pending=[],calls=[];
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.window.doodlesAppearance={local:true,setDarkMode(value){calls.push(value);return value?Promise.resolve():new Promise(resolve=>pending.push(resolve));}};
  s.window.doodlesModes.activate('cozy');await flush();
  s.window.doodlesModes.activate(null);
  assert.ok(s.document.body.classList.contains('doodles-dark'));
  s.window.doodlesModes.activate('cozy');pending.shift()();await flush();
  assert.ok(s.document.body.classList.contains('doodles-dark'));
  s.advance(30000);await flush();assert.deepEqual(calls,[true,false,true]);
  s.window.doodlesModes.activate(null);pending.shift()();await flush();
  assert.equal(s.document.body.classList.contains('doodles-dark'),false);
});

test('legacy global appearance bridges are never invoked',()=>{
  const s=session();s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.window.doodlesSky={setDarkMode(){throw new Error('Global settings must not change');}};
  s.window.doodlesModes.activate('cozy');s.advance(30000);s.window.doodlesModes.activate(null);
});

test('native array API preloads both themes and commits the entire palette synchronously',async()=>{
  let release;
  const loaded=new Promise(resolve=>{release=resolve;}),events=[];
  const themes=[['light','Default Light Modern'],['dark',DARK_THEME]].map(([id,settingsId])=>({
    id,settingsId,type:id,isLoaded:false,
    async ensureLoaded(){await loaded;this.isLoaded=true;},
    setCustomizations(settings){assert.equal(settings,service.settings);}
  }));
  const service={settings:{},extensionResourceLoaderService:{},current:themes[1],
    getColorThemes:()=>themes,getColorTheme(){return this.current;},
    applyTheme(theme,target){assert.equal(target,'preview');assert.ok(theme.isLoaded);this.current=theme;events.push('native:'+theme.id);return Promise.resolve();}
  };
  const host=createWindowAppearance(service);
  const obsolete=host.setDarkMode(true,()=>events.push('obsolete'));
  const daylight=host.setDarkMode(false,()=>events.push('palette:light'));
  await flush();assert.deepEqual(events,[]);
  release();await Promise.all([obsolete,daylight]);
  assert.deepEqual(events,['native:light','palette:light']);
  await host.setDarkMode(true,()=>events.push('palette:dark'));
  assert.deepEqual(events.slice(-2),['native:dark','palette:dark']);
  await host.setDarkMode(false,()=>events.push('palette:light'));
  assert.deepEqual(events.slice(-2),['native:light','palette:light']);
});

test('delayed Cozy entry leaves the daylight palette intact until the native commit',async()=>{
  const s=session(),pending=[];
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.window.doodlesAppearance={local:true,setDarkMode(value,commit){return new Promise(resolve=>pending.push(()=>{commit();resolve();}));}};
  s.window.doodlesModes.activate('cozy');
  assert.equal(s.document.body.classList.contains('doodles-dark'),false);
  pending.shift()();await flush();
  assert.equal(s.document.body.classList.contains('doodles-dark'),true);
  s.window.doodlesModes.activate(null);
  assert.equal(s.document.body.classList.contains('doodles-dark'),true);
  pending.shift()();await flush();
  assert.equal(s.document.body.classList.contains('doodles-dark'),false);
});

test('daylight commands keep independent clocks without writing settings',async()=>{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const source=fs.readFileSync(path.join(__dirname,'../../daylight-sky/extension.js'),'utf8');
  const create=()=>{
    const commands=new Map(),state=new Map([['windowAppearanceMigrated',true]]),writes=[];
    const vscode={ConfigurationTarget:{Global:1},workspace:{getConfiguration:()=>({
      inspect:()=>({globalValue:{}}),update:async(...args)=>writes.push(args)})},
      commands:{registerCommand:(name,fn)=>{commands.set(name,fn);return {dispose(){}};}},
      window:{showInformationMessage(){}}};
    const context={subscriptions:[],globalState:{get:(key,fallback)=>state.has(key)?state.get(key):fallback,update:async(key,value)=>state.set(key,value)}};
    const sandbox={module:{exports:{}},console,Intl,Date,require:name=>name==='vscode'?vscode:require('./host-appearance')};
    vm.runInNewContext(source,sandbox);sandbox.module.exports.activate(context);
    return {commands,writes};
  };
  const a=create(),b=create();await flush();
  await a.commands.get('daylightSky.setTime')(123);
  assert.equal(a.commands.get('daylightSky.getTime')().override,123);
  assert.equal(b.commands.get('daylightSky.getTime')().override,null);
  await a.commands.get('daylightSky.setDarkMode')(true);
  await a.commands.get('daylightSky.setDarkMode')(false);
  await a.commands.get('daylightSky.pause')();
  assert.equal(a.commands.get('daylightSky.getTime')().minutes,123);
  await a.commands.get('daylightSky.restore')();
  assert.equal(a.commands.get('daylightSky.getTime')().enabled,false);
  await a.commands.get('daylightSky.resume')();
  assert.equal(a.commands.get('daylightSky.getTime')().enabled,true);
  assert.deepEqual(a.writes,[]);assert.deepEqual(b.writes,[]);
});

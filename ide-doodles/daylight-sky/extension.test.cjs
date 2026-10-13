const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('legacy dark-mode requests preserve user theme and chosen time',async()=>{
  const commands=new Map(),state=new Map();let timer;
  const values={colorTheme:'Original Light',colorCustomizations:{custom:'#abc'}};
  const vscode={ConfigurationTarget:{Global:1},window:{showInformationMessage(){}},
    commands:{registerCommand(name,fn){commands.set(name,fn);return {dispose(){}};}},
    workspace:{getConfiguration:()=>({inspect:key=>({globalValue:values[key]}),update:async(key,value)=>{values[key]=value;}})}};
  const sandbox={module:{exports:{}},require:name=>name==='vscode'?vscode:require('./appearance'),console,Date,setTimeout,setInterval(fn){timer=fn;return 1;},clearInterval(){}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/extension.js','utf8'),sandbox);
  sandbox.module.exports.activate({subscriptions:[],globalState:{get:(k,d)=>state.has(k)?state.get(k):d,update:async(k,v)=>state.set(k,v)}});
  await new Promise(resolve=>setImmediate(resolve));
  await commands.get('daylightSky.setDarkMode')(true);
  await commands.get('daylightSky.setTime')(1080);
  assert.equal(values.colorCustomizations['editor.background'],undefined);
  assert.equal(values.colorTheme,'Original Light');
  await commands.get('daylightSky.setDarkMode')(false);
  assert.equal(values.colorTheme,'Original Light');
  assert.equal(commands.get('daylightSky.getTime')().minutes,1080);
  assert.equal(values.colorCustomizations.custom,'#abc');
});
test('time commands preserve user colors and handle overrides and time zones',async()=>{
  const commands=new Map(),state=new Map();let colors={},timer;
  const vscode={ConfigurationTarget:{Global:1},window:{showInformationMessage(){}},
    commands:{registerCommand(name,fn){commands.set(name,fn);return {dispose(){}};}},
    workspace:{getConfiguration(){return {inspect:()=>({globalValue:colors}),update:async(key,value)=>{colors=value;}}}}
  };
  const context={module:{exports:{}},require:name=>name==='vscode'?vscode:require('./appearance'),console,Date,setTimeout,
    setInterval(fn){timer=fn;return 1;},clearInterval(){}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/extension.js','utf8'),context);
  context.module.exports.activate({subscriptions:[],globalState:{get:(k,d)=>state.has(k)?state.get(k):d,update:async(k,v)=>state.set(k,v)}});
  await new Promise(resolve=>setImmediate(resolve));
  await commands.get('daylightSky.setTime')(1080);
  assert.equal(colors['terminal.background'],undefined);
  assert.equal(commands.get('daylightSky.getTime')().override,1080);
  assert.equal(colors['terminal.background'],undefined);
  await Promise.all([commands.get('daylightSky.setTime')(600),commands.get('daylightSky.setTime')(1200)]);
  assert.equal(commands.get('daylightSky.getTime')().minutes,1200);
  await commands.get('daylightSky.setTime')(null);
  assert.equal(commands.get('daylightSky.getTime')().override,null);
  const now=new Date();assert.equal(colors['terminal.background'],undefined);
  let instant=Date.parse('2026-03-08T06:30:00Z');
  context.Date=class extends Date {constructor(){super(instant);}};
  await commands.get('daylightSky.setTimeZone')('America/New_York');
  assert.equal(commands.get('daylightSky.getTime')().minutes,90);
  instant=Date.parse('2026-03-08T07:30:00Z');
  assert.equal(commands.get('daylightSky.getTime')().minutes,210);
  assert.equal(colors['terminal.background'],undefined);
  await commands.get('daylightSky.setTime')(1080);
  await commands.get('daylightSky.setTimeZone')('Asia/Kathmandu');
  assert.equal(commands.get('daylightSky.getTime')().minutes,1080);
  await commands.get('daylightSky.setTime')(null);
  assert.equal(commands.get('daylightSky.getTime')().minutes,795);
  assert.throws(()=>commands.get('daylightSky.setTimeZone')('invalid/zone'));
});

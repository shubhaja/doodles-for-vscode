const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');
const {skyAt}=require('./ktown-weather.js');

test('normal text has at least 7:1 contrast against every time-of-day sky',()=>{
  const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
    .reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
  for(let minutes=0;minutes<1440;minutes++){
    const ratio=(luminance(skyAt(minutes/60))+.05)/(luminance('#202b3d')+.05);
    assert(ratio>=7,`Insufficient normal text contrast at minute ${minutes}: ${ratio}`);
  }
});

test('Cozy exit reasserts normal text after delayed native commits, including ANSI colors and new terminals',async()=>{
  const s=session(),pending=[];s.context.fetch=async()=>({ok:false});
  const addTerminal=()=>{
    const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
    wrapper.xterm={element:{},options:{theme:{background:'#11182b',foreground:'#e2e8f5',red:'#ff9da8'}}};
    s.document.body.appendChild(wrapper);return wrapper.xterm;
  };
  const terminal=addTerminal();
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');s.load('../weather/ktown-weather.js');
  s.window.doodlesAppearance={local:true,setDarkMode(value,commit){
    return new Promise(resolve=>pending.push(()=>{
      // Simulate the native theme replacing xterm's theme just before commit.
      terminal.options.theme={background:'#11182b',foreground:'#e2e8f5',red:'#ff9da8'};
      commit();resolve();
    }));
  }};
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  for(let cycle=0;cycle<3;cycle++){
    s.window.doodlesModes.activate('cozy');pending.shift()();await flush();
    assert.equal(terminal.options.theme.foreground,'#e2e8f5');
    assert.equal(terminal.options.theme.brightBlue,'#bfd0ff','Cozy replaces daylight bright ANSI colors too');
    s.window.doodlesModes.activate(null);
    assert.equal(terminal.options.theme.foreground,'#e2e8f5','retain dark palette until native exit commits');
    pending.shift()();await flush();
    assert.equal(s.document.body.classList.contains('doodles-dark'),false);
    assert.equal(terminal.options.theme.foreground,'#202b3d');
    assert.equal(terminal.options.theme.red,'#a52232');
    assert.equal(terminal.options.theme.brightWhite,'#202b3d');
  }
  const added=addTerminal();s.advance(1000);
  assert.equal(added.options.theme.foreground,'#202b3d');
  assert.equal(added.options.theme.red,'#a52232');
});

test('unchanged time does not rewrite styles and overlapping clock reads are coalesced',async()=>{
  const s=session();s.context.fetch=async()=>({ok:false});
  s.load('../weather/ktown-weather.js');
  const style=s.document.head.children.find(el=>(el.textContent||'').includes('--vscode-mainWindow-background'));
  let css=style.textContent,writes=0,reads=0,resolve;
  Object.defineProperty(style,'textContent',{get:()=>css,set:value=>{css=value;writes++;}});
  s.document.dispatchEvent(new s.context.CustomEvent('doodles-sky-change'));
  s.document.dispatchEvent(new s.context.CustomEvent('doodles-sky-change'));
  assert.equal(writes,0);
  s.window.doodlesSky={getTime(){reads++;return new Promise(done=>{resolve=done;});}};
  s.advance(3000);
  assert.equal(reads,1,'one clock request may be in flight');
  resolve({minutes:720,override:720});await new Promise(done=>setImmediate(done));
  assert.equal(writes,1);
  assert.equal(s.document.getElementById('doodles-time').value,'720');
});

test('disco uses readable dark colors throughout its cycle and restores the latest daylight',()=>{
  const s=session();s.context.fetch=async()=>({ok:false});
  const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
  wrapper.xterm={element:{},options:{theme:{background:'#181818'}}};
  s.document.body.appendChild(wrapper);
  s.load('../world/night-sky.js');s.load('../weather/ktown-weather.js');s.load('../sheep/disco-overlay.js');
  const css=()=>s.document.head.children.map(el=>el.textContent||'').find(text=>text.includes('color-scheme:light'));
  const before=wrapper.xterm.options.theme.background;
  s.window.doodlesModes.activate('disco');s.advance(1400);
  assert.match(s.window.doodlesDiscoSky,/^#[0-9a-f]{6}$/);
  assert(s.document.body.classList.contains('doodles-dark'));
  assert.equal(wrapper.xterm.options.theme.background,s.window.doodlesDiscoSky);
  assert.equal(wrapper.xterm.options.theme.foreground,'#f4edff');
  const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
    .reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
  for(let step=0;step<100;step++){
    s.advance(240);
    for(const foreground of ['#f4edff','#cbbce5','#79edff','#ff7ce5']){
      const ratio=(luminance(foreground)+.05)/(luminance(s.window.doodlesDiscoSky)+.05);
      assert(ratio>=7,`${foreground} against ${s.window.doodlesDiscoSky}: ${ratio}`);
    }
    assert.equal(wrapper.xterm.options.theme.background,s.window.doodlesDiscoSky);
  }
  assert.notEqual(wrapper.xterm.options.theme.background,before);
  assert(css().includes('--vscode-editorGroup-emptyBackground:'));
  const time=s.document.getElementById('doodles-time');time.value='720';s.event(time,'input');
  assert.equal(wrapper.xterm.options.theme.background,s.window.doodlesDiscoSky,'clock updates preserve disco');
  s.window.doodlesModes.activate(null);
  assert.equal(s.window.doodlesDiscoSky,null);
  assert.equal(s.document.body.classList.contains('doodles-dark'),false);
  assert.equal(wrapper.xterm.options.theme.foreground,'#202b3d');
  assert(css().includes('--pasture-sky:#c3e4f7'),'exit restores the latest selected time');
  assert(css().includes('--vscode-terminal-background:'+wrapper.xterm.options.theme.background));
  assert.equal(s.document.getElementById('pasture-disco-lights'),null);
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');

function setup(extra={},storage){
  let now=Date.parse('2026-09-24T12:00:00Z'),code=63;
  const s=session(storage);
  const rainCalls=[];
  s.window.doodlesRainField=()=>({setAmount:value=>rainCalls.push(['density',value]),setGusts:value=>rainCalls.push(['gust',value]),dispose(){}});
  s.context.Date=class extends Date {static now(){return now;}};
  s.context.MutationObserver=class {observe(){} disconnect(){}};
  s.context.fetch=async()=>({ok:true,json:async()=>({utc_offset_seconds:0,current:{cloud_cover:code===63?100:70,weather_code:code,is_day:1,time:new Date(now).toISOString().slice(0,19),...extra}})});
  s.load('../weather/ktown-weather.js');
  return {s,rainCalls,buttons:s.document.querySelector('.doodles-weather-presets').children,
    overlay:s.document.getElementById('ktown-weather-clouds'),
    tick(ms){now+=ms;s.advance(ms);},setCode(value){code=value;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('live weather, manual threshold and preview reset update animal umbrellas',async()=>{
  const {s,buttons,overlay}=setup({rain:2,showers:0,interval:900});await flush();
  s.load('../sheep/sheep-overlay.js');s.load('goldfish.js');
  const flock=s.document.getElementById('pasture-sheep'),amounts=[];
  s.document.addEventListener('pasture-rain-change',event=>amounts.push(event.detail.amount));
  assert.ok(Number(overlay.dataset.rainAmount)>50);
  assert.ok(flock.classList.contains('raining'),'late animal load uses live rain');
  const slider=s.document.getElementById('doodles-rain');
  for(const amount of [50,51,0]) {
    slider.value=String(amount);s.event(slider,'input');
    assert.equal(flock.classList.contains('raining'),amount>50);
    assert.equal(amounts.at(-1),amount);
  }
  buttons[2].click();assert.ok(flock.classList.contains('raining'),'rain preset');
  buttons[0].click();assert.equal(flock.classList.contains('raining'),false,'sun preset');
  buttons[0].click();assert.ok(flock.classList.contains('raining'),'restore live rain');
  s.event(s.window,'pagehide');
});

test('location selection refreshes coordinates, ignores old weather, and persists across reload',async()=>{
  const {s,overlay,tick}=setup();await flush();
  let finishOld;
  s.context.fetch=()=>new Promise(resolve=>{finishOld=resolve;});
  tick(31000);s.event(s.window,'focus');
  const urls=[];
  s.context.fetch=async url=>{
    urls.push(url);
    return {ok:true,json:async()=>url.includes('photon')?{features:[{geometry:{coordinates:[139.69,35.68]},properties:{name:'Tokyo',country:'Japan'}}]}:
      {timezone:'Asia/Tokyo',utc_offset_seconds:32400,current:{time:'2026-09-24T21:00:31',cloud_cover:12,weather_code:0,is_day:1}}};
  };
  const input=s.document.getElementById('doodles-location');
  assert.equal(input.value,'');input.value='Tokyo';
  s.document.getElementById('doodles-location-search').click();await flush();
  s.document.getElementById('doodles-location-results').children[0].click();await flush();
  assert.match(urls[1],/latitude=35.68&longitude=139.69/);
  assert.equal(overlay.dataset.cloudCover,'12');
  assert.equal(s.document.getElementById('doodles-time').value,'1260');
  finishOld({ok:true,json:async()=>({utc_offset_seconds:0,current:{time:'2026-09-24T12:00:31',cloud_cover:99,weather_code:63,is_day:1}})});await flush();
  assert.equal(overlay.dataset.cloudCover,'12');
  assert.equal(s.document.getElementById('doodles-time').value,'1260');
  assert.equal(s.storage.has('doodles-weather-35.68,139.69'),true);
  s.event(s.window,'pagehide');
  const next=setup({},s.storage);await flush();
  assert.equal(next.s.document.getElementById('doodles-location').value,'Tokyo, Japan');
  assert.equal(next.s.document.getElementById('doodles-time').value,'1260');
  next.s.event(next.s.window,'pagehide');
});

test('failed and empty location searches preserve the current weather',async()=>{
  const {s,overlay}=setup();await flush();
  const search=s.document.getElementById('doodles-location-search');
  s.document.getElementById('doodles-location').value='Tokyo';
  const status=s.document.getElementById('doodles-location-status');
  s.context.fetch=async()=>({ok:true,json:async()=>({features:[]})});
  search.click();await flush();assert.match(status.textContent,/No matches/);
  s.context.fetch=async()=>{throw Error('offline');};
  search.click();await flush();assert.match(status.textContent,/unchanged/);
  assert.equal(overlay.dataset.cloudCover,'100');assert.equal(search.disabled,false);
  s.event(s.window,'pagehide');
});

test('live rainfall and gusts reach the renderer; rain preview uses the selected recipe and then restores live values',async()=>{
  const {s,rainCalls,buttons,overlay}=setup({interval:900,rain:.25,showers:0,wind_speed_10m:15,wind_gusts_10m:36});await flush();
  assert.equal(overlay.dataset.rainAmount,'37');assert.deepEqual(rainCalls.slice(-2),[['gust',60],['density',37]]);
  buttons[2].click();assert.equal(overlay.dataset.rainAmount,'100');assert.deepEqual(rainCalls.slice(-2),[['gust',null],['density',100]]);
  buttons[2].click();assert.deepEqual(rainCalls.slice(-2),[['gust',60],['density',37]]);
  s.event(s.window,'pagehide');
});

test('each preview toggles; rainbow expires back to live rain',async()=>{
  const {s,buttons,overlay,tick}=setup();await flush();
  assert.equal(overlay.dataset.rain,'true');
  for(const button of buttons){
    button.click();assert.equal(overlay.dataset.state,'preview');assert.equal(button.getAttribute('aria-pressed'),'true');
    button.click();assert.equal(overlay.dataset.rain,'true');assert.equal(overlay.dataset.state,'current');
  }
  buttons[3].click();assert.equal(overlay.dataset.rain,'false');
  tick(90000);await flush();
  assert.equal(overlay.dataset.rain,'true');assert.equal(buttons[3].getAttribute('aria-pressed'),'false');
  s.event(s.window,'pagehide');assert.equal(s.document.querySelector('.doodles-weather-controls'),null);
});

test('updates during previews are retained; switching resets expiry',async()=>{
  const {s,buttons,overlay,tick,setCode}=setup();await flush();
  buttons[3].click();tick(40000);setCode(3);s.event(s.window,'focus');await flush();
  assert.equal(overlay.dataset.state,'preview');
  buttons[2].click();tick(50000);assert.equal(overlay.dataset.state,'preview');
  tick(40000);await flush();
  assert.equal(overlay.dataset.rain,'false');assert.equal(overlay.dataset.cloudCover,'70');
  assert.equal(overlay.dataset.state,'current');
});

test('stale observations are not restored after preview',async()=>{
  const {s,buttons,overlay,tick}=setup();await flush();
  s.context.fetch=async()=>{throw Error('offline');};
  buttons[3].click();tick(3*60*60*1000);await flush();
  assert.equal(overlay.dataset.rain,'false');assert.equal(overlay.dataset.cloudCover,'unknown');
});

test('daylight replaces dark terminal text and restores owned colors on release',async()=>{
  const {s,tick}=setup();await flush();
  const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
  const terminal={element:{},options:{allowTransparency:false,theme:{background:'#123456',foreground:'#eeeeee',red:'#aa2233'}}};
  wrapper.xterm=terminal;s.document.body.appendChild(wrapper);
  tick(2000);
  assert.notEqual(terminal.options.theme.background,'#123456');
  assert.match(terminal.options.theme.background,/^#[a-f0-9]{6}$/);
  assert.equal(terminal.options.allowTransparency,false);
  assert.equal(terminal.options.theme.foreground,'#202b3d');
  assert.equal(terminal.options.theme.red,'#a52232');
  assert.equal(s.window.doodlesPrepareTerminal,undefined);
  s.event(s.window,'pagehide');
  assert.equal(terminal.options.theme.background,'#123456');
  assert.equal(terminal.options.theme.foreground,'#eeeeee');
  assert.equal(terminal.options.theme.red,'#aa2233');
  assert.equal(terminal.options.theme.cursor,undefined);
});

test('daylight text returns after Cozy exits and respects explicit terminal edits on release',async()=>{
  const {s,tick}=setup();await flush();
  const wrapper=s.document.createElement('div');wrapper.className='terminal-wrapper';
  wrapper.xterm={element:{},options:{theme:{foreground:'#eeeeee',background:'#222222'}}};
  s.document.body.appendChild(wrapper);tick(1000);
  s.load('../world/night-sky.js');s.load('../world/cozy-mode.js');
  s.window.doodlesModes.activate('cozy');tick(1000);
  assert.equal(wrapper.xterm.options.theme.foreground,'#e2e8f5');
  s.window.doodlesModes.activate(null);
  assert.equal(wrapper.xterm.options.theme.foreground,'#202b3d');
  wrapper.xterm.options.theme.foreground='#user';
  s.event(s.window,'pagehide');
  assert.equal(wrapper.xterm.options.theme.foreground,'#user');
});

test('time slider controls native Daylight Sky and follows its state',async()=>{
  const {s,tick}=setup();await flush();
  let state={minutes:720,override:null};const calls=[];
  s.window.doodlesSky={
    getTime:async()=>state,
    setTime:async minutes=>{calls.push(minutes);return state={minutes:minutes ?? 721,override:minutes};}
  };
  tick(1000);await flush();
  const slider=s.document.getElementById('doodles-time');
  assert.equal(slider.value,'720');
  slider.value='1080';s.event(slider,'input');await flush();
  assert.deepEqual(calls,[1080]);assert.equal(slider.value,'1080');
  tick(60000);await flush();assert.equal(slider.value,'1080');
  const live=s.document.getElementById('doodles-settings').querySelectorAll('button').find(el=>el.textContent==='Use live weather & time');
  live.click();await flush();assert.deepEqual(calls,[1080,null]);assert.equal(slider.value,'721');
  state={minutes:722,override:null};tick(1000);await flush();assert.equal(slider.value,'722');
  s.event(s.window,'pagehide');
});

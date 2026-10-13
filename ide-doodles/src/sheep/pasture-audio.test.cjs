const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('../goldfish/test-dom.cjs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('feeding audio unlocks on the gesture, plays short effects and obeys mute and visibility',async()=>{
  const s=session(),voices=[],noises=[];let context;
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),Q:param()});
  s.context.MutationObserver=class {observe(){}disconnect(){}};
  s.window.AudioContext=class {
    constructor(){context=this;this.state='suspended';this.currentTime=10;this.sampleRate=8000;this.destination={};}
    createGain(){return node();}
    createBuffer(){return {getChannelData:()=>new Float32Array(8000)};}
    createBiquadFilter(){return node();}
    createOscillator(){const voice={...node(),start(t){this.started=t;},stop(t){this.stopped=t;}};voices.push(voice);return voice;}
    createBufferSource(){const voice={...node(),start(t){this.started=t;},stop(t){this.stopped=t;}};noises.push(voice);return voice;}
    async resume(){this.state='running';}
    async suspend(){this.state='suspended';}
    async close(){this.state='closed';}
  };
  s.load('../sheep/pasture-audio.js');
  assert.equal(context,undefined);
  s.pointer(s.document.body,'pointerdown',500,220);await flush();
  assert.equal(context.state,'running');assert.equal(voices.length,0,'unlock is silent');
  const sound=kind=>s.event(s.document,'pasture-sound',{detail:{kind}});
  sound('food-pop');await flush();
  assert.equal(voices.length,2);assert.ok(voices.every(v=>v.stopped-v.started<.1));
  sound('food-glub');await flush();
  assert.equal(voices.length,4);assert.equal(voices[2].started,10.12);assert.equal(voices[3].started,10.34);
  assert.ok(voices[3].stopped<10.6,'bubble phrase lasts less than a second');
  const count=noises.length;
  sound('eyes-open');sound('eyes-close');await flush();
  assert.equal(noises.length,count+2);
  assert.ok(Math.abs(noises.at(-2).stopped-noises.at(-2).started-.48)<.001);
  assert.ok(Math.abs(noises.at(-1).stopped-noises.at(-1).started-.34)<.001);
  s.document.getElementById('pasture-sound-toggle').click();await flush();
  sound('eyes-open');sound('eyes-close');await flush();assert.equal(noises.length,count+2);
  sound('food-pop');sound('food-glub');await flush();assert.equal(voices.length,4);
  s.document.getElementById('pasture-sound-toggle').click();await flush();
  s.hide(true);sound('food-glub');await flush();assert.equal(voices.length,4);
  s.hide(false);await flush();sound('food-glub');await flush();assert.equal(voices.length,6);
  const cozy=active=>s.event(s.document,'doodles-cozy-change',{detail:{active}});
  cozy(true);await flush();
  const bed=noises.find(n=>n.loop);assert.ok(bed,'cozy starts a soft continuous fire bed');
  const crackles=noises.length;s.advance(2000);assert.ok(noises.length>crackles,'fire adds irregular crackles');
  s.document.getElementById('pasture-sound-toggle').click();await flush();
  assert.ok(Object.prototype.hasOwnProperty.call(bed,'stopped'));
  const mutedCount=noises.length;s.advance(2000);assert.equal(noises.length,mutedCount);
  s.document.getElementById('pasture-sound-toggle').click();await flush();assert.ok(noises.length>mutedCount);
  s.hide(true);await flush();const hiddenCount=noises.length;s.advance(2000);assert.equal(noises.length,hiddenCount);
  s.hide(false);await flush();assert.ok(noises.length>hiddenCount);
  cozy(false);const endedCount=noises.length;s.advance(2000);assert.equal(noises.length,endedCount);
  s.event(s.window,'pagehide');await flush();assert.equal(context.state,'closed');
  sound('food-pop');await flush();assert.equal(voices.length,6);
});

test('food still pops without swimmers but does not make a chasing sound',()=>{
  const s=session(),sounds=[];s.load('goldfish.js');
  s.document.addEventListener('pasture-sound',event=>sounds.push(event.detail.kind));
  s.window.fishState().fish.forEach(f=>{f.grounded=true;});
  s.pointer(s.document.body,'pointerdown',500,220);s.advance(3100);
  assert.deepEqual(sounds,['food-pop']);
  s.advance(3000);assert.deepEqual(sounds,['food-pop']);
});

test('recorded Cozy loop decodes once, cancels pending starts, and obeys mute and visibility',async()=>{
  const s=session(),sources=[];let resolveDecode,decodes=0,context;
  const recording={duration:64};
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param()});
  s.context.atob=value=>Buffer.from(value,'base64').toString('binary');
  s.context.MutationObserver=class {observe(){}disconnect(){}};
  s.window.AudioContext=class {
    constructor(){context=this;this.state='running';this.currentTime=10;this.sampleRate=8000;this.destination={};}
    createGain(){return node();}
    createBuffer(){return {getChannelData:()=>new Float32Array(8000)};}
    createBiquadFilter(){return node();}
    decodeAudioData(bytes){
      decodes++;assert.equal(Buffer.from(bytes).subarray(0,4).toString(),'OggS');
      return new Promise(resolve=>{resolveDecode=resolve;});
    }
    createBufferSource(){const source={...node(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}
    async resume(){this.state='running';}
    async suspend(){this.state='suspended';}
    async close(){this.state='closed';}
  };
  s.load('../sheep/pasture-audio.js');
  const cozy=active=>s.event(s.document,'doodles-cozy-change',{detail:{active}});
  cozy(true);cozy(true);await flush();assert.equal(decodes,1);
  cozy(false);resolveDecode(recording);await flush();assert.equal(sources.length,0,'late decode must not start after exit');
  cozy(true);cozy(true);await flush();assert.equal(sources.length,1,'concurrent starts share one source');
  assert.equal(sources[0].buffer,recording);assert.equal(sources[0].loop,true);
  s.advance(3000);assert.equal(sources.length,1,'recording replaces synthetic crackles');
  const mute=s.document.getElementById('pasture-sound-toggle');
  mute.click();await flush();assert.equal(sources[0].stopped,true);
  mute.click();await flush();assert.equal(sources.length,2);assert.equal(decodes,1);
  s.hide(true);await flush();assert.equal(sources[1].stopped,true);
  s.hide(false);await flush();assert.equal(sources.length,3);
  cozy(false);assert.equal(sources[2].stopped,true);
  cozy(true);await flush();assert.equal(sources.length,4);
  s.event(s.window,'pagehide');await flush();assert.equal(sources[3].stopped,true);assert.equal(context.state,'closed');
  cozy(true);await flush();assert.equal(sources.length,4);
});

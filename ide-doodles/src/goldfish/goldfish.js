(() => {
  'use strict';
  if (document.getElementById('doodles-goldfish')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'doodles-goldfish';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:997;image-rendering:pixelated;';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const listeners = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, {capture:true, signal:listeners.signal});
  let disco=document.getElementById('pixel-disco')?.dataset.party==='true';
  let umbrellas=Number(document.getElementById('ktown-weather-clouds')?.dataset.rainAmount)>50;
  on(document,'pasture-disco-change',event=>{disco=Boolean(event.detail.open);});
  on(document,'pasture-rain-change',event=>{umbrellas=Number(event.detail.amount)>50;});
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let width, height, hold = null, drag = null, food = [], bubbles = [], frame, last = 0, elapsed = 0;
  let feedingSoundUntil=0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const school = {target:null, wander:0};
  const fish = Array.from({length:3}, (_, i) => ({
    id:i, x:0, y:0, vx:0, vy:0, heading:i%2 ? Math.PI : 0, facing:i%2 ? -1 : 1,
    phase:random(0,7), size:[0.65,0.6,0.7][i], target:null, wander:0, bite:0,
    speed:14, stroke:random(0,16), turn:0, bubbleIn:random(8,22), grounded:false, landAge:0, walkPhase:0, stroll:0, resting:false, kind:'fish', evolution:null
  }));
  const adopted = new Set();
  const cozyAnimals=new Map();
  let cozy=document.body.classList?.contains('doodles-cozy') || false;
  const swimTop = () => Math.min(18, height * 0.1);
  const swimBottom = () => Math.max(swimTop(), height / 3 - 28);
  // Grow into the pasture's 3x pixel scale during the mammal-to-sheep stages.
  const animalScale = f => {
    const t=clamp((f.landAge-180)/120,0,1);
    return f.size+(1.5-f.size)*t*t*(3-2*t);
  };
  const standingY = f => height - 5 - clamp((f.landAge-180)/120,0,1) - 20*animalScale(f);
  const landMargin = f => Math.min(width/2,Math.max(24,27*animalScale(f)));
  function resize() {
    cancel();
    const oldWidth = width || innerWidth / 2, oldHeight = height || innerHeight / 2;
    width = Math.ceil(innerWidth / 2); height = Math.ceil(innerHeight / 2);
    canvas.width = width; canvas.height = height;
    for (const f of fish) {
      const margin=f.grounded ? landMargin(f) : 16;
      f.x = clamp(f.x * width / oldWidth, margin, width - margin);
      f.y = f.grounded ? standingY(f) : clamp(f.y * height / oldHeight, swimTop(), swimBottom());
      f.target = null;
    }
    food = []; bubbles = []; hold = null; school.target = null;
  }
  resize();
  fish.forEach((f,i) => {
    f.x = clamp(width/2+(i-1)*42,16,width-16);
    f.y = clamp(height/4+(i-1)*16,swimTop(),swimBottom());
  });
  const palettes = [
    {edge:'#a44224', dark:'#d65722', mid:'#f78c27', light:'#ffc65b', shine:'#ffe7a2', fin:'#efa04b'},
    {edge:'#ad592f', dark:'#dd7639', mid:'#ffc06b', light:'#ffe2ad', shine:'#fff2d1', fin:'#f2b673'},
    {edge:'#a13f28', dark:'#cc4d23', mid:'#f17b24', light:'#ffac43', shine:'#ffe292', fin:'#e89043'}
  ];
  // Cache 16 complete pixel poses per fish: a traveling body wave, a broad
  // forked fantail, dorsal fin and independently paddling pectoral fins.
  const sprites = palettes.map((p,skin) => Array.from({length:16},(_,frame) => {
    const sprite = document.createElement('canvas'); sprite.width = 48; sprite.height = 36;
    sprite.pixels = Array(48*36).fill(null);
    const c = sprite.getContext('2d'), phase = frame/16*Math.PI*2;
    const pixel = (x,y,color) => {
      x=Math.round(x); y=Math.round(y);
      c.fillStyle=color; c.fillRect(x,y,1,1);
      if(x>=0 && x<48 && y>=0 && y<36) sprite.pixels[y*48+x]=color;
    };
    const wave = x => Math.sin(phase+(30-x)*0.17)*Math.pow(Math.max(0,32-x)/32,2)*3;
    // The tail spreads into two flowing lobes with a notch between them.
    for(let x=3;x<22;x++) {
      const spread=(22-x)*0.57+1, center=18+wave(x);
      for(let y=Math.ceil(center-spread);y<=center+spread;y++) {
        if(x<10 && Math.abs(y-center)<(10-x)*0.55) continue;
        const ray = Math.round(Math.abs(y-center)*2+(22-x)*0.6)%5===0;
        pixel(x,y,ray ? p.light : Math.abs(y-center)>spread-1.5 ? p.edge : p.fin);
      }
    }
    // Tall swept dorsal and soft ventral fins.
    for(let x=20;x<34;x++) {
      const top=8-Math.sin((x-20)/14*Math.PI)*5;
      for(let y=top;y<15;y++) pixel(x,y+wave(x), (x+y)%5===0 ? p.light : p.fin);
      if(x<28) for(let y=23;y<28-(x-20)*0.3;y++) pixel(x,y+wave(x),p.fin);
    }
    // Rounded goldfish belly, curved gill, highlight and cream/calico patches.
    for(let x=18;x<=40;x++) for(let y=8;y<=27;y++) {
      const q=((x-29)/11.5)**2+((y-17.5)/8.5)**2;
      if(q>1) continue;
      let color=q>0.83 ? p.edge : y<13 ? p.light : y>22 ? p.dark : p.mid;
      if(skin===1 && ((x-26)**2+(y-16)**2<27 || x>34 && y>17)) color=p.shine;
      if(y===11 && x>26 && x<34 || y===12 && x>22 && x<27) color=p.shine;
      if(x===34 && y>=16 && y<=22) color=p.dark;
      if(y>14 && y<22 && x<32 && (x+y*2)%7===0) color=p.light;
      pixel(x,y+wave(x),color);
    }
    const paddle=Math.round(Math.sin(phase+1)*2);
    for(let x=27;x<33;x++) for(let y=20;y<25+(32-x)*0.35+paddle;y++) pixel(x,y,p.fin);
    pixel(36,14,p.shine); pixel(37,14,p.shine);
    pixel(36,15,'#302d27'); pixel(37,15,'#302d27'); pixel(36,16,'#302d27');
    pixel(36,14,'#fff3d7'); pixel(40,18,p.dark); pixel(41,19,p.light);
    sprite.eye={x:36,y:15};
    return sprite;
  }));
  const evolutionSeconds = 300;
  const stateKey = 'doodles-goldfish-state-v1';
  // One-time requested reset; subsequent reloads preserve new creature progress.
  try {
    const resetKey = 'doodles-creatures-reset-2026-09-24';
    if (!localStorage.getItem(resetKey)) {
      localStorage.removeItem(stateKey);
      localStorage.setItem(resetKey, 'done');
    }
  } catch (_) { /* Storage may be unavailable. */ }
  let savedAt = 0;
  function saveState() {
    try {
      localStorage.setItem(stateKey, JSON.stringify({version:1, fish:fish.map(f => {
        if(f.kind==='sheep') {
          const sheep=window.doodlesPasture?.snapshot('goldfish-'+f.id);
          if(sheep && Number.isFinite(sheep.x)) {
            f.x=(sheep.x+48)/2;f.y=standingY(f);
            f.facing=sheep.direction;f.heading=f.facing>0 ? 0 : Math.PI;
          }
        }
        // Reloading during a drag restores its last committed position and habitat.
        const state = drag?.f===f ? {...f,...drag.origin} : cozyAnimals.has(f.id) ? {...f,...cozyAnimals.get(f.id).origin} : raceRunners.has(f.id) ? {...f,...raceRunners.get(f.id).origin} : f;
        return {id:f.id, kind:f.kind, x:state.x/width, y:state.y/height, grounded:state.grounded,
          evolution:f.evolution, landAge:state.landAge, heading:state.heading, facing:state.facing};
      })}));
    } catch (_) { /* Storage may be unavailable; the animation can still run. */ }
  }
  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(stateKey));
      if (saved?.version!==1 || !Array.isArray(saved.fish)) return;
      for (const f of fish) {
        const state = saved.fish.find(item => item?.id===f.id);
        if (!state || !['x','y','landAge','heading'].every(key => Number.isFinite(state[key]))
          || typeof state.grounded!=='boolean' || ![-1,1].includes(state.facing)) continue;
        f.grounded=state.grounded;
        f.landAge=f.grounded ? clamp(state.landAge,0,evolutionSeconds) : 0;
        // Migrate previously saved completed forms into permanent flock members.
        // Migrate retired animal saves without losing progress.
        f.evolution=['sheep','frog','bird'].includes(state.evolution) || state.landAge>0 ? 'sheep' : null;
        f.kind=['sheep','frog','bird'].includes(state.kind) || f.landAge===evolutionSeconds ? 'sheep' : 'fish';
        if(f.kind==='sheep') {f.grounded=true;f.landAge=evolutionSeconds;}
        const margin=f.grounded ? landMargin(f) : 16;
        f.x=clamp(state.x*width,margin,width-margin);
        f.y=f.grounded ? standingY(f) : clamp(state.y*height,8,height-8);
        f.facing=state.facing;
        f.heading=f.grounded ? (f.facing>0 ? 0 : Math.PI) : state.heading;
      }
    } catch (_) { /* Invalid or missing saves start with the default school. */ }
  }
  restoreState();
  function adoptSheep(f) {
    if(adopted.has(f.id))return true;
    const camper=cozyAnimals.get(f.id);
    const member=window.doodlesPasture?.addSheep({id:'goldfish-'+f.id,x:(camper?camper.origin.x:f.x)*2-48,direction:camper?camper.origin.facing:f.facing,activityX:camper?f.x*2-48:undefined});
    if(!member)return false;
    adopted.add(f.id);
    return true;
  }
  function restoreFlock() {
    for(const f of fish)if(f.kind==='sheep')adoptSheep(f);
  }
  on(document,'pasture-ready',restoreFlock);
  restoreFlock();
  // Lightweight race slots let canvas creatures use the flock's shared course.
  const raceRunners = new Map();
  let racing = document.body.classList?.contains('pasture-running') || false;
  function raceRunner(f) {
    if (!raceRunners.has(f.id)) {
      const slot = document.createElement('div');
      const origin = {x:f.x,y:f.y,heading:f.heading,facing:f.facing,resting:f.resting};
      slot.getBoundingClientRect = () => ({left:f.x*2-48});
      raceRunners.set(f.id,{slot,origin});
    }
    return raceRunners.get(f.id).slot;
  }
  window.doodlesGoldfishRace = {
    participants() {
      cancel();
      return fish.filter(f=>f.kind==='fish' && f.grounded).map(raceRunner);
    }
  };
  on(document,'pasture-run-change',event=>{
    racing=event.detail.active;
    if(racing)return;
    for(const f of fish) {
      const runner=raceRunners.get(f.id);
      if(runner)Object.assign(f,runner.origin);
    }
    raceRunners.clear();
    saveState();
  });
  function cozyParticipant(f){
    if(!cozyAnimals.has(f.id)){
      const slot=document.createElement('div');slot.hidden=true;slot.setAttribute('aria-hidden','true');
      slot.getBoundingClientRect=()=>({left:f.x*2-48});document.body.appendChild(slot);
      cozyAnimals.set(f.id,{slot,origin:{x:f.x,y:f.y,heading:f.heading,facing:f.facing,resting:f.resting}});
    }
    return cozyAnimals.get(f.id).slot;
  }
  function releaseCozy(){
    for(const f of fish){const entry=cozyAnimals.get(f.id);if(entry){if(f.kind!=='sheep')Object.assign(f,entry.origin);entry.slot.remove();}}
    cozyAnimals.clear();
  }
  window.doodlesGoldfishCozy={participants(){
    return fish.filter(f=>f.kind!=='sheep' && f.grounded).map(cozyParticipant);
  }};
  on(document,'doodles-cozy-change',event=>{
    cozy=event.detail.active;
    if(!cozy){releaseCozy();saveState();}
  });
  const landSprites = new Map();
  const landKeyframes = new Map();
  const mixColor = (a,b,t) => {
    const channels = color => color.slice(1).match(/../g).map(v=>parseInt(v,16));
    const aa=channels(a), bb=channels(b);
    return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*t).toString(16).padStart(2,'0')).join('');
  };
  // Representative body plans, not a claim that these are known direct ancestors.
  // The first pose retains our fanciful goldfish; the remaining sequence follows
  // the tetrapod -> synapsid -> mammal -> ruminant branch.
  const landForms = [
    {name:'Walking goldfish',rx:11.5,ry:8.5,cy:0,tail:1,fin:1,limbs:2,fur:0,ears:0,hooves:0,horns:0,wool:0},
    {name:'Lobe-finned fish',rx:15,ry:6,cy:7,tail:1,fin:0.5,limbs:4,fur:0,ears:0,hooves:0,horns:0,wool:0},
    {name:'Early tetrapod',rx:15,ry:5,cy:9,tail:0.9,fin:0,limbs:4,fur:0,ears:0,hooves:0,horns:0,wool:0},
    {name:'Early amniote',rx:13,ry:5,cy:7,tail:0.85,fin:0,limbs:4,fur:0,ears:0,hooves:0,horns:0,wool:0},
    {name:'Early synapsid',rx:14,ry:6,cy:6,tail:0.7,fin:0,limbs:4,fur:0,ears:0,hooves:0,horns:0,wool:0},
    {name:'Cynodont',rx:12,ry:6,cy:5,tail:0.5,fin:0,limbs:4,fur:0.4,ears:0.2,hooves:0,horns:0,wool:0},
    {name:'Small early mammal',rx:11,ry:6,cy:5,tail:0.75,fin:0,limbs:4,fur:1,ears:1,hooves:0,horns:0,wool:0},
    {name:'Early even-toed ungulate',rx:12,ry:6,cy:3,tail:0.4,fin:0,limbs:4,fur:1,ears:1,hooves:1,horns:0,wool:0},
    {name:'Early ruminant',rx:12,ry:6,cy:5,tail:0.25,fin:0,limbs:4,fur:1,ears:1,hooves:1,horns:0,wool:0},
    {name:'Wild sheep',rx:11,ry:6,cy:8,tail:0.15,fin:0,limbs:4,fur:1,ears:1,hooves:1,horns:0,wool:0.15},
    {name:'Domestic woolly sheep',rx:11,ry:7,cy:10,tail:0.15,fin:0,limbs:4,fur:1,ears:1,hooves:1,horns:0,wool:1}
  ];
  // Exact standing pose from ../sheep/sheep-pixel.png, frame 0 (32x24).
  // Keeping it as native pixels makes the injected script self-contained.
  const sheepColors = [null,'#fff6db','#f1e6c7','#dfd3b3','#d1c7a6','#a59a85',
    '#827c70','#615f57','#43453f','#c4b89b'];
  const sheepRows = [
    '................................',
    '................................',
    '..................1112..........',
    '................21111112........',
    '...............2111111112.......',
    '........1.....31121222223.......',
    '.....21111112223234245667.......',
    '....211111111222257567666.......',
    '...32111111122225765668666......',
    '...21111111112225693667666......',
    '..312212111112222222576666......',
    '..42212122111222222226777.......',
    '..332222222212222222235.........',
    '..433222222222222222229.........',
    '...3332222222222222334..........',
    '...3323322222222222224..........',
    '...933333332333222334...........',
    '....93333444333333439...........',
    '.....594994449933999............',
    '.....87.77.....6777.............',
    '.....77.78.....7787.............',
    '.....77.88.....7787.............',
    '................................',
    '................................'
  ];
  function pixelSprite() {
    const sprite=document.createElement('canvas'); sprite.width=64; sprite.height=40;
    sprite.pixels=Array(64*40).fill(null);
    const c=sprite.getContext('2d');
    sprite.paint=(x,y,color)=>{
      x=Math.round(x); y=Math.round(y);
      if(!color || x<0 || x>=64 || y<0 || y>=40) return;
      sprite.pixels[y*64+x]=color;
      c.fillStyle=color; c.fillRect(x,y,1,1);
    };
    return sprite;
  }
  // Interpolate solid silhouettes, not translucent images. Boundary distances
  // let fins recede and fleece expand without a hard swap or ghosted outlines.
  function shapeField(sprite) {
    if(sprite.field) return sprite.field;
    const pixels=sprite.pixels, edges=[[],[]];
    for(let y=0;y<40;y++) for(let x=0;x<64;x++) {
      const i=y*64+x, solid=!!pixels[i];
      if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([xx,yy])=>
        xx>=0 && xx<64 && yy>=0 && yy<40 && !!pixels[yy*64+xx]!==solid))
        edges[solid ? 1 : 0].push(i);
    }
    sprite.field=pixels.map((color,i)=>{
      let distance=Infinity, nearest=i;
      for(const other of edges[color ? 0 : 1]) {
        const d=(i%64-other%64)**2+(Math.floor(i/64)-Math.floor(other/64))**2;
        if(d<distance) {distance=d;nearest=other;}
      }
      return {distance:(Math.sqrt(distance)-0.5)*(color ? 1 : -1), color:color || pixels[nearest]};
    });
    return sprite.field;
  }
  function landSprite(f) {
    const step=Math.min(60,Math.floor(f.landAge/evolutionSeconds*60));
    const pose=f.resting ? 0 : Math.floor(f.walkPhase)%4;
    const key=f.id+':'+step+':'+pose+':'+f.resting+':'+f.evolution;
    if(landSprites.has(key)) return landSprites.get(key);
    const progress=step/6, index=Math.floor(progress);
    const start=landKeyframe(f,index,pose);
    if(progress===index) {landSprites.set(key,start);return start;}
    const end=landKeyframe(f,index+1,pose), a=shapeField(start), b=shapeField(end);
    const t=progress-index, eased=t*t*(3-2*t), sprite=pixelSprite();
    for(let i=0;i<a.length;i++) if(a[i].distance*(1-eased)+b[i].distance*eased>=0)
      sprite.paint(i%64,Math.floor(i/64),mixColor(a[i].color,b[i].color,eased));
    // Pupils remain readable rather than blending into the coat mid-transition.
    paintEye(sprite,Math.round(start.eye.x*(1-eased)+end.eye.x*eased),
      Math.round(start.eye.y*(1-eased)+end.eye.y*eased));
    landSprites.set(key,sprite);
    return sprite;
  }
  function paintEye(sprite,x,y) {
    sprite.eye={x,y};
    sprite.paint(x,y-1,'#fff3d7');
    sprite.paint(x,y,'#302d27');
    sprite.paint(x+1,y,'#302d27');
  }
  function landKeyframe(f,progress,pose) {
    const key=f.id+':'+progress+':'+pose+':'+f.resting;
    if(landKeyframes.has(key)) return landKeyframes.get(key);
    const sprite=pixelSprite(), p=palettes[f.id], form=landForms[progress];
    if(progress>=8) {
      // Build the last forms backward from the real sheep. A slimmer torso and
      // longer shanks gradually give way to its round fleece and short feet.
      const bodyBottom=[15,17,19][progress-8];
      const colors=progress===10 ? sheepColors : progress===9
        ? [null,'#e0d1b0','#c5b18c','#ad9875','#968669','#918570','#827c70','#615f57','#43453f','#a59374']
        : [null,'#c9b88b','#a28a60','#927c56','#806d4c','#918570','#827c70','#615f57','#43453f','#8c7754'];
      for(let y=0;y<24;y++) {
        const sy=y>=22 ? y : y<bodyBottom ? Math.floor(y/bodyBottom*19)
          : 19+Math.floor((y-bodyBottom)/(22-bodyBottom)*3);
        for(let x=0;x<32;x++) {
          const swing=progress===10 || f.resting || y<bodyBottom ? 0 : Math.round(Math.sin(pose*Math.PI/2+(x<12 ? 0 : Math.PI)));
          // The terminal gait matches the real flock's two-state 3px waddle.
          const bob=progress===10 && !f.resting ? pose%2 : 0;
          sprite.paint(x+13+swing,y+16-bob,colors[Number(sheepRows[sy][x])]);
        }
      }
      // The reference sheep's pupil is at (22,8); retain its exact original
      // pixel in the final form and strengthen the smaller earlier faces.
      const eyeY=16+Math.ceil(8*bodyBottom/19);
      if(progress===10) sprite.eye={x:35,y:24-(f.resting ? 0 : pose%2)};
      else paintEye(sprite,35,eyeY);
      landKeyframes.set(key,sprite);
      return sprite;
    }
    const {rx,ry,cy,tail,fin,fur,ears,hooves,horns,wool}=form;
    const earth=clamp(progress/3,0,1);
    const edge=mixColor(mixColor(p.edge,'#645540',earth),'#9b927a',wool);
    const mid=mixColor(mixColor(p.mid,'#a28a60',earth),'#f1e6c7',wool);
    const light=mixColor(mixColor(p.light,'#c9b88b',earth),'#fff6db',wool);
    const dark=mixColor(mixColor(p.dark,'#79674c',earth),'#c4b89b',wool);
    const leg=mixColor(p.mid,'#827c70',earth);
    const pixel=(x,y,color)=>sprite.paint(Math.round(x)+29,Math.round(y)+18,color);
    const stamp=(source,sx,sy,sw,sh,dx,dy,dw,dh)=>{
      for(let y=0;y<dh;y++) for(let x=0;x<dw;x++)
        sprite.paint(dx+x,dy+y,source.pixels[(sy+Math.floor(y/dh*sh))*source.width+sx+Math.floor(x/dw*sw)]);
    };
    const oval=(cx,oy,ox,sy,fill,border,fluffy=0)=>{
      for(let y=Math.floor(oy-sy-2);y<=oy+sy+2;y++)
        for(let x=Math.floor(cx-ox-2);x<=cx+ox+2;x++) {
          const q=((x-cx)/ox)**2+((y-oy)/sy)**2;
          const rim=1+fluffy*0.13*Math.cos(Math.atan2(y-oy,x-cx)*12);
          if(q<=rim) pixel(x,y,q>rim-0.22 ? border : fill);
        }
    };
    const drawLeg=(center,index,rear=false)=>{
      const phase=pose*Math.PI/2+index*Math.PI;
      const swing=f.resting ? 0 : Math.round(Math.sin(phase)*2);
      const lift=f.resting ? 0 : Math.max(0,Math.round(Math.cos(phase)*2));
      const top=Math.round(cy+ry-3), bottom=19-lift;
      const spread=progress>0 && progress<5 ? (center<0 ? -2 : 2) : 0;
      for(let y=top;y<=bottom;y++) {
        const radius=progress===0 ? (y===bottom ? 0 : 1) : y===bottom ? 0 : y===bottom-1 ? 1 : 2;
        const bend=Math.round((swing+spread)*(y-top)/Math.max(1,bottom-top));
        for(let x=-radius;x<=radius;x++) {
          const outline=y>=top+2 && (Math.abs(x)===radius || y===bottom);
          pixel(center+x+bend,y,outline ? edge : rear ? dark : leg);
        }
      }
      if(hooves>0.5) {
        for(let x=-2;x<=1;x++) {
          pixel(center+swing+x,bottom,'#615f57');
          pixel(center+swing+x,bottom-1,'#615f57');
        }
      }
    };
    if(form.limbs>=3) {drawLeg(-10,1,true);drawLeg(2,0,true);}
    if(progress===0) stamp(sprites[f.id][pose*4],0,0,48,36,0,0,48,36);
    else {
      if(progress<2) {
        stamp(sprites[f.id][pose*4],0,0,19,36,
          Math.round(14-14*tail),Math.round(cy),Math.round(16*tail),24);
      } else {
        for(let x=0;x<Math.round(tail*14);x++) {
          const y=cy+Math.sin(x/5)*2;
          pixel(-rx-x,y,edge);pixel(-rx-x,y+1,mid);
          if(x<tail*10) pixel(-rx-x,y+2,mid);
        }
      }
      if(fin>0) {
        const finHeight=Math.round(7*fin);
        for(let x=-7;x<3;x++) for(let y=cy-ry-finHeight;y<cy-ry+2;y++)
          if(y>cy-ry-finHeight+(x+3)*(x+3)/18) pixel(x,y,p.fin);
      }
      oval(-3,cy,rx,ry,mid,edge,wool);
      for(let y=Math.ceil(cy-ry+3);y<cy+ry-2;y+=4)
        for(let x=-rx+1;x<5;x+=5) {
          if(((x+3)/rx)**2+((y-cy)/ry)**2<0.7) {
            pixel(x,y,light);pixel(x+1,y,light);
            if(wool>0.3) {pixel(x-1,y+1,light);pixel(x+1,y+2,dark);}
            else if(fur>0.3) pixel(x+1,y+1,dark);
          }
        }
      const headY=cy-(progress>=7 ? 3 : 0);
      oval(10,headY,progress>=5 ? 5 : 6,progress>=5 ? 5 : 3,
        mixColor(mid,'#827c70',clamp(progress-8,0,1)),edge);
      if(ears>0.1) {
        oval(7,headY-6,1+ears,1+ears,light,edge);
        oval(13,headY-6,1+ears,1+ears,light,edge);
      }
      if(horns>0.1) {
        oval(6,headY-4,3*horns,4*horns,'#c5b58b','#786b51');
        if(horns>0.6) oval(6,headY-4,1,2,dark,'#786b51');
      }
      if(wool>0.4) oval(10,headY-5,3,2,light,mid,1);
      paintEye(sprite,40,Math.round(18+headY-2));
      pixel(15,headY+1,'#615f57');
    }
    drawLeg(-6,0);drawLeg(3,1);
    if(progress===0) sprite.eye={x:36,y:15};
    landKeyframes.set(key,sprite);
    return sprite;
  }
  function walk(f,dt) {
    if(!f.evolution) f.evolution='sheep';
    f.landAge=Math.min(evolutionSeconds,f.landAge+dt);
    f.stroll-=dt;
    if(f.stroll<=0) {
      f.resting=!f.resting;
      f.stroll=f.resting ? random(1.5,4) : random(6,12);
      if(!f.resting && Math.random()<0.3) f.facing*=-1;
    }
    if(!f.resting) {
      const speed=reduced.matches ? 2 : 7;
      f.x+=f.facing*speed*dt;
      f.walkPhase+=dt*(reduced.matches ? 1 : 5);
    }
    const margin=landMargin(f);
    if(f.x<=margin || f.x>=width-margin) {
      f.x=clamp(f.x,margin,width-margin);
      f.facing=f.x<=margin ? 1 : -1;
    }
    f.heading=f.facing>0 ? 0 : Math.PI;
    f.y=standingY(f);
  }
  // Shared slim purple umbrella; keep in sync with the other animal renderer.
  const umbrellaColors={"e": "#70647e", "m": "#9585a8", "h": "#b2a0c2", "s": "#847394", "p": "#817b80"};
  const umbrellaRows=[
    '..............eeee..............',
    '...........ehhhhhhmme...........',
    '........ehhhhhhhhhmmmmme........',
    '......ehhhhhhhhhhhmmmmmmse......',
    '....emmmmmmmmmmmmmmmmmmmssse....',
    '...emmmmmmmmmmmmmmmmmmmmsssse...',
    '..esssssssssssssssssssssssssse..',
    '..eeeeeeeeeeeeeeeeeeeeeeeeeeee..',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
    '...............p................',
  ];
  // Rasterize once at integer art pixels. Transformed fillRect edges are
  // antialiased even when imageSmoothingEnabled is false; sprite blits are not.
  const umbrellaSprite=document.createElement('canvas');
  umbrellaSprite.width=32;umbrellaSprite.height=24;
  const umbrellaCtx=umbrellaSprite.getContext('2d');
  umbrellaRows.forEach((row,y)=>[...row].forEach((key,x)=>{
    if(umbrellaColors[key]) {umbrellaCtx.fillStyle=umbrellaColors[key];umbrellaCtx.fillRect(x,y,1,1);}
  }));
  const glassesSprite=document.createElement('canvas');
  glassesSprite.width=11;glassesSprite.height=4;
  const glassesCtx=glassesSprite.getContext('2d');
  glassesCtx.fillStyle='#282e29';
  glassesCtx.fillRect(0,0,11,1);glassesCtx.fillRect(3,1,5,3);glassesCtx.fillRect(9,1,2,2);
  glassesCtx.fillStyle='#8baebb';glassesCtx.fillRect(4,1,3,1);glassesCtx.fillRect(9,1,1,1);
  function drawGlasses(sprite) {
    if(!disco)return;
    const eye=sprite.eye || {x:40,y:15};
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(glassesSprite,eye.x-34,eye.y-20);
  }
  function drawUmbrella(f,sprite,scale,angle=0) {
    if(!umbrellas)return;
    // Find the top of this pose, including fins and changing evolution silhouettes.
    if(sprite.shelterTop===undefined) {
      const first=sprite.pixels?.findIndex(Boolean) ?? -1;
      sprite.shelterTop=first<0 ? 0 : Math.floor(first/sprite.width);
    }
    const top=(sprite.shelterTop-18)*scale;
    const clearance=Math.abs(Math.sin(angle))*18*scale;
    ctx.save();
    ctx.translate(Math.round(f.x-16*scale),Math.max(0,Math.round(f.y+top-clearance-12*scale)));
    ctx.scale(scale,scale);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(umbrellaSprite,0,0);
    ctx.restore();
  }
  function drawFish(f) {
    // Keep the full side profile, retaining facing while swimming nearly vertically.
    if (Math.abs(Math.cos(f.heading)) > 0.2) f.facing = Math.cos(f.heading) > 0 ? 1 : -1;
    const facing = f.facing;
    const onLand=f.grounded || (drag?.f===f && drag.origin.grounded);
    const scale=onLand ? animalScale(f) : f.size;
    const sprite=onLand ? landSprite(f) : sprites[f.id][Math.floor(f.stroke)%16];
    const angle=f.grounded ? 0 : Math.sin(f.heading)*facing*0.45;
    drawUmbrella(f,sprite,scale,angle);
    ctx.save(); ctx.translate(Math.round(f.x),Math.round(f.y));
    ctx.rotate(angle);
    ctx.scale(facing*scale,scale);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(sprite,-29,-18);
    drawGlasses(sprite);
    if(f.bite>0) { ctx.fillStyle='#ffe8a8'; ctx.fillRect(11,0,2,2); }
    ctx.restore();
  }
  function dispense(x,y) {
    const count = Math.min(12, 48-food.length);
    for (let i=0;i<count;i++) food.push({x:clamp(x+random(-14,14),8,width-8), y:clamp(y+random(-6,5),8,height-8), age:0, drift:random(-2,2)});
    if(count>0) {
      document.dispatchEvent(new CustomEvent('pasture-sound',{detail:{kind:'food-pop'}}));
      feedingSoundUntil=elapsed+1;
    }
  }
  function mouthBubble(f) {
    const angle = Math.sin(f.heading)*f.facing*0.45;
    const x = 13*f.size*f.facing, y = f.size;
    bubbles.push({x:Math.round(f.x)+x*Math.cos(angle)-y*Math.sin(angle),
      y:Math.round(f.y)+x*Math.sin(angle)+y*Math.cos(angle), age:0,
      life:random(1.8,2.8), drift:random(-1.5,1.5)});
  }
  function hitFish(x,y) {
    return [...fish].reverse().find(f => {
      if(f.kind==='sheep' || raceRunners.has(f.id) || cozyAnimals.has(f.id))return false;
      const angle=f.grounded ? 0 : Math.sin(f.heading)*f.facing*0.45;
      const dx=x-f.x, dy=y-f.y;
      const scale=f.grounded ? animalScale(f) : f.size;
      const lx=(dx*Math.cos(angle)+dy*Math.sin(angle))/scale*f.facing;
      const ly=(-dx*Math.sin(angle)+dy*Math.cos(angle))/scale;
      return lx>=-27 && lx<=22 && ly>=-16 && ly<=(f.grounded ? 20 : 12);
    });
  }
  function finishDrag(restore=false) {
    if (!drag) return;
    const {f,origin,id}=drag; drag=null;
    if (restore) Object.assign(f,origin);
    else {
      f.grounded=f.y>=standingY(f)-24;
      if (f.grounded) { f.y=standingY(f); f.heading=f.facing>0 ? 0 : Math.PI; }
      if(!f.grounded) {f.landAge=0;f.evolution=null;}
      else if(!origin.grounded) {f.stroll=random(6,12);f.resting=false;}
      f.target=null; f.vx=0; f.vy=0;
    }
    if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    canvas.style.cursor='';
    saveState();
  }
  function cancel() { hold = null; finishDrag(true); }
  function resetEvolution() {
    cancel();
    document.dispatchEvent(new CustomEvent('doodles-evolution-reset'));
    releaseCozy();
    for(const {slot} of raceRunners.values())slot.remove();
    raceRunners.clear();adopted.clear();food=[];bubbles=[];school.target=null;school.wander=0;
    fish.forEach((f,i)=>{
      window.doodlesPasture?.removeSheep('goldfish-'+f.id);
      Object.assign(f,{kind:'fish',evolution:null,landAge:0,grounded:false,
        x:clamp(width/2+(i-1)*42,16,width-16),y:clamp(height/4+(i-1)*16,swimTop(),swimBottom()),
        vx:0,vy:0,heading:i%2?Math.PI:0,facing:i%2?-1:1,target:null,wander:0,
        bite:0,turn:0,stroll:0,resting:false});
    });
    saveState();
  }
  window.doodlesResetEvolution=resetEvolution;
  const consume = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  on(window,'pointerdown',e => {
    if (e.button !== 0 || !e.isPrimary || e.altKey || e.ctrlKey || e.metaKey || drag) return;
    if(e.target?.closest?.('#pasture-sheep, #pasture-race-flag, #pixel-disco, #pasture-sound-toggle, #doodles-settings, .doodles-weather-controls')) {hold=null;return;}
    const x=e.clientX/2, y=e.clientY/2, f=hitFish(x,y);
    if (f) {
      hold=null;
      drag={id:e.pointerId,f,offsetX:x-f.x,offsetY:y-f.y,
        origin:{x:f.x,y:f.y,grounded:f.grounded,heading:f.heading,landAge:f.landAge}};
      f.grounded=false; f.vx=0; f.vy=0;
      canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor='grabbing';
      consume(e); return;
    }
    hold = {id:e.pointerId, x:e.clientX, y:e.clientY, start:performance.now(), fed:false};
  });
  on(window,'pointermove',e => {
    if (drag && e.pointerId===drag.id) {
      if (!(e.buttons & 1)) { cancel(); return; }
      const f=drag.f;
      const margin=drag.origin.grounded ? landMargin(f) : Math.min(20,width/2);
      f.x=clamp(e.clientX/2-drag.offsetX,margin,width-margin);
      f.y=clamp(e.clientY/2-drag.offsetY,18,standingY(f));
      consume(e); return;
    }
    if (!hold || e.pointerId !== hold.id) return;
    if (!(e.buttons & 1) || Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>6) cancel();
  });
  on(window,'pointerup',e => {
    if (drag && e?.pointerId===drag.id) { finishDrag(); consume(e); }
    hold=null;
  });
  on(window,'pointercancel',cancel);
  on(window,'lostpointercapture',e => { if (e.target===canvas) cancel(); });
  on(window,'blur',cancel); on(window,'dragstart',cancel);
  on(document,'pointerout',e => { if (!e.relatedTarget && !drag) cancel(); });
  on(window,'keydown',e => { if (e.key === 'Escape') cancel(); });
  on(window,'resize',resize);
  function tick(now) {
    const dt = Math.min((now-(last || now))/1000,0.05); last = now; elapsed += dt;
    ctx.clearRect(0,0,width,height);
    if (hold && !hold.fed && now-hold.start >= 3000) {
      dispense(hold.x/2,hold.y/2); hold.fed = true;
    }
    for (const pellet of food) {
      pellet.age += dt; pellet.y += dt*3.5; pellet.x = clamp(pellet.x+pellet.drift*dt,4,width-4);
      ctx.fillStyle = '#98613c'; ctx.fillRect(Math.round(pellet.x),Math.round(pellet.y),2,2);
      ctx.fillStyle = '#e4b46a'; ctx.fillRect(Math.round(pellet.x),Math.round(pellet.y),1,1);
    }
    food = food.filter(p => p.age < 24 && p.y < height-12);
    // Snapshot neighbors so steering does not depend on update order.
    const neighbors = fish.filter(f => f.kind==='fish' && !f.grounded && drag?.f!==f).map(f => ({id:f.id,x:f.x,y:f.y,vx:f.vx,vy:f.vy}));
    const center = neighbors.reduce((c,f) => ({x:c.x+f.x/neighbors.length,y:c.y+f.y/neighbors.length}), {x:0,y:0});
    school.wander -= dt;
    if (!school.target || school.wander <= 0 || Math.hypot(school.target.x-center.x,school.target.y-center.y)<35) {
      school.target = {x:random(24,Math.max(25,width-24)),y:random(swimTop(),swimBottom())};
      school.wander = random(16,28);
    }
    const claimed = new Set();
    for (const f of fish) {
      if(f.kind==='sheep') {
        if(!adoptSheep(f))drawFish(f);
        continue;
      }
      f.bite = Math.max(0,f.bite-dt);
      if (drag?.f===f) { drawFish(f); continue; }
      if(cozy && f.grounded){
        if(!cozyAnimals.has(f.id))document.dispatchEvent(new CustomEvent('doodles-cozy-animal-added',{detail:{animal:cozyParticipant(f)}}));
        const {slot}=cozyAnimals.get(f.id),position=parseFloat(slot.style.getPropertyValue('--cozy-x'));
        if(Number.isFinite(position))f.x=(position+48)/2;
        f.y=standingY(f)-(parseFloat(slot.style.getPropertyValue('--cozy-bottom'))||6)/2+3;
        f.facing=Number(slot.style.getPropertyValue('--cozy-facing'))||f.facing;f.heading=f.facing>0?0:Math.PI;
        f.resting=!slot.classList.contains('cozy-gathering');
        if(!f.resting)f.walkPhase+=dt*9;
        if(f.kind==='fish'){
          if(!f.evolution)f.evolution='sheep';f.landAge=Math.min(evolutionSeconds,f.landAge+dt);
          if(f.landAge===evolutionSeconds){f.kind='sheep';adoptSheep(f);slot.remove();cozyAnimals.delete(f.id);saveState();}
          else drawFish(f);
        }
        continue;
      }
      if (f.grounded) {
        if(racing && !raceRunners.has(f.id)) {
          document.dispatchEvent(new CustomEvent('pasture-runner-added',{detail:{animal:raceRunner(f)}}));
        }
        const runner=raceRunners.get(f.id);
        if(runner) {
          const slot=runner.slot;
          f.x=(parseFloat(slot.style.getPropertyValue('--run-home'))+48)/2;
          f.y=standingY(f)+(parseFloat(slot.style.getPropertyValue('--run-y'))||0)/2;
          f.facing=slot.classList.contains('gathering') ? Number(slot.style.getPropertyValue('--gather-facing'))||1 : 1;
          f.heading=f.facing>0 ? 0 : Math.PI;
          f.resting=slot.classList.contains('waiting');
          if(!reduced.matches && !document.body.classList.contains('pasture-run-paused') && !f.resting)f.walkPhase+=dt*14;
          drawFish(f);
          continue;
        }
        walk(f,dt);
        if(f.landAge===evolutionSeconds) {
          f.kind='sheep';f.grounded=true;f.target=null;
          adoptSheep(f);saveState();
        }
        if(!adopted.has(f.id))drawFish(f);
        continue;
      }
      let meal = null, distance = Infinity;
      for (const p of food) {
        if (claimed.has(p)) continue;
        const d = Math.hypot(p.x-f.x,p.y-f.y);
        if (d < distance) { meal = p; distance = d; }
      }
      if(meal) claimed.add(meal);
      // One short shared bubble phrase per pinch, only when a swimmer chases it.
      if(meal && distance>12 && feedingSoundUntil>elapsed) {
        feedingSoundUntil=0;
        document.dispatchEvent(new CustomEvent('pasture-sound',{detail:{kind:'food-glub'}}));
      }
      f.wander -= dt;
      if (!f.target || f.wander <= 0 || Math.hypot(f.target.x-f.x,f.target.y-f.y)<12) {
        f.target = {x:random(-24,24),y:random(-20,20)};
        f.wander = random(4,9);
      }
      const target = meal || {x:school.target.x+f.target.x,y:school.target.y+f.target.y};
      const dx = target.x-f.x, dy = target.y-f.y, length = Math.hypot(dx,dy) || 1;
      let steerX=dx/length, steerY=dy/length;
      for(const other of neighbors) {
        if(other.id===f.id) continue;
        const ox=f.x-other.x, oy=f.y-other.y, d=Math.hypot(ox,oy);
        if(d<52) {
          const force=(1-d/52)*(meal ? 0.65 : 3.2);
          steerX+=(d>0.01 ? ox/d : f.id>other.id ? 1 : -1)*force;
          steerY+=(d>0.01 ? oy/d : 0.5)*force;
        }
        // Anticipate a crossing before bodies overlap.
        const px=ox+(f.vx-other.vx)*0.65, py=oy+(f.vy-other.vy)*0.65;
        const predicted=Math.hypot(px,py);
        if(predicted<32 && predicted>0.01 && !meal) {
          steerX+=px/predicted*1.5; steerY+=py/predicted*1.5;
        }
        if(d>52 && !meal) {
          // Attraction grows with distance so stragglers always rejoin the school.
          const cohesion=clamp((d-52)/65,0,2.5);
          steerX+=other.vx/30*0.3-ox/d*cohesion;
          steerY+=other.vy/30*0.3-oy/d*cohesion;
        }
      }
      // Soft boundaries make the fish arc back into the window.
      const margin=Math.min(48,width/5,height/5);
      if(!meal) {
        steerX+=Math.max(0,1-f.x/margin)*3-Math.max(0,1-(width-f.x)/margin)*3;
        const bandMargin = margin;
        steerY+=Math.max(0,1-(f.y-swimTop())/bandMargin)*3
          -Math.max(0,1-(swimBottom()-f.y)/bandMargin)*3;
      }
      const desired=Math.atan2(steerY,steerX);
      const delta=Math.atan2(Math.sin(desired-f.heading),Math.cos(desired-f.heading));
      const rate=meal ? 3.5 : reduced.matches ? 0.3 : 1.15;
      const turn=clamp(delta,-rate*dt,rate*dt);
      f.heading+=turn; f.turn=dt ? turn/dt : 0;
      // Tail beats produce short pushes and glides; tight turns slow the body.
      const cruise=meal ? 48*clamp(length/30,0.25,1) : reduced.matches ? 3 : 15;
      const speed=cruise*(0.85+0.15*Math.sin(f.stroke/16*Math.PI*2))*(1-Math.min(0.45,Math.abs(delta)*0.15));
      f.speed+=(speed-f.speed)*(1-Math.exp(-dt*3));
      f.vx=Math.cos(f.heading)*f.speed; f.vy=Math.sin(f.heading)*f.speed;
      f.x=clamp(f.x+f.vx*dt,8,width-8);
      // Feeding can lead outside the idle band; swim back smoothly afterward.
      const bottom = meal || f.y > swimBottom() ? height-8 : swimBottom();
      f.y=clamp(f.y+f.vy*dt,8,bottom);
      f.stroke=(f.stroke+dt*(reduced.matches ? 4 : 13+f.speed*0.38))%16;
      if (meal && Math.hypot(meal.x-f.x,meal.y-f.y)<13) {
        food.splice(food.indexOf(meal),1); f.bite = 0.3;
      }
      drawFish(f);
      f.bubbleIn -= dt;
      if (f.bubbleIn <= 0) {
        mouthBubble(f);
        f.bubbleIn = random(12,26) * (reduced.matches ? 2 : 1);
      }
    }
    for (const b of bubbles) {
      b.age += dt; b.y -= dt*(reduced.matches ? 3 : 8); b.x += b.drift*dt;
      ctx.globalAlpha = 0.28*Math.max(0,1-b.age/b.life)*Math.min(1,b.age/0.2); ctx.strokeStyle = '#83b9bc';
      ctx.strokeRect(Math.round(b.x),Math.round(b.y),2,2);
    }
    ctx.globalAlpha = 1; bubbles = bubbles.filter(b => b.age<b.life);
    if (now-savedAt>=1000) { saveState(); savedAt=now; }
    frame = requestAnimationFrame(tick);
  }
  on(document,'visibilitychange',() => {
    cancelAnimationFrame(frame); cancel(); last = 0;
    saveState();
    if (!document.hidden) frame = requestAnimationFrame(tick);
  });
  on(window,'beforeunload',saveState);
  on(window,'pagehide',() => { saveState();releaseCozy();delete window.doodlesGoldfishCozy; cancelAnimationFrame(frame); listeners.abort(); canvas.remove();delete window.doodlesResetEvolution; });
  frame = requestAnimationFrame(tick);
  if(cozy)document.dispatchEvent(new CustomEvent('doodles-cozy-animals-ready'));
})();

(function () {
  'use strict';
  if (document.getElementById('pasture-sheep')) return;
  const style = document.createElement('style');
  style.textContent = `
    /* Grass is body::after at 1000; sheep belong immediately beneath it. */
    #pasture-sheep {display:contents;pointer-events:none;}
    #pasture-sheep .sheep {position:fixed;z-index:999;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;bottom:6px;left:clamp(0px,var(--home),calc(100% - 96px));width:96px;height:72px;animation:sheep-stroll var(--cycle) steps(24,end) infinite;animation-delay:var(--delay);}
    #pasture-sheep .sheep-facing {position:relative;width:100%;height:100%;animation:sheep-turn var(--cycle) steps(1,end) infinite;animation-delay:var(--delay);}
    #pasture-sheep .sheep-sprite {width:100%;height:100%;background-image:var(--sheep-sprite);background-size:400% 100%;background-repeat:no-repeat;image-rendering:pixelated;animation:sheep-poses var(--cycle) steps(1,end) infinite,sheep-waddle var(--cycle) steps(1,end) infinite;animation-delay:var(--delay);transform-origin:50% 90%;}
    #pasture-sheep .sheep.airborne {z-index:1002;animation:none;bottom:auto;}
    #pasture-sheep .sheep.airborne .sheep-facing {animation:none;transform:scaleX(var(--held-facing));}
    #pasture-sheep .sheep.airborne .sheep-sprite {animation:none;background-position:0 0;transform-origin:62% 24%;}
    #pasture-sheep .sheep.held {cursor:grabbing;}
    #pasture-sheep .sheep.held .sheep-sprite {animation:sheep-dangle 1.2s ease-in-out infinite alternate;}
    @keyframes sheep-dangle {from {transform:rotate(-9deg);} to {transform:rotate(9deg);}}
    #pasture-sheep .parachute {display:none;position:absolute;left:8px;top:-53px;width:80px;height:70px;pointer-events:none;background-size:100% 100%;image-rendering:pixelated;}
    #pasture-sheep .sheep.falling .parachute {display:block;}
    @media (prefers-reduced-motion:reduce) {#pasture-sheep .sheep.held .sheep-sprite {animation:none;}}
    #pasture-sheep .sheep.sleeping {animation-play-state:paused;bottom:-6px;}
    #pasture-sheep .sheep.sleeping .sheep-facing {animation-play-state:paused;}
    #pasture-sheep .sheep.sleeping .sheep-sprite {animation:none;background-position:0 0;transform:none;}
    #pasture-sheep .sleep-eye {display:none;position:absolute;left:63px;top:21px;width:9px;height:9px;background:#827c70;pointer-events:none;}
    #pasture-sheep .sleep-eye::after {content:'';position:absolute;left:0;top:6px;width:6px;height:3px;background:#43453f;box-shadow:6px -3px 0 -0.5px #43453f;}
    #pasture-sheep .sheep.sleeping .sleep-eye {display:block;}
    #pasture-sheep .sleep-zzz {display:none;position:absolute;left:var(--zzz-left,70px);top:-5px;color:#788da8;font:bold 12px monospace;letter-spacing:1px;pointer-events:none;text-shadow:0 1px #f5f0e7;}
    #pasture-sheep .sheep.sleeping .sleep-zzz {display:block;}
    #pasture-sheep .sleep-zzz span {position:absolute;left:0;top:0;opacity:0;transform-origin:center;}
    #pasture-sheep .sheep.sleeping .sleep-zzz span {animation:sheep-dream 3.6s linear infinite;animation-delay:var(--z-delay);}
    @keyframes sheep-dream {0% {opacity:0;transform:translate(0,0) scale(1);} 12% {opacity:0.9;} 55% {opacity:0.6;} 100% {opacity:0;transform:translate(12px,-32px) scale(0.35);}}
    @media (prefers-reduced-motion:reduce) {#pasture-sheep .sheep.sleeping .sleep-zzz span {animation:none;position:static;opacity:0.75;}}
    #pasture-sheep .rain-umbrella {display:none;position:absolute;left:0;top:-30px;width:96px;height:72px;z-index:-1;background-image:var(--sheep-umbrella);background-size:100% 100%;image-rendering:pixelated;pointer-events:none;}
    #pasture-sheep.raining .rain-umbrella {display:block;}
    #pasture-sheep.raining .sheep.falling .rain-umbrella {display:none;}
    /* Keep the regular head-up sheep and walking motion while wearing shades. */
    #pasture-sheep .sheep.disco .sheep-sprite {position:relative;}
    #pasture-sheep .sheep.disco:not(.airborne) .sheep-sprite {background-position:0 0;animation-name:sheep-waddle;}
    @media (prefers-reduced-motion:reduce) {#pasture-sheep .sheep.disco .sheep-sprite {animation:none;}}
    #pasture-sheep .sheep.disco .sheep-sprite::after {content:'';position:absolute;left:54px;top:18px;width:24px;height:3px;background:#282e29;box-shadow:6px 3px #282e29,6px 6px #282e29;}
    #pasture-sheep .sheep.disco .sheep-sprite::before {content:'';position:absolute;z-index:1;left:63px;top:21px;width:9px;height:3px;background:#8baebb;}
    @keyframes sheep-stroll {
      0%,20%,84%,100% {left:clamp(0px,var(--home),calc(100% - 96px));}
      34%,70% {left:clamp(0px,calc(var(--home) + var(--step)),calc(100% - 96px));}
    }
    @keyframes sheep-turn {
      0%,100% {transform:scaleX(var(--direction));}
      70% {transform:scaleX(var(--return));}
    }
    @keyframes sheep-poses {
      0%,12%,38%,53%,88% {background-position:33.333333% 0;}
      6%,16%,44%,60%,94% {background-position:66.666667% 0;}
      18%,66%,98% {background-position:100% 0;}
      20%,70% {background-position:0% 0;}
    }
    /* Two discrete gait states, alternating roughly every 0.3 seconds. */
    @keyframes sheep-waddle {
      0%,34%,84%,100% {transform:translate(0,0);}
      20%, 21%, 22%, 23%, 24%, 25%, 26%, 27%, 28%, 29%, 30%, 31%, 32%, 33%, 70%, 71%, 72%, 73%, 74%, 75%, 76%, 77%, 78%, 79%, 80%, 81%, 82%, 83% {transform:translate(0,0);}
      20.5%, 21.5%, 22.5%, 23.5%, 24.5%, 25.5%, 26.5%, 27.5%, 28.5%, 29.5%, 30.5%, 31.5%, 32.5%, 33.5%, 70.5%, 71.5%, 72.5%, 73.5%, 74.5%, 75.5%, 76.5%, 77.5%, 78.5%, 79.5%, 80.5%, 81.5%, 82.5%, 83.5% {transform:translate(0,-3px);}
    }
    @media (prefers-reduced-motion:reduce) {
      #pasture-sheep .sheep,#pasture-sheep .sheep-facing,#pasture-sheep .sheep-sprite {animation:none;}
      #pasture-sheep .sheep-facing {transform:scaleX(var(--direction));}
      #pasture-sheep .sheep-sprite {background-position:33.333333% 0;}
    }
    @media (max-width:700px) {#pasture-sheep .sheep:not(.evolved):nth-child(n+3) {display:none;}}
  `;
  const flock = document.createElement('div');
  flock.id='pasture-sheep';flock.setAttribute('aria-hidden','true');
  flock.style.setProperty('--sheep-sprite','url("data:image/png;base64,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")');
  const flockMembers=[];
  const members=new Map();
  // Two screen pixels per art pixel, with the same warm highlights and
  // olive-grey shadows as the creatures. Each gore has its own rounded light.
  const canopy=parachuteSprite();
  function parachuteSprite() {
    const parts=[];
    const path=(fill,d)=>parts.push(`<path fill="${fill}" d="${d}"/>`);
    const pixel=(x,y,fill)=>parts.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
    function cord(x,y,endX,endY) {
      const steps=endY-y;
      for(let i=0;i<=steps;i++) {
        const px=Math.round(x+(endX-x)*i/steps);
        pixel(px,y+i,'#797c70');
        if(i%3!==2)pixel(px-1,y+i,'#d8d0b6');
      }
    }
    cord(3,14,17,32);cord(12,14,19,32);
    cord(27,14,21,32);cord(36,14,23,32);
    // The stepped silhouette and scalloped hem stay sharp at the live size.
    path('#626f69','M1 15V11H3V8H5V6H8V4H12V2H16V1H24V2H28V4H32V6H35V8H37V11H39V15H36V14H32V15H28V16H25V15H22V14H18V15H15V16H12V15H8V14H4V15Z');
    path('#8baaa9','M2 13V11H4V8H6V6H9V5H13V3H17V2H23V3H27V5H31V6H34V8H36V11H38V14H35V13H32V14H28V15H25V14H22V13H18V14H15V15H12V14H8V13Z');
    // Left blue panel: soft reflected cream at the crown, cool folded underside.
    path('#b5d2cd','M3 11V9H5V7H8V5H13V4H15V3H18V4H15V6H12V9H10V13H7V12H3Z');
    path('#d8e4d6','M5 9V7H8V6H10V5H14V4H16V5H13V6H10V7H8V9Z');
    path('#779a9a','M2 12H4V13H8V12H10V14H8V13H4V14H2Z');
    // Inner blue gores, with narrow seams curving outward as the cloth fills.
    path('#a5c7c5','M11 13V9H13V6H16V4H18V3H20V5H18V8H17V11H16V14H14V15H12V14Z');
    path('#c9ded5','M12 10V8H14V6H16V5H18V4H19V5H17V7H15V10Z');
    path('#719594','M10 12V9H11V7H13V5H15V4H16V5H14V7H12V10H11V14H10Z');
    path('#7faaa9','M23 3H25V4H28V6H30V9H31V13H28V15H25V14H24V10H23Z');
    path('#b8d2cb','M24 4H25V5H27V7H28V10H26V8H25V6H24Z');
    path('#688c8c','M29 9H30V11H31V14H29V15H27V14H29Z');
    path('#95b7b3','M27 4H29V5H32V7H34V9H36V12H37V13H34V12H32V13H31V9H29V6H27Z');
    path('#bcd4cb','M29 5H31V6H33V8H34V10H33V9H32V7H30V6H29Z');
    path('#73938f','M33 11H35V12H37V14H35V13H32V14H31V12H33Z');
    // Butter-coloured centre panel uses the wool palette, shaded at its edges.
    path('#b5aa88','M19 2H22V4H23V6H24V10H25V14H23V13H18V14H16V12H17V8H18V4H19Z');
    path('#e4d8b5','M19 3H21V4H22V7H23V11H24V13H21V12H18V13H17V11H18V7H19Z');
    path('#fff4d6','M19 3H21V5H22V8H21V7H19V10H18V7H19Z');
    path('#f2e8c9','M19 8H21V11H22V12H18V11H19Z');
    path('#c9bb98','M22 8H23V11H24V13H22V12H21V11H22Z');
    // Broken stitches, tiny creases and brass cord attachments, not noise.
    for(const [x,y,c] of [[7,10,'#c9ded5'],[8,10,'#c9ded5'],[13,11,'#d8e4d6'],[14,12,'#87abaa'],[26,11,'#c9ded5'],[34,10,'#73938f'],[6,12,'#e4e6d2'],[13,14,'#d8d0b6'],[19,12,'#fff4d6'],[27,14,'#d8d0b6'],[35,12,'#d8d0b6']])pixel(x,y,c);
    for(const x of [3,12,27,36]) {pixel(x,14,'#a79a73');pixel(x,15,'#e4d8b5');}
    path('#777363','M16 32H19V33H21V32H24V34H22V35H18V34H16Z');
    path('#d7c7a1','M17 32H19V33H22V32H23V33H21V34H18V33H17Z');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="70" viewBox="0 0 40 35" shape-rendering="crispEdges">'+parts.join('')+'</svg>';
  }
  const sheep = [
    ['18%',1,60,-3], ['50%',-1,68,-27],
    ['82%',1,56,-39]
  ];
  for(const [home,direction,cycle,delay] of sheep)createSheep({home,direction,cycle,delay});
  function createSheep({home,direction,cycle,delay,id}) {
    const animal=document.createElement('div');animal.className='sheep';
    if(id) {animal.classList.add('evolved');animal.dataset.evolutionId=id;}
    for(const [key,value] of Object.entries({home,direction,return:-direction,step:direction*48+'px',cycle:cycle+'s',delay:delay+'s'}))animal.style.setProperty('--'+key,String(value));
    const facing=document.createElement('div');facing.className='sheep-facing';
    const sprite=document.createElement('div');sprite.className='sheep-sprite';
    facing.appendChild(sprite);animal.appendChild(facing);
    const chute=document.createElement('div');chute.className='parachute';
    chute.style.backgroundImage='url("data:image/svg+xml,'+encodeURIComponent(canopy)+'")';
    animal.appendChild(chute);flock.appendChild(animal);
    const eye=document.createElement('span');eye.className='sleep-eye';facing.appendChild(eye);
    const zzz=document.createElement('span');zzz.className='sleep-zzz';
    for(let i=0;i<3;i++) {
      const z=document.createElement('span');z.textContent='z';
      z.style.setProperty('--z-delay',(i*1.2)+'s');zzz.appendChild(z);
    }
    animal.appendChild(zzz);
    const umbrella=document.createElement('div');umbrella.className='rain-umbrella';umbrella.setAttribute('aria-hidden','true');animal.appendChild(umbrella);
    const wake=makeSleepy(animal,facing);
    flockMembers.push({animal,wake});
    makeDraggable(animal,facing,wake);
    if(id)members.set(id,{animal,facing});
    if(document.getElementById('pixel-disco')?.dataset.party==='true') {wake();animal.classList.add('disco');}
    return animal;
  }
  function discoChanged(event) {
    const active=Boolean(event.detail.open);
    for(const {animal,wake} of flockMembers) {
      if(active) {wake();animal.classList.add('disco');}
      else {animal.classList.remove('disco');}
    }
  }
  document.addEventListener('pasture-run-change',event=>{
    if(event.detail.active)for(const {wake} of flockMembers)wake();
  });
  document.addEventListener('pasture-disco-change',discoChanged);
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
  const umbrellaArt='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24" shape-rendering="crispEdges">'+umbrellaRows.map((row,y)=>[...row].map((key,x)=>umbrellaColors[key] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${umbrellaColors[key]}"/>` : '').join('')).join('')+'</svg>';
  flock.style.setProperty('--sheep-umbrella','url("data:image/svg+xml,'+encodeURIComponent(umbrellaArt)+'")');
  const rainChanged=event=>flock.classList.toggle('raining',Number(event.detail.amount)>50);
  rainChanged({detail:{amount:document.getElementById('ktown-weather-clouds')?.dataset.rainAmount}});
  document.addEventListener('pasture-rain-change',rainChanged);
  window.addEventListener('pagehide',()=>document.removeEventListener('pasture-rain-change',rainChanged),{once:true});
  if(document.getElementById('pixel-disco')?.dataset.party==='true')discoChanged({detail:{open:true}});
  window.addEventListener('pagehide',()=>document.removeEventListener('pasture-disco-change',discoChanged),{once:true});
  function makeSleepy(animal,facing) {
    let timer=0;
    function schedule(delay=(animal.classList.contains('cozy')?35000:45000)+Math.random()*55000) {
      clearTimeout(timer);timer=setTimeout(nap,delay);
    }
    function wake() {
      animal.classList.remove('sleeping');schedule();
    }
    function nap() {
      if(!animal.isConnected)return;
      if(animal.classList.contains('airborne') || animal.classList.contains('disco') || animal.classList.contains('foraging') || animal.classList.contains('cozy-gathering') || animal.classList.contains('running') || document.hidden) {schedule(12000);return;}
      const transform=getComputedStyle(facing).transform;
      const reversed=transform.startsWith('matrix(') && Number(transform.slice(7).split(',')[0])<0;
      animal.style.setProperty('--zzz-left',reversed?'2px':'70px');
      animal.classList.add('sleeping');
      timer=setTimeout(wake,animal.classList.contains('cozy')?6000+Math.random()*4000:12000+Math.random()*8000);
    }
    const cozyChanged=()=>{animal.classList.remove('sleeping');schedule(25000+Math.random()*45000);};
    document.addEventListener('doodles-cozy-change',cozyChanged);
    schedule(10000+Math.random()*30000);
    window.addEventListener('pagehide',()=>{clearTimeout(timer);document.removeEventListener('doodles-cozy-change',cozyChanged);},{once:true});
    return wake;
  }
  function makeDraggable(animal,facing,wake) {
    let pointer=null,frame=0,x=0,y=0,heldFacing=1;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const clampX=value=>Math.max(0,Math.min(window.innerWidth-96,value));
    const ground=()=>Math.max(0,window.innerHeight-78);
    function place() {
      x=clampX(x);y=Math.max(0,Math.min(ground(),y));
      animal.style.left=x+'px';animal.style.top=y+'px';
    }
    function land() {
      cancelAnimationFrame(frame);frame=0;
      animal.style.setProperty('--home',clampX(x)+'px');
      if(animal.classList.contains('running'))animal.style.setProperty('--run-home',clampX(x)+'px');
      animal.classList.remove('airborne','held','falling');
      animal.style.removeProperty('left');animal.style.removeProperty('top');
    }
    function release() {
      if(pointer===null)return;
      const id=pointer;pointer=null;
      if(animal.hasPointerCapture(id))animal.releasePointerCapture(id);
      animal.classList.remove('held');animal.classList.add('falling');
      if(reduced.matches || y>=ground()){land();return;}
      const startX=x,startY=y,start=performance.now();
      function descend(now) {
        const elapsed=(now-start)/1000;
        x=startX+Math.sin(elapsed*2.4)*16;
        y=startY+elapsed*110;
        const landed=y>=ground();place();
        if(landed)land();else frame=requestAnimationFrame(descend);
      }
      frame=requestAnimationFrame(descend);
    }
    animal.addEventListener('pointerdown',event=>{
      if(event.button!==0 || pointer!==null)return;
      event.preventDefault();event.stopPropagation();
      wake();
      document.dispatchEvent(new CustomEvent('pasture-sound',{detail:{kind:'baa'}}));
      cancelAnimationFrame(frame);
      const transform=getComputedStyle(facing).transform;
      heldFacing=transform.startsWith('matrix(') && Number(transform.slice(7).split(',')[0])<0 ? -1 : 1;
      animal.style.setProperty('--held-facing',heldFacing);
      animal.classList.remove('falling');animal.classList.add('airborne','held');
      pointer=event.pointerId;
      animal.setPointerCapture(pointer);
      x=event.clientX-(heldFacing===1?60:36);y=event.clientY-17;place();
    });
    animal.addEventListener('pointermove',event=>{
      if(event.pointerId!==pointer)return;
      event.preventDefault();event.stopPropagation();
      x=event.clientX-(heldFacing===1?60:36);y=event.clientY-17;place();
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']) {
      animal.addEventListener(name,event=>{if(event.pointerId===pointer){event.stopPropagation();release();}});
    }
    animal.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
    window.addEventListener('blur',release);
    window.addEventListener('resize',()=>{if(animal.classList.contains('airborne'))place();});
    window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
  }
  document.head.appendChild(style);document.body.appendChild(flock);
  // Evolved fish enter through the same factory as the original flock, so all
  // behavior (sleep, pickup, parachutes, dancing and foraging) stays shared.
  window.doodlesPasture={
    removeSheep(id) {
      const member=members.get(id);if(!member)return;
      member.animal.remove();members.delete(id);
      const index=flockMembers.findIndex(entry=>entry.animal===member.animal);
      if(index>=0)flockMembers.splice(index,1);
    },
    addSheep({id,x,direction=1,activityX}) {
      if(typeof id!=='string' || !id || !Number.isFinite(x))return null;
      if(members.has(id))return members.get(id).animal;
      const home=Math.max(0,Math.min(innerWidth-96,x))+'px';
      const animal=createSheep({id,home,direction:direction<0 ? -1 : 1,cycle:60+Math.random()*12,delay:0});
      if(Number.isFinite(activityX))animal.dataset.cozyStartX=String(activityX);
      document.dispatchEvent(new CustomEvent('pasture-sheep-added',{detail:{animal}}));
      return animal;
    },
    snapshot(id) {
      const member=members.get(id);if(!member)return null;
      const {animal,facing}=member;
      // A race or an interrupted pickup resumes at the sheep's pasture home.
      const transient=animal.classList.contains('airborne') || animal.classList.contains('running') || animal.classList.contains('cozy');
      const x=transient ? parseFloat(animal.style.getPropertyValue('--home')) : animal.getBoundingClientRect().left;
      const transform=getComputedStyle(facing).transform;
      const reversed=transform.startsWith('matrix(') && Number(transform.slice(7).split(',')[0])<0;
      return {x:Math.max(0,Math.min(innerWidth-96,x)),direction:animal.classList.contains('cozy') ? Number(animal.style.getPropertyValue('--direction')) : reversed ? -1 : 1};
    }
  };
  document.dispatchEvent(new CustomEvent('pasture-ready'));
})();

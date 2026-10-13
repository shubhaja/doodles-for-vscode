(function () {
  'use strict';
  if(document.getElementById('pasture-flowers'))return;
  const root=document.createElement('div');root.id='pasture-flowers';root.setAttribute('aria-hidden','true');
  const style=document.createElement('style');style.textContent=`
    #pasture-flowers {display:contents;pointer-events:none;}
    #pasture-flowers .flower {position:fixed;bottom:4px;width:20px;height:42px;z-index:998;pointer-events:none;background-size:100% 100%;image-rendering:pixelated;transform-origin:50% 100%;animation:flower-grow 3s steps(6,end) both;transition:transform .6s steps(4,end),opacity .6s;}
    @keyframes flower-grow {from {transform:scaleY(.05);opacity:0;} to {transform:scaleY(1);opacity:1;}}
    #pasture-flowers .flower.ready {animation:none;}
    #pasture-flowers .flower.nibbling {transform:scaleY(.55);}
    #pasture-flowers .flower.eaten {transform:scaleY(.05);opacity:0;}
    #pasture-sheep .sheep.foraging:not(.airborne):not(.disco) {animation:none;}
    #pasture-sheep .sheep.foraging:not(.airborne):not(.disco) .sheep-facing {animation:none;transform:scaleX(var(--forage-facing));}
    #pasture-sheep .sheep.foraging:not(.airborne):not(.disco) .sheep-sprite {background-position:0 0;animation:flower-walk .5s steps(1,end) infinite;}
    #pasture-sheep .sheep.foraging.eating:not(.airborne):not(.disco) .sheep-sprite {animation:flower-nibble .8s steps(1,end) infinite;}
    @keyframes flower-walk {0%,100% {transform:translateY(0);} 50% {transform:translateY(-3px);}}
    @keyframes flower-nibble {0%,100% {background-position:33.333333% 0;transform:none;} 50% {background-position:66.666667% 0;transform:none;}}
    @media (prefers-reduced-motion:reduce) {#pasture-flowers .flower {animation:none;transition:none;} #pasture-sheep .sheep.foraging .sheep-sprite {animation:none !important;}}
  `;
  document.head.appendChild(style);document.body.appendChild(root);
  const flowers=[],jobs=new Map(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let nextFlower=performance.now()+8000,last=performance.now(),party=false,running=false;
  const clamp=x=>Math.max(0,Math.min(window.innerWidth-96,x));
  function blocked(sheep){return ['airborne','disco','sleeping','running'].some(c=>sheep.classList.contains(c)) || sheep.getClientRects().length===0;}
  function spawn(now) {
    const available=[...document.querySelectorAll('#pasture-sheep .sheep')].filter(s=>!blocked(s));
    if(!available.length || window.innerWidth<160)return;
    const sheep=available[Math.floor(Math.random()*available.length)];
    const x=Math.max(45,Math.min(window.innerWidth-45,sheep.getBoundingClientRect().left+48+(Math.random()<.5?-1:1)*(80+Math.random()*100)));
    if(flowers.some(f=>Math.abs(f.x-x)<36))return;
    const color=['#e9b5ce','#f2d780','#c9b4e5'][Math.floor(Math.random()*3)];
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 21" shape-rendering="crispEdges"><path fill="#628751" d="M4 5H5V21H4Z M4 13H2V12H0V14H2V15H4Z M5 16H7V14H9V16H7V17H5Z"/><path fill="'+color+'" d="M3 0H6V2H8V5H6V7H3V5H1V2H3Z"/><path fill="#fff2bd" d="M3 2H6V5H3Z"/><path fill="#c89358" d="M4 3H5V4H4Z"/></svg>';
    const el=document.createElement('div');el.className='flower';el.style.left=(x-10)+'px';el.style.backgroundImage='url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';root.appendChild(el);
    flowers.push({el,x,ready:now+3200,owner:null,born:now});
  }
  function finish(sheep,job,consume=false) {
    sheep.classList.remove('foraging','eating');
    if(!sheep.classList.contains('airborne')) {
      sheep.style.setProperty('--home',clamp(job.x)+'px');sheep.style.removeProperty('left');
    }
    job.flower.owner=null;job.flower.el.classList.remove('nibbling');
    if(consume){job.flower.el.remove();flowers.splice(flowers.indexOf(job.flower),1);}
    else job.flower.el.classList.remove('eaten');
    jobs.delete(sheep);
  }
  function tick() {
    const now=performance.now(),dt=Math.min(.15,(now-last)/1000);last=now;
    if(document.hidden || running || document.body.classList.contains('doodles-cozy'))return;
    if(!party && now>=nextFlower){if(flowers.length<3)spawn(now);nextFlower=now+22000+Math.random()*18000;}
    for(const f of [...flowers]) {
      if(now>=f.ready)f.el.classList.add('ready');
      if(!f.owner && now-f.born>150000){f.el.remove();flowers.splice(flowers.indexOf(f),1);continue;}
      if(party || now<f.ready || f.owner)continue;
      const candidates=[...document.querySelectorAll('#pasture-sheep .sheep')].filter(s=>!blocked(s) && !jobs.has(s));
      candidates.sort((a,b)=>Math.abs(a.getBoundingClientRect().left+48-f.x)-Math.abs(b.getBoundingClientRect().left+48-f.x));
      const sheep=candidates[0];if(!sheep)continue;
      const x=sheep.getBoundingClientRect().left,dir=f.x>=x+48?1:-1;
      const target=clamp(f.x-(dir===1?75:21));
      sheep.style.left=x+'px';sheep.style.setProperty('--forage-facing',String(dir));sheep.classList.add('foraging');
      f.owner=sheep;jobs.set(sheep,{flower:f,x,target,eatingAt:null});
    }
    for(const [sheep,job] of [...jobs]) {
      if(party || blocked(sheep)){finish(sheep,job);continue;}
      job.target=clamp(job.target);
      const distance=job.target-job.x;
      if(Math.abs(distance)>1) {
        job.x=reduced.matches?job.target:job.x+Math.sign(distance)*Math.min(Math.abs(distance),34*dt);
        sheep.style.left=job.x+'px';
      } else {
        if(job.eatingAt===null){job.eatingAt=now;sheep.classList.add('eating');job.flower.el.classList.add('nibbling');}
        if(now-job.eatingAt>1800)job.flower.el.classList.add('eaten');
        if(now-job.eatingAt>2600)finish(sheep,job,true);
      }
    }
  }
  function disco(event){party=Boolean(event.detail.open);if(party)for(const [s,j] of [...jobs])finish(s,j);}
  function pickup(event){const sheep=event.target.closest?.('#pasture-sheep .sheep');const job=jobs.get(sheep);if(job)finish(sheep,job);}
  function run(event){running=Boolean(event.detail.active);if(running)for(const [s,j] of [...jobs])finish(s,j);}
  document.addEventListener('pasture-run-change',run);
  const dark=event=>{if(event.detail.active)for(const [s,j] of [...jobs])finish(s,j);};
  document.addEventListener('doodles-cozy-change',dark);
  document.addEventListener('pasture-disco-change',disco);
  document.addEventListener('pointerdown',pickup);
  // Polling also catches captured pickup events, which intentionally stop propagation.
  const timer=setInterval(tick,100);
  window.addEventListener('pagehide',()=>{document.removeEventListener('doodles-cozy-change',dark);clearInterval(timer);document.removeEventListener('pasture-run-change',run);document.removeEventListener('pasture-disco-change',disco);document.removeEventListener('pointerdown',pickup);},{once:true});
})();

(function () {
  'use strict';
  if(document.getElementById('pasture-run-scenery'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fence='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24" shape-rendering="crispEdges"><path fill="#805e43" d="M3 2H7V24H3Z M25 2H29V24H25Z M0 7H32V11H0Z M0 16H32V20H0Z"/><path fill="#d5b386" d="M3 1H6V23H3Z M25 1H28V23H25Z M0 6H32V9H0Z M0 15H32V18H0Z"/><path fill="#f0d4a4" d="M3 1H6V3H3Z M25 1H28V3H25Z M0 6H32V7H0Z"/></svg>';
  const fenceURL='url("data:image/svg+xml,'+encodeURIComponent(fence)+'")';
  const style=document.createElement('style');style.textContent=`
    body.pasture-grass-ready::after {clip-path:inset(0 0 28px 0);}
    #pasture-run-scenery {display:none;pointer-events:none;}
    body.pasture-running #pasture-run-scenery {display:block;}
    #pasture-run-grass {position:fixed;bottom:0;left:0;right:0;height:28px;z-index:1000;pointer-events:none;background:url('data:image/png;base64,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') repeat-x bottom left;background-size:700px 28px;image-rendering:pixelated;}
    #pasture-run-scenery .run-fence {position:fixed;bottom:9px;width:48px;height:36px;z-index:998;background:${fenceURL} center/contain no-repeat;image-rendering:pixelated;}
    #pasture-run-status {position:fixed;bottom:155px;left:116px;transform:translateX(-50%);z-index:1001;color:#fff;pointer-events:none;}
    #pasture-run-status > svg {display:block;overflow:visible;transform-origin:50% 100%;}
    #pasture-run-best {position:absolute;top:36px;left:50%;transform:translateX(-50%);white-space:nowrap;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:1px;color:#fff;opacity:.8;}
    #pasture-run-status.record #pasture-run-best {color:#ffe39a;opacity:1;}
    #pasture-run-crown {position:absolute;bottom:38px;left:50%;width:28px;height:20px;margin-left:-14px;opacity:0;}
    #pasture-run-crown svg {display:block;width:28px;height:20px;}
    #pasture-run-crown .spark {position:absolute;left:12px;top:8px;width:4px;height:4px;background:#ffe39a;opacity:0;}
    @media(prefers-reduced-motion:reduce) {#pasture-run-status.record #pasture-run-crown {opacity:1;}}
    body.pasture-running #pasture-sheep .sheep.running {display:block;pointer-events:none;}
    body #pasture-sheep .sheep.running.gathering:not(.airborne) .sheep-facing {transform:scaleX(var(--gather-facing,-1));}
    body.pasture-running #pasture-flowers {visibility:hidden;}
    #pasture-sheep .sheep.running:not(.airborne) {animation:none;left:clamp(0px,var(--run-home),calc(100% - 96px));bottom:6px;transform:translateY(var(--run-y,0px));}
    #pasture-sheep .sheep.running:not(.airborne) .sheep-facing {animation:none;transform:scaleX(1);}
    #pasture-sheep .sheep.running:not(.airborne) .sheep-sprite {position:relative;z-index:1;background-position:0 0;clip-path:inset(0 0 18px 0);animation:pasture-gallop 180ms steps(2,end) infinite;transform-origin:50% 85%;}
    #pasture-sheep .sheep.running:not(.airborne) .sheep-facing::before,
    #pasture-sheep .sheep.running:not(.airborne) .sheep-facing::after {content:'';position:absolute;z-index:0;top:45px;left:18px;width:6px;height:11px;background:#55564b;transform-origin:50% 0;animation:pasture-legs 180ms steps(2,end) infinite;}
    #pasture-sheep .sheep.running:not(.airborne) .sheep-facing::after {left:54px;animation-delay:-90ms;}
    #pasture-sheep .sheep.running.waiting:not(.airborne) .sheep-sprite,
    #pasture-sheep .sheep.running.waiting:not(.airborne) .sheep-facing::before,
    #pasture-sheep .sheep.running.waiting:not(.airborne) .sheep-facing::after {animation:none;transform:none;}
    #pasture-sheep .sheep.running.jumping:not(.airborne) .sheep-sprite {animation:none;transform:none;}
    #pasture-sheep .sheep.running.jumping:not(.airborne) .sheep-facing::before {animation:none;transform:rotate(-28deg);}
    #pasture-sheep .sheep.running.jumping:not(.airborne) .sheep-facing::after {animation:none;transform:rotate(28deg);}
    @keyframes pasture-legs {0%,100% {transform:rotate(-38deg);} 50% {transform:rotate(38deg);}}
    body.pasture-run-paused #pasture-sheep .sheep.running .sheep-facing::before,
    body.pasture-run-paused #pasture-sheep .sheep.running .sheep-facing::after {animation-play-state:paused;}
    @media(prefers-reduced-motion:reduce) {#pasture-sheep .sheep.running .sheep-facing::before,#pasture-sheep .sheep.running .sheep-facing::after {animation:none !important;}}
    @keyframes pasture-gallop {0%,100% {transform:translateY(0) rotate(-3deg) scale(1.03,.97);} 50% {transform:translateY(-5px) rotate(3deg) scale(.97,1.03);}}
    body.pasture-run-paused #pasture-sheep .sheep.running .sheep-sprite {animation-play-state:paused;}
    @media(prefers-reduced-motion:reduce) {#pasture-sheep .sheep.running:not(.airborne) .sheep-sprite {animation:none;}}
  `;
  const ns='http://www.w3.org/2000/svg';
  const scenery=document.createElement('div');scenery.id='pasture-run-scenery';scenery.setAttribute('aria-hidden','true');
  const grass=document.createElement('div');grass.id='pasture-run-grass';grass.setAttribute('aria-hidden','true');
  const status=document.createElement('div');status.id='pasture-run-status';scenery.appendChild(status);
  const digits=['01110/11011/11011/11011/11011/11011/01110',
    '00110/01110/00110/00110/00110/00110/11111',
    '01110/11011/00011/00110/01100/11000/11111',
    '11110/00011/00011/01110/00011/00011/11110',
    '00011/00111/01111/11011/11111/00011/00011',
    '11111/11000/11000/11110/00011/11011/01110',
    '01110/11000/11000/11110/11011/11011/01110',
    '11111/00011/00110/00110/01100/01100/01100',
    '01110/11011/11011/01110/11011/11011/01110',
    '01110/11011/11011/01111/00011/00011/01110'];
  const scoreArt=document.createElementNS(ns,'svg');scoreArt.classList.add('run-score');scoreArt.setAttribute('shape-rendering','crispEdges');
  const pixels=document.createElementNS(ns,'path');pixels.setAttribute('fill','currentColor');scoreArt.appendChild(pixels);status.appendChild(scoreArt);
  const bestLabel=document.createElement('div');bestLabel.id='pasture-run-best';status.appendChild(bestLabel);
  const crown=document.createElement('div');crown.id='pasture-run-crown';status.appendChild(crown);
  const crownArt=document.createElementNS(ns,'svg');crownArt.setAttribute('viewBox','0 0 14 10');crownArt.setAttribute('shape-rendering','crispEdges');
  for(const [fill,d] of [['#f7cf65','M0 1H2V3H4V1H6V0H8V1H10V3H12V1H14V8H0Z'],['#d9a647','M1 8H13V10H1Z'],['#fff0ac','M2 5H4V7H2Z M6 4H8V6H6Z M10 5H12V7H10Z']]){
    const path=document.createElementNS(ns,'path');path.setAttribute('fill',fill);path.setAttribute('d',d);crownArt.appendChild(path);
  }
  crown.appendChild(crownArt);
  const sparks=Array.from({length:6},()=>{const el=document.createElement('span');el.className='spark';crown.appendChild(el);return el;});
  const bestKey='pasture-race-best';
  const validBest=value=>{const n=Number(value);return Number.isSafeInteger(n) && n>=0?n:0;};
  function savedBest(){try{return validBest(localStorage.getItem(bestKey));}catch(_){return 0;}}
  let best=savedBest(),recordThisRun=false,celebrations=[];
  function renderBest(){bestLabel.textContent='BEST '+best;}
  function celebrate(){
    status.classList.add('record');
    if(reduced.matches)return;
    celebrations.push(crown.animate([
      {opacity:0,transform:'translateY(8px) scale(.6)'},
      {opacity:1,transform:'translateY(-3px) scale(1.15)',offset:.18},
      {opacity:1,transform:'translateY(0) scale(1)',offset:.7},
      {opacity:0,transform:'translateY(-7px) scale(1)'}
    ],{duration:1700,easing:'steps(10,end)'}));
    sparks.forEach((el,i)=>{
      const angle=Math.PI*2*i/6,x=Math.round(Math.cos(angle)*30),y=Math.round(Math.sin(angle)*22);
      celebrations.push(el.animate([{opacity:0,transform:'translate(0,0)'},{opacity:1,offset:.2},{opacity:0,transform:'translate('+x+'px,'+y+'px)'}],{duration:850,delay:120,easing:'steps(8,end)'}));
    });
  }
  function updateBest(value){
    best=Math.max(best,savedBest());
    if(value>best){
      best=value;try{localStorage.setItem(bestKey,String(best));}catch(_){}
      if(!recordThisRun){recordThisRun=true;celebrate();}
    }
    renderBest();
  }
  function bestChanged(event){if(event.key===bestKey){best=Math.max(best,validBest(event.newValue));renderBest();}}
  window.addEventListener('storage',bestChanged);renderBest();
  let shownScore=-1,scoreBump=null;
  function drawScore(value){
    if(value===shownScore)return;
    const increasing=shownScore>=0 && value>shownScore;
    shownScore=value;const text=String(value),width=text.length*6-1;
    scoreArt.setAttribute('viewBox','0 0 '+width+' 7');scoreArt.setAttribute('width',String(width*4));scoreArt.setAttribute('height','28');
    status.setAttribute('aria-label',text);
    let path='';
    [...text].forEach((digit,i)=>digits[Number(digit)].split('/').forEach((row,y)=>{
      [...row].forEach((pixel,x)=>{if(pixel==='1')path+='M'+(i*6+x)+' '+y+'h1v1h-1z';});
    }));
    pixels.setAttribute('d',path);scoreBump?.cancel();
    if(increasing && !reduced.matches)scoreBump=scoreArt.animate([
      {transform:'translateY(0) scale(1)'},
      {transform:'translateY(-5px) scale(1.2)',offset:.35},
      {transform:'translateY(0) scale(1)'}
    ],{duration:260,easing:'steps(6,end)'});
  }
  document.head.appendChild(style);document.body.append(grass,scenery);document.body.classList.add('pasture-grass-ready');
  const speed=420,hopDuration=.72,hopHeight=68;
  let active=false,frame=0,last=0,time=0,offset=0,flock=[],hops=[],fences=[];
  let phase='off',score=0,nextFence=0,starts=[],crashAt=0;
  const spacing=()=>Math.max(0,Math.min(44,(innerWidth-120)/Math.max(1,flock.length-1)));
  const home=i=>Math.max(0,Math.min(24+i*spacing(),innerWidth-96));
  function show(){
    scenery.dataset.phase=phase;scenery.dataset.score=String(score);
    updateBest(score);drawScore(score);
  }
  function clearCourse(){
    for(const animation of celebrations)animation.cancel();celebrations=[];status.classList.remove('record');
    for(const f of fences)f.el.remove();fences=[];hops=[];
    for(const s of flock){s.style.removeProperty('--run-y');s.classList.remove('jumping');}
  }
  function begin(){
    clearCourse();score=0;recordThisRun=false;phase='gathering';
    starts=flock.map(s=>s.getBoundingClientRect().left);
    flock.forEach((s,i)=>{s.classList.remove('waiting');s.classList.add('gathering');s.style.setProperty('--gather-facing',starts[i]>home(i)?'-1':'1');});
    show();refresh();
  }
  function setActive(value){
    if(value===active)return;
    active=value;
    document.dispatchEvent(new CustomEvent('pasture-run-change',{detail:{active}}));
    if(active)flock=[...document.querySelectorAll('#pasture-sheep .sheep'),...(window.doodlesGoldfishRace?.participants() || [])];
    clearCourse();
    for(const s of flock){
      if(active)s.style.setProperty('--run-home',s.getBoundingClientRect().left+'px');
      s.classList.toggle('running',active);
      if(!active){s.style.removeProperty('--run-home');s.classList.remove('gathering','waiting');}
    }
    document.body.classList.toggle('pasture-running',active);

    if(active)begin();else {phase='off';show();refresh();}
  }
  function jump(){
    if(!active || document.hidden)return;
    if(phase==='over'){begin();return;}
    if(phase!=='running' || hops.length)return;
    // Rightmost sheep meets the fence first; travel time sets the overlapping delay.
    for(let i=flock.length-1;i>=0;i--)
      hops.push({sheep:flock[i],start:time+(flock.length-1-i)*spacing()/speed});
  }
  function spawn(){
    const el=document.createElement('div');el.className='run-fence';scenery.appendChild(el);
    fences.push({el,x:innerWidth+24,scored:false});
    nextFence=time+1.05+Math.pow(Math.random(),2)*1.25;
  }
  function height(s){
    const hop=hops.find(h=>h.sheep===s),t=hop?(phase==='over'?crashAt:time)-hop.start:-1;
    return t>=0 && t<=hopDuration?Math.sin(t/hopDuration*Math.PI)*hopHeight:0;
  }
  function paint(){
    grass.style.backgroundPositionX=-offset+'px';
    status.style.left=(home(0)+48+(home(flock.length-1)-home(0))/2)+'px';
    for(const s of flock){const y=height(s);s.style.setProperty('--run-y',-y+'px');s.classList.toggle('jumping',y>0);}
    for(const f of fences)f.el.style.left=f.x+'px';
  }
  function tick(now){
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;
    if(phase==='gathering'){
      let arrived=true;
      flock.forEach((s,i)=>{
        const distance=home(i)-starts[i];
        starts[i]+=Math.sign(distance)*Math.min(Math.abs(distance),reduced.matches?Infinity:650*dt);
        s.style.setProperty('--run-home',starts[i]+'px');
        const ready=Math.abs(home(i)-starts[i])<.1;
        s.classList.toggle('gathering',!ready);s.classList.toggle('waiting',ready);if(!ready)arrived=false;
      });
      if(arrived && !flock.some(s=>s.classList.contains('airborne'))){
        for(const s of flock)s.classList.remove('waiting');
        phase='running';nextFence=time+.25;show();
      }
    }else if(phase==='running'){
      flock.forEach((s,i)=>s.style.setProperty('--run-home',home(i)+'px'));
      if(!reduced.matches)offset=(offset+speed*dt)%700;
      hops=hops.filter(h=>time-h.start<=hopDuration);
      if(time>=nextFence)spawn();
      for(const f of [...fences]){
        f.x-=speed*dt;
        // Forgiving collision boxes around the hooves and the central fence rails.
        for(let i=0;i<flock.length;i++){
          const center=home(i)+48;
          if(Math.abs(f.x+24-center)<29 && height(flock[i])<29){
            phase='over';crashAt=time;document.body.classList.add('pasture-run-paused');show();break;
          }
        }
        if(phase==='over')break;
        if(!f.scored && f.x+48<home(0)+20){f.scored=true;score++;show();}
        if(f.x < -60){f.el.remove();fences.splice(fences.indexOf(f),1);}
      }
    }
    paint();
    if(phase==='over'){refresh();return;}
    frame=requestAnimationFrame(tick);
  }
  function refresh(){
    cancelAnimationFrame(frame);frame=0;last=0;
    document.body.classList.toggle('pasture-run-paused',document.hidden || phase==='over');
    if(active && !document.hidden && phase!=='over')frame=requestAnimationFrame(tick);
  }
  function key(event){
    if(!active || !window.doodlesModes.ownsInput(event.target))return;
    if(event.code!=='Space' || event.isComposing || event.altKey || event.ctrlKey || event.metaKey)return;
    event.preventDefault();
    if(!event.repeat)jump();
  }
  function sheepAdded(event) {
    const animal=event.detail.animal;
    if(!active || flock.includes(animal))return;
    const x=animal.getBoundingClientRect().left;
    flock.push(animal);
    animal.classList.add('running');
    if(phase==='gathering') {
      starts.push(x);animal.classList.add('gathering');
      animal.style.setProperty('--gather-facing',x>home(flock.length-1)?'-1':'1');
      animal.style.setProperty('--run-home',x+'px');
    } else {
      animal.style.setProperty('--run-home',home(flock.length-1)+'px');
      if(hops.length && phase==='running')hops.push({sheep:animal,start:time});
    }
    paint();
  }
  const unregister=window.doodlesModes.register({id:'race',label:'Race mode',enter:()=>setActive(true),exit:()=>setActive(false)});
  const resetEvolution=()=>{if(active)window.doodlesModes.activate(null);};
  document.addEventListener('doodles-evolution-reset',resetEvolution);
  window.addEventListener('keydown',key,true);
  document.addEventListener('pasture-sheep-added',sheepAdded);
  document.addEventListener('pasture-runner-added',sheepAdded);
  document.addEventListener('visibilitychange',refresh);
  reduced.addEventListener('change',refresh);
  window.addEventListener('pagehide',()=>{
    document.removeEventListener('doodles-evolution-reset',resetEvolution);
    window.removeEventListener('storage',bestChanged);
    unregister();cancelAnimationFrame(frame);window.removeEventListener('keydown',key,true);
    document.removeEventListener('visibilitychange',refresh);reduced.removeEventListener('change',refresh);
    document.removeEventListener('pasture-sheep-added',sheepAdded);
    document.removeEventListener('pasture-runner-added',sheepAdded);
  },{once:true});

})();

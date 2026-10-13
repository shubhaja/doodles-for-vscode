(() => {
  'use strict';
  if(document.getElementById('doodles-campfire'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const style=document.createElement('style');
  // Hand-drawn pixel poses: a full ember body with irregular, flickering crowns.
  const svg=body=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" shape-rendering="crispEdges">'+body+'</svg>';
  const palette={r:'#b54c2d',o:'#ed7832',a:'#ffc14b',h:'#ffe58b'};
  // A small, dark pair of crossed sticks; the flames are the focus.
  const logs=svg('<path fill="#42332d" d="M7 33H11V34H16V35H21V36H25V39H21V38H16V37H11V36H7Z M8 37H12V36H17V35H22V33H25V36H22V37H17V38H12V39H8Z"/>'+
    '<path fill="#80533b" d="M8 34H11V35H16V36H21V37H24V38H21V37H16V36H11V35H8Z M9 37H13V36H18V35H22V34H24V35H21V36H17V37H12V38H9Z"/>'+
    '<path fill="#ac7947" d="M8 34H10V35H8Z M22 34H24V35H22Z M9 37H11V38H9Z"/>'+
    '<path fill="#c56832" d="M14 35H16V36H14Z M19 35H21V36H19Z"/>');
  // A broad shared body keeps the fire full; only the uneven crown breaks away.
  const body=[
    '.....rrooaarrr.......',
    '....rrooaaaaoor......',
    '...rooaaaaaaaar......',
    '..rroaaaooaaaaar.....',
    '..roaaaoooaaaaar....',
    '.rooahaaoooaaaaar...',
    '.roahhaaooaaaaaar...',
    '.roahhaaaaahaaaaar...',
    '..roahhaahhhaaaor....',
    '..roaaahhhhaaooor....',
    '...rooaaaaaaaoor.....',
    '....rrooooooorr......',
    '......rrrrrrr........'
  ];
  const crowns=[
    ['.........r..........','........rr..........','........ror.........','.........oor........',
     '........rooar.......','.......roaaor.......','......rooaaor..r....','......roaaaoorrr....'],
    ['.......r............','.......rr...........','........or..........','........oor.........',
     '.......rooorr.......','......roaaaoor......','......roaaaor.......','.....rooaaaoorr.....'],
    ['..........r.........','.........rr.........','........ror.........','.......roor.........',
     '.......roaar........','........rooor.......','.......roaaorr......','......rooaaaoorr....'],
    ['....................','.........rr.........','........roor........','.......roaar........',
     '.......roaaor.......','......rooaaor.......','.....rooaaor..r.....','.....roaaaorrror....'],
    ['........r...........','........rr..........','.......ror..........','.......roor.........',
     '........roor........','.......rooaar.......','......rooaaorr......','.....rooaaaaoor.....'],
    ['.........r..........','........rr..........','.......ror..........','.......roor.........',
     '......rooar.........','......roaar.........','.......rooorr.......','......rooaaaorr.....']
  ];
  function flame(frame){
    const rows=[...crowns[frame],...body],parts=[];
    // Small gold patches pop between held frames rather than flowing as a gradient.
    const highlights=[[[8,13],[11,17]],[[9,12],[13,16]],[[10,14],[8,17]],
      [[9,15],[12,18]],[[8,14],[12,16]],[[10,13],[11,18]]][frame];
    const pixels=rows.map(row=>[...row]);
    for(const [x,y] of highlights)if(pixels[y][x] && pixels[y][x]!=='.')pixels[y][x]='h';
    pixels.forEach((row,y)=>row.forEach((key,x)=>{
      if(palette[key])parts.push('<rect x="'+(x+6)+'" y="'+(y+14)+'" width="1" height="1" fill="'+palette[key]+'"/>');
    }));
    const sparks=[[[16,10]],[[15,8]],[],[[20,12]],[[21,9]],[]][frame];
    for(const [x,y] of sparks)parts.push('<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="#df873e"/>');
    return svg(parts.join(''));
  }
  const url=svg=>'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
  style.textContent=`
    #doodles-campfire {position:fixed;left:66.6667%;bottom:6px;width:96px;height:120px;transform:translateX(-50%);z-index:999;pointer-events:none;image-rendering:pixelated;}
    #doodles-campfire[hidden] {display:none;}
    #doodles-campfire::before {content:'';position:absolute;left:50%;bottom:-20px;width:340px;height:210px;transform:translateX(-50%);background:radial-gradient(ellipse,#ffbc682b,transparent 68%);}
    .cozy-fire-flame,.cozy-fire-logs {position:absolute;inset:0;background-position:center;background-size:96px 120px;background-repeat:no-repeat;image-rendering:pixelated;}
    .cozy-fire-flame {background-image:${url(flame(0))};animation:cozy-flame 1080ms steps(1,end) infinite;}
    .cozy-fire-logs {background-image:${url(logs)};}
    @keyframes cozy-flame {${Array.from({length:6},(_,i)=>`${i*100/6}%{background-image:${url(flame(i))};}`).join('')}}
    @keyframes cozy-walk {0%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    #pasture-sheep .sheep.cozy.cozy-gathering:not(.airborne) .sheep-sprite {background-position:0 0;animation:cozy-walk 360ms steps(2,end) infinite;}
    #pasture-sheep .sheep.cozy:not(.airborne) {animation:none;left:var(--cozy-x);bottom:var(--cozy-bottom,6px);}
    #pasture-sheep .sheep.cozy:not(.airborne) .sheep-facing {animation:none;transform:scaleX(var(--cozy-facing));}
    #pasture-sheep .sheep.cozy:not(.cozy-gathering):not(.airborne) .sheep-sprite {animation:none;background-position:0 0;transform:translateY(10px) scaleY(.86);clip-path:inset(0 0 10px 0);transform-origin:50% 100%;}
    #pasture-sheep .sheep.cozy .sleep-eye {top:38px;}
    body.doodles-cozy #pasture-sheep .rain-umbrella {display:none;}
    @media(prefers-reduced-motion:reduce) {.cozy-fire-flame {animation:none;}#pasture-sheep .sheep.cozy {transition:none;}}
    body.doodles-cozy-hidden .cozy-fire-flame {animation-play-state:paused;}
  `;
  const fire=document.createElement('div');fire.id='doodles-campfire';fire.hidden=true;fire.setAttribute('aria-hidden','true');
  for(const name of ['flame','logs']){const part=document.createElement('div');part.className='cozy-fire-'+name;fire.appendChild(part);}
  document.head.appendChild(style);document.body.appendChild(fire);
  let active=false,frame=0,last=0;
  const members=new Map();
  function arrange(){
    const animals=[...members.keys()].filter(animal=>animal.isConnected);
    const center=innerWidth*2/3;
    animals.forEach((animal,i)=>{
      const side=i%2===0?-1:1,rank=Math.floor(i/2),member=members.get(animal);
      const distance=Math.min(100+rank*78,Math.max(50,innerWidth/3-52));
      member.target=Math.max(0,Math.min(innerWidth-96,center+side*distance-48));
      member.facing=side<0?1:-1;
      member.x=Math.max(0,Math.min(innerWidth-96,member.x));
      animal.style.setProperty('--cozy-bottom',(6+(innerWidth<780?rank:Math.floor(rank/2))*24)+'px');
    });
  }
  function tick(now){
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    for(const [animal,member] of members){
      if(!animal.isConnected){members.delete(animal);arrange();continue;}
      if(animal.classList.contains('airborne')){member.x=animal.getBoundingClientRect().left;continue;}
      const distance=member.target-member.x;
      if(!document.hidden)member.x+=Math.sign(distance)*Math.min(Math.abs(distance),reduced.matches?Infinity:105*dt);
      const walking=Math.abs(member.target-member.x)>1;
      animal.classList.toggle('cozy-gathering',walking);
      animal.style.setProperty('--cozy-x',Math.max(0,Math.min(innerWidth-96,Math.round(member.x/3)*3))+'px');
      animal.style.setProperty('--cozy-facing',String(walking?Math.sign(distance):member.facing));
    }
    if(active && !document.hidden)frame=requestAnimationFrame(tick);
  }
  function join(animal){
    if(!active || members.has(animal))return;
    const x=animal.dataset.cozyStartX!==undefined?Number(animal.dataset.cozyStartX):animal.getBoundingClientRect().left;delete animal.dataset.cozyStartX;
    animal.style.setProperty('--cozy-x',x+'px');
    animal.classList.remove('sleeping');animal.classList.add('cozy','cozy-gathering');
    members.set(animal,{x,target:x,facing:1});arrange();
  }
  function enter(){
    active=true;window.doodlesNightSky.setActive(true);fire.hidden=false;
    document.body.classList.add('doodles-cozy');
    // Release foraging jobs before arranging the flock.
    document.dispatchEvent(new CustomEvent('doodles-cozy-change',{detail:{active:true}}));
    ready();
    visibility();
  }
  function exit(){
    active=false;cancelAnimationFrame(frame);fire.hidden=true;
    for(const [animal] of members){
      animal.classList.remove('cozy','cozy-gathering','sleeping');
      for(const key of ['--cozy-x','--cozy-facing','--cozy-bottom'])animal.style.removeProperty(key);
    }
    members.clear();document.body.classList.remove('doodles-cozy','doodles-cozy-hidden');
    document.dispatchEvent(new CustomEvent('doodles-cozy-change',{detail:{active:false}}));
    window.doodlesNightSky.setActive(false);
  }
  function added(event){join(event.detail.animal);}
  function ready(){if(active)for(const animal of [...document.querySelectorAll('#pasture-sheep .sheep'),...(window.doodlesGoldfishCozy?.participants() || [])])join(animal);}
  function visibility(){document.body.classList.toggle('doodles-cozy-hidden',active && document.hidden);cancelAnimationFrame(frame);last=0;if(active && !document.hidden)frame=requestAnimationFrame(tick);}
  const unregister=window.doodlesModes.register({id:'cozy',label:'Cozy mode',restoreOnReload:true,enter,exit});
  document.addEventListener('doodles-cozy-animal-added',added);document.addEventListener('doodles-cozy-animals-ready',ready);
  document.addEventListener('pasture-sheep-added',added);document.addEventListener('pasture-ready',ready);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',arrange);
  window.addEventListener('pagehide',()=>{
    document.removeEventListener('doodles-cozy-animal-added',added);document.removeEventListener('doodles-cozy-animals-ready',ready);
    unregister();fire.remove();style.remove();document.removeEventListener('pasture-sheep-added',added);
    document.removeEventListener('pasture-ready',ready);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',arrange);
  },{once:true});
})();

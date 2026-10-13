(function () {
  'use strict';
  if (document.getElementById('pixel-disco')) return;
  const style=document.createElement('style');
  style.textContent=`
    #pixel-disco {position:fixed;top:0;left:calc(50% - 80px);width:160px;height:140px;overflow:hidden;transform:scale(1.5);transform-origin:top center;z-index:1004;pointer-events:none;}
    #pixel-disco .disco-hanger {position:absolute;left:16px;top:0;width:128px;height:140px;transform:translateY(-150px);transition:transform 800ms cubic-bezier(.45,0,.25,1);}
    #pixel-disco.open .disco-hanger {transform:translateY(0);transition-delay:350ms;}
    #pixel-disco .disco-cord {position:absolute;left:63.5px;top:-160px;width:1px;height:226px;background:#c4b8e0;}
    #pixel-disco canvas {position:absolute;left:16px;top:34px;width:96px;height:96px;image-rendering:pixelated;}
    @media (prefers-reduced-motion:reduce) {#pixel-disco .disco-hanger {transition:none;}}
  `;
  const root=document.createElement('div');root.id='pixel-disco';
  const hanger=document.createElement('div');hanger.className='disco-hanger';hanger.setAttribute('aria-hidden','true');
  const cord=document.createElement('div');cord.className='disco-cord';
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
  hanger.appendChild(cord);hanger.appendChild(canvas);root.appendChild(hanger);
  document.head.appendChild(style);document.body.appendChild(root);
  const ctx=canvas.getContext('2d');
  if(!ctx){root.remove();style.remove();return;}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let open=false,frame=0,last=-Infinity,partyTimer=0,lastSky=-Infinity;
  let skyColor='#260c46';
  function publishSky(active) {
    window.doodlesDiscoSky=active?skyColor:null;
    document.body.style.setProperty('--doodles-disco-sky',skyColor);
    document.dispatchEvent(new CustomEvent('doodles-sky-change'));
  }
  function signalParty(active) {
    root.dataset.party=String(active);
    document.body.classList.toggle('doodles-disco',active);
    publishSky(active);
    window.doodlesNightSky?.setActive(active);
    document.dispatchEvent(new CustomEvent('pasture-disco-change',{detail:{open:active}}));
  }
  // Paint at native resolution: stepped spherical silhouette and moving mirror tiles.
  function draw(time) {
    if(Math.abs(time-lastSky)>=.24) {
      // A shared hex palette also works with xterm's canvas renderer.
      // Saturated violet → magenta → electric blue, always dark enough for
      // pale text. Slow interpolation avoids flashes behind working content.
      const stops=[[38,12,70],[65,10,48],[12,24,72],[20,12,62]];
      const position=(time/6)%stops.length,index=Math.floor(position),blend=position-index;
      skyColor='#'+stops[index].map((value,i)=>Math.round(value+(stops[(index+1)%stops.length][i]-value)*blend).toString(16).padStart(2,'0')).join('');
      lastSky=time;
      if(root.dataset.party==='true')publishSky(true);
    }
    ctx.clearRect(0,0,96,96);
    const cx=48,cy=56,r=24,phase=time*0.65;
    for(let y=-r;y<r;y++)for(let x=-r;x<r;x++) {
      const nx=(x+.5)/r,ny=(y+.5)/r,d=nx*nx+ny*ny;
      if(d>1)continue;
      const depth=Math.sqrt(1-d);
      const longitude=Math.atan2(nx,depth)+phase;
      const latitude=Math.asin(ny);
      const u=(longitude/(Math.PI*2)*28+280)%28;
      const v=(latitude/Math.PI+.5)*18;
      const col=Math.floor(u),row=Math.floor(v);
      const grout=u%1<.10 || v%1<.10;
      const shine=Math.max(0,depth*.75-nx*.4-ny*.45);
      const tile=((col*7+row*11)%9)/9;
      const glint=Math.pow(Math.max(0,Math.sin(col*2.3+row*1.7+phase*2)),18);
      const light=grout?48+shine*16:Math.min(96,51+shine*28+tile*10+glint*15);
      const hue=[212,245,280,190,225][(col+row)%5];
      ctx.fillStyle=`hsl(${hue} ${grout?10:18}% ${light}%)`;
      ctx.fillRect(cx+x,cy+y,1,1);
    }
    // Tiny pixel crosses twinkle near the ball without filling the editor with glitter.
    for(let i=0;i<5;i++) {
      const brightness=Math.max(0,Math.sin(time*1.8+i*2.4));
      if(brightness<.72)continue;
      const angle=i*2.4+time*.07;
      const x=Math.round(cx+Math.cos(angle)*34),y=Math.round(cy+Math.sin(angle)*33);
      ctx.globalAlpha=(brightness-.72)/.28;
      ctx.fillStyle=i%2?'#fff0b9':'#e5f7ff';
      ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);
    }
    ctx.globalAlpha=1;
  }
  function animate(now) {
    if(!open || document.hidden || reduced.matches){frame=0;return;}
    if(now-last>=80){draw(now/1000);last=now;}
    frame=requestAnimationFrame(animate);
  }
  function refresh() {
    cancelAnimationFrame(frame);frame=0;
    if(open){draw(1);if(!document.hidden && !reduced.matches)frame=requestAnimationFrame(animate);}
  }
  function setActive(value){
    open=value;root.classList.toggle('open',open);
    document.dispatchEvent(new CustomEvent('pasture-sound',{detail:{kind:open?'open':'close'}}));
    clearTimeout(partyTimer);
    if(open)partyTimer=setTimeout(()=>signalParty(true),reduced.matches?0:1150);
    else signalParty(false);
    refresh();
  }
  const unregister=window.doodlesModes.register({id:'disco',label:'Disco mode',enter:()=>setActive(true),exit:()=>setActive(false)});
  document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);
  window.addEventListener('pagehide',()=>{
    unregister();clearTimeout(partyTimer);cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',refresh);reduced.removeEventListener('change',refresh);
  },{once:true});
  draw(1);
})();

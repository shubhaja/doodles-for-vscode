(() => {
  'use strict';
  if(document.getElementById('doodles-terminal-eyes-style'))return;
  const svg=(tag,attrs={})=>{
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    return node;
  };
  const style=document.createElement('style');style.id='doodles-terminal-eyes-style';
  style.textContent=`
    .doodles-eyes-overlay {position:fixed;inset:34px 0 0;overflow:hidden;z-index:1003;pointer-events:none;}
    .doodles-eyes-overlay[hidden] {display:none;}
    .doodles-eye-opening {position:absolute;width:var(--eye-width);height:var(--eye-width);transform:translate(-50%,-50%);}
    .doodles-terminal-eye {position:absolute;inset:0;width:100%;height:100%;overflow:visible;image-rendering:pixelated;shape-rendering:crispEdges;}
  `;
  document.head.append(style);
  const defsSvg=svg('svg',{'aria-hidden':'true',width:0,height:0});
  defsSvg.style.cssText='position:absolute;pointer-events:none';
  const defs=svg('defs');defsSvg.append(defs);
  const overlay=document.createElement('div');overlay.className='doodles-eyes-overlay';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
  // Uniform scaling preserves round irises; eye outlines and rotation vary independently.
  const positions=[[13,13,92],[43,9,132],[83,21,80],[29,35,60],[64,43,128],
    [9,62,106],[46,69,78],[88,60,118],[25,87,68],[73,89,104]];
  const shapes=[
    {half:19,upper:10,lower:7,upPower:.8,lowPower:.8,bias:.1,angle:-18,iris:7},
    {half:21,upper:3,lower:6,upPower:1.8,lowPower:.65,bias:0,angle:8,iris:6},
    {half:14,upper:14,lower:13,upPower:.5,lowPower:.5,bias:0,angle:24,iris:8},
    {half:20,upper:9,lower:5,upPower:1.4,lowPower:1.5,bias:.4,angle:-32,iris:6},
    {half:19,upper:15,lower:11,upPower:.55,lowPower:.7,bias:-.1,angle:12,iris:9},
    {half:21,upper:4,lower:3,upPower:.65,lowPower:1.4,bias:.2,angle:-9,iris:5},
    {half:12,upper:17,lower:14,upPower:.5,lowPower:.6,bias:0,angle:-16,iris:7},
    {half:20,upper:4,lower:11,upPower:2,lowPower:.6,bias:-.35,angle:28,iris:8},
    {half:14,upper:14,lower:8,upPower:.7,lowPower:1.3,bias:.45,angle:38,iris:6},
    {half:21,upper:3,lower:8,upPower:1,lowPower:.85,bias:-.3,angle:-24,iris:7},
    {half:17,upper:16,lower:4,upPower:.6,lowPower:1.8,bias:0,angle:-6,iris:7},
    {half:18,upper:5,lower:15,upPower:1.6,lowPower:.55,bias:.15,angle:17,iris:8},
    {half:20,upper:11,lower:10,upPower:1.8,lowPower:1.8,bias:0,angle:-38,iris:6},
    {half:16,upper:11,lower:10,upPower:.3,lowPower:.3,bias:0,angle:5,iris:8},
    {half:10,upper:18,lower:17,upPower:.65,lowPower:.5,bias:0,angle:43,iris:6},
    {half:22,upper:6,lower:5,upPower:1.2,lowPower:.7,bias:.55,angle:-14,iris:5},
    {half:17,upper:12,lower:8,upPower:.7,lowPower:.8,bias:-.65,angle:32,iris:7},
    {half:13,upper:9,lower:12,upPower:.4,lowPower:1.5,bias:.3,angle:-27,iris:6},
    {half:20,upper:2,lower:4,upPower:2,lowPower:1,bias:0,angle:19,iris:4},
    {half:15,upper:16,lower:15,upPower:1.1,lowPower:.85,bias:-.15,angle:-48,iris:5}
  ];
  function outline(shape,x){
    const u=Math.max(-1,Math.min(1,(x-24)/shape.half)),arch=Math.max(0,1-u*u);
    return {seam:24,top:24-shape.upper*arch**shape.upPower*(1+shape.bias*u),
      bottom:24+shape.lower*arch**shape.lowPower*(1-shape.bias*u*.6)};
  }
  function aperturePath(shape){
    const edge=(side,start,end,step)=>{
      let path='';
      for(let x=start;step>0?x<=end:x>=end;x+=step){
        const y=Math.round(outline(shape,x)[side]);
        path+=path?`H${x}V${y}`:`M${x} ${y}`;
      }
      return path;
    };
    return edge('top',24-shape.half,24+shape.half,1)+
      edge('bottom',24+shape.half,24-shape.half,-1).replace('M','L')+'Z';
  }
  function pixelDisc(radius){
    let path='';
    for(let y=-radius;y<radius;y++){
      const half=Math.round(Math.sqrt(radius*radius-(y+.5)**2));
      path+=`M${24-half} ${24+y}h${half*2}v1h${-half*2}Z`;
    }
    return path;
  }
  const eyes=[];
  positions.forEach(([x,y,width],i)=>{
    const opening=document.createElement('div');opening.className='doodles-eye-opening';
    opening.style.cssText=`left:${x}%;top:${y}%;--eye-width:clamp(${Math.round(width*.6)}px,${width/9}vw,${width}px)`;
    const eye=svg('svg',{viewBox:'0 0 48 48',class:'doodles-terminal-eye'});
    const shape=shapes[i],aperture=aperturePath(shape);
    const rotation=svg('g',{transform:`rotate(${shape.angle} 24 24)`}),group=svg('g',{class:'eye-open'});
    const clip=svg('clipPath',{id:`doodles-eye-clip-${i}`});clip.append(svg('path',{d:aperture}));defs.append(clip);
    const interior=svg('g',{'clip-path':`url(#doodles-eye-clip-${i})`});
    // Flat eye white, with no surrounding lid or screen distortion.
    interior.append(svg('path',{d:aperture,fill:'#f1e6c7'}));
    const pupil=svg('g',{class:'doodles-eye-pupil'});
    pupil.append(svg('path',{d:pixelDisc(shape.iris),fill:'#827c70'}),
      svg('path',{d:pixelDisc(shape.iris-1),fill:'#615f57'}),
      svg('path',{d:pixelDisc(Math.max(2,Math.round(shape.iris*.5))),fill:'#282e29'}),
      svg('rect',{x:21,y:21,width:2,height:2,fill:'#fff6db'}),
      svg('rect',{x:26,y:26,width:1,height:1,fill:'#c4b89b'}));
    interior.append(pupil);group.append(interior);rotation.append(group);eye.append(rotation);opening.append(eye);overlay.append(opening);
    const radians=shape.angle*Math.PI/180;
    eyes.push({opening,pupil,shape,clip,group,interior,rotation,cos:Math.cos(radians),sin:Math.sin(radians)});
  });
  // Deal without replacement: two openings show the entire twenty-eye palette.
  let palette=[];
  function refreshShapes(){
    if(palette.length<eyes.length){
      palette=[...shapes];
      for(let i=palette.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [palette[i],palette[j]]=[palette[j],palette[i]];
      }
    }
    for(const eye of eyes){
      const shape=palette.shift(),aperture=aperturePath(shape);
      eye.shape=shape;
      eye.cos=Math.cos(shape.angle*Math.PI/180);eye.sin=Math.sin(shape.angle*Math.PI/180);
      eye.rotation.setAttribute('transform',`rotate(${shape.angle} 24 24)`);
      for(const path of [eye.clip.children[0],eye.interior.children[0]]){
        path.setAttribute('d',aperture);
      }
      [shape.iris,shape.iris-1,Math.max(2,Math.round(shape.iris*.5))].forEach((radius,i)=>{
        eye.pupil.children[i].setAttribute('d',pixelDisc(radius));
      });
    }
  }
  let active=false,gazeFrame=0,lidFrame=0,openness=0,lastLidTime=0;
  function renderLids(){
    const eased=openness*openness*(3-2*openness);
    // Move only the aperture: irises keep their round shape behind the lids.
    for(const eye of eyes)eye.clip.children[0].setAttribute('transform',
      `translate(0 24) scale(1 ${eased}) translate(0 -24)`);
  }
  function animateLids(now){
    lidFrame=0;
    const step=(now-lastLidTime)/(active?480:300);
    lastLidTime=now;
    openness=Math.max(0,Math.min(1,openness+(active?step:-step)));
    renderLids();
    if(openness!==(active?1:0))lidFrame=requestAnimationFrame(animateLids);
    else if(!active)overlay.hidden=true;
  }
  renderLids();
  let mouseX=innerWidth/2,mouseY=innerHeight/2;
  function look(){
    gazeFrame=0;
    if(!active)return;
    for(const {opening,pupil,shape,cos,sin} of eyes){
      const rect=opening.getBoundingClientRect();
      const dx=mouseX-rect.left-rect.width/2,dy=mouseY-rect.top-rect.height/2;
      // Inverse rotation keeps the gaze aimed toward the screen pointer.
      const lx=cos*dx+sin*dy,ly=-sin*dx+cos*dy;
      const distance=Math.hypot(lx,ly),reach=Math.min(1,distance/180);
      const travelX=Math.min(7,shape.half-shape.iris-2);
      const travelY=Math.max(1,Math.min(6,(shape.upper+shape.lower)/2-shape.iris*.65));
      const nx=lx/(distance||1),ny=ly/(distance||1);
      const travel=reach/(Math.hypot(nx/travelX,ny/travelY)||1);
      pupil.setAttribute('transform',`translate(${Math.round(nx*travel)} ${Math.round(ny*travel)})`);
    }
  }
  function pointer(event){
    mouseX=event.clientX;mouseY=event.clientY;
    if(active && !gazeFrame)gazeFrame=requestAnimationFrame(look);
  }
  function resized(){
    if(active && !gazeFrame)gazeFrame=requestAnimationFrame(look);
  }
  function setActive(value){
    active=value;
    document.dispatchEvent(new CustomEvent('pasture-sound',{detail:{kind:active?'eyes-open':'eyes-close'}}));
    if(active){
      if(overlay.hidden)refreshShapes();
      overlay.hidden=false;look();
    }
    else{cancelAnimationFrame(gazeFrame);gazeFrame=0;}
    cancelAnimationFrame(lidFrame);
    lastLidTime=performance.now();
    lidFrame=requestAnimationFrame(animateLids);
  }


  const unregister=window.doodlesModes.register({id:'god',label:'God mode',enter:()=>setActive(true),exit:()=>setActive(false)});
  window.addEventListener('pointermove',pointer,{passive:true});
  window.addEventListener('resize',resized);
  document.body.append(defsSvg,overlay);
  window.addEventListener('pagehide',()=>{
    unregister();active=false;
    for(const frame of [gazeFrame,lidFrame])cancelAnimationFrame(frame);
    window.removeEventListener('pointermove',pointer);window.removeEventListener('resize',resized);
    overlay.remove();defsSvg.remove();style.remove();
  },{once:true});
})();

// Shared by the playground and the installed overlay so the chosen look matches.
(function () {
  'use strict';
  const defaults=Object.freeze({density:100,speed:470,length:8,width:1.2,opacity:44,wind:-8,depth:100,gust:19});
  function create(canvas,initial=defaults) {
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas 2D is unavailable.');
    const drops=Array.from({length:1800},()=>({x:Math.random(),y:Math.random(),depth:Math.random(),phase:Math.random()*Math.PI*2}));
    let settings={...defaults,...initial},width=1,height=1,ratio=1;
    return {
      configure(next){settings={...settings,...next};},
      resize(w,h,dpr=1){
        width=Math.max(1,w);height=Math.max(1,h);ratio=Math.max(1,Math.min(dpr,2));
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      },
      draw(dt,time){
        const s=settings;
        ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);ctx.lineCap='round';
        const count=Math.min(drops.length,Math.round(width*height/1000*s.density/50));
        for(let i=0;i<count;i++) {
          const d=drops[i],depth=1-s.depth/100+d.depth*s.depth/100;
          const speed=s.speed*(.35+depth*.9);
          const wind=Math.tan(s.wind*Math.PI/180)+Math.sin(time*.65+d.phase)*s.gust/500;
          d.y=((d.y+dt*speed/(height+90))%1+1)%1;
          d.x=((d.x+dt*speed*wind/(width+180))%1+1)%1;
          const x=d.x*(width+180)-90,y=d.y*(height+90)-45,length=s.length*(.25+depth*.75);
          ctx.strokeStyle=`rgba(65,112,149,${s.opacity/100*(.25+.65*depth)})`;
          ctx.lineWidth=s.width*(.3+.7*depth);
          ctx.beginPath();ctx.moveTo(x-length*wind,y-length);ctx.lineTo(x,y);ctx.stroke();
          ctx.strokeStyle=`rgba(245,253,255,${s.opacity/100*.5*depth})`;
          ctx.lineWidth=Math.max(.3,s.width*.3);
          ctx.beginPath();ctx.moveTo(x+.65-length*wind,y-length*.7);ctx.lineTo(x+.65,y);ctx.stroke();
        }
      }
    };
  }
  window.doodlesFineRain={create,defaults};
})();

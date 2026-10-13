// Fine falling rain uses the same renderer and chosen recipe as the playground.
window.doodlesRainField = function(host) {
  const canvas=document.createElement("canvas");canvas.className="sky-rain-field";host.appendChild(canvas);
  if(!canvas.getContext("2d") || !window.doodlesFineRain)return {setAmount(){},setGusts(){},dispose(){canvas.remove();}};
  const {create,defaults}=window.doodlesFineRain;
  const renderer=create(canvas,{density:0});
  const reduced=matchMedia("(prefers-reduced-motion:reduce)");
  let amount=0,gust=defaults.gust,frame=0,last=null,time=0,disposed=false;
  function tick(now) {
    frame=0;
    if(disposed || document.hidden || reduced.matches || !amount)return;
    const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;time+=dt;
    renderer.draw(dt,time);frame=requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);frame=0;last=null;
    if(disposed || document.hidden || !amount)return;
    renderer.draw(0,time);if(!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function resize() {
    renderer.resize(innerWidth,innerHeight,window.devicePixelRatio || 1);resume();
  }
  window.addEventListener("resize",resize);document.addEventListener("visibilitychange",resume);
  reduced.addEventListener("change",resume);resize();
  return {
    setAmount(value) {
      if(disposed)return;
      const next=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
      if(next===amount)return;
      amount=next;renderer.configure({density:amount});
      if(!amount)renderer.draw(0,time);
      resume();
    },
    setGusts(value) {
      if(disposed)return;
      const next=Number.isFinite(value)?Math.max(0,Math.min(100,value)):defaults.gust;
      if(next===gust)return;
      gust=next;renderer.configure({gust});
      if(amount&&!document.hidden)renderer.draw(0,time);
    },
    dispose() {
      disposed=true;cancelAnimationFrame(frame);canvas.remove();
      window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",resume);
      reduced.removeEventListener("change",resume);
    }
  };
};

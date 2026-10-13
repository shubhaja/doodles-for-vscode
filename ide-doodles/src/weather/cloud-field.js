// Procedural cloud field using simplex-noise 4.0.3 (MIT, vendored alongside this file).
// Visual weather simulation: cover changes the density threshold, not sprite count.
window.doodlesCloudField = function(host) {
  const canvas=document.createElement('canvas');canvas.className='sky-cloud-field';host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return {setCover(){},dispose(){canvas.remove();}};
  const noise=window.doodlesSimplex.createNoise3D();
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let cover=0,target=0,time=0,disposed=false;
  function paint(immediate=false) {
    if(disposed || document.hidden)return;
    cover=immediate?target:cover+(target-cover)*.12;
    const width=Math.min(280,Math.ceil(innerWidth/5)),height=Math.max(1,Math.round(width*innerHeight/innerWidth));
    if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
    if(cover<.001){ctx.clearRect(0,0,width,height);return;}
    if(!reduced.matches)time+=.004;
    const pixels=ctx.createImageData(width,height);
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      const u=x/width*4+time,v=y/width*4;
      let n=0,amp=.55,freq=1;
      for(let octave=0;octave<5;octave++){n+=amp*noise(u*freq,v*freq,time*.35);freq*=2.03;amp*=.5;}
      const density=smooth((n-(.72-cover*1.35))/.28);
      const shade=smooth((n+.25)/.8),p=(y*width+x)*4;
      pixels.data[p]=Math.round(156+shade*94);
      pixels.data[p+1]=Math.round(172+shade*80);
      pixels.data[p+2]=Math.round(187+shade*66);
      // Preserve text readability even at full overcast.
      pixels.data[p+3]=Math.round(density*(.12+cover*.17)*255);
    }
    ctx.putImageData(pixels,0,0);
  }
  const timer=setInterval(()=>{if(!reduced.matches || Math.abs(cover-target)>.001)paint();},180);
  const resize=()=>paint(true);window.addEventListener('resize',resize);
  return {setCover(value,immediate=false){target=Math.max(0,Math.min(1,value/100));paint(immediate || reduced.matches);},
    dispose(){disposed=true;clearInterval(timer);window.removeEventListener('resize',resize);canvas.remove();}};
};

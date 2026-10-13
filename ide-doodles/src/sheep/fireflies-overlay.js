(function () {
  'use strict';
  if (document.getElementById('pasture-fireflies')) return;
  const style = document.createElement('style');
  style.textContent = `
    #pasture-fireflies {position:fixed;inset:auto 0 0;height:22px;z-index:1001;pointer-events:none;overflow:hidden;}
    #pasture-fireflies .firefly {position:absolute;top:100%;width:2px;height:2px;background:#9bdcff;box-shadow:0 0 4px 1px #72bdff99;opacity:0;animation:firefly-rise var(--duration) linear infinite;}
    @keyframes firefly-rise {
      0% {top:100%;opacity:0;transform:translateX(0);}
      12% {opacity:0.9;}
      38% {transform:translateX(var(--drift));opacity:0.8;}
      58% {opacity:0.65;}
      78% {top:0;opacity:0;transform:translateX(calc(var(--drift) * -0.5));}
      100% {top:0;opacity:0;transform:translateX(0);}
    }
    @media (max-width:700px) {#pasture-fireflies .firefly:nth-child(n+7) {display:none;}}
    @media (prefers-reduced-motion:reduce) {#pasture-fireflies {display:none;}}
  `;
  const overlay = document.createElement('div');
  overlay.id = 'pasture-fireflies';
  overlay.setAttribute('aria-hidden', 'true');
  for (let i=0; i<12; i++) {
    const dot = document.createElement('span');
    dot.className = 'firefly';
    dot.style.left = (5+i*8)+'%';
    dot.style.setProperty('--duration', (5+(i%4)*0.7)+'s');
    dot.style.setProperty('--drift', (i%2 ? -3 : 3)+'px');
    dot.style.animationDelay = (-i*1.37)+'s';
    overlay.appendChild(dot);
  }
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  // Fade at the actual top of the status bar, including when its size changes.
  let bar;
  const updateHeight = () => {
    const rect = bar.getBoundingClientRect();
    overlay.style.height = (rect.height ? Math.max(0,window.innerHeight-rect.top) : 0)+'px';
  };
  const sizeObserver = new ResizeObserver(updateHeight);
  const findBar = () => {
    bar = document.getElementById('pasture-ground') || document.querySelector('.monaco-workbench .part.statusbar');
    if (!bar) return;
    updateHeight();
    sizeObserver.observe(bar);
    discovery.disconnect();
  };
  const discovery = new MutationObserver(findBar);
  discovery.observe(document.body,{childList:true,subtree:true});
  findBar();
  window.addEventListener('resize',updateIfReady);
  function updateIfReady() {if (bar) updateHeight();}
  window.addEventListener('pagehide',() => {
    discovery.disconnect();sizeObserver.disconnect();
    window.removeEventListener('resize',updateIfReady);
  },{once:true});
})();

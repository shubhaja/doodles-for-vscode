(() => {
  'use strict';
  if(window.doodlesSettings)return;
  let scheduled=0;
  const style=document.createElement('style');
  style.textContent=`    .doodles-weather-controls {position:fixed;right:64px;top:5px;display:flex;gap:2px;z-index:1004;-webkit-app-region:no-drag;}
    .doodles-weather-controls.toolbar-mounted {position:static;margin-right:4px;}
    .doodles-weather-controls button {width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--vscode-foreground,#303b50);font-size:15px;cursor:pointer;}
    .doodles-weather-controls button:hover,.doodles-weather-controls button[aria-pressed="true"] {background:var(--vscode-toolbar-hoverBackground,rgba(100,100,120,.12));}
    .doodles-weather-controls button:focus-visible {outline:1px solid currentColor;outline-offset:-1px;}
    #doodles-settings {position:fixed;right:12px;top:36px;width:min(290px,calc(100vw - 24px));box-sizing:border-box;max-height:calc(100vh - 48px);overflow:auto;z-index:1008;padding:16px;border:1px solid #a8b7c5;border-radius:12px;background:var(--vscode-dropdown-background,#edf3f7);color:var(--vscode-foreground,#303b50);box-shadow:0 8px 28px #24394b30;font:13px/1.5 system-ui;-webkit-app-region:no-drag;}
    #doodles-settings[hidden] {display:none;}
    #doodles-settings h2 {margin:0 0 10px;font-size:15px;}
    #doodles-settings button {padding:6px 10px;border:1px solid #a8b7c5;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer;}
    #doodles-settings button:hover {background:#8aa5bb26;}
    #doodles-settings button:focus-visible,#doodles-settings input:focus-visible {outline:2px solid #648eae;outline-offset:2px;}
    #doodles-settings button:disabled {opacity:.5;cursor:default;}

    #doodles-settings .doodles-reset {display:block;margin-top:14px;}
    #doodles-settings p {margin:8px 0;font-size:12px;opacity:.8;}
    .doodles-mode-button {display:block;width:100%;margin:6px 0;text-align:left;}
    .doodles-mode-button[aria-pressed="true"] {background:var(--vscode-toolbar-hoverBackground,#8aa5bb40) !important;}
  `;
  const controls=document.createElement('div');controls.className='doodles-weather-controls';
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='⚙';toggle.title='Doodles settings';
  toggle.setAttribute('aria-label','Doodles settings');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','doodles-settings');
  controls.appendChild(toggle);
  const panel=document.createElement('section');panel.id='doodles-settings';panel.hidden=true;panel.setAttribute('aria-label','Doodles settings');
  const title=document.createElement('h2');title.textContent='Doodles settings';panel.appendChild(title);
  const modePanel=document.createElement('div');modePanel.setAttribute('role','group');modePanel.setAttribute('aria-label','Modes');panel.appendChild(modePanel);
  const buttons=new Map();
  const unsubscribe=window.doodlesModes.subscribe(({active,modes})=>{
    for(const [id,button] of buttons)if(!modes.some(mode=>mode.id===id)){button.remove();buttons.delete(id);}
    for(const {id,label} of modes){
      let button=buttons.get(id);
      if(!button){
        button=document.createElement('button');button.type='button';button.className='doodles-mode-button';button.id='doodles-mode-'+id;
        button.addEventListener('click',()=>window.doodlesModes.toggle(id));
        buttons.set(id,button);modePanel.appendChild(button);
      }
      button.textContent=label;button.setAttribute('aria-pressed',String(active===id));
      button.title=active===id?'Return to everyday life':'Start '+label.toLowerCase();
    }
  });
  const hint=document.createElement('p');hint.textContent='Select an active mode again to return to everyday life. Race: Space to jump or retry.';modePanel.appendChild(hint);

  const reset=document.createElement('button');reset.type='button';reset.className='doodles-reset';reset.textContent='Reset evolution';panel.appendChild(reset);
  const resetNote=document.createElement('p');resetNote.textContent='Return all evolved creatures to swimming goldfish.';resetNote.setAttribute('role','status');panel.appendChild(resetNote);
  if(window.doodlesConfig?.host==='webview'){reset.hidden=true;resetNote.hidden=true;}
  const settingsOpened=()=>{reset.disabled=typeof window.doodlesResetEvolution!=='function';};
  document.addEventListener('doodles-settings-open',settingsOpened);
  reset.addEventListener('click',()=>{
    if(typeof window.doodlesResetEvolution==='function'){window.doodlesResetEvolution();resetNote.textContent='Evolution reset. All three goldfish are swimming again.';}
  });

  function setOpen(open){
    panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
    if(open)document.dispatchEvent(new CustomEvent('doodles-settings-open'));
  }
  toggle.addEventListener('click',()=>setOpen(panel.hidden));
  function outside(event){if(!event.target?.closest?.('#doodles-settings, .doodles-weather-controls'))setOpen(false);}
  function escape(event){if(event.key==='Escape' && !panel.hidden){setOpen(false);toggle.focus?.();event.stopPropagation();}}
  document.addEventListener('pointerdown',outside);panel.addEventListener('keydown',escape);controls.addEventListener('keydown',escape);
  for(const target of [controls,panel])for(const type of ['pointerdown','mousedown','click','dblclick','keydown','keyup'])target.addEventListener(type,event=>event.stopPropagation());
  document.head.appendChild(style);document.body.append(panel,controls);
  const item=document.createElement('li');item.className='action-item';item.setAttribute('role','presentation');
  function mount(){
    scheduled=0;
    const anchor=document.getElementById('pasture-sound-toggle')?.closest('li.action-item');
    if(anchor?.isConnected){
      if(controls.parentNode!==item)item.appendChild(controls);
      if(item.parentNode!==anchor.parentNode || item.nextElementSibling!==anchor)anchor.parentNode.insertBefore(item,anchor);
      controls.classList.add('toolbar-mounted');
    }else{
      if(controls.parentNode!==document.body)document.body.appendChild(controls);
      item.remove();controls.classList.remove('toolbar-mounted');
    }
  }
  const observer=new MutationObserver(()=>{if(!scheduled)scheduled=requestAnimationFrame(mount);});
  observer.observe(document.body,{childList:true,subtree:true});mount();

  window.doodlesSettings={panel};
  window.addEventListener('pagehide',()=>{
    document.removeEventListener('doodles-settings-open',settingsOpened);
    unsubscribe();observer.disconnect();cancelAnimationFrame(scheduled);document.removeEventListener('pointerdown',outside);
    controls.remove();panel.remove();item.remove();style.remove();delete window.doodlesSettings;
  },{once:true});
})();

(() => {
  'use strict';
  if(window.doodlesModes)return;
  const modes=new Map(),listeners=new Set();
  let active=null,transitioning=false,tearingDown=false,restoreTimer=0,restoreMode=null;
  const storageKey='doodles-resting-mode';
  try{restoreMode=sessionStorage.getItem(storageKey);}catch(_){}

  const snapshot=()=>({active,modes:[...modes.values()].map(({id,label})=>({id,label}))});
  const publish=()=>{const state=snapshot();for(const listener of listeners)listener(state);};
  function activate(id){
    if(id!==null && !modes.has(id))throw new Error('Unknown mode: '+id);
    clearTimeout(restoreTimer);restoreMode=null;
    if(id===active)return;
    if(transitioning)throw new Error('Mode lifecycle cannot start another transition');
    transitioning=true;
    const previous=active;active=null;
    try{
      if(previous!==null)modes.get(previous).exit();
      if(id!==null){
        try{modes.get(id).enter();active=id;}
        catch(error){modes.get(id).exit();throw error;}
      }
    }finally{
      transitioning=false;
      if(!tearingDown)try{sessionStorage.setItem(storageKey,modes.get(active)?.restoreOnReload?active:'');}catch(_){}
      publish();
    }
  }
  // Keyboard shortcuts belong to world controls, never editor/terminal inputs.
  function ownsInput(target){
    if(target===document.body)return true;
    if(target?.isContentEditable || target?.closest?.('input, textarea, select, [contenteditable="true"]'))return false;
    return !!target?.closest?.('.doodles-mode-button, #pasture-sheep, #pixel-goldfish');
  }
  function escape(event){
    if(event.key==='Escape' && active!==null && ownsInput(event.target)){
      event.preventDefault();event.stopPropagation();activate(null);
    }
  }
  window.doodlesModes={
    activate,ownsInput,snapshot,
    toggle(id){activate(active===id?null:id);},
    subscribe(listener){listeners.add(listener);listener(snapshot());return ()=>listeners.delete(listener);},
    register(mode){
      if(!mode.id || !mode.label || typeof mode.enter!=='function' || typeof mode.exit!=='function')throw new Error('Invalid mode');
      if(modes.has(mode.id))throw new Error('Duplicate mode: '+mode.id);
      modes.set(mode.id,mode);publish();
      if(mode.restoreOnReload && restoreMode===mode.id)restoreTimer=setTimeout(()=>activate(mode.id),0);
      return ()=>{if(modes.get(mode.id)!==mode)return;if(active===mode.id)activate(null);modes.delete(mode.id);publish();};
    }
  };
  window.addEventListener('keydown',escape,true);
  window.addEventListener('pagehide',()=>{
    tearingDown=true;clearTimeout(restoreTimer);activate(null);listeners.clear();window.removeEventListener('keydown',escape,true);
  },{once:true});
})();

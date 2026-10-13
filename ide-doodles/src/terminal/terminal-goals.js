(function () {
  'use strict';
  if(document.getElementById('terminal-goal-styles'))return;
  const style=document.createElement('style');style.id='terminal-goal-styles';
  style.textContent=`
    .terminal-wrapper.terminal-goal-pane {position:relative;}
    .terminal-wrapper.terminal-goal-pane > .terminal-xterm-host > .xterm {padding-top:34px !important;}
    /* Native xterm viewport/screen/sticky scroll occupy layers 30–35. */
    .terminal-goal-header {position:absolute;top:0;left:12px;right:16px;height:28px;z-index:40;pointer-events:auto;display:flex;align-items:center;border-bottom:1px solid var(--vscode-widget-border,rgba(100,110,125,.18));}
    .terminal-goal-input {box-sizing:border-box;width:100%;height:25px;min-width:0;margin:0;padding:3px 6px;border:1px solid transparent;border-radius:3px;background:transparent;color:var(--vscode-terminal-foreground,var(--vscode-editor-foreground,#394653));font:600 12px/18px var(--vscode-editor-font-family,monospace);text-overflow:ellipsis;outline:none;}
    .terminal-goal-input::placeholder {color:var(--vscode-descriptionForeground,#687789);font-weight:400;opacity:.75;}
    .terminal-goal-input:hover {background:var(--vscode-toolbar-hoverBackground,rgba(100,110,125,.08));}
    .terminal-goal-input:focus {background:var(--vscode-input-background,#fff);color:var(--vscode-input-foreground,#394653);border-color:var(--vscode-focusBorder,#719ccc);}
  `;
  document.head.appendChild(style);
  const entries=new Map();let scheduled=0;
  function attach(wrapper){
    const bridge=wrapper.pastureGoal;
    if(!bridge || !wrapper.xterm?.element)return;
    const header=document.createElement('div');header.className='terminal-goal-header';
    const input=document.createElement('input');input.type='text';input.className='terminal-goal-input';input.maxLength=120;
    input.placeholder='Add a goal…';input.setAttribute('aria-label','Terminal title or goal');input.spellcheck=false;
    input.autocomplete='off';input.title='Click to edit terminal goal · Enter to save · Escape to cancel';
    header.appendChild(input);wrapper.appendChild(header);wrapper.classList.add('terminal-goal-pane');
    let editing=false,disposed=false;
    const read=()=>String(bridge.getTitle() || '');
    function sync(){if(!editing)input.value=read();}
    function terminalFocus(){if(wrapper.isConnected)wrapper.xterm?.focus();}
    async function save(){
      if(!editing)return;
      editing=false;
      const value=input.value.replace(/[\r\n]+/g,' ').trim();input.value=value;
      if(value===read())return;
      try{await bridge.rename(value || undefined);if(!disposed)sync();}
      catch(_){if(!disposed){sync();input.title='Could not save the terminal goal. Click to try again.';}}
    }
    input.addEventListener('focus',()=>{editing=true;input.select();});
    input.addEventListener('blur',save);
    for(const type of ['pointerdown','mousedown','click','dblclick','keyup','keypress'])header.addEventListener(type,event=>event.stopPropagation());
    input.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(event.isComposing)return;
      if(event.key==='Enter'){event.preventDefault();void save();input.blur();terminalFocus();}
      if(event.key==='Escape'){event.preventDefault();editing=false;sync();input.blur();terminalFocus();}
    });
    const subscription=bridge.onTitleChanged(sync);sync();
    // VS Code subtracts the xterm element's padding when calculating terminal rows.
    bridge.relayout();
    entries.set(wrapper,()=>{disposed=true;subscription?.dispose();header.remove();wrapper.classList.remove('terminal-goal-pane');});
  }
  function scan(){
    scheduled=0;
    for(const [wrapper,dispose] of entries){if(!wrapper.isConnected){dispose();entries.delete(wrapper);}}
    for(const wrapper of document.querySelectorAll('.terminal-wrapper'))if(!entries.has(wrapper))attach(wrapper);
  }
  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(scan);}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});scan();
  window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(scheduled);for(const dispose of entries.values())dispose();entries.clear();},{once:true});
})();

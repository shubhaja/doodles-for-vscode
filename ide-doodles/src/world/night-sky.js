(() => {
  'use strict';
  if(document.getElementById('doodles-dark-style'))return;
  const style=document.createElement('style');style.id='doodles-dark-style';
  // A stable star field: no flashing, particles, or layer over editor text.
  const stars=Array.from({length:95},(_,i)=>{
    const x=(i*137.508)%1000,y=(i*i*31.7+i*59)%800,r=i%13===0?1.3:.65;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${i%4===0?'#f6dbba':'#cad8ff'}" opacity="${i%3===0?.6:.3}"/>`;
  }).join('');
  const starURL='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800">'+stars+'</svg>')+'")';
  style.textContent=`
    body.doodles-dark,body.doodles-dark .monaco-workbench {
      color-scheme:dark;color:#e2e8f5 !important;
      --pasture-sky:#11182b !important;
      --vscode-editor-background:#11182b !important;--vscode-terminal-background:#11182b !important;
      --vscode-panel-background:#11182b !important;--vscode-sideBar-background:#11182b !important;
      --vscode-foreground:#e2e8f5 !important;--vscode-editor-foreground:#e2e8f5 !important;
      --vscode-terminal-foreground:#e2e8f5 !important;--vscode-sideBar-foreground:#e2e8f5 !important;
      --vscode-input-background:#202a43 !important;--vscode-input-foreground:#e2e8f5 !important;
      --vscode-dropdown-background:#202a43 !important;--vscode-dropdown-foreground:#e2e8f5 !important;
      --vscode-toolbar-hoverBackground:#354366 !important;--vscode-focusBorder:#aebdf5 !important;
      --doodles-night-sky:${starURL},radial-gradient(ellipse at 80% 100%,#51446b33,transparent 60%),linear-gradient(#11182b,#11182b);
    }
    body.doodles-dark,body.doodles-dark .monaco-workbench,
    body.doodles-dark .monaco-workbench .part.editor,
    body.doodles-dark .monaco-editor,body.doodles-dark .monaco-editor .margin,
    body.doodles-dark .monaco-editor-background,
    body.doodles-dark .monaco-workbench .part.panel,
    body.doodles-dark .monaco-workbench .part,
    body.doodles-dark .monaco-workbench .monaco-grid-view,
    body.doodles-dark .monaco-workbench .monaco-split-view2,
    body.doodles-dark .monaco-workbench .editor-group-container,
    body.doodles-dark .monaco-workbench .editor-container,
    body.doodles-dark .monaco-workbench .tabs-container,
    body.doodles-dark .monaco-workbench .tab,
    body.doodles-dark .monaco-workbench .part > .title,
    body.doodles-dark .monaco-workbench .part.statusbar > .items-container {
      background-color:#11182b !important;background-image:var(--doodles-night-sky) !important;
      background-attachment:fixed !important;background-position:0 0 !important;
      background-size:1000px 800px,100vw 100vh,100vw 100vh !important;
    }
    body.doodles-dark::before {display:none !important;}
    body.doodles-dark .terminal-wrapper,body.doodles-dark .terminal-xterm-host,
    body.doodles-dark .xterm-viewport,body.doodles-dark .terminal-goal-header {
      background-color:#11182b !important;background-image:none !important;color:#e2e8f5;
    }
    body.doodles-dark .terminal-wrapper::after {opacity:0 !important;}
    body.doodles-dark #ktown-weather-clouds {visibility:hidden;}
    body.doodles-dark #pasture-sheep .sleep-zzz {color:#d7dcff;text-shadow:0 1px #10172b;}
    body.doodles-dark #pasture-help,body.doodles-dark #weather-credit,
    body.doodles-dark main,body.doodles-dark h1,body.doodles-dark footer {color:#d9e2f6;}
  `;
  document.head.appendChild(style);
  const variables=Object.entries(window.doodlesDarkColors || {}).map(([key,value])=>'--vscode-'+key.replaceAll('.','-')+':'+value+' !important;').join('');
  style.textContent+=`body.doodles-dark,body.doodles-dark .monaco-workbench {${variables}}
    body.doodles-dark:not(.doodles-dark-native) .monaco-editor .view-line span {color:#e2e8f5 !important;}
  `;
  // Native themes include separate empty-editor and window-gutter colors.
  // Keep those surfaces in the same night palette, including before a terminal exists.
  const surfaces=['mainWindow-background','editorGroup-emptyBackground','editorPane-background',
    'activityBar-background','titleBar-activeBackground','titleBar-inactiveBackground',
    'statusBar-background','statusBar-noFolderBackground','statusBar-debuggingBackground',
    'editorGroupHeader-tabsBackground','tab-activeBackground','tab-inactiveBackground'];
  const borders=['window-activeBorder','window-inactiveBorder','panel-border','sideBar-border',
    'editorGroup-border','editorGroupHeader-border','titleBar-border','statusBar-border'];
  style.textContent+=`body.doodles-dark,body.doodles-dark .monaco-workbench {
    ${surfaces.map(key=>'--vscode-'+key+':#11182b !important;').join('')}
    ${borders.map(key=>'--vscode-'+key+':transparent !important;').join('')}
  }
  body.doodles-dark .monaco-workbench .part {
    border-color:transparent !important;box-shadow:none !important;
  }
  body.doodles-dark .monaco-workbench .part.statusbar > .items-container {box-shadow:none !important;}
  `;
  // Disco shares the native dark theme and terminal ownership with Cozy, but
  // uses club surfaces instead of stars. These rules commit with doodles-dark.
  const clubSurfaces=[...surfaces,'editor-background','terminal-background','panel-background',
    'sideBar-background','sideBarSectionHeader-background','sideBarTitle-background'];
  const clubText=['foreground','editor-foreground','terminal-foreground','sideBar-foreground',
    'sideBarTitle-foreground','sideBarSectionHeader-foreground','icon-foreground','activityBar-foreground',
    'statusBar-foreground','statusBar-noFolderForeground','titleBar-activeForeground',
    'panelTitle-activeForeground','tab-activeForeground','input-foreground','dropdown-foreground'];
  style.textContent+=`body.doodles-dark.doodles-disco,body.doodles-dark.doodles-disco .monaco-workbench {
    --pasture-sky:var(--doodles-disco-sky) !important;
    --doodles-night-sky:linear-gradient(var(--doodles-disco-sky),var(--doodles-disco-sky));
    ${clubSurfaces.map(key=>'--vscode-'+key+':var(--doodles-disco-sky) !important;').join('')}
    ${clubText.map(key=>'--vscode-'+key+':#f4edff !important;').join('')}
    --vscode-descriptionForeground:#cbbce5 !important;--vscode-input-placeholderForeground:#cbbce5 !important;
    --vscode-activityBar-inactiveForeground:#cbbce5 !important;--vscode-tab-inactiveForeground:#cbbce5 !important;
    --vscode-panelTitle-inactiveForeground:#cbbce5 !important;
    --vscode-textLink-foreground:#79edff !important;--vscode-textLink-activeForeground:#b7f7ff !important;
    --vscode-focusBorder:#ff7ce5 !important;--vscode-panelTitle-activeBorder:#ff7ce5 !important;
    --vscode-input-background:#25153f !important;--vscode-dropdown-background:#25153f !important;
    --vscode-quickInput-background:#25153f !important;--vscode-editorWidget-background:#25153f !important;
    --vscode-button-background:#7130a0 !important;--vscode-button-hoverBackground:#833bb5 !important;
    --vscode-button-foreground:#ffffff !important;
    --vscode-editor-selectionBackground:#643575 !important;--vscode-terminal-selectionBackground:#643575 !important;
    --vscode-list-activeSelectionBackground:#643575 !important;--vscode-list-activeSelectionForeground:#ffffff !important;
    color:#f4edff !important;
  }
  body.doodles-dark.doodles-disco .monaco-workbench .part,
  body.doodles-dark.doodles-disco .terminal-wrapper,
  body.doodles-dark.doodles-disco .terminal-xterm-host,
  body.doodles-dark.doodles-disco .xterm-viewport,
  body.doodles-dark.doodles-disco .terminal-goal-header {background-color:var(--doodles-disco-sky) !important;color:#f4edff;}
  `;
  let active=false,bridge=null,requested=false,generation=0;
  const terminals=new Map();
  function releaseTerminals(){
    for(const [terminal,saved] of terminals){
      const theme={...terminal.options.theme};
      for(const [key,value] of Object.entries(saved.last))if(theme[key]===value){
        if(key in saved.original)theme[key]=saved.original[key];else delete theme[key];
      }
      for(const handler of saved.handlers)handler.dispose();
      terminal.options.theme=theme;
    }
    terminals.clear();
  }
  function fallbackTerminals(){
    for(const wrapper of document.querySelectorAll('.terminal-wrapper')){
      const terminal=wrapper.xterm;if(!terminal?.options)continue;
      let saved=terminals.get(terminal);
      const original={...terminal.options.theme};
      const last={background:'#11182b',foreground:'#e2e8f5',cursor:'#f5dcaa',selectionBackground:'#3d5078',
        black:'#8290ad',red:'#ff9da8',green:'#b0d9a0',yellow:'#f0d397',blue:'#a6bdff',magenta:'#d5b3f5',cyan:'#9ed9df',white:'#e2e8f5',
        brightBlack:'#a8b5ce',brightRed:'#ffb4bd',brightGreen:'#c3eab5',brightYellow:'#ffe3ae',
        brightBlue:'#bfd0ff',brightMagenta:'#e4c9ff',brightCyan:'#b6ecf0',brightWhite:'#ffffff'};
      if(window.doodlesDiscoSky)Object.assign(last,{background:window.doodlesDiscoSky,foreground:'#f4edff',
        cursor:'#ff7ce5',selectionBackground:'#643575',red:'#ff8da8',green:'#9ef5b8',yellow:'#ffe59b',
        blue:'#aebdff',magenta:'#ff9ce9',cyan:'#79edff',white:'#f4edff'});
      if(saved)for(const key of Object.keys(last))if(!['background','foreground'].includes(key) && original[key]!==saved.last[key])saved.original[key]=original[key];
      if(!saved){
        const handlers=[];
        // Block stale shell/agent OSC color overrides while the atmosphere owns colors.
        for(const code of [10,11]){const handler=terminal.parser?.registerOscHandler?.(code,data=>active && data!=='?');if(handler)handlers.push(handler);}
        saved={original,last,handlers};terminals.set(terminal,saved);
        terminal.write?.('\x1b]110\x07\x1b]111\x07');
      }
      if(Object.entries(last).some(([key,value])=>terminal.options.theme?.[key]!==value)){
        terminal.options.theme={...terminal.options.theme,...last};
      }
      saved.last=last;
    }
  }
  function commit(value,current,native){
    if(current!==generation)return;
    if(value){
      document.body.classList.add('doodles-dark');
      document.body.classList.toggle('doodles-dark-native',native);
      fallbackTerminals();
    }else{
      document.body.classList.remove('doodles-dark','doodles-dark-native');
      releaseTerminals();
      document.dispatchEvent(new CustomEvent('doodles-appearance-restored'));
    }
  }
  function syncHost(){
    const host=window.doodlesAppearance;
    if(!host?.local || !host?.setDarkMode){
      if(active)commit(true,generation,false);
      return;
    }
    if(host===bridge && requested){
      if(active && document.body.classList.contains('doodles-dark'))fallbackTerminals();
      return;
    }
    const current=generation,value=active;
    bridge=host;requested=true;
    let committed=false;
    const finish=()=>{if(committed)return;committed=true;commit(value,current,true);};
    Promise.resolve(host.setDarkMode(value,finish)).then(finish).catch(error=>{
      if(current===generation){requested=false;commit(value,current,false);}
      console.warn('[Doodles] Local theme unavailable:',error.message);
    });
  }
  function setActive(value){
    active=value;++generation;requested=false;
    if(window.doodlesAppearance?.local)syncHost();
    else commit(value,generation,false);
  }
  window.doodlesNightSky={setActive};
  // The injected command bridge appears when VS Code creates a terminal.
  document.addEventListener('doodles-appearance-ready',syncHost);
  const refreshPalette=()=>{if(document.body.classList.contains('doodles-dark'))fallbackTerminals();};
  document.addEventListener('doodles-sky-change',refreshPalette);
  const timer=setInterval(syncHost,1000);
  window.addEventListener('pagehide',()=>{if(active)setActive(false);clearInterval(timer);document.removeEventListener('doodles-appearance-ready',syncHost);document.removeEventListener('doodles-sky-change',refreshPalette);style.remove();},{once:true});
})();

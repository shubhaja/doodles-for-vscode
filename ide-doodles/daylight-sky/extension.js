const STOPS = [
  [0, '#e8a5aa'], [3, '#b9edaa'], [4, '#c6ade6'], [6, '#e3d7eb'], [8, '#d6edf9'],
  [12, '#c3e4f7'], [16, '#cce5f6'], [17, '#cce5f6'],
  [17.5, '#f7d6cc'], [18, '#f5bfca'],
  [19, '#edc3dc'], [20, '#e2cdeb'], [21, '#d9cde8'], [24, '#e8a5aa']
];
function mix(a,b,t) {
  return '#' + [1,3,5].map(i => Math.round(parseInt(a.slice(i,i+2),16)*(1-t) + parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
}
function skyAt(hour) {
  hour = ((hour % 24) + 24) % 24;
  for (let i=1;i<STOPS.length;i++) {
    const [end,b]=STOPS[i], [start,a]=STOPS[i-1];
    if (hour<=end) return mix(a,b,(hour-start)/(end-start));
  }
}
function colorsAt(hour) {
  const sky=skyAt(hour), pane=mix(sky,'#ffffff',0.24), raised=mix(sky,'#ffffff',0.48);
  return {
    'editor.background':pane, 'terminal.background':pane,
    'sideBar.background':mix(sky,'#ffffff',0.13),
    'sideBarSectionHeader.background':sky,
    'activityBar.background':sky, 'panel.background':pane,
    'statusBar.background':sky, 'statusBar.noFolderBackground':sky,
    'statusBar.debuggingBackground':sky,
    'titleBar.activeBackground':sky, 'titleBar.inactiveBackground':mix(sky,'#ffffff',0.18),
    'editorGroupHeader.tabsBackground':sky,
    'tab.activeBackground':pane, 'tab.inactiveBackground':sky,
    'input.background':raised, 'dropdown.background':raised,
    'quickInput.background':raised, 'editorWidget.background':raised,
    'terminal.foreground':'#303b50', 'editor.foreground':'#303b50',
    'foreground':'#303b50', 'sideBar.foreground':'#303b50',
    'statusBar.foreground':'#303b50', 'titleBar.activeForeground':'#303b50',
    'input.foreground':'#303b50'
  };
}
function activate(context) {
  const vscode=require('vscode');
  const appearance=require('./appearance').createAppearance(vscode,context);
  let timeOverride=null,timeZone=null,enabled=true;
  const timeState=()=>{
    const now=new Date();
    let minutes=now.getHours()*60+now.getMinutes();
    if(timeZone) {
      const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
      minutes=Number(parts.find(p=>p.type==='hour').value)*60+Number(parts.find(p=>p.type==='minute').value);
    }
    return {minutes:timeOverride ?? minutes,override:timeOverride,timeZone,paused,enabled};
  };
  // Appearance now belongs to each renderer. This extension supplies only time.
  let paused=false;
  async function migrateAppearance() {
    await appearance.setDark(false);
    if(context.globalState.get("windowAppearanceMigrated",false))return;
    const config=vscode.workspace.getConfiguration("workbench");
    const current={...(config.inspect("colorCustomizations")?.globalValue || {})};
    const original=context.globalState.get("originalColors",{});
    // Only remove recognizable generated sky values, preserving custom edits.
    const sky=current["activityBar.background"];
    if(context.globalState.get("originalCaptured",false) && /^#[0-9a-f]{6}$/i.test(sky || "")) {
      const mixWhite=t=>mix(sky,"#ffffff",t);
      const generated=new Set([sky,mixWhite(.13),mixWhite(.18),mixWhite(.24),mixWhite(.48),"#303b50"]);
      for(const key of Object.keys(colorsAt(12)))if(generated.has(current[key])) {
        if(Object.prototype.hasOwnProperty.call(original,key))current[key]=original[key];else delete current[key];
      }
      await config.update("colorCustomizations",current,vscode.ConfigurationTarget.Global);
    }
    await context.globalState.update("windowAppearanceMigrated",true);
  }
  let timeQueue=migrateAppearance();
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.setDarkMode',enabled=>{
    if(typeof enabled!=='boolean')throw new Error('Invalid dark mode state');
    const update=timeQueue.then(async()=>{
      // Older renderers may still send this command; never write shared colors.
      return;
    });
    timeQueue=update.catch(()=>{});return update;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.setTimeZone',zone=>{
    if(zone!==null) {
      if(typeof zone!=='string' || !zone)throw new Error('Invalid time zone');
      new Intl.DateTimeFormat('en-US',{timeZone:zone});
    }
    const update=timeQueue.then(async()=>{
      timeZone=zone;return timeState();
    });
    timeQueue=update.catch(()=>{});return update;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.getTime',()=>timeState()));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.setTime',minutes=>{
    if(minutes!==null && (!Number.isInteger(minutes) || minutes<0 || minutes>1439))throw new Error('Invalid time of day');
    const update=timeQueue.then(async()=>{
      timeOverride=minutes;
      paused=false;
      enabled=true;
      return timeState();
    });
    timeQueue=update.catch(()=>{});
    return update;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.pause',async()=>{
    timeOverride=timeState().minutes;paused=true;
    vscode.window.showInformationMessage('Daylight Sky paused at the current colors.');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.resume',async()=>{
    timeOverride=null;
    paused=false;enabled=true;
    vscode.window.showInformationMessage(timeZone?'Daylight Sky follows '+timeZone+'.':'Daylight Sky follows your device clock.');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('daylightSky.restore',async()=>{
    paused=true;enabled=false;
    vscode.window.showInformationMessage('Original background colors restored; grass is unchanged.');
  }));
  void timeQueue.catch(error=>console.error('Daylight Sky migration:',error));
}
module.exports={activate,skyAt,colorsAt};

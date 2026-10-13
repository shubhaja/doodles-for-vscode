'use strict';
// Shared by the injected host's Daylight Sky extension and the portable extension.
const DARK_THEME='Default Dark Modern';
const DARK_COLORS={
  'editor.background':'#11182b','terminal.background':'#11182b','panel.background':'#11182b',
  'sideBar.background':'#11182b','activityBar.background':'#0c1223',
  'sideBarSectionHeader.background':'#182039','editorGroupHeader.tabsBackground':'#0c1223',
  'tab.activeBackground':'#182039','tab.inactiveBackground':'#0c1223',
  'statusBar.background':'#0c1223','statusBar.noFolderBackground':'#0c1223','statusBar.debuggingBackground':'#24213f',
  'titleBar.activeBackground':'#0c1223','titleBar.inactiveBackground':'#0c1223',
  'input.background':'#202a43','dropdown.background':'#202a43','quickInput.background':'#182039','editorWidget.background':'#182039',
  'foreground':'#e2e8f5','editor.foreground':'#e2e8f5','terminal.foreground':'#e2e8f5',
  'sideBar.foreground':'#e2e8f5','statusBar.foreground':'#e2e8f5','titleBar.activeForeground':'#e2e8f5',
  'titleBar.inactiveForeground':'#a8b5ce','input.foreground':'#e2e8f5','dropdown.foreground':'#e2e8f5',
  'tab.activeForeground':'#f3f6ff','tab.inactiveForeground':'#acb8d0','descriptionForeground':'#acb8d0',
  'editorLineNumber.foreground':'#8290ad','editorLineNumber.activeForeground':'#e2e8f5',
  'editorCursor.foreground':'#f5dcaa','terminalCursor.foreground':'#f5dcaa',
  'editor.selectionBackground':'#3d5078','editor.inactiveSelectionBackground':'#303e5c',
  'terminal.selectionBackground':'#3d5078','focusBorder':'#aebdf5',
  'list.activeSelectionBackground':'#354b75','list.activeSelectionForeground':'#ffffff',
  'list.inactiveSelectionBackground':'#283750','list.inactiveSelectionForeground':'#e2e8f5',
  'list.hoverBackground':'#25314b','list.hoverForeground':'#ffffff',
  'button.background':'#526cad','button.foreground':'#ffffff',
  'textLink.foreground':'#adc6ff','errorForeground':'#ffabb3'
};
function createAppearance(vscode,context){
  const key='doodlesDarkAppearance';
  let active=false,queue=Promise.resolve();
  async function change(enabled){
    const config=vscode.workspace.getConfiguration('workbench');
    let saved=context.globalState.get(key);
    if(enabled){
      active=true;
      if(!saved){
        saved={theme:config.inspect('colorTheme')?.globalValue,colors:config.inspect('colorCustomizations')?.globalValue || {}};
        await context.globalState.update(key,saved);
      }
      if(config.inspect('colorTheme')?.globalValue!==DARK_THEME)await config.update('colorTheme',DARK_THEME,vscode.ConfigurationTarget.Global);
      const current=config.inspect('colorCustomizations')?.globalValue || {};
      if(Object.entries(DARK_COLORS).some(([key,value])=>current[key]!==value))await config.update('colorCustomizations',{...current,...DARK_COLORS},vscode.ConfigurationTarget.Global);
    }else{
      if(!saved){active=false;return;}
      const colors={...(config.inspect('colorCustomizations')?.globalValue || {})};
      // Keep unrelated settings and edits the user made during the activity.
      for(const [name,value] of Object.entries(DARK_COLORS))if(colors[name]===value){
        if(Object.prototype.hasOwnProperty.call(saved.colors,name))colors[name]=saved.colors[name];else delete colors[name];
      }
      await config.update('colorCustomizations',colors,vscode.ConfigurationTarget.Global);
      if(config.inspect('colorTheme')?.globalValue===DARK_THEME)await config.update('colorTheme',saved.theme,vscode.ConfigurationTarget.Global);
      await context.globalState.update(key,undefined);active=false;
    }
  }
  return {
    get active(){return active;},
    setDark(enabled){const result=queue.then(()=>change(enabled));queue=result.catch(()=>{});return result;}
  };
}
if(typeof module!=='undefined' && module.exports)module.exports={createAppearance,DARK_COLORS,DARK_THEME};
else window.doodlesDarkColors=DARK_COLORS;

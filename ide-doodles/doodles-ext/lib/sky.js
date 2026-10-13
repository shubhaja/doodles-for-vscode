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

module.exports = { skyAt, colorsAt };

(function () {
  'use strict';
  const config = typeof window !== 'undefined' ? window.doodlesConfig : null;
  let latitude = Number.isFinite(config?.latitude) ? Math.max(-90, Math.min(90, config.latitude)) : 40.7479;
  let longitude = Number.isFinite(config?.longitude) ? Math.max(-180, Math.min(180, config.longitude)) : -73.9867;
  const LOCATION_KEY = 'doodles-weather-location-v1-'+latitude+','+longitude;
  let locationName = '';
  function validLocation(value) {return value && typeof value.name==='string' && value.name.trim() && Number.isFinite(value.latitude) && Math.abs(value.latitude)<=90 && Number.isFinite(value.longitude) && Math.abs(value.longitude)<=180;}
  try {
    const saved=JSON.parse(sessionStorage.getItem(LOCATION_KEY)||'null');
    if(validLocation(saved)){latitude=saved.latitude;longitude=saved.longitude;locationName=saved.name;}
  } catch(_) {}
  const weatherURL = () => 'https://api.open-meteo.com/v1/forecast?latitude='+latitude+'&longitude='+longitude+'&current=cloud_cover,weather_code,is_day,rain,showers,wind_speed_10m,wind_gusts_10m&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto';
  let API = weatherURL(), CACHE_KEY = 'doodles-weather-'+latitude+','+longitude;
  let weatherRequest=0, locationRequest=0, locationController;
  function validZone(zone) {
    if(typeof zone!=='string' || !zone)return false;
    try {new Intl.DateTimeFormat('en-US',{timeZone:zone});return true;}catch(_){return false;}
  }
  function savedZone() {
    try {const zone=sessionStorage.getItem(CACHE_KEY+'-timezone');return validZone(zone)?zone:null;}catch(_){return null;}
  }
  let timeZone=savedZone();
  function localMinutes(now=Date.now()) {
    if(!timeZone){const date=new Date(now);return date.getHours()*60+date.getMinutes();}
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
    return Number(parts.find(p=>p.type==='hour').value)*60+Number(parts.find(p=>p.type==='minute').value);
  }
  const INTERVAL = 5 * 60 * 1000, MAX_AGE = 2 * 60 * 60 * 1000;
  function parseWeather(data, now = Date.now()) {
    const cover = data?.current?.cloud_cover, time = data?.current?.time;
    if (typeof cover !== 'number' || !Number.isFinite(cover) || cover < 0 || cover > 100 || typeof time !== 'string' || !Number.isFinite(data.utc_offset_seconds)) throw new Error('Invalid cloud-cover response');
    const observed = Date.parse(time + 'Z') - data.utc_offset_seconds * 1000;
    if (!Number.isFinite(observed) || now-observed > MAX_AGE || observed-now > 30*60*1000) throw new Error('Stale weather response');
    const code=data.current.weather_code, isDay=data.current.is_day;
    if (!Number.isInteger(code) || code<0 || code>99 || (isDay!==0 && isDay!==1)) throw new Error('Invalid weather conditions');
    const {rain,showers,interval,wind_speed_10m,wind_gusts_10m}=data.current;
    // Current precipitation is accumulated over current.interval (normally 900s),
    // not over an hour. Normalize liquid rain + showers; never count snowfall.
    const rainRate=nonnegative(rain) && nonnegative(showers) && Number.isFinite(interval) && interval>0 && interval<=3600
      ? (rain+showers)*3600/interval : null;
    return { cover, code, isDay, observed, fetched: now,
      rainRate:Number.isFinite(rainRate)?rainRate:null,
      windSpeed:nonnegative(wind_speed_10m)?wind_speed_10m:null,
      windGusts:nonnegative(wind_gusts_10m)?wind_gusts_10m:null };
  }
  function nonnegative(value) {return typeof value==='number' && Number.isFinite(value) && value>=0;}
  const rainCodes=new Set([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99]);
  function isRain(value) {return !!value && rainCodes.has(value.code);}
  function isSunny(value) {return !!value && value.isDay===1 && (value.code===0 || value.code===1);}
  function rainbowTransition(previous,next) {
    return isRain(previous) && isSunny(next) && next.observed>previous.observed && next.observed-previous.observed<=MAX_AGE;
  }
  function cloudOpacity(cover, index) {
    const density = Math.max(0, Math.min(1, cover/100));
    return Math.min(1, Math.max(0, density * 12 - index)) * (0.42 + 0.23*density);
  }
  function rainAmount(value) {
    if(!isRain(value))return 0;
    // A visual tuning curve, not meteorological severity classes. Light rain
    // remains visible; 10 mm/hour and above fills the density slider to 100%.
    if(nonnegative(value.rainRate))return value.rainRate===0?0:Math.round(12+88*Math.pow(Math.min(1,value.rainRate/10),.55));
    if([55,65,67,82,95,96,99].includes(value.code))return 100;
    if([53,63,66,81].includes(value.code))return 60;
    return 25;
  }
  function rainGusts(value) {
    if(!nonnegative(value?.windSpeed) && !nonnegative(value?.windGusts))return null;
    const speed=Math.max(nonnegative(value.windSpeed)?value.windSpeed:0,nonnegative(value.windGusts)?value.windGusts:0);
    // Map the strongest reported wind to the playground's 0–100% gust dial.
    return Math.round(Math.min(100,speed/60*100));
  }
  function skyAt(hour) {
    const stops=[[0,'#e8a5aa'],[3,'#b9edaa'],[4,'#c6ade6'],[6,'#e3d7eb'],[8,'#d6edf9'],[12,'#c3e4f7'],[16,'#cce5f6'],[17,'#cce5f6'],[17.5,'#f7d6cc'],[18,'#f5bfca'],[19,'#edc3dc'],[20,'#e2cdeb'],[21,'#d9cde8'],[24,'#e8a5aa']];
    hour=((hour%24)+24)%24;
    for(let i=1;i<stops.length;i++)if(hour<=stops[i][0]) {
      const [start,a]=stops[i-1],[end,b]=stops[i],t=(hour-start)/(end-start);
      return '#'+[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-t)+parseInt(b.slice(k,k+2),16)*t).toString(16).padStart(2,'0')).join('');
    }
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports={parseWeather,cloudOpacity,rainAmount,rainGusts,skyAt,isRain,isSunny,rainbowTransition,API}; return; }
  if (document.getElementById('ktown-weather-clouds')) return;
  const style = document.createElement('style');
  style.textContent = `
    #ktown-weather-clouds {position:fixed;inset:0;z-index:990;pointer-events:none;overflow:hidden;}
    #ktown-weather-clouds .sky-cloud-field {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
    #ktown-weather-clouds .sky-rain {position:absolute;inset:0;opacity:0;transition:opacity 3s;}
    #ktown-weather-clouds[data-rain="true"] .sky-rain {opacity:1;}
    #ktown-weather-clouds .sky-rain-field {width:100%;height:100%;display:block;}
    @media (prefers-reduced-motion:reduce) {#ktown-weather-clouds .sky-rainbow,#ktown-weather-clouds .sky-rain {transition:none;}}
    #ktown-weather-clouds .sky-rainbow {position:absolute;left:0;top:6%;width:100%;height:94%;opacity:0;filter:blur(clamp(8px,1.2vw,20px));transition:opacity 8s ease;}
    #ktown-weather-clouds .sky-rainbow.visible {opacity:.14;}
    #doodles-settings label {display:flex;justify-content:space-between;margin-top:12px;}
    #doodles-settings input[type=range] {display:block;width:100%;margin:8px 0;accent-color:#648eae;cursor:pointer;}
    #doodles-settings input[type=text] {box-sizing:border-box;width:100%;padding:7px;margin:6px 0;border:1px solid #a8b7c5;border-radius:6px;background:var(--vscode-input-background,#fff);color:inherit;font:inherit;}
    #doodles-location-results button {display:block;width:100%;text-align:left;margin-top:6px;}
    #doodles-settings p {margin:8px 0;color:inherit;opacity:.8;font-size:12px;}
    #doodles-settings .doodles-weather-presets {display:flex;gap:6px;margin:10px 0;}
    #ktown-weather-clouds[data-state="preview"] .sky-rain {transition:none;}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div'); overlay.id='ktown-weather-clouds'; overlay.setAttribute('aria-hidden','true');
  overlay.dataset.source='Open-Meteo • CC BY 4.0';
  const cloudField=window.doodlesCloudField?.(overlay);
  const rain=document.createElement('div');rain.className='sky-rain';
  const rainField=window.doodlesRainField?.(rain);
  const ns='http://www.w3.org/2000/svg',rainbow=document.createElementNS(ns,'svg');
  rainbow.setAttribute('class','sky-rainbow');rainbow.setAttribute('viewBox','0 0 1000 600');
  rainbow.setAttribute('preserveAspectRatio','none');
  ['#e89597','#eeb786','#eedb9a','#a7cea6','#9bbfda','#b5a4cc'].forEach((color,i)=>{
    const arc=document.createElementNS(ns,'path'),inset=i*17;
    // Unequal shoulders soften the arch; extend below the viewport into the grass.
    arc.setAttribute('d',`M ${65+inset} 620 C ${45+inset} 350 ${180+inset} ${55+inset} 405 ${55+inset} C ${660-inset} ${35+inset} ${880-inset} 310 ${905-inset} 620`);
    arc.setAttribute('fill','none');arc.setAttribute('stroke',color);arc.setAttribute('stroke-width','19');
    rainbow.appendChild(arc);
  });
  overlay.append(rain,rainbow);
  document.body.appendChild(overlay);
  let last=null,busy=false,lastAttempt=0,rainbowTimer=null,disposed=false;
  let preview=null,previewTimer=null,liveState='unavailable';
  let manual=null,timeOverride=null;
  const timeStyle=document.createElement('style');document.head.appendChild(timeStyle);
  // xterm draws its own opaque background; CSS variables cannot recolor that canvas.
  // Set both background and readable text; leave transparency and rendering alone.
  let paneColor=null;
  const terminalColors=new Map();
  let nativeSky=null,timeRequest=0,timePending=false,timeReadPending=false;
  function releaseSky() {
    paneColor=null;timeStyle.textContent='';
    for(const [terminal,saved] of terminalColors) {
      const theme={...terminal.options.theme};
      for(const [key,value] of Object.entries(saved.last))if(theme[key]===value){
        if(key in saved.original)theme[key]=saved.original[key];else delete theme[key];
      }
      terminal.options.theme=theme;
    }
    terminalColors.clear();
  }
  async function readNativeTime() {
    if(timePending || timeReadPending)return;
    const bridge=window.doodlesSky;if(!bridge)return;
    const request=timeRequest;
    timeReadPending=true;
    try {
      let state=await bridge.getTime();
      if(disposed || request!==timeRequest)return;
      if(bridge.setTimeZone && state.timeZone!==timeZone)state=await bridge.setTimeZone(timeZone);
      if(disposed || request!==timeRequest)return;
      if(!nativeSky)nativeSky=bridge;
      timeOverride=state.override;
      if(state.enabled===false){releaseSky();return;}
      showTime(state.minutes);showStatus();
    }catch(error){console.warn('[Daylight Sky] Cannot read time:',error.message);}
    finally{timeReadPending=false;}
  }
  function syncSky() {
    if(window.doodlesSky)void readNativeTime();
    syncTerminals();
  }
  function syncTerminals() {
    if(!paneColor || document.body.classList.contains('doodles-dark'))return;
    const active=new Set();
    for(const wrapper of document.querySelectorAll('.terminal-wrapper')) {
      const terminal=wrapper.xterm;if(!terminal?.element || !terminal.options)continue;
      active.add(terminal);
      const theme=terminal.options.theme || {};
      let saved=terminalColors.get(terminal);
      if(!saved){saved={original:{...theme},last:{}};terminalColors.set(terminal,saved);}
      // Own the complete light terminal palette. Restoring a captured palette can
      // otherwise bring back Cozy's pale ANSI colors after a native theme update.
      const colors={background:paneColor,foreground:'#202b3d',cursor:'#202b3d',selectionBackground:'#879bb955',
        black:'#202b3d',red:'#a52232',green:'#286331',yellow:'#755400',blue:'#2454a4',magenta:'#793a91',cyan:'#216775',white:'#505b70',
        brightBlack:'#596579',brightRed:'#b72b3c',brightGreen:'#35743c',brightYellow:'#856200',
        brightBlue:'#345fba',brightMagenta:'#88469c',brightCyan:'#287584',brightWhite:'#202b3d'};
      for(const key of Object.keys(colors))if(theme[key]!==saved.last[key]){
        if(key in theme)saved.original[key]=theme[key];else delete saved.original[key];
      }
      if(Object.entries(colors).some(([key,value])=>theme[key]!==value))terminal.options.theme={...theme,...colors};
      saved.last=colors;
    }
    for(const terminal of terminalColors.keys())if(!active.has(terminal))terminalColors.delete(terminal);
  }
  // Reassert daylight only after the native theme and Cozy terminal overrides
  // have finished restoring, so a late native commit cannot leave pale text.
  const restorePalette=()=>showTime(Number(timeSlider.value));
  document.addEventListener('doodles-appearance-restored',restorePalette);
  const skyTimer=setInterval(syncSky,1000);
  const syncPalette=()=>showTime(Number(timeSlider.value));
  document.addEventListener('doodles-sky-change',syncPalette);
  const panel=document.createElement('div');
  window.doodlesSettings.panel.appendChild(panel);
  const status=document.createElement('p');status.setAttribute('role','status');panel.appendChild(status);
  const locationLabel=document.createElement('label');locationLabel.setAttribute('for','doodles-location');locationLabel.textContent='Weather & time location';
  const locationInput=document.createElement('input');locationInput.type='text';locationInput.id='doodles-location';locationInput.placeholder='Address or city, including country';locationInput.maxLength=240;
  locationInput.value=locationName || config?.location || '';
  const locationSearch=document.createElement('button');locationSearch.type='button';locationSearch.id='doodles-location-search';locationSearch.textContent='Find location';
  const locationStatus=document.createElement('p');locationStatus.id='doodles-location-status';locationStatus.setAttribute('role','status');
  locationStatus.textContent=locationName ? 'Using '+locationName : 'Add a city to find your address. Current weather: '+latitude+', '+longitude+'.';
  const locationResults=document.createElement('div');locationResults.id='doodles-location-results';
  const locationCredit=document.createElement('p');locationCredit.textContent='Address searches use Photon / © OpenStreetMap contributors.';
  panel.append(locationLabel,locationInput,locationSearch,locationStatus,locationResults,locationCredit);
  function clearLocations(){while(locationResults.firstChild)locationResults.firstChild.remove();}
  function selectLocation(value) {
    let saved=true;
    try{sessionStorage.setItem(LOCATION_KEY,JSON.stringify(value));}catch(_){saved=false;}
    latitude=value.latitude;longitude=value.longitude;locationName=value.name;locationInput.value=locationName;
    API=weatherURL();CACHE_KEY='doodles-weather-'+latitude+','+longitude;
    timeZone=savedZone();void setTime(null);
    // Ignore any in-flight weather response for the previous place.
    weatherRequest++;busy=false;lastAttempt=-Infinity;last=null;clearLocations();
    locationStatus.textContent='Using '+locationName+(saved?'':' (could not save; this session only)');
    restoreWeather();
  }
  async function findLocation() {
    const query=locationInput.value.trim();
    if(query.length<3){locationStatus.textContent='Enter an address or city (at least 3 characters).';return;}
    const request=++locationRequest;locationController?.abort();locationController=new AbortController();
    const controller=locationController,timeout=setTimeout(()=>controller.abort(),12000);
    clearLocations();locationStatus.textContent='Finding locations…';locationSearch.disabled=true;
    try {
      const response=await fetch('https://photon.komoot.io/api/?limit=5&q='+encodeURIComponent(query),{signal:controller.signal,credentials:'omit'});
      if(!response.ok)throw new Error('Lookup failed');
      const data=await response.json();if(disposed || request!==locationRequest)return;
      for(const feature of (Array.isArray(data.features)?data.features:[])) {
        const props=feature.properties || {},coords=feature.geometry?.coordinates || [];
        const street=[props.housenumber,props.street].filter(Boolean).join(' ');
        const name=[...new Set([street || props.name,props.city || props.town || props.village,props.state,props.country].filter(Boolean))].join(', ');
        const value={name,latitude:coords[1],longitude:coords[0]};if(!validLocation(value))continue;
        const result=document.createElement('button');result.type='button';result.textContent=name;
        result.addEventListener('click',()=>selectLocation(value));locationResults.appendChild(result);
      }
      locationStatus.textContent=locationResults.children.length?'Choose your location below.':'No matches. Try adding your city and country.';
    }catch(_){if(!disposed && request===locationRequest)locationStatus.textContent='Location search unavailable. Try again; your current weather location is unchanged.';}
    finally{clearTimeout(timeout);if(request===locationRequest)locationSearch.disabled=false;}
  }
  locationSearch.addEventListener('click',findLocation);
  locationInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void findLocation();}});
  locationInput.addEventListener('input',()=>{locationRequest++;locationController?.abort();locationSearch.disabled=false;clearLocations();});
  const sliders={};
  function slider(key,label,max,step) {
    const row=document.createElement('label');row.setAttribute('for','doodles-'+key);
    const name=document.createElement('span');name.textContent=label;
    const output=document.createElement('output');output.setAttribute('for','doodles-'+key);row.append(name,output);
    const input=document.createElement('input');input.type='range';input.id='doodles-'+key;input.min='0';input.max=String(max);input.step=String(step);
    panel.append(row,input);sliders[key]={input,output};return input;
  }
  const cloudSlider=slider('cloud','Cloud cover',100,1),rainSlider=slider('rain','Rain intensity',100,1),timeSlider=slider('time','Time of day',1439,1);
  const presets=document.createElement('div');presets.className='doodles-weather-presets';panel.appendChild(presets);
  const live=document.createElement('button');live.type='button';live.textContent='Use live weather & time';panel.appendChild(live);
  function showTime(currentMinutes) {
    const minutes=currentMinutes ?? timeOverride ?? localMinutes();
    timeSlider.value=String(minutes);
    const hour=Math.floor(minutes/60),label=`${hour%12 || 12}:${String(minutes%60).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
    sliders.time.output.textContent=label;timeSlider.setAttribute('aria-valuetext',label);
    // Disco uses the native dark appearance and its own surface palette.
    // Keep daylight ready underneath for the eventual mode exit.
    const sky=skyAt(minutes/60);
    const mix=t=>'#'+[1,3,5].map(k=>Math.round(parseInt(sky.slice(k,k+2),16)*(1-t)+255*t).toString(16).padStart(2,'0')).join('');
    const colors={editor:mix(.24),terminal:mix(.24),sideBar:mix(.13),panel:mix(.24),activityBar:sky,statusBar:sky};
    let vars=`--pasture-sky:${sky} !important;`;
    for(const [key,color] of Object.entries(colors))vars+=`--vscode-${key}-background:${color} !important;`;
    for(const key of ['titleBar-activeBackground','titleBar-inactiveBackground','editorGroupHeader-tabsBackground','tab-inactiveBackground','sideBarSectionHeader-background','statusBar-noFolderBackground','statusBar-debuggingBackground'])vars+=`--vscode-${key}:${sky} !important;`;
    for(const key of ['input','dropdown','quickInput','editorWidget'])vars+=`--vscode-${key}-background:${mix(.48)} !important;`;
    vars+=`--vscode-tab-activeBackground:${mix(.24)} !important;`;
    for(const key of ['editorGroup-emptyBackground','editorPane-background','sideBar-dropBackground'])vars+=`--vscode-${key}:${mix(.24)} !important;`;
    for(const key of ['foreground','editor-foreground','terminal-foreground','sideBar-foreground',
      'sideBarTitle-foreground','sideBarSectionHeader-foreground','activityBar-foreground',
      'statusBar-foreground','statusBar-noFolderForeground','statusBar-debuggingForeground',
      'titleBar-activeForeground','titleBar-inactiveForeground','input-foreground','dropdown-foreground',
      'tab-activeForeground','tab-inactiveForeground','tab-unfocusedActiveForeground',
      'tab-unfocusedInactiveForeground','panelTitle-activeForeground','panelTitle-inactiveForeground',
      'descriptionForeground','icon-foreground','editorCursor-foreground','terminalCursor-foreground',
      'commandCenter-foreground','commandCenter-activeForeground','commandCenter-inactiveForeground',
      'statusBarItem-remoteForeground','statusBarItem-prominentForeground',
      'breadcrumb-foreground','breadcrumb-activeSelectionForeground','breadcrumb-focusForeground',
      'input-placeholderForeground','search-placeholderForeground',
      'list-activeSelectionForeground','list-inactiveSelectionForeground','list-hoverForeground',
      'list-focusForeground','quickInput-foreground','editorWidget-foreground',
      'activityBarTop-foreground','activityBarTop-inactiveForeground',
      'menu-foreground','notificationCenterHeader-foreground','notifications-foreground',
      'editorLineNumber-activeForeground'])vars+=`--vscode-${key}:#202b3d !important;`;
    for(const key of ['textLink-foreground','textLink-activeForeground'])vars+=`--vscode-${key}:#174c91 !important;`;
    vars+=`--vscode-focusBorder:#2454a4 !important;--vscode-disabledForeground:#596579 !important;
      --vscode-editorLineNumber-foreground:#596579 !important;
      --vscode-button-foreground:#ffffff !important;--vscode-button-background:#2454a4 !important;
      --vscode-button-hoverBackground:#173e80 !important;
      --vscode-button-secondaryForeground:#202b3d !important;--vscode-button-secondaryBackground:${mix(.48)} !important;
      --vscode-menu-background:${mix(.48)} !important;--vscode-notifications-background:${mix(.48)} !important;
      --vscode-notificationCenterHeader-background:${mix(.24)} !important;`;
    vars+=`--vscode-mainWindow-background:${sky} !important;--vscode-sideBarTitle-background:${sky} !important;
      --vscode-activityBar-inactiveForeground:#596579 !important;
      --vscode-activityBar-activeBorder:#2454a4 !important;
      --vscode-activityBar-activeBackground:${mix(.32)} !important;
      --vscode-activityBarTop-activeBorder:#2454a4 !important;
      --vscode-activityBarTop-activeBackground:${mix(.32)} !important;
      --vscode-list-activeSelectionBackground:#879bb955 !important;
      --vscode-list-inactiveSelectionBackground:#879bb933 !important;
      --vscode-list-hoverBackground:#879bb922 !important;`;
    for(const key of ['window-activeBorder','window-inactiveBorder','panel-border','sideBar-border',
      'editorGroup-border','editorGroupHeader-border','titleBar-border','statusBar-border'])vars+=`--vscode-${key}:transparent !important;`;
    vars+=`--vscode-keybindingLabel-foreground:#202b3d !important;--vscode-keybindingLabel-background:${mix(.48)} !important;`;
    const scope='body:not(.doodles-dark) .monaco-workbench';
    // VS Code paints some workbench parts with inline theme colors, not variables.
    // Override those surfaces too, scoped out while Cozy owns the renderer.
    const css=`body:not(.doodles-dark),${scope} {${vars}color-scheme:light;color:#202b3d !important;background-color:${sky} !important;}
      ${scope} .monaco-grid-view,${scope} .monaco-split-view2 {background-color:${sky} !important;}
      ${scope} .part {border-color:transparent !important;box-shadow:none !important;}
      ${scope} .part.statusbar > .items-container {box-shadow:none !important;}
      /* Native workbench rules can assign literal dark-theme colors to children.
         Recolor the actual chrome labels as well as their parent and variables. */
      ${scope} .part.statusbar,
      ${scope} .part.statusbar .statusbar-item,
      ${scope} .part.statusbar .statusbar-item-label,
      ${scope} .part.statusbar .statusbar-item-label > span,
      ${scope} .part.statusbar .codicon,
      ${scope} .part.titlebar .window-title,
      ${scope} .part.titlebar .command-center,
      ${scope} .part.titlebar .command-center .action-label,
      ${scope} .part.titlebar .command-center .search-label,
      ${scope} .part.titlebar .command-center .codicon,
      ${scope} .part.titlebar .menubar-menu-title,
      ${scope} .tab .label-name,${scope} .tab .label-description,
      ${scope} .pane-header .title,${scope} .part.panel .title-label {
        color:#202b3d !important;
      }
      ${scope} .part.sidebar .viewlet-label,
      ${scope} .part.sidebar .empty-view,
      ${scope} .part.sidebar .message,
      ${scope} .part.auxiliarybar .viewlet-label,
      ${scope} .part.activitybar .action-label,
      ${scope} .part .title-actions .action-label,
      ${scope} .part.panel .composite-bar .action-label {
        color:#202b3d !important;
      }
      ${scope} .part.sidebar > .title .title-label,
      ${scope} .part.sidebar > .title .title-label h2,
      ${scope} .part.auxiliarybar > .title .title-label h2,
      ${scope} .part.activitybar .action-item.checked .action-label,
      ${scope} .part.activitybar .action-item.checked .codicon,
      ${scope} .part .composite-bar .action-item.checked .action-label,
      ${scope} .part .composite-bar .action-item.checked .codicon {
        color:#202b3d !important;opacity:1 !important;
      }
      ${scope} .part .composite-bar .action-item.checked {
        background-color:${mix(.32)} !important;
      }
      /* Native activity controls repaint literal theme colors when selected.
         Font glyphs, SVG mask fills and the selection plate are separate paint
         paths; overriding only the label's color leaves the latter two white. */
      ${scope} .activitybar .action-item .action-label,
      ${scope} .activitybar .action-item .action-label::before,
      ${scope} .activitybar .action-item:hover .action-label::before,
      ${scope} .activitybar .action-item:focus .action-label::before,
      ${scope} .activitybar .action-item.checked .action-label::before,
      ${scope} .activitybar .action-item.active .action-label::before {
        color:#202b3d !important;
      }
      ${scope} .activitybar .action-item .action-label.uri-icon,
      ${scope} .composite-bar .action-item .action-label.uri-icon {
        background-color:#202b3d !important;
      }
      ${scope} .activitybar .action-item .action-label:not(.uri-icon) {
        background-color:transparent !important;
      }
      ${scope} .activitybar .action-item:hover,
      ${scope} .activitybar .action-item:focus-within,
      ${scope} .activitybar .action-item.checked .active-item-indicator {
        background-color:${mix(.32)} !important;
      }
      ${scope} .activitybar .action-item.checked .active-item-indicator::before {
        border-left-color:#2454a4 !important;
      }
      ${scope} .part.activitybar .action-item:not(.disabled) .action-label,
      ${scope} .part .title-actions .action-item:not(.disabled) .action-label,
      ${scope} .part.panel .composite-bar .action-item:not(.disabled) .action-label {opacity:1 !important;}
      ${scope} input::placeholder,${scope} textarea::placeholder {color:#465268 !important;opacity:1 !important;}
      ${scope} .monaco-keybinding-key {color:#202b3d !important;background-color:${mix(.48)} !important;}
      ${scope} .part.sidebar,${scope} .part.auxiliarybar {background-color:${colors.sideBar} !important;color:#202b3d !important;}
      ${scope} .part.activitybar,${scope} .part.titlebar,${scope} .part.sidebar > .title,
      ${scope} .part.auxiliarybar > .title,${scope} .pane-header {background-color:${sky} !important;color:#202b3d !important;}
      ${scope} .part.editor,${scope} .part.panel,
      ${scope} .editor-group-container,${scope} .editor-container,
      ${scope} .monaco-editor,${scope} .monaco-editor .margin,${scope} .monaco-editor-background,
      ${scope} .terminal-wrapper,${scope} .terminal-xterm-host,
      ${scope} .xterm-viewport,${scope} .terminal-goal-header {
        background-color:${colors.panel} !important;color:#202b3d !important;
      }
      ${scope} .editor-group-watermark {color:#202b3d !important;}
      ${scope} .editor-group-watermark .shortcuts {opacity:1 !important;}
      ${scope} .part.statusbar,${scope} .tabs-container,${scope} .tab {
        background-color:${sky} !important;
      }
      ${scope} .tab.active {background-color:${colors.editor} !important;}
      ${scope} .monaco-list {color:#202b3d !important;}
      ${scope} .monaco-list-row.selected {background-color:var(--vscode-list-inactiveSelectionBackground) !important;color:#202b3d !important;}
      ${scope} .monaco-list:focus-within .monaco-list-row.selected {background-color:var(--vscode-list-activeSelectionBackground) !important;}
      ${scope} .terminal-goal-header {color:#202b3d !important;}`;
    // Polling discovers new terminals and clock changes, but must not invalidate
    // the entire workbench stylesheet when the visible palette is unchanged.
    if(timeStyle.textContent!==css)timeStyle.textContent=css;
    paneColor=colors.terminal;syncTerminals();
  }
  function showStatus(){status.textContent=(preview?'Weather preview':last && Date.now()-last.observed<=MAX_AGE?`Live cloud cover: ${last.cover}%${liveState==='current'?'':' (cached)'}`:'Live weather unavailable')+(timeOverride===null?(timeZone?' · '+timeZone:' · Device time (location time pending)'):' · Time preview');}
  function manualWeather() {
    clearTimeout(previewTimer);hideRainbow();preview='manual';
    manual={cover:Number(cloudSlider.value),rain:Number(rainSlider.value),code:Number(rainSlider.value)>0?63:3,isDay:1,observed:Date.now()};
    labels();draw(manual,'preview');
  }
  cloudSlider.addEventListener('input',manualWeather);rainSlider.addEventListener('input',manualWeather);
  async function setTime(minutes) {
    const request=++timeRequest;
    timeOverride=minutes;showTime();showStatus();
    const bridge=window.doodlesSky;
    if(!bridge)return;
    timePending=true;
    try {
      if(bridge.setTimeZone)await bridge.setTimeZone(timeZone);
      const state=await bridge.setTime(minutes);
      if(disposed || request!==timeRequest)return;
      nativeSky=bridge;timeOverride=state.override;showTime(state.minutes);showStatus();
    }catch(error){
      if(request===timeRequest)status.textContent='Could not update Daylight Sky. Apply doodles and reload the window.';
      console.warn('[Daylight Sky] Cannot set time:',error.message);
    }finally{if(request===timeRequest)timePending=false;}
  }
  timeSlider.addEventListener('input',()=>{void setTime(Number(timeSlider.value));});
  live.addEventListener('click',()=>{void setTime(null);restoreWeather();});
  showTime();const timeTimer=setInterval(()=>{if(!nativeSky && timeOverride===null)showTime();},60000);

  const buttons=new Map();
  const previews={sun:{cover:0,code:0,isDay:1},cloud:{cover:100,code:3,isDay:1},rain:{cover:100,code:63,isDay:1,rain:100},rainbow:{cover:15,code:1,isDay:1}};
  function labels(){
    for(const [key,button] of buttons){
      button.setAttribute('aria-pressed',String(preview===key));
      button.title=preview===key?'Return to current weather':`Preview ${key} for 90 seconds`;
      button.setAttribute('aria-label',button.title);
    }
  }
  function restoreWeather(){
    clearTimeout(previewTimer);preview=null;manual=null;hideRainbow();labels();
    const fresh=last && Date.now()-last.observed<=MAX_AGE;
    draw(fresh?last:null,fresh?liveState:'unavailable');
    refresh();
  }
  for(const [key,icon] of [['sun','☀️'],['cloud','☁️'],['rain','🌧️'],['rainbow','🌈']]){
    const button=document.createElement('button');button.type='button';button.textContent=icon;
    button.addEventListener('click',event=>{
      event.stopPropagation();
      if(preview===key){restoreWeather();return;}
      clearTimeout(previewTimer);hideRainbow();preview=key;labels();
      draw({...previews[key],observed:Date.now()},'preview');
      if(key==='rainbow')rainbow.classList.add('visible');
      previewTimer=setTimeout(restoreWeather,90000);
    });
    presets.appendChild(button);buttons.set(key,button);
  }
  labels();
  function hideRainbow(){clearTimeout(rainbowTimer);rainbow.classList.remove('visible');}
  function draw(value, state) {
    if(state!=='preview'){liveState=state;if(preview)return;}
    cloudField?.setCover(value?.cover || 0,state==='preview');
    overlay.dataset.state=state;overlay.dataset.cloudCover=value?String(value.cover):'unknown';
    overlay.dataset.updated=value?new Date(value.observed).toISOString():'';
    const amount=value?.rain ?? rainAmount(value);
    overlay.dataset.rain=String(amount>0);overlay.dataset.rainAmount=String(amount);
    document.dispatchEvent(new CustomEvent('pasture-rain-change',{detail:{amount}}));
    rainField?.setGusts?.(rainGusts(value));
    rainField?.setAmount(amount);
    cloudSlider.value=String(value?.cover || 0);rainSlider.value=String(amount);
    sliders.cloud.output.textContent=cloudSlider.value+'%';sliders.rain.output.textContent=amount+'%';
    showStatus();
    if(!isSunny(value))hideRainbow();
  }
  try {
    const cache=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
    if(cache && typeof cache.cover==='number' && cache.cover>=0 && cache.cover<=100 && Number.isFinite(cache.observed) && Date.now()-cache.observed<MAX_AGE && cache.observed<=Date.now()+30*60*1000) {last=cache;draw(last,'cached');}
  } catch(_) {}
  async function refresh() {
    if(busy || Date.now()-lastAttempt<30000)return;busy=true;lastAttempt=Date.now();
    const request=++weatherRequest;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(API,{signal:controller.signal,credentials:'omit',cache:'no-store'});
      if(!response.ok)throw new Error('Weather HTTP '+response.status);
      const data=await response.json();
      const next=parseWeather(data);
      if(disposed || request!==weatherRequest)return;
      if(last && next.observed<last.observed)return;
      if(validZone(data.timezone) && data.timezone!==timeZone) {
        timeZone=data.timezone;
        try{sessionStorage.setItem(CACHE_KEY+'-timezone',timeZone);}catch(_){}
        showTime();void readNativeTime();
      }
      if(!preview && rainbowTransition(last,next)) {
        hideRainbow();rainbow.classList.add('visible');
        rainbowTimer=setTimeout(hideRainbow,90000);
      }
      last=next;
      try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(last))}catch(_){}
      draw(last,'current');console.info('[Daylight Sky] Cloud cover: '+last.cover+'% — Open-Meteo');
    } catch(error) {
      if(disposed || request!==weatherRequest)return;
      if(last && Date.now()-last.observed<=MAX_AGE)draw(last,'cached-offline');else draw(null,'unavailable');
      console.warn('[Daylight Sky] Weather unavailable; using only fresh cached data.',error.message);
    } finally {clearTimeout(timeout);if(request===weatherRequest)busy=false;}
  }
  if(!last)draw(null,'unavailable');
  refresh();
  const timer=setInterval(refresh,INTERVAL);
  function visibleRefresh(){overlay.dataset.hidden=String(document.hidden);if(!document.hidden)refresh();}
  overlay.dataset.hidden=String(document.hidden);
  const expiryTimer=setInterval(()=>{if(last && Date.now()-last.observed>MAX_AGE)draw(null,'stale');},60000);
  window.addEventListener('online',refresh);
  window.addEventListener('focus',visibleRefresh);
  document.addEventListener('visibilitychange',visibleRefresh);
  window.addEventListener('pagehide',()=>{
    disposed=true;locationController?.abort();cloudField?.dispose();rainField?.dispose();hideRainbow();clearTimeout(previewTimer);
    panel.remove();overlay.remove();style.remove();timeStyle.remove();
    clearInterval(timer);clearInterval(expiryTimer);clearInterval(timeTimer);
    clearInterval(skyTimer);document.removeEventListener('doodles-appearance-restored',restorePalette);
    document.removeEventListener('doodles-sky-change',syncPalette);
    releaseSky();
    window.removeEventListener('online',refresh);
    window.removeEventListener('focus',visibleRefresh);
    document.removeEventListener('visibilitychange',visibleRefresh);
  },{once:true});
})();

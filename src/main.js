const { invoke } = window.__TAURI__.core;

const DEFAULT_COLORS = { claude:'#ff6b35', codex:'#4d9fff', antigravity:'#39d98a' };
const CAT_COLORS = { 'KI':'#ff6b35','Browser':'#4d9fff','Entwicklung':'#7c4dff','Office':'#39d98a','Kommunikation':'#00e5ff','Unterhaltung':'#f0a500','Gaming':'#ff4444','Produktivität':'#a0ff00','Medien':'#ff69b4','Web':'#00bcd4','Verknüpfung':'#ff8c42','Tools':'#00d4a8','Sonstige':'#b06bff' };
const SPEED_MAP  = [14, 10, 7, 4, 2];
const SPEED_DOTS = ['●○○○○','●●○○○','●●●○○','●●●●○','●●●●●'];

let ALL_PROGRAMS = [
  { id:'claude',      name:'Claude',      color:'#ff6b35', appType:'store', path:'Claude_pzs8sxrjxfjjc!Claude',    category:'KI' },
  { id:'codex',       name:'Codex',       color:'#4d9fff', appType:'store', path:'OpenAI.Codex_2p2nqsd0c76g0!App', category:'KI' },
  { id:'antigravity', name:'Antigravity', color:'#39d98a', appType:'store', path:'electron.app.Antigravity',        category:'KI' },
];

let appColors={}, bundleColors={}, hiddenCards=new Set();
let alwaysOnTop=true, autoSize=false, currentSizeId='medium', currentZoom='medium';
let bundles=[], activeBundleIdx=-1, bundleReady=false, isDirty=false;
let deletedBasePrograms=[]; // dauerhaft gelöschte Basis-Programme (claude/codex/antigravity)
let customAccents=[null,null]; // zwei speicherbare Custom-Akzent-Slots
let editingSlot=-1;
let dragSrcId=null, suppressNextClick=false;
let autostartEnabled=false, autostartDays=['Mo','Di','Mi','Do','Fr'];
let onboardingAlways=true; // Standard AN: Setup-Assistent bei jedem Start; ausschaltbar in den Einstellungen
let deleteGuardKey='ctrl'; // ctrl|shift|alt|off — Taste, die zum Löschen von Programmkarten gehalten werden muss
let editingBundleIdx=-1, layoutMode='pyramid', gridCols=4;
let orbitCount=2, orbitSizes=[90,140,200], orbitSpeeds=[3,2,1];
let scKey='O'; // Strg+Alt sind fest, nur dritte Taste frei
let lastActivePrograms=[]; // zuletzt gestartete Programme
let globalDelay=0;         // Startverzögerung Einzelprogramme (Sliderwert 0-10 → ×0.5s)
let profiles=[];           // [{name, bundle, time:'HH:MM', days:[]}]
let profileTimer=null, lastProfileFire='', countdownInt=null, pendingProfile=null;
let closeMode=false; // false=Starten, true=Schließen
let themeMode='system'; // system | dark | light
let accentColor=null;    // null = Theme-Standard, sonst Hex-Override
let languageMode=null;   // null = Auto-Erkennung (navigator.language), sonst 'de'|'en'|'es'|'hi'|'fr'

// ── Sprache ──
function setLanguage(lang){
  languageMode=lang;
  I18N.setLang(lang);
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  renderKiCards(); renderProgramList(); renderBundleList(); renderBundleQuick();
  renderProfileBundleOptions(); renderProfileList();
  updateStartBtn(); checkStartButton(); updateScPreview();
  markDirty();
}

// ── Helpers ──
// HTML-Escaping: neutralisiert nutzergesteuerte Strings (Programm-/Bundle-/Profilnamen,
// IDs) bevor sie in innerHTML/Attribute fließen. Deckt Text- und Attribut-Kontext ab.
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function getColor(id){ return appColors[id]||DEFAULT_COLORS[id]||ALL_PROGRAMS.find(p=>p.id===id)?.color||'#00e5ff'; }
function hexToRgb(hex){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; }
function markDirty(){ isDirty=true; const d=document.getElementById('saveDisk'); if(d){d.classList.add('dirty');d.classList.remove('saved');} }
function delayToMs(sliderVal){ return Math.round((sliderVal||0)*0.5*1000); } // Sliderwert → Millisekunden
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function updateGlobalDelay(val){ globalDelay=parseInt(val); document.getElementById('globalDelayVal').textContent=(globalDelay*0.5).toFixed(1)+'s'; markDirty(); }

// ── Theme (Light/Dark/System) ──
function applyTheme(){
  let effective=themeMode;
  if(themeMode==='system') effective=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  if(effective==='light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
}
function setTheme(mode){
  themeMode=mode;
  ['system','dark','light'].forEach(m=>document.getElementById('theme-'+m)?.classList.toggle('active',m===mode));
  applyTheme(); markDirty();
}
// Auf Systemwechsel reagieren, wenn "System" gewählt ist
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{ if(themeMode==='system') applyTheme(); });

// ── Akzentfarbe ──
function applyAccent(){
  if(accentColor){ document.documentElement.style.setProperty('--accent-rgb',hexToRgb(accentColor)); }
  else { document.documentElement.style.removeProperty('--accent-rgb'); } // zurück zum Theme-Default
  buildOrbitSVG(); // Ringe neu zeichnen, damit Farbe greift
}
function setAccent(val){
  if(val==='reset'){ accentColor=null; }
  else { accentColor=val; }
  applyAccent(); markDirty();
}
// ── Custom-Akzent-Slots ──
function renderAccentSlots(){
  [0,1].forEach(i=>{
    const slot=document.getElementById('accentSlot'+i); if(!slot) return;
    const c=customAccents[i];
    if(c){
      slot.className='accent-slot filled'; slot.style.background=c; slot.title=c;
      slot.innerHTML='<div class="accent-slot-x" title="Entfernen">&#10005;</div>';
      slot.querySelector('.accent-slot-x').onclick=(e)=>{ e.stopPropagation(); clearAccentSlot(i); };
      slot.onclick=()=>setAccent(c);
    } else {
      slot.className='accent-slot empty'; slot.style.background=''; slot.title='Farbe wählen'; slot.innerHTML='';
      slot.onclick=()=>openAccentSlot(i);
    }
  });
}
function openAccentSlot(i){ editingSlot=i; const inp=document.getElementById('accentSlotInput'); inp.value=customAccents[i]||'#00e5ff'; inp.click(); }
function saveAccentSlot(val){ if(editingSlot<0) return; customAccents[editingSlot]=val; renderAccentSlots(); setAccent(val); editingSlot=-1; }
function clearAccentSlot(i){ customAccents[i]=null; renderAccentSlots(); markDirty(); }

// ── SVG Orbit-System ──
function buildOrbitSVG() {
  const visible = ALL_PROGRAMS.filter(p => !hiddenCards.has(p.id));

  // Maximalen Radius berechnen (nur aktive Orbits)
  const maxR = orbitSizes[orbitCount - 1];
  // Großzügiger Puffer: Dot-Radius (6) + extra damit Orbit 3 nicht abgeschnitten wird
  const pad = 24;
  const svgSize = (maxR + pad) * 2;
  const cx = svgSize / 2;

  const svg = document.getElementById('mainSvg');
  svg.setAttribute('width',  svgSize);
  svg.setAttribute('height', svgSize);
  svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);

  // Innenkreis mittig
  const inner = document.getElementById('innerCircle');
  inner.setAttribute('cx', cx);
  inner.setAttribute('cy', cx);

  // Power-Symbol: cx horizontal, cx+14 vertikal (leicht nach unten für optische Mitte)
  document.getElementById('powerSymbol').setAttribute('transform', `translate(${cx},${cx+14})`);

  // ── Orbit-Gruppen ──
  const grp = document.getElementById('orbitGroup');
  grp.innerHTML = '';

  // Gemeinsame Animations-Keyframes einmalig definieren
  for(let s=1;s<=5;s++){
    const sec = SPEED_MAP[s-1];
    const animName = `orbitSpinS${s}`;
    let styleEl = document.getElementById('anim_s'+s);
    if(!styleEl){ styleEl = document.createElement('style'); styleEl.id='anim_s'+s; document.head.appendChild(styleEl); }
    styleEl.textContent = `@keyframes ${animName}{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
  }

  // Programme auf Orbits verteilen (max 3/5/7)
  const maxPerOrbit = [3, 5, 7];
  let remaining = [...visible];
  const orbitGroups = [];
  for(let i = 0; i < orbitCount; i++){
    const take = Math.min(maxPerOrbit[i], remaining.length);
    orbitGroups.push(remaining.splice(0, take));
  }

  orbitGroups.forEach((progs, oi) => {
    // Ring IMMER zeichnen (auch wenn leer)
    const r = orbitSizes[oi];
    const ring = document.createElementNS('http://www.w3.org/2000/svg','circle');
    ring.setAttribute('cx', cx); ring.setAttribute('cy', cx); ring.setAttribute('r', r);
    ring.setAttribute('fill','none'); ring.setAttribute('class','orbit-ring');
    ring.setAttribute('stroke-width','1.2'); ring.setAttribute('stroke-dasharray','6 5');
    grp.appendChild(ring);

    if(!progs.length) return; // Keine Dots, aber Ring ist gezeichnet

    const mySpeed = orbitSpeeds[oi];
    const speedSec = SPEED_MAP[mySpeed - 1];
    const animName = `orbitSpinS${mySpeed}`;
    // Bei gleicher Speed teilen alle Orbits dieselbe Animation → synchron
    const rotG = document.createElementNS('http://www.w3.org/2000/svg','g');
    rotG.style.cssText = `transform-origin:${cx}px ${cx}px; animation:${animName} ${speedSec}s linear infinite`;

    // Dots gleichmäßig verteilen, Start immer bei -90° (oben)
    const n = progs.length;
    progs.forEach((p, pi) => {
      const angle = (pi * (360 / n) - 90) * Math.PI / 180;
      const dx = cx + r * Math.cos(angle);
      const dy = cx + r * Math.sin(angle);
      const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('id',   'dot-'+p.id);
      dot.setAttribute('cx',   dx.toFixed(2));
      dot.setAttribute('cy',   dy.toFixed(2));
      dot.setAttribute('r',    '6');
      dot.setAttribute('fill', getColor(p.id));
      dot.setAttribute('class','orbit-dot');
      dot.setAttribute('opacity','0');
      rotG.appendChild(dot);
    });
    grp.appendChild(rotG);
  });

  updateDots();
}

// Orbit-Einstellungen
function setOrbitCount(n){
  orbitCount=n;
  [1,2,3].forEach(i=>{ const btn=document.getElementById('orb-'+i); if(btn) btn.classList.toggle('active',i===n); });
  document.getElementById('orbSizeRow1').style.display  = n>=2?'flex':'none';
  document.getElementById('orbSizeRow2').style.display  = n>=3?'flex':'none';
  document.getElementById('orbSpeedRow1').style.display = n>=2?'flex':'none';
  document.getElementById('orbSpeedRow2').style.display = n>=3?'flex':'none';
  buildOrbitSVG(); markDirty();
}
function updateOrbitSize(idx,val){
  orbitSizes[idx]=parseInt(val);
  document.getElementById('orbSizeVal'+idx).textContent=val;
  buildOrbitSVG(); markDirty();
}
function updateOrbitSpeed(idx,val){
  orbitSpeeds[idx]=parseInt(val);
  document.getElementById('orbSpeedVal'+idx).textContent=SPEED_DOTS[val-1];
  buildOrbitSVG(); markDirty();
}

// ── Layout ──
function setLayout(mode){
  layoutMode=mode;
  document.getElementById('layout-pyramid').classList.toggle('active',mode==='pyramid');
  document.getElementById('layout-grid').classList.toggle('active',mode==='grid');
  document.getElementById('gridColsSetting').style.display=mode==='grid'?'block':'none';
  renderKiCards(); markDirty();
}
function setGridCols(n){
  gridCols=n;
  [3,4,5,6,7].forEach(i=>document.getElementById('cols-'+i)?.classList.toggle('active',i===n));
  renderKiCards(); markDirty();
}

// ── Karten rendern ──
// ── Drag & Drop: Programme im Frontend umsortieren (Orbit-Position folgt Reihenfolge) ──
function onCardDragStart(e){
  dragSrcId=this.dataset.id; this.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  try{ e.dataTransfer.setData('text/plain',dragSrcId); }catch(_){}
}
function onCardDragOver(e){
  e.preventDefault(); e.dataTransfer.dropEffect='move';
  if(this.dataset.id!==dragSrcId) this.classList.add('drag-over');
}
function onCardDragLeave(){ this.classList.remove('drag-over'); }
function onCardDrop(e){
  e.preventDefault(); e.stopPropagation(); this.classList.remove('drag-over');
  const targetId=this.dataset.id;
  if(!dragSrcId||dragSrcId===targetId) return;
  const from=ALL_PROGRAMS.findIndex(p=>p.id===dragSrcId);
  const to=ALL_PROGRAMS.findIndex(p=>p.id===targetId);
  if(from<0||to<0) return;
  const [moved]=ALL_PROGRAMS.splice(from,1);
  ALL_PROGRAMS.splice(to,0,moved); // an Zielposition einfügen → rutscht auf passenden Orbit
  suppressNextClick=true;
  renderKiCards(); markDirty();
}
function onCardDragEnd(){
  document.querySelectorAll('.ki-card').forEach(c=>c.classList.remove('dragging','drag-over'));
  dragSrcId=null; setTimeout(()=>{ suppressNextClick=false; },50);
}

function renderKiCards(){
  const container=document.getElementById('kiOptions'); if(!container) return;
  [...container.querySelectorAll('.ki-card,.row-break')].forEach(el=>{
    if(el.classList.contains('row-break')||!ALL_PROGRAMS.find(p=>p.id===el.dataset?.id)) el.remove();
  });
  ALL_PROGRAMS.forEach(p=>{
    let div=document.querySelector(`.ki-card[data-id="${p.id}"]`);
    if(!div){
      div=document.createElement('div');
      div.className='ki-card'; div.dataset.id=p.id; div.onclick=()=>toggle(div);
      div.draggable=true;
      div.addEventListener('dragstart',onCardDragStart);
      div.addEventListener('dragover',onCardDragOver);
      div.addEventListener('dragleave',onCardDragLeave);
      div.addEventListener('drop',onCardDrop);
      div.addEventListener('dragend',onCardDragEnd);
      div.innerHTML=`<div class="ki-close">&#10005;</div><div class="ki-name"></div><div class="ki-check"></div>`;
      div.querySelector('.ki-name').textContent=p.name;
      div.querySelector('.ki-close').addEventListener('click',e=>removeProgram2(e,p.id));
    }
    container.appendChild(div); // verschiebt vorhandene Knoten ans Ende → DOM folgt Array-Reihenfolge
  });
  container.className='ki-options '+layoutMode;
  container.querySelectorAll('.row-break').forEach(el=>el.remove());
  if(layoutMode==='pyramid') applyPyramidLayout(container);
  else applyGridLayout(container,gridCols);
  applyCardColors();
  buildOrbitSVG();
}

function applyPyramidLayout(container){
  const rowSizes=[3,5,7];
  const cards=[...container.querySelectorAll('.ki-card:not(.hidden)')];
  let pos=0;
  rowSizes.forEach(rowMax=>{
    const inRow=Math.min(rowMax,cards.length-pos);
    if(inRow<=0) return;
    pos+=inRow;
    if(pos<cards.length){ const br=document.createElement('div'); br.className='row-break'; cards[pos-1].insertAdjacentElement('afterend',br); }
  });
}
function applyGridLayout(container,cols){
  const cards=[...container.querySelectorAll('.ki-card:not(.hidden)')];
  cards.forEach((card,i)=>{ if((i+1)%cols===0&&i<cards.length-1){ const br=document.createElement('div'); br.className='row-break'; card.insertAdjacentElement('afterend',br); } });
}
function applyCardColors(){
  ALL_PROGRAMS.forEach(p=>{ const card=document.querySelector(`.ki-card[data-id="${p.id}"]`); const color=getColor(p.id); const rgb=hexToRgb(color); if(card){card.style.setProperty('--ki-color',color);card.style.setProperty('--ki-rgb',rgb);} });
}

// ── Programme-Tab ──
function renderProgramList(){
  const list=document.getElementById('programList'); if(!list) return; list.innerHTML='';
  const byCat={};
  ALL_PROGRAMS.forEach(p=>{if(!byCat[p.category])byCat[p.category]=[];byCat[p.category].push(p);});
  Object.entries(byCat).forEach(([cat,progs])=>{
    const lbl=document.createElement('div'); lbl.className='prog-cat-label'; lbl.textContent=I18N.translateCategory(cat).toUpperCase(); list.appendChild(lbl);
    progs.forEach(p=>{
      const color=getColor(p.id);
      const el=document.createElement('div'); el.className='prog-item';
      el.innerHTML=`<div class="prog-dot" style="background:${esc(color)}"></div><div class="prog-name"></div><div class="prog-actions"><div class="prog-color-btn" style="background:${esc(color)}"></div><input type="color" class="color-input" value="${esc(color)}"/><div class="prog-del">✕</div></div>`;
      el.querySelector('.prog-name').textContent=p.name;
      const ci=el.querySelector('.color-input');
      el.querySelector('.prog-color-btn').addEventListener('click',()=>ci.click());
      ci.addEventListener('input',()=>updateProgColor(p.id,ci.value,ci));
      el.querySelector('.prog-del').addEventListener('click',()=>removeProgram(p.id));
      list.appendChild(el);
    });
  });
}
function updateProgColor(id,color,input){
  appColors[id]=color; const prog=ALL_PROGRAMS.find(p=>p.id===id); if(prog) prog.color=color;
  input.previousElementSibling.style.background=color;
  input.closest('.prog-item').querySelector('.prog-dot').style.background=color;
  applyCardColors(); buildOrbitSVG(); markDirty();
}
function removeProgram(id){
  // Basis-Programm? → dauerhaft als gelöscht merken, damit es nach Neustart nicht zurückkommt
  if(['claude','codex','antigravity'].includes(id) && !deletedBasePrograms.includes(id)){
    deletedBasePrograms.push(id);
  }
  ALL_PROGRAMS=ALL_PROGRAMS.filter(p=>p.id!==id); hiddenCards.delete(id);
  bundles.forEach(b=>{ if(Array.isArray(b.programs)) b.programs=b.programs.filter(pid=>pid!==id); });
  renderKiCards();
  if(typeof renderProgramList==='function') renderProgramList();
  if(typeof renderBundleList==='function') renderBundleList();
  if(typeof renderBundleQuick==='function') renderBundleQuick();
  markDirty();
}
/* ── Löschschutz: X-Knöpfe nur bei gehaltener Modifier-Taste aktiv ──
   Verhindert versehentliches Löschen beim schnellen Klicken. */
function applyDeleteGuard(){
  document.body.classList.toggle('del-guard', deleteGuardKey!=='off');
  if(deleteGuardKey==='off') document.body.classList.remove('del-armed');
  document.querySelectorAll('#delGuardPick button').forEach(b=>b.classList.toggle('active', b.dataset.k===deleteGuardKey));
}
function setDeleteGuard(k){ deleteGuardKey=k; applyDeleteGuard(); markDirty(); }
// Ist die hinterlegte Taste in diesem Event gedrückt?
function guardHeld(e){
  return deleteGuardKey==='ctrl' ? e.ctrlKey
       : deleteGuardKey==='shift'? e.shiftKey
       : deleteGuardKey==='alt'  ? e.altKey : false;
}
function updateArmed(e){
  if(deleteGuardKey==='off'){ document.body.classList.remove('del-armed'); return; }
  document.body.classList.toggle('del-armed', guardHeld(e));
}
window.addEventListener('keydown',updateArmed);
window.addEventListener('keyup',updateArmed);
// Fenster verlassen → Schutz wieder scharf (sonst bliebe er "entsperrt" hängen)
window.addEventListener('blur',()=>document.body.classList.remove('del-armed'));
document.addEventListener('click',e=>{
  const b=e.target.closest('#delGuardPick button'); if(b) setDeleteGuard(b.dataset.k);
});

// Frontend-Karten-x: stoppt Event-Bubbling, dann echtes Löschen
function removeProgram2(event,id){
  event.stopPropagation();
  // Sicherheitsnetz zusätzlich zum CSS: ohne gehaltene Taste wird nicht gelöscht.
  if(deleteGuardKey!=='off' && !guardHeld(event)) return;
  removeProgram(id);
}
async function rescanPrograms(){
  const btn=document.querySelector('.btn-rescan'); if(btn) btn.textContent=I18N.t('programs.rescanning');
  try{
    const found=await invoke('detect_installed_apps');
    const neu=found.filter(app=>!ALL_PROGRAMS.find(p=>p.id===app.id));
    if(btn) btn.textContent=I18N.t('programs.rescan');
    if(!neu.length){ if(btn){ btn.textContent=I18N.t('programs.rescanNone'); setTimeout(()=>{btn.textContent=I18N.t('programs.rescan');},2500); } return; }
    openAppPicker(neu);
  }catch(e){ if(btn){ btn.textContent=I18N.t('programs.rescanError'); setTimeout(()=>{btn.textContent=I18N.t('programs.rescan');},2000); } }
}

// Auswahl-Dialog: zeigt gefundene Apps mit Häkchen; nur Angehakte werden übernommen.
// (Namen via textContent gesetzt → kein HTML-Injection-Risiko.)
function openAppPicker(list){
  const ov=document.createElement('div'); ov.className='app-picker-overlay';
  const panel=document.createElement('div'); panel.className='app-picker';
  const head=document.createElement('div'); head.className='app-picker-head';
  const headTitle=document.createElement('span'); headTitle.textContent=I18N.t('picker.title');
  const headClose=document.createElement('span'); headClose.className='app-picker-close'; headClose.title=I18N.t('common.close'); headClose.innerHTML='&#10005;';
  head.append(headTitle,headClose);
  const sub=document.createElement('div'); sub.className='app-picker-sub';
  sub.textContent=I18N.t('picker.subtitle',{count:list.length});
  const items=document.createElement('div'); items.className='app-picker-list';
  // Nach Kategorie gruppieren (feste Reihenfolge; Unbekanntes ans Ende).
  const order=['KI','Entwicklung','Browser','Kommunikation','Unterhaltung','Produktivität','Tools','Sonstige'];
  const groups={};
  list.forEach((app,idx)=>{ const c=app.category||'Sonstige'; (groups[c]||(groups[c]=[])).push({app,idx}); });
  Object.keys(groups).sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);}).forEach(cat=>{
    const h=document.createElement('div'); h.className='app-picker-cat-head'; h.textContent=I18N.translateCategory(cat);
    items.appendChild(h);
    groups[cat].forEach(({app,idx})=>{
      const row=document.createElement('label'); row.className='app-picker-item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.dataset.idx=idx;
      const nm=document.createElement('span'); nm.className='app-picker-name'; nm.textContent=app.name;
      row.append(cb,nm); items.appendChild(row);
    });
  });
  const actions=document.createElement('div'); actions.className='app-picker-actions';
  const selAll=document.createElement('button'); selAll.className='app-picker-selall'; selAll.textContent=I18N.t('picker.selectAll');
  const addBtn=document.createElement('button'); addBtn.className='app-picker-add'; addBtn.textContent=I18N.t('picker.add');
  actions.append(selAll,addBtn);
  panel.append(head,sub,items,actions); ov.appendChild(panel); document.body.appendChild(ov);

  const close=()=>ov.remove();
  head.querySelector('.app-picker-close').onclick=close;
  ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
  selAll.onclick=()=>{ const boxes=items.querySelectorAll('input'); const allOn=[...boxes].every(b=>b.checked); boxes.forEach(b=>b.checked=!allOn); selAll.textContent=allOn?I18N.t('picker.selectAll'):I18N.t('picker.selectNone'); };
  addBtn.onclick=()=>{
    let added=0;
    items.querySelectorAll('input:checked').forEach(cb=>{
      const app=list[+cb.dataset.idx];
      if(app && !ALL_PROGRAMS.find(p=>p.id===app.id)){
        ALL_PROGRAMS.push({id:app.id,name:app.name,color:CAT_COLORS[app.category]||'#00e5ff',appType:app.app_type,path:app.path,category:app.category});
        deletedBasePrograms=deletedBasePrograms.filter(d=>d!==app.id); added++;
      }
    });
    if(added){ renderKiCards(); renderProgramList(); markDirty(); }
    close();
  };
}
async function pickExeFile(){ try{ const {open}=window.__TAURI__.dialog; const sel=await open({multiple:false,filters:[{name:'Programme & Verknüpfungen',extensions:['exe','lnk','url']}]}); if(sel) document.getElementById('newProgPath').value=sel; }catch(e){console.error(e);} }
function addProgramManually(){
  const name=document.getElementById('newProgName').value.trim();
  let path=document.getElementById('newProgPath').value.trim();
  if(!name||!path) return;
  const id=name.toLowerCase().replace(/\s+/g,'_')+'_'+Date.now();
  let appType, category;
  if(/^[a-z][a-z0-9+.-]*:\/\//i.test(path)){
    appType='url'; category=/^https?:\/\//i.test(path)?'Web':'Verknüpfung';
  } else if(path.includes('\\')||path.includes('/')){
    appType='exe'; category='Eigene'; // .exe, .lnk, .url-Pfade
  } else if(/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(path)){
    path='https://'+path; appType='url'; category='Web';
  } else {
    appType='store'; category='Eigene';
  }
  ALL_PROGRAMS.push({id,name,color:'#00e5ff',appType,path,category});
  appColors[id]='#00e5ff';
  document.getElementById('newProgName').value=''; document.getElementById('newProgPath').value='';
  renderKiCards(); renderProgramList(); markDirty();
}

// ── Bundles ──
function renderBundleList(){
  refreshTrayMenu();   // Tray-Menü spiegelt die Bundles (Anlegen/Löschen/Sprachwechsel)
  const list=document.getElementById('bundleList'); if(!list) return; list.innerHTML='';
  if(!bundles.length){list.innerHTML=`<div style="font-size:10px;color:rgba(var(--ui-text-rgb),0.4);text-align:center;padding:6px;letter-spacing:1px">${I18N.t('bundles.none')}</div>`;return;}
  bundles.forEach((b,i)=>{
    const el=document.createElement('div'); el.className='bundle-item'+(activeBundleIdx===i?' active':'');
    el.innerHTML=`<div class="bundle-item-info" onclick="selectBundle(${i})"><div class="bundle-item-name">${esc(b.name.toUpperCase())}</div><div class="bundle-item-apps">${esc(b.programs.map(id=>ALL_PROGRAMS.find(p=>p.id===id)?.name||id).join(' · '))}</div></div><div class="bundle-item-btns"><div class="bundle-edit-btn" onclick="openBundleEditor(${i})">&#9998;</div><div class="bundle-item-del" onclick="deleteBundle(event,${i})">✕</div></div>`;
    list.appendChild(el);
  });
  renderBundleColorList();
}
function renderBundleColorList(){
  const list=document.getElementById('bundleColorList'); if(!list) return; list.innerHTML='';
  if(!bundles.length){list.innerHTML=`<div style="font-size:10px;color:rgba(var(--ui-text-rgb),0.4)">${I18N.t('bundles.createFirst')}</div>`;return;}
  bundles.forEach((b,i)=>{
    const color=bundleColors[b.name]||'#00e5ff';
    const el=document.createElement('div'); el.className='color-editor-item';
    el.innerHTML=`<div class="color-editor-name"></div><div class="color-editor-right"><div class="color-preview" style="background:${esc(color)}"></div><input class="color-input" type="color" value="${esc(color)}"/></div>`;
    el.querySelector('.color-editor-name').textContent=b.name;
    const ci=el.querySelector('.color-input'), prev=el.querySelector('.color-preview');
    prev.addEventListener('click',()=>ci.click());
    ci.addEventListener('input',()=>{ prev.style.background=ci.value; updateBundleColor(b.name,ci.value,i); });
    list.appendChild(el);
  });
}
function updateBundleColor(name,color,idx){ bundleColors[name]=color; const prev=document.querySelector(`#bci-${idx}`); if(prev) prev.previousElementSibling.style.background=color; renderBundleQuick(); markDirty(); }
function renderBundleQuick(){
  const q=document.getElementById('bundleQuick'); if(!q) return; q.innerHTML='';
  bundles.forEach((b,i)=>{ const color=bundleColors[b.name]||'#00e5ff'; const rgb=hexToRgb(color); const btn=document.createElement('button'); btn.className='bundle-quick-btn'+(activeBundleIdx===i?' active':''); btn.textContent=b.name; btn.style.setProperty('--bc',color); btn.style.setProperty('--bc-rgb',rgb); btn.style.borderColor=activeBundleIdx===i?color:`rgba(${rgb},0.4)`; if(activeBundleIdx===i) btn.style.background=`rgba(${rgb},0.08)`; btn.onclick=()=>selectBundle(i); q.appendChild(btn); });
}
function openBundleEditor(idx){
  editingBundleIdx=idx; const b=bundles[idx]; const editor=document.getElementById('bundleEditor');
  document.getElementById('bundleEditorTitle').textContent=b.name.toUpperCase();
  const color=bundleColors[b.name]||'#00e5ff'; document.getElementById('bundleColorPreview').style.background=color; document.getElementById('bundleColorInput').value=color;
  const progList=document.getElementById('bundleProgList'); progList.innerHTML='';
  ALL_PROGRAMS.forEach(p=>{ const inBundle=b.programs.includes(p.id); const el=document.createElement('div'); el.className='bundle-prog-item'+(inBundle?' selected':''); el.dataset.id=p.id; el.innerHTML=`<div class="bundle-prog-dot" style="background:${esc(getColor(p.id))}"></div>`; el.append(p.name); el.onclick=()=>el.classList.toggle('selected'); progList.appendChild(el); });
  const ed=document.getElementById('bundleEditDelay'); if(ed){ ed.value=b.delay||0; document.getElementById('bundleEditDelayVal').textContent=((b.delay||0)*0.5).toFixed(1)+'s'; }
  editor.style.display='flex';
}
function updateEditingBundleColor(color){ document.getElementById('bundleColorPreview').style.background=color; if(editingBundleIdx>=0) bundleColors[bundles[editingBundleIdx].name]=color; renderBundleQuick(); }
function saveBundleEdits(){ if(editingBundleIdx<0) return; bundles[editingBundleIdx].programs=[...document.querySelectorAll('#bundleProgList .bundle-prog-item.selected')].map(el=>el.dataset.id); bundles[editingBundleIdx].delay=parseInt(document.getElementById('bundleEditDelay').value)||0; closeBundleEditor(); renderBundleList(); renderBundleQuick(); markDirty(); }
function closeBundleEditor(){ editingBundleIdx=-1; document.getElementById('bundleEditor').style.display='none'; }
function selectBundle(idx){
  if(activeBundleIdx===idx){deactivateBundle();return;} activeBundleIdx=idx; bundleReady=false;
  const b=bundles[idx];
  ALL_PROGRAMS.forEach(p=>{ const card=document.querySelector(`.ki-card[data-id="${p.id}"]`); if(!card) return; if(b.programs.includes(p.id)){card.classList.remove('hidden');card.classList.add('selected');}else card.classList.remove('selected'); });
  renderBundleList(); renderBundleQuick(); updateDots(); updateStartBtn(); document.getElementById('btnStart').disabled=false;
}
function deactivateBundle(){
  activeBundleIdx=-1; bundleReady=false;
  ALL_PROGRAMS.forEach(p=>{ const card=document.querySelector(`.ki-card[data-id="${p.id}"]`); if(!card) return; if(hiddenCards.has(p.id)) card.classList.add('hidden'); else card.classList.remove('hidden'); });
  renderBundleList(); renderBundleQuick(); updateStartBtn(); checkStartButton();
}
function deleteBundle(event,idx){ event.stopPropagation(); bundles.splice(idx,1); if(activeBundleIdx===idx) deactivateBundle(); else if(activeBundleIdx>idx) activeBundleIdx--; renderBundleList(); renderBundleQuick(); markDirty(); }
let bundleOrder=[];
function showBundleCreator(){ bundleOrder=[]; document.getElementById('bundleNameInput').value=''; const d=document.getElementById('bundleCreateDelay'); if(d){ d.value=0; document.getElementById('bundleCreateDelayVal').textContent='0.0s'; } renderBundleProgSelect(); }
function renderBundleProgSelect(){ const c=document.getElementById('bundleProgramSelect'); if(!c) return; c.innerHTML=''; ALL_PROGRAMS.forEach(p=>{ const el=document.createElement('div'); el.className='bundle-prog-item'; el.dataset.id=p.id; el.innerHTML=`<div class="bundle-prog-dot" style="background:${esc(getColor(p.id))}"></div><span></span><div class="bundle-order-num"></div>`; el.querySelector('span').textContent=p.name; el.onclick=()=>toggleBundleProgram(el,p.id); c.appendChild(el); }); }
function toggleBundleProgram(el,id){ if(el.classList.contains('selected')){el.classList.remove('selected');bundleOrder=bundleOrder.filter(x=>x!==id);}else{el.classList.add('selected');bundleOrder.push(id);} document.querySelectorAll('#bundleProgramSelect .bundle-prog-item').forEach(item=>{ const num=item.querySelector('.bundle-order-num'); if(!num) return; const idx=bundleOrder.indexOf(item.dataset.id); num.textContent=idx>=0?idx+1:''; }); }
function saveBundle(){ const name=document.getElementById('bundleNameInput').value.trim(); if(!name||!bundleOrder.length) return; const delay=parseInt(document.getElementById('bundleCreateDelay').value)||0; bundles.push({name,programs:[...bundleOrder],delay}); bundleOrder=[]; document.getElementById('bundleNameInput').value=''; const d=document.getElementById('bundleCreateDelay'); if(d){ d.value=0; document.getElementById('bundleCreateDelayVal').textContent='0.0s'; } renderBundleProgSelect(); renderBundleList(); renderBundleQuick(); renderProfileBundleOptions(); markDirty(); }

// ── Profile (Auto-Switch) ──
function renderProfileBundleOptions(){
  const sel=document.getElementById('profileBundleSelect'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='';
  if(!bundles.length){ const o=document.createElement('option'); o.value=''; o.textContent=I18N.t('bundles.createFirst'); sel.appendChild(o); return; }
  bundles.forEach(b=>{ const o=document.createElement('option'); o.value=b.name; o.textContent=b.name; sel.appendChild(o); });
  if(cur) sel.value=cur;
}
function renderProfileList(){
  const list=document.getElementById('profileList'); if(!list) return; list.innerHTML='';
  if(!profiles.length){ list.innerHTML=`<div style="font-size:10px;color:rgba(var(--ui-text-rgb),0.4);text-align:center;padding:6px;letter-spacing:1px">${I18N.t('profiles.none')}</div>`; return; }
  profiles.forEach((p,i)=>{
    const exists=bundles.some(b=>b.name===p.bundle);
    const el=document.createElement('div'); el.className='bundle-item';
    const days=(p.days&&p.days.length)?p.days.map(d=>I18N.t('day.'+d.toLowerCase())).join('·'):I18N.t('profiles.daily');
    el.innerHTML=`<div class="bundle-item-info"><div class="bundle-item-name">${esc(p.name.toUpperCase())} · ${esc(p.time)}</div><div class="bundle-item-apps">${exists?esc(p.bundle):'<span style="color:#ff6666">'+esc(I18N.t('profiles.bundleMissing'))+'</span>'} · ${days}</div></div><div class="bundle-item-btns"><div class="bundle-item-del" onclick="deleteProfile(${i})">✕</div></div>`;
    list.appendChild(el);
  });
}
function saveProfile(){
  const name=document.getElementById('profileNameInput').value.trim();
  const bundle=document.getElementById('profileBundleSelect').value;
  const time=document.getElementById('profileTimeInput').value;
  if(!name||!bundle||!time) return;
  const days=[...document.querySelectorAll('#profileDays .day-btn.active')].map(b=>b.dataset.day);
  profiles.push({name,bundle,time,days});
  document.getElementById('profileNameInput').value='';
  document.querySelectorAll('#profileDays .day-btn').forEach(b=>b.classList.remove('active'));
  renderProfileList(); markDirty();
}
function deleteProfile(i){ profiles.splice(i,1); renderProfileList(); markDirty(); }

// Auto-Switch: jede Minute prüfen, ob ein Profil fällig ist
function startProfileWatcher(){
  if(profileTimer) clearInterval(profileTimer);
  profileTimer=setInterval(checkProfiles,15000); // alle 15s (deckt Minutenwechsel sicher ab)
  checkProfiles();
}
function checkProfiles(){
  if(pendingProfile) return; // läuft schon ein Countdown
  const now=new Date();
  const hhmm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const dayMap=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const today=dayMap[now.getDay()];
  const stamp=now.toDateString()+' '+hhmm;
  for(const p of profiles){
    if(p.time!==hhmm) continue;
    if(p.days&&p.days.length&&!p.days.includes(today)) continue;
    if(lastProfileFire===stamp+p.name) continue; // in dieser Minute schon ausgelöst
    if(!bundles.some(b=>b.name===p.bundle)) continue;
    lastProfileFire=stamp+p.name;
    triggerProfileCountdown(p);
    break;
  }
}
function triggerProfileCountdown(profile){
  pendingProfile=profile;
  const ov=document.getElementById('profileCountdown');
  document.getElementById('pcName').textContent=profile.name+' → '+profile.bundle;
  let sec=10; document.getElementById('pcSeconds').textContent=sec;
  ov.classList.add('active');
  countdownInt=setInterval(()=>{
    sec--; document.getElementById('pcSeconds').textContent=sec;
    if(sec<=0) confirmProfileSwitch();
  },1000);
}
function cancelProfileSwitch(){
  if(countdownInt) clearInterval(countdownInt);
  document.getElementById('profileCountdown').classList.remove('active');
  pendingProfile=null;
}
function confirmProfileSwitch(){
  if(countdownInt) clearInterval(countdownInt);
  document.getElementById('profileCountdown').classList.remove('active');
  const profile=pendingProfile; pendingProfile=null;
  if(!profile) return;
  const idx=bundles.findIndex(b=>b.name===profile.bundle);
  if(idx<0) return;
  // Fenster zeigen, Bundle aktivieren, starten
  selectBundle(idx); bundleReady=true;
  startSequence();
}

// ── Menü ──
function toggleMenu(){ document.getElementById('sidemenu').classList.toggle('open'); document.getElementById('overlay').classList.toggle('active'); }
function switchTab(name){ document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active')); document.getElementById('tab-'+name).classList.add('active'); document.getElementById('content-'+name).classList.add('active'); if(name==='programs') renderProgramList(); if(name==='bundles'){renderBundleList();renderBundleProgSelect();} if(name==='profiles'){renderProfileBundleOptions();renderProfileList();} }

// ── Fenster ──
function setActiveSizeBtn(id){ document.querySelectorAll('.size-btn[id^="szbtn-"]').forEach(b=>b.classList.remove('active')); const btn=document.getElementById('szbtn-'+id); if(btn) btn.classList.add('active'); }
async function setSize(w,h,id){ currentSizeId=id; setActiveSizeBtn(id); markDirty(); try{ if(id==='fullscreen') await invoke('set_fullscreen',{value:true}); else{await invoke('set_fullscreen',{value:false});await invoke('set_window_size',{width:w,height:h});} }catch(e){} }
async function toggleAutoSize(){ autoSize=!autoSize; markDirty(); document.getElementById('toggle-autosize').classList.toggle('active',autoSize); if(autoSize) try{await invoke('set_window_size',{width:Math.round(screen.width*0.65),height:Math.round(screen.height*0.75)});}catch(e){} }
function applyZoom(zoom){ const wrap=document.getElementById('zoomWrap'); wrap.classList.remove('zoom-small','zoom-medium','zoom-large'); wrap.classList.add('zoom-'+zoom); document.querySelectorAll('.size-btn[id^="zoom-"]').forEach(b=>b.classList.remove('active')); const btn=document.getElementById('zoom-'+zoom); if(btn) btn.classList.add('active'); }
function setZoom(zoom){ currentZoom=zoom; applyZoom(zoom); markDirty(); }
async function toggleAlwaysOnTop(){ alwaysOnTop=!alwaysOnTop; markDirty(); document.getElementById('toggle-ontop').classList.toggle('active',alwaysOnTop); try{await invoke('set_always_on_top',{value:alwaysOnTop});}catch(e){} }
function toggleAutostart(){ autostartEnabled=!autostartEnabled; markDirty(); document.getElementById('toggle-autostart').classList.toggle('active',autostartEnabled); }
// Setup-Assistent (Programmsuche) bei jedem Start zeigen statt nur beim ersten.
// Praktisch zum Testen — und für alle, die die Suche regelmäßig sehen wollen.
function toggleOnboardingAlways(){ onboardingAlways=!onboardingAlways; markDirty(); document.getElementById('toggle-onboarding')?.classList.toggle('active',onboardingAlways); }
function toggleDay(btn){ const day=btn.dataset.day; btn.classList.toggle('active'); if(btn.classList.contains('active')){if(!autostartDays.includes(day)) autostartDays.push(day);}else autostartDays=autostartDays.filter(d=>d!==day); markDirty(); }

// ── Karten ──
function checkStartButton(){ const sel=document.querySelectorAll('.ki-card.selected:not(.hidden)').length===0&&activeBundleIdx<0; document.getElementById('btnStart').disabled=closeMode?false:sel; }
function updateDots(){ ALL_PROGRAMS.forEach(p=>{ const card=document.querySelector(`.ki-card[data-id="${p.id}"]`); const dot=document.getElementById('dot-'+p.id); if(!dot) return; dot.setAttribute('opacity',(!hiddenCards.has(p.id)&&card&&card.classList.contains('selected'))?'1':'0'); }); }
function toggle(card){ if(suppressNextClick){ suppressNextClick=false; return; } if(hiddenCards.has(card.dataset.id)) return; if(activeBundleIdx>=0) deactivateBundle(); card.classList.toggle('selected'); checkStartButton(); updateDots(); updateStartBtn(); }

// ── Start-Button ──
function updateStartBtn(){
  const btn=document.getElementById('btnStart');
  if(closeMode){
    // Im Schließen-Modus: Button schließt die Auswahl
    if(activeBundleIdx>=0){const b=bundles[activeBundleIdx];btn.innerHTML=`&#9632; ${esc(b.name.toUpperCase())} ${esc(I18N.t('mode.close').replace('■ ','').toUpperCase())}`;}
    else btn.innerHTML=I18N.t('btn.closeAllSelected');
    btn.classList.remove('ready-state');
    return;
  }
  if(activeBundleIdx>=0){const b=bundles[activeBundleIdx];btn.innerHTML=bundleReady?`&#9654; ${esc(b.name.toUpperCase())}`:`&#9646;&#9646; ${esc(b.name.toUpperCase())}`;btn.classList.add('ready-state');}else{btn.innerHTML=I18N.t('btn.startAll');btn.classList.remove('ready-state');bundleReady=false;}
}
function handleStartBtn(){
  if(closeMode){ closeSelected(); return; }
  if(activeBundleIdx>=0&&!bundleReady){bundleReady=true;updateStartBtn();return;} startSequence();
}

// ── Start/Schließen-Modus ──
function setMode(mode){
  closeMode=(mode==='close');
  document.getElementById('mode-start').classList.toggle('active',!closeMode);
  document.getElementById('mode-close').classList.toggle('active',closeMode);
  document.getElementById('zoomWrap')?.classList.toggle('close-mode',closeMode);
  document.getElementById('headline').textContent=closeMode?I18N.t('headline.close'):I18N.t('headline.start');
  document.getElementById('sysLabel').textContent=closeMode?I18N.t('sys.shutdown'):I18N.t('sys.initialize');
  // "Alles schließen" nur im Schließen-Modus zeigen
  document.getElementById('btnCloseAll').classList.toggle('visible',closeMode);
  updateStartBtn(); checkStartButton();
}
async function closeApps(ids){
  if(!ids.length) return;
  const failed=[];
  for(const id of ids){
    const prog=ALL_PROGRAMS.find(p=>p.id===id);
    try{ await invoke('close_app',{appId:id,appType:prog?.appType||'store',path:prog?.path||id}); }
    catch(e){ failed.push(prog?.name||id); console.error('close_app',id,e); }
  }
  // Kurzes visuelles Feedback am Button
  const btn=document.getElementById('btnStart');
  const orig=btn.innerHTML;
  btn.innerHTML=failed.length?I18N.t('close.failedCount',{n:failed.length}):I18N.t('close.closed');
  setTimeout(()=>{ updateStartBtn(); },2000);
}
function closeSelected(){
  const ids=activeBundleIdx>=0?bundles[activeBundleIdx].programs:[...document.querySelectorAll('.ki-card.selected:not(.hidden)')].map(c=>c.dataset.id);
  if(!ids.length) return;
  closeApps(ids);
}
function closeAll(){
  const ids=ALL_PROGRAMS.filter(p=>!hiddenCards.has(p.id)).map(p=>p.id);
  const btn=document.getElementById('btnCloseAll');
  const orig=btn.innerHTML;
  btn.innerHTML=I18N.t('btn.closingAll');
  closeApps(ids);
  setTimeout(()=>{ btn.innerHTML=orig; },2000);
}

// ── Shortcut (Strg+Alt fest, dritte Taste frei) ──
function updateScPreview(){
  const preview=document.getElementById('scPreview');
  if(preview) preview.textContent=I18N.t('shortcut.ctrl')+'+'+I18N.t('shortcut.alt')+'+'+(scKey||'O');
}
async function applyShortcut(){
  scKey=(document.getElementById('scKey').value||scKey||'O').trim();
  updateScPreview(); markDirty();
  try{ await invoke('set_shortcut',{ctrl:true,shift:false,alt:true,key:scKey}); }catch(e){ console.error('Shortcut:',e); }
}
// ── Shortcut Capture (dritte Taste belegen) ──
let capturing=false;
function startCapture(){
  const btn=document.getElementById('scCaptureBtn');
  if(capturing){ stopCapture(); return; }
  capturing=true; btn.textContent=I18N.t('capture.pressKey'); btn.classList.add('active');
  window.addEventListener('keydown',captureKey,true);
}
function stopCapture(){
  capturing=false; const btn=document.getElementById('scCaptureBtn');
  if(btn){ btn.textContent=I18N.t('shortcut.assign'); btn.classList.remove('active'); }
  window.removeEventListener('keydown',captureKey,true);
}
function captureKey(e){
  if(!capturing) return;
  e.preventDefault(); e.stopPropagation();
  if(e.key==='Escape'){ stopCapture(); return; }
  if(['Control','Shift','Alt','Meta'].includes(e.key)) return; // auf die dritte Taste warten
  let key=null;
  if(e.code.startsWith('Key')) key=e.code.slice(3);            // Buchstabe A–Z
  else if(/^Digit[1-9]$/.test(e.code)) key=e.code.slice(5);    // Zahl 1–9 (0 ausgeschlossen)
  else if(/^Numpad[1-9]$/.test(e.code)) key=e.code.slice(6);   // Numpad 1–9
  if(!key){ const b=document.getElementById('scCaptureBtn'); if(b) b.textContent=I18N.t('capture.onlyAZ09'); setTimeout(()=>{ if(b&&capturing) b.textContent=I18N.t('capture.pressKey'); },1200); return; }
  scKey=key;
  document.getElementById('scKey').value=scKey;
  updateScPreview(); stopCapture(); applyShortcut();
}

// ── Speichern / Laden ──
async function saveAll(){
  const customProgs=ALL_PROGRAMS.filter(p=>!['claude','codex','antigravity'].includes(p.id));
  const s={alwaysOnTop,autoSize,sizeId:currentSizeId,zoom:currentZoom,hiddenCards:[...hiddenCards],bundles,appColors,bundleColors,autostartEnabled,autostartDays,customPrograms:customProgs,onboardingDone:true,onboardingAlways,deleteGuardKey,layoutMode,gridCols,orbitCount,orbitSizes,orbitSpeeds,scKey,lastActivePrograms,globalDelay,profiles,themeMode,accentColor,customAccents,deletedBasePrograms,programOrder:ALL_PROGRAMS.map(p=>p.id),languageMode};
  try{
    await invoke('save_settings',{settings:JSON.stringify(s)});
    try{await invoke('set_autostart',{enable:autostartEnabled,days:autostartDays});}catch(e){}
    isDirty=false;
    const disk=document.getElementById('saveDisk'); disk.classList.remove('dirty'); disk.classList.add('saved');
    setTimeout(()=>disk.classList.remove('saved'),2500);
    document.querySelectorAll('.btn-save').forEach(btn=>{const orig=btn.textContent;btn.textContent=I18N.t('saved.label');btn.style.borderColor='#39d98a';btn.style.color='#39d98a';setTimeout(()=>{btn.textContent=orig;btn.style.borderColor='';btn.style.color='';},2000);});
  }catch(e){console.error(e);}
}
async function loadSettings(){
  try{
    const json=await invoke('load_settings'); const s=JSON.parse(json);
    // Dauerhaft gelöschte Basis-Programme entfernen (bevor irgendwas gerendert wird)
    if(s.deletedBasePrograms&&Array.isArray(s.deletedBasePrograms)){
      deletedBasePrograms=[...s.deletedBasePrograms];
      ALL_PROGRAMS=ALL_PROGRAMS.filter(p=>!deletedBasePrograms.includes(p.id));
    }
    if(s.onboardingPrograms) s.onboardingPrograms.forEach(p=>{if(!ALL_PROGRAMS.find(x=>x.id===p.id)) ALL_PROGRAMS.push({id:p.id,name:p.name,color:CAT_COLORS[p.category]||'#00e5ff',appType:p.app_type,path:p.path,category:p.category||'KI'});});
    if(s.customPrograms) s.customPrograms.forEach(p=>{if(!ALL_PROGRAMS.find(x=>x.id===p.id)) ALL_PROGRAMS.push(p);});
    if(s.programOrder&&Array.isArray(s.programOrder)){
      const rank=new Map(s.programOrder.map((id,i)=>[id,i]));
      ALL_PROGRAMS.sort((a,b)=>(rank.has(a.id)?rank.get(a.id):1e9)-(rank.has(b.id)?rank.get(b.id):1e9));
    }
    if(s.appColors){appColors={...s.appColors};ALL_PROGRAMS.forEach(p=>{if(appColors[p.id]) p.color=appColors[p.id];});}
    if(s.bundleColors) bundleColors=s.bundleColors;
    if(s.alwaysOnTop!==undefined){alwaysOnTop=s.alwaysOnTop;document.getElementById('toggle-ontop').classList.toggle('active',alwaysOnTop);try{await invoke('set_always_on_top',{value:alwaysOnTop});}catch(e){}}
    if(s.autoSize!==undefined){autoSize=s.autoSize;document.getElementById('toggle-autosize').classList.toggle('active',autoSize);}
    if(s.sizeId){const sizes={small:[1000,750],medium:[1300,900],large:[1600,1100]};currentSizeId=s.sizeId;setActiveSizeBtn(s.sizeId);try{if(s.sizeId==='fullscreen') await invoke('set_fullscreen',{value:true});else if(sizes[s.sizeId]) await invoke('set_window_size',{width:sizes[s.sizeId][0],height:sizes[s.sizeId][1]});}catch(e){}}
    if(s.zoom){currentZoom=s.zoom;applyZoom(s.zoom);}
    if(s.hiddenCards) s.hiddenCards.forEach(id=>hiddenCards.add(id));
    if(s.bundles){bundles=s.bundles;renderBundleList();renderBundleQuick();}
    if(s.autostartEnabled!==undefined){autostartEnabled=s.autostartEnabled;document.getElementById('toggle-autostart').classList.toggle('active',autostartEnabled);}
    if(s.autostartDays){autostartDays=s.autostartDays;document.querySelectorAll('.day-btn').forEach(btn=>btn.classList.toggle('active',autostartDays.includes(btn.dataset.day)));}
    // Fehlt das Feld (alte Einstellungsdatei), gilt der Standard: AN.
    onboardingAlways = s.onboardingAlways!==undefined ? !!s.onboardingAlways : true;
    document.getElementById('toggle-onboarding')?.classList.toggle('active',onboardingAlways);
    if(['ctrl','shift','alt','off'].includes(s.deleteGuardKey)) deleteGuardKey=s.deleteGuardKey;
    applyDeleteGuard();
    if(s.layoutMode){layoutMode=s.layoutMode;document.getElementById('layout-'+layoutMode)?.classList.add('active');document.getElementById('layout-'+(layoutMode==='pyramid'?'grid':'pyramid'))?.classList.remove('active');if(layoutMode==='grid') document.getElementById('gridColsSetting').style.display='block';}
    if(s.gridCols){gridCols=s.gridCols;[3,4,5,6,7].forEach(i=>document.getElementById('cols-'+i)?.classList.toggle('active',i===gridCols));}
    if(s.orbitCount){orbitCount=s.orbitCount;[1,2,3].forEach(i=>document.getElementById('orb-'+i)?.classList.toggle('active',i===orbitCount));document.getElementById('orbSizeRow1').style.display=orbitCount>=2?'flex':'none';document.getElementById('orbSizeRow2').style.display=orbitCount>=3?'flex':'none';document.getElementById('orbSpeedRow1').style.display=orbitCount>=2?'flex':'none';document.getElementById('orbSpeedRow2').style.display=orbitCount>=3?'flex':'none';}
    if(s.orbitSizes){orbitSizes=s.orbitSizes;orbitSizes.forEach((v,i)=>{const sl=document.getElementById('orbSize'+i);if(sl){sl.value=v;document.getElementById('orbSizeVal'+i).textContent=v;}});}
    if(s.orbitSpeeds){orbitSpeeds=s.orbitSpeeds;orbitSpeeds.forEach((v,i)=>{const sl=document.getElementById('orbSpeed'+i);if(sl){sl.value=v;document.getElementById('orbSpeedVal'+i).textContent=SPEED_DOTS[v-1];}});}
    if(s.lastActivePrograms && s.lastActivePrograms.length) lastActivePrograms=[...s.lastActivePrograms];
    if(s.scKey!==undefined){ scKey=s.scKey||'O'; const ki=document.getElementById('scKey'); if(ki) ki.value=scKey; updateScPreview(); try{await invoke('set_shortcut',{ctrl:true,shift:false,alt:true,key:scKey});}catch(e){console.error('Shortcut init:',e);} }
    if(s.globalDelay!==undefined){ globalDelay=s.globalDelay; const sl=document.getElementById('globalDelay'); if(sl){ sl.value=globalDelay; document.getElementById('globalDelayVal').textContent=(globalDelay*0.5).toFixed(1)+'s'; } }
    if(s.profiles) profiles=s.profiles;
    if(s.themeMode){ themeMode=s.themeMode; ['system','dark','light'].forEach(m=>document.getElementById('theme-'+m)?.classList.toggle('active',m===themeMode)); applyTheme(); }
    languageMode=s.languageMode||I18N.detectLang();
    I18N.setLang(languageMode);
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===languageMode));
    if(s.accentColor!==undefined){ accentColor=s.accentColor; applyAccent(); }
    if(s.customAccents&&Array.isArray(s.customAccents)){ customAccents=[s.customAccents[0]||null,s.customAccents[1]||null]; }
    renderAccentSlots();
    renderProfileBundleOptions(); renderProfileList();
    renderKiCards();
    // Versteckte Karten anwenden
    hiddenCards.forEach(id=>{const card=document.querySelector(`.ki-card[data-id="${id}"]`);if(card){card.classList.add('hidden');card.classList.remove('selected');}});
    // Letzten Zustand wiederherstellen: zuletzt gestartete Programme auswählen
    if(lastActivePrograms.length){
      // Erst alle abwählen
      document.querySelectorAll('.ki-card').forEach(c=>c.classList.remove('selected'));
      // Dann die letzten aktiven auswählen (falls nicht versteckt)
      lastActivePrograms.forEach(id=>{
        const card=document.querySelector(`.ki-card[data-id="${id}"]`);
        if(card && !hiddenCards.has(id)) card.classList.add('selected');
      });
    }
    checkStartButton();
    updateDots();   // Orbit-Punkte an wiederhergestellte Selektion angleichen (Fix: zuletzt aktive Programme im Orbit anzeigen)
  }catch(e){console.log('Keine Einstellungen:',e);languageMode=I18N.detectLang();I18N.setLang(languageMode);document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===languageMode));renderKiCards();}
}

// ── Start-Sequenz ──
async function startSequence(){
  const selected=activeBundleIdx>=0?bundles[activeBundleIdx].programs:[...document.querySelectorAll('.ki-card.selected:not(.hidden)')].map(c=>c.dataset.id);
  if(!selected.length) return;

  // Letzten Zustand merken + sofort speichern
  lastActivePrograms = [...selected];
  await saveAll();

  // Delay bestimmen: Bundle nutzt eigenen Wert, Einzelstart den globalen
  const delaySlider = activeBundleIdx>=0 ? (bundles[activeBundleIdx].delay||0) : globalDelay;
  const stepMs = delayToMs(delaySlider);

  document.getElementById('screen-select').style.display='none'; document.getElementById('screen-load').style.display='block';
  const bar=document.getElementById('bar'),percent=document.getElementById('percent'),statusEl=document.getElementById('status'),ready=document.getElementById('ready');

  // Programme starten; Fehler sammeln (ehrliches Feedback)
  const failed=[];
  (async()=>{
    // Web-/Protokoll-URLs gebündelt in EINEM Aufruf öffnen → der Standardbrowser
    // macht daraus Tabs in einem Fenster (kein Kaltstart-Race, keine leeren Tabs).
    // Reihenfolge = Auswahlreihenfolge.
    const urlPaths = selected
      .map(id => ALL_PROGRAMS.find(p=>p.id===id))
      .filter(p => p && p.appType==='url')
      .map(p => p.path);
    if(urlPaths.length){
      try{ await invoke("launch_urls",{urls:urlPaths}); }
      catch(e){ failed.push('URLs'); console.error('launch_urls',e); }
    }
    // Übrige Programme (.exe / Store) einzeln mit Verzögerung starten
    const rest = selected.filter(id => { const p=ALL_PROGRAMS.find(x=>x.id===id); return !p || p.appType!=='url'; });
    for(let i=0;i<rest.length;i++){
      const id=rest[i], prog=ALL_PROGRAMS.find(p=>p.id===id);
      try{ await invoke("launch_app",{appId:id,appType:prog?.appType||'store',path:prog?.path||id}); }
      catch(e){ failed.push(prog?.name||id); console.error('launch_app',id,e); }
      if(stepMs>0 && i<rest.length-1) await sleep(stepMs);
    }
  })();

  // Lade-Animation: Dauer an Delay anpassen, damit sie den echten Start grob begleitet
  const baseStep=Math.max(800, stepMs+300);
  const perApp=Math.floor(90/selected.length);let steps=[],pct=0;
  selected.forEach(id=>{const name=esc(ALL_PROGRAMS.find(p=>p.id===id)?.name||id);steps.push({pct:pct+Math.floor(perApp*0.4),label:I18N.t('start.startingApp',{name})});pct+=perApp;steps.push({pct,label:I18N.t('start.readyApp',{name})});});
  steps.push({pct:100,label:I18N.t('start.systemsOnline')});
  let dotCount=0;
  const di=setInterval(()=>{dotCount=(dotCount+1)%4;const d=document.getElementById('dots');if(d)d.textContent='.'.repeat(dotCount);},400);
  let lastDelay=0;
  steps.forEach((step,i)=>{const delay=500+i*baseStep;lastDelay=delay;setTimeout(()=>{bar.style.width=step.pct+'%';percent.textContent=step.pct+'%';if(step.pct<100)statusEl.innerHTML=step.label+'<span id="dots">'+'.'.repeat(dotCount)+'</span>';},delay);});
  setTimeout(async()=>{clearInterval(di);
    // Ehrliches Endergebnis: bei Fehlern Hinweis statt nur "Systems online"
    if(failed.length){ statusEl.style.display='block'; statusEl.innerHTML='<span style="color:#ff6666">'+I18N.t('start.notStarted',{n:failed.length})+'</span> '+esc(failed.join(', ')); bar.style.background='#ff4444'; }
    else statusEl.style.display='none';
    ready.style.display='block';
    setTimeout(()=>resetToSelect(),5000);   // nach 5s zurück zum Start-Frontend
  },lastDelay+900);
}
function resetToSelect(){
  const sel=document.getElementById('screen-select'), load=document.getElementById('screen-load');
  const bar=document.getElementById('bar'), percent=document.getElementById('percent');
  const statusEl=document.getElementById('status'), ready=document.getElementById('ready');
  load.style.display='none'; sel.style.display='block';
  if(bar){ bar.style.width='0%'; bar.style.background=''; } if(percent) percent.textContent='0%';
  if(statusEl){ statusEl.style.display='block'; statusEl.innerHTML=''; }
  if(ready) ready.style.display='none';
  if(activeBundleIdx>=0) deactivateBundle();
  document.querySelectorAll('.ki-card.selected').forEach(c=>c.classList.remove('selected'));
  updateDots(); checkStartButton(); updateStartBtn();
}

// ── Internet-Status ──
let netTimer=null;
async function updateNetStatus(){
  const el=document.getElementById('netStatus'); if(!el) return;
  let online;
  try{ online=await invoke('check_internet'); }
  catch(e){ online=navigator.onLine; } // Fallback
  el.classList.toggle('offline',!online);
  el.title=online?I18N.t('net.connected'):I18N.t('net.disconnected');
}
function startNetWatcher(){
  updateNetStatus();
  if(netTimer) clearInterval(netTimer);
  netTimer=setInterval(updateNetStatus,30000); // alle 30s
  window.addEventListener('online',updateNetStatus);
  window.addEventListener('offline',updateNetStatus);
}

// ── Tray-Menü (Rechtsklick auf das Taskleisten-Symbol) ──
// Rust baut das Menü, kennt aber weder Programme noch Startverzögerung —
// die Aktionen führt deshalb das Frontend aus. Das Fenster bleibt dabei zu.
let _trayTimer=null;
function refreshTrayMenu(){ clearTimeout(_trayTimer); _trayTimer=setTimeout(doRefreshTrayMenu,150); }
async function doRefreshTrayMenu(){
  try{
    await invoke('update_tray_menu',{
      bundles: bundles.map(b=>b.name),
      labels:{
        start:    I18N.t('tray.start'),    close:    I18N.t('tray.close'),
        startAll: I18N.t('tray.startAll'), closeAll: I18N.t('tray.closeAll'),
        show:     I18N.t('tray.show'),     quit:     I18N.t('tray.quit')
      }
    });
  }catch(e){ console.error('Tray-Menü:',e); }
}
function handleTrayAction(action){
  if(action==='start:all'){
    if(activeBundleIdx>=0) deactivateBundle();
    document.querySelectorAll('.ki-card:not(.hidden)').forEach(c=>c.classList.add('selected'));
    updateDots(); checkStartButton(); updateStartBtn();
    startSequence(); return;
  }
  if(action==='close:all'){ closeAll(); return; }
  const m=/^(start|close):(\d+)$/.exec(action||''); if(!m) return;
  const idx=+m[2], b=bundles[idx]; if(!b) return;
  if(m[1]==='close'){ closeApps(b.programs); return; }
  if(activeBundleIdx!==idx) selectBundle(idx);
  bundleReady=true; startSequence();
}
(function(){
  const ev=window.__TAURI__ && window.__TAURI__.event;
  if(!ev || !ev.listen) return;            // im Browser-Test nicht vorhanden
  ev.listen('tray-action', e=>handleTrayAction(e && e.payload));
})();

// ── Init ──
applyTheme();        // System-Theme sofort anwenden (vor Settings-Load)
I18N.setLang(I18N.detectLang()); // Sprache sofort anwenden, loadSettings überschreibt ggf. mit gespeicherter Wahl
renderAccentSlots();
applyDeleteGuard();  // Schutz sofort scharf, bevor die Einstellungen geladen sind
loadSettings();
startProfileWatcher();
startNetWatcher();
refreshTrayMenu();   // Tray-Beschriftungen in der aktiven Sprache setzen
// ═══════════════ STATE & PERSISTENZA ═══════════════
// ═══════════════ STATE ═══════════════
let S=loadState(),view='dashboard';
let appSettings=loadAppSettings();
let studyQ=[],againQ=[],studyDid=null;
let sess={again:0,hard:0,good:0,easy:0,reviewed:0};
let delCardId=null,delDeckId=null;
let selColor=COLORS[0],inlineColor=COLORS[0];
let importParsed=[],barChart=null,statsDid=null;
let undoStack=[];  // [{cardSnapshot, item, fromAgain, sessSnapshot, tcSnapshot}]

// Applica i default/migrazioni ai dati grezzi (usata sia al caricamento normale
// sia al ripristino di un backup, così i due percorsi non divergono più).
function normalizeState(s){
  s.cards.forEach(c=>{
    if(!c.status)c.status='new';
    if(c.lapses==null)c.lapses=0;
    if(c.stepIdx==null)c.stepIdx=0;
    if(c.suspended==null)c.suspended=false;
    if(c.repetitions>0&&c.status==='new')c.status='review';
  });
  s.decks.forEach(d=>{
    d.settings={...DEF,...(d.settings||{})};
    // Passi vuoti o non validi renderebbero la data di ripasso NaN: ripristina i predefiniti
    ['learnSteps','relearnSteps'].forEach(k=>{
      const v=d.settings[k],a=Array.isArray(v)?v.filter(n=>n>0):parseSteps(v);
      d.settings[k]=a.length?a:[...DEF[k]];
    });
  });
  if(!s.reviews)s.reviews=[];
  if(!s.lastStudyDate)s.lastStudyDate='';
  if(!s.todayCounts)s.todayCounts={};
  if(!s.studyLog)s.studyLog=[];
  if(!s.streak)s.streak=0;
  return s;
}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(SK));
    if(s?.decks&&s?.cards)return normalizeState(s);
  }catch(e){}
  return defState();
}

function defState(){
  return{
    decks:[],
    cards:[],
    reviews:[],streak:0,lastStudyDate:'',todayCounts:{},studyLog:[],
  };
}

// Streak da mostrare: se l'ultimo giorno di studio non è oggi né ieri, la serie è interrotta
function effectiveStreak(){
  if(!S.streak||!S.lastStudyDate)return 0;
  const t=new Date().toDateString(),y=new Date();y.setDate(y.getDate()-1);
  return(S.lastStudyDate===t||S.lastStudyDate===y.toDateString())?S.streak:0;
}

function mkCard(deckId,front,back,tags,id){
  return{id:id||uid(),deckId,front,back,tags:tags||'',created:Date.now(),
    interval:0,easeFactor:2.5,repetitions:0,dueDate:Date.now(),
    lapses:0,stepIdx:0,status:'new',suspended:false};
}

function save(){localStorage.setItem(SK,JSON.stringify(S));}
function uid(){return Math.random().toString(36).slice(2,11);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getDeck(id){return S.decks.find(d=>d.id===id);}
function cfg(did){return getDeck(did)?.settings||{...DEF};}
function parseSteps(s){return String(s).split(/[\s,]+/).map(Number).filter(n=>!isNaN(n)&&n>0);}
function getSteps(did,type){const c=cfg(did);const r=type==='learn'?c.learnSteps:c.relearnSteps;return Array.isArray(r)?r:parseSteps(r);}

// ═══════════════ TODAY COUNTS ═══════════════
function todayKey(){return new Date().toDateString();}
// Traccia l'ultimo giorno per cui è già stata fatta la pulizia dei contatori
// di giorni passati, così la purge gira una sola volta per cambio di giorno
// invece che a ogni singola chiamata di getTc() (che avviene decine di volte
// per render).
let _tcPurgedDay=null;
function getTc(did){
  const k=todayKey();
  if(!S.todayCounts[k])S.todayCounts[k]={};
  if(!S.todayCounts[k][did])S.todayCounts[k][did]={newDone:0,revDone:0};
  if(_tcPurgedDay!==k){
    Object.keys(S.todayCounts).forEach(x=>{if(x!==k)delete S.todayCounts[x];});
    _tcPurgedDay=k;
  }
  return S.todayCounts[k][did];
}
function incTc(did,type){const c=getTc(did);if(type==='new')c.newDone++;else c.revDone++;}

// ═══════════════ APP SETTINGS ═══════════════
function loadAppSettings(){
  try{const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(s)return s;}catch(e){}
  return{themeIdx:0,firebase:null};
}
function saveAppSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(appSettings));}

// ═══════════════ FIREBASE ═══════════════
let fbApp=null,fbDb=null;

function fbRestoreFields(){
  const fbCfg=appSettings.firebase||{};
  ['apikey','authdomain','dburl','projectid'].forEach(k=>{
    const el=document.getElementById('fb-'+k);if(el)el.value=fbCfg[k]||'';
  });
  // Se già connesso, riconnetti silenziosamente
  if(fbCfg.apikey&&fbCfg.dburl)fbInitApp(fbCfg,true);
}

function fbReadFields(){
  return{
    apikey:document.getElementById('fb-apikey')?.value.trim()||'',
    authdomain:document.getElementById('fb-authdomain')?.value.trim()||'',
    dburl:document.getElementById('fb-dburl')?.value.trim()||'',
    projectid:document.getElementById('fb-projectid')?.value.trim()||'',
  };
}

function fbInitApp(fbCfg,silent=false){
  try{
    if(fbApp){try{firebase.app('[DEFAULT]').delete();}catch(e){}}
    fbApp=firebase.initializeApp({
      apiKey:fbCfg.apikey,
      authDomain:fbCfg.authdomain,
      databaseURL:fbCfg.dburl,
      projectId:fbCfg.projectid,
    });
    fbDb=firebase.database(fbApp);
    // Test connessione
    fbDb.ref('.info/connected').once('value').then(snap=>{
      fbApp._connected=true;
      if(!silent)toast('Firebase connesso!');
      fbUpdateUI(true);
    }).catch(err=>{
      fbApp._connected=false;
      fbSetStatus('err',`Connessione fallita: ${err.message}`);
      fbUpdateUI(false);
    });
    return true;
  }catch(err){
    fbSetStatus('err',`Errore inizializzazione: ${err.message}`);
    fbUpdateUI(false);
    return false;
  }
}

function fbConnect(){
  const fbCfg=fbReadFields();
  if(!fbCfg.apikey||!fbCfg.dburl){toast('Inserisci almeno API Key e Database URL.');return;}
  fbSetStatus('loading','Connessione in corso…');
  appSettings.firebase=fbCfg;
  saveAppSettings();
  fbInitApp(fbCfg);
}

function fbDisconnect(){
  if(fbApp){try{fbApp.delete();}catch(e){}}
  fbApp=null;fbDb=null;
  appSettings.firebase=null;
  saveAppSettings();
  ['apikey','authdomain','dburl','projectid'].forEach(k=>{const el=document.getElementById('fb-'+k);if(el)el.value='';});
  fbSetStatus(null);
  fbUpdateUI(false);
  toast('Firebase disconnesso.');
}

function fbUpdateUI(connected){
  const disc=document.getElementById('fb-disconnect-btn');
  const up=document.getElementById('fb-upload-btn');
  const down=document.getElementById('fb-download-btn');
  const act=document.getElementById('fb-actions');
  const isConn=connected||(fbApp&&fbApp._connected);
  if(disc)disc.style.display=isConn?'':'none';
  if(act)act.style.display=isConn?'flex':'none';
  if(up){up.disabled=!isConn;}
  if(down){down.disabled=!isConn;}
  if(isConn&&!document.getElementById('fb-status-bar')?.querySelector('.fb-status.ok')){
    fbSetStatus('ok','Connesso al database Firebase.');
  }
}

function fbSetStatus(type,msg){
  const bar=document.getElementById('fb-status-bar');if(!bar)return;
  if(!type){bar.style.display='none';bar.innerHTML='';return;}
  const ico=type==='ok'?'bi-cloud-check-fill':type==='loading'?'bi-hourglass-split':'bi-exclamation-triangle-fill';
  bar.style.display='block';
  bar.innerHTML=`<div class="fb-status ${type}"><i class="bi ${ico}"></i> ${msg}</div>`;
}

async function fbUpload(){
  if(!fbDb){toast('Firebase non connesso.');return;}
  const up=document.getElementById('fb-upload-btn');
  if(up){up.disabled=true;up.innerHTML='<i class="bi bi-hourglass-split"></i> Caricamento…';}
  try{
    const payload={...S,_uploadedAt:new Date().toISOString(),_version:'mnemosyne_v5'};
    await fbDb.ref('mnemosyne/backup').set(payload);
    toast('Backup caricato su Firebase!');
    fbSetStatus('ok',`Backup caricato — ${new Date().toLocaleTimeString('it-IT')}`);
  }catch(err){
    toast('Errore upload: '+err.message);
    fbSetStatus('err','Errore durante il caricamento: '+err.message);
  }finally{
    if(up){up.disabled=false;up.innerHTML='<i class="bi bi-cloud-upload"></i> Carica backup';}
  }
}

async function fbDownload(){
  if(!fbDb){toast('Firebase non connesso.');return;}
  const down=document.getElementById('fb-download-btn');
  if(down){down.disabled=true;down.innerHTML='<i class="bi bi-hourglass-split"></i> Scaricamento…';}
  try{
    const snap=await fbDb.ref('mnemosyne/backup').once('value');
    const data=snap.val();
    if(!data||!data.decks||!data.cards){toast('Nessun backup trovato nel database.');return;}
    delete data._uploadedAt;delete data._version;
    S=normalizeState(data);save();nav('dashboard');
    toast('Backup scaricato e ripristinato!');
  }catch(err){
    toast('Errore download: '+err.message);
    fbSetStatus('err','Errore durante il download: '+err.message);
  }finally{
    if(down){down.disabled=false;down.innerHTML='<i class="bi bi-cloud-download"></i> Scarica backup';}
  }
}

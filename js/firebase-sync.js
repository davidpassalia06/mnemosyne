// ═══════════════ FIREBASE (Realtime Database + Authentication) ═══════════════
// I dati di ogni account stanno in  mnemosyne/users/{uid}/backup .
// Le regole del database (console Firebase) permettono a ciascun utente di leggere e
// scrivere solo il proprio ramo: il codice qui sotto da solo NON protegge i dati.
let fbApp=null,fbDb=null,fbAuth=null,fbCfgKey='',fbUser=null;
let fbInitLock=Promise.resolve();

function fbSdkOk(){return typeof firebase!=='undefined'&&!!firebase.auth&&!!firebase.database;}
function fbUserPath(){return fbUser?`mnemosyne/users/${fbUser.uid}/backup`:null;}

function fbRestoreFields(){
  const fbCfg=appSettings.firebase||{};
  ['apikey','authdomain','dburl','projectid'].forEach(k=>{
    const el=document.getElementById('fb-'+k);if(el)el.value=fbCfg[k]||'';
  });
  // Se già configurato, riconnetti silenziosamente
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

// Le inizializzazioni vengono accodate: evita che due chiamate ravvicinate (es. riapertura
// delle impostazioni) si sovrappongano mentre la vecchia app viene eliminata.
function fbInitApp(fbCfg,silent=false){
  fbInitLock=fbInitLock.then(()=>fbInitAppImpl(fbCfg,silent)).catch(()=>false);
  return fbInitLock;
}

async function fbInitAppImpl(fbCfg,silent){
  if(!fbSdkOk()){
    fbSetStatus('err','SDK Firebase non caricato (sei offline?).');
    fbUpdateUI();return false;
  }
  const key=JSON.stringify(fbCfg);
  if(fbApp&&key===fbCfgKey){fbUpdateUI();return true;}   // già inizializzata con questa configurazione
  try{
    if(fbApp){
      try{await fbApp.delete();}catch(e){}
      fbApp=fbDb=fbAuth=null;fbUser=null;
    }
    fbApp=firebase.initializeApp({
      apiKey:fbCfg.apikey,
      authDomain:fbCfg.authdomain,
      databaseURL:fbCfg.dburl,
      projectId:fbCfg.projectid,
    });
    fbCfgKey=key;
    fbDb=firebase.database(fbApp);
    fbAuth=firebase.auth(fbApp);
    fbAuth.onAuthStateChanged(fbOnAuth,err=>fbSetStatus('err',fbErrMsg(err)));
    if(!silent)toast('Firebase configurato. Accedi con il tuo account.');
    fbUpdateUI();
    return true;
  }catch(err){
    fbApp=fbDb=fbAuth=null;fbCfgKey='';
    fbSetStatus('err',`Errore inizializzazione: ${err.message}`);
    fbUpdateUI();
    return false;
  }
}

// ─── Autenticazione ───
async function fbOnAuth(user){
  fbUser=user;
  if(user){
    // Lo slot locale deve essere quello dell'account: se diverso, cambia slot e ricarica
    if(ACTIVE_UID!==user.uid){fbSwitchLocalSlot(user.uid);return;}
    fbSetStatus('ok',`Connesso come ${user.email||user.uid}`);
    fbUpdateUI();
    fbRestoreIfEmpty();
  }else{
    if(ACTIVE_UID)fbSetStatus('err','Sessione scaduta: accedi di nuovo per sincronizzare.');
    else fbSetStatus('ok','Firebase configurato. Accedi o crea un account per sincronizzare.');
    fbUpdateUI();
  }
}

// Passa allo slot locale dell'account e ricarica la pagina (SK viene scelto all'avvio).
// Al primo accesso propone di importare i dati "ospite" già presenti sul dispositivo.
function fbSwitchLocalSlot(uid){
  const slot=GUEST_SK+'_'+uid;
  try{
    if(localStorage.getItem(slot)===null){
      const raw=localStorage.getItem(GUEST_SK);
      const guest=raw?JSON.parse(raw):null;
      if(guest?.cards?.length&&confirm(`Importare nell'account i dati già presenti su questo dispositivo (${guest.cards.length} carte)?`)){
        localStorage.setItem(slot,raw);
      }
    }
    localStorage.setItem(ACTIVE_UID_KEY,uid);
  }catch(e){
    fbSetStatus('err','Impossibile passare ai dati locali dell\'account: '+e.message);
    return;
  }
  location.reload();
}

function fbReadCreds(){
  return{
    email:document.getElementById('fb-email')?.value.trim()||'',
    pw:document.getElementById('fb-password')?.value||'',
  };
}
function fbLogin(){return fbAuthAction('login');}
function fbRegister(){return fbAuthAction('register');}
async function fbAuthAction(kind){
  if(!fbAuth){toast('Prima salva la configurazione con "Connetti".');return;}
  const{email,pw}=fbReadCreds();
  if(!email||!pw){toast('Inserisci email e password.');return;}
  fbSetStatus('loading',kind==='register'?'Creazione account…':'Accesso in corso…');
  try{
    if(kind==='register')await fbAuth.createUserWithEmailAndPassword(email,pw);
    else await fbAuth.signInWithEmailAndPassword(email,pw);
    const p=document.getElementById('fb-password');if(p)p.value='';
    // il resto avviene in fbOnAuth
  }catch(err){
    fbSetStatus('err',fbErrMsg(err));
  }
}

// I dati locali dell'account restano nel suo slot: uscire non cancella nulla, riporta solo allo slot ospite.
async function fbLogout(){
  try{if(fbAuth)await fbAuth.signOut();}catch(e){}
  try{localStorage.removeItem(ACTIVE_UID_KEY);}catch(e){}
  location.reload();
}

function fbErrMsg(err){
  const m={
    'auth/invalid-email':'Email non valida.',
    'auth/invalid-credential':'Email o password errate.',
    'auth/wrong-password':'Email o password errate.',
    'auth/user-not-found':'Email o password errate.',
    'auth/email-already-in-use':'Esiste già un account con questa email.',
    'auth/weak-password':'Password troppo debole (minimo 6 caratteri).',
    'auth/too-many-requests':'Troppi tentativi: riprova più tardi.',
    'auth/network-request-failed':'Errore di rete.',
    'auth/operation-not-allowed':'Accesso con email/password non abilitato nella console Firebase.',
    'PERMISSION_DENIED':'Permesso negato: controlla le regole del database e di essere connesso.',
  };
  return m[err?.code]||('Errore: '+(err?.message||err));
}

// ─── Connessione / configurazione ───
function fbConnect(){
  const fbCfg=fbReadFields();
  if(!fbCfg.apikey||!fbCfg.dburl){toast('Inserisci almeno API Key e Database URL.');return;}
  fbSetStatus('loading','Connessione in corso…');
  appSettings.firebase=fbCfg;
  saveAppSettings();
  fbInitApp(fbCfg);
}

// Rimuove la configurazione ed esce dall'account; i dati locali dell'account restano sul dispositivo.
async function fbDisconnect(){
  try{if(fbAuth)await fbAuth.signOut();}catch(e){}
  try{if(fbApp)await fbApp.delete();}catch(e){}
  fbApp=fbDb=fbAuth=null;fbUser=null;fbCfgKey='';
  appSettings.firebase=null;
  saveAppSettings();
  ['apikey','authdomain','dburl','projectid'].forEach(k=>{const el=document.getElementById('fb-'+k);if(el)el.value='';});
  fbSetStatus(null);
  fbUpdateUI();
  toast('Firebase disconnesso.');
}

function fbUpdateUI(){
  const inited=!!fbApp,logged=!!fbUser;
  const show=(id,on,disp='')=>{const el=document.getElementById(id);if(el)el.style.display=on?disp:'none';};
  show('fb-disconnect-btn',inited);
  show('fb-auth',inited&&!logged);
  show('fb-account',logged,'flex');
  show('fb-actions',logged,'flex');
  const em=document.getElementById('fb-account-email');if(em)em.textContent=fbUser?.email||'';
  ['fb-upload-btn','fb-download-btn'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!logged;});
}

function fbSetStatus(type,msg){
  const bar=document.getElementById('fb-status-bar');if(!bar)return;
  if(!type){bar.style.display='none';bar.innerHTML='';return;}
  const ico=type==='ok'?'bi-cloud-check-fill':type==='loading'?'bi-hourglass-split':'bi-exclamation-triangle-fill';
  bar.style.display='block';
  bar.innerHTML=`<div class="fb-status ${type}"><i class="bi ${ico}"></i> ${esc(msg)}</div>`;
}

// ─── Backup ───
async function fbUpload(){
  if(!fbDb||!fbUser){toast('Accedi prima al tuo account.');return;}
  const up=document.getElementById('fb-upload-btn');
  if(up){up.disabled=true;up.innerHTML='<i class="bi bi-hourglass-split"></i> Caricamento…';}
  try{
    const payload={...S,_uploadedAt:new Date().toISOString(),_version:'mnemosyne_v5'};
    await fbDb.ref(fbUserPath()).set(payload);
    toast('Backup caricato su Firebase!');
    fbSetStatus('ok',`Backup caricato — ${new Date().toLocaleTimeString('it-IT')}`);
  }catch(err){
    toast('Errore upload: '+fbErrMsg(err));
    fbSetStatus('err','Errore durante il caricamento: '+fbErrMsg(err));
  }finally{
    if(up){up.disabled=!fbUser;up.innerHTML='<i class="bi bi-cloud-upload"></i> Carica backup';}
  }
}

async function fbDownload(){
  if(!fbDb||!fbUser){toast('Accedi prima al tuo account.');return;}
  const down=document.getElementById('fb-download-btn');
  if(down){down.disabled=true;down.innerHTML='<i class="bi bi-hourglass-split"></i> Scaricamento…';}
  try{
    const snap=await fbDb.ref(fbUserPath()).once('value');
    const data=snap.val();
    if(!data||!data.decks||!data.cards){toast('Nessun backup trovato per questo account.');return;}
    delete data._uploadedAt;delete data._version;
    S=normalizeState(data);save();nav('dashboard');
    toast('Backup scaricato e ripristinato!');
  }catch(err){
    toast('Errore download: '+fbErrMsg(err));
    fbSetStatus('err','Errore durante il download: '+fbErrMsg(err));
  }finally{
    if(down){down.disabled=!fbUser;down.innerHTML='<i class="bi bi-cloud-download"></i> Scarica backup';}
  }
}

// Dopo l'accesso su un dispositivo vuoto (nessun mazzo né carta) ripristina da solo i dati dell'account.
// Non tocca mai uno slot locale che contiene già dati.
async function fbRestoreIfEmpty(){
  if(!fbDb||!fbUser||S.cards.length||S.decks.length)return;
  try{
    const snap=await fbDb.ref(fbUserPath()).once('value');
    const data=snap.val();
    if(!data||!data.decks||!data.cards)return;
    delete data._uploadedAt;delete data._version;
    S=normalizeState(data);save();nav('dashboard');
    toast('Dati dell\'account ripristinati dal cloud.');
  }catch(err){/* silenzioso: l'utente può usare "Scarica backup" */}
}

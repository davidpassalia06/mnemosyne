// ═══════════════ POMODORO ═══════════════
// Timer di studio a blocchi (default 25 min studio / 5 min pausa).
// Lo stato del timer vive solo in memoria; le impostazioni sono in appSettings.pomodoro.
const POMO_DEF={enabled:false,focusMin:25,breakMin:5,autoStart:true};
let pomo={phase:'idle',running:false,endAt:0,leftMs:0,done:0}; // phase: idle | focus | break
let pomoInt=null,pomoAudio=null;

function pomoCfg(){return{...POMO_DEF,...(appSettings.pomodoro||{})};}
function pomoMs(p){const c=pomoCfg();return(p==='focus'?c.focusMin:c.breakMin)*MIN;}
function pomoFmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function pomoLeft(){return pomo.running?pomo.endAt-Date.now():pomo.leftMs;}
function pomoRun(){clearInterval(pomoInt);pomoInt=setInterval(pomoTick,1000);}

function pomoStart(phase){
  pomo.phase=phase;pomo.running=true;
  pomo.leftMs=pomoMs(phase);pomo.endAt=Date.now()+pomo.leftMs;
  pomoRun();pomoRender();
}
function pomoToggle(){
  if(pomo.phase==='idle'){pomoStart('focus');return;}
  if(pomo.running){pomo.leftMs=Math.max(0,pomo.endAt-Date.now());pomo.running=false;clearInterval(pomoInt);}
  else{pomo.endAt=Date.now()+pomo.leftMs;pomo.running=true;pomoRun();}
  pomoRender();
}
function pomoReset(){
  clearInterval(pomoInt);
  pomo={phase:'idle',running:false,endAt:0,leftMs:0,done:pomo.done};
  pomoRender();
}
function pomoSkipBreak(){pomoStart('focus');}

function pomoTick(){
  if(!pomo.running)return;
  if(Date.now()>=pomo.endAt){pomoPhaseEnd();return;}
  const t=document.getElementById('pomo-time');
  if(t)t.textContent=pomoFmt(pomo.endAt-Date.now());
}
function pomoPhaseEnd(){
  pomoAlert();
  if(pomo.phase==='focus'){
    pomo.done++;
    toast(`Blocco completato — pausa di ${pomoCfg().breakMin} min.`);
    pomoStart('break');
  }else{
    toast('Pausa finita: quando vuoi, avvia un nuovo blocco.');
    pomoReset();
  }
}
// Il browser consente l'audio solo dopo un gesto dell'utente: si prepara l'AudioContext al primo tocco.
function pomoUnlockAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!pomoAudio)pomoAudio=new AC();
    if(pomoAudio.state==='suspended')pomoAudio.resume();
  }catch(e){}
}
document.addEventListener('pointerdown',pomoUnlockAudio);
document.addEventListener('keydown',pomoUnlockAudio);

// Vibrazione + breve beep (entrambi opzionali: se il browser li blocca, si ignora)
function pomoAlert(){
  try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch(e){}
  try{
    if(!pomoAudio)return;
    const ctx=pomoAudio,o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
    o.type='sine';o.frequency.value=880;
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.15,t+.02);
    g.gain.exponentialRampToValueAtTime(.0001,t+.6);
    o.connect(g);g.connect(ctx.destination);
    o.start(t);o.stop(t+.65);
  }catch(e){}
}

// Disegna il chip nella topbar. Visibile durante lo studio, o in qualsiasi vista
// finché il timer non è tornato a riposo.
function pomoRender(){
  const r=document.getElementById('tb-right');if(!r)return;
  const old=document.getElementById('pomo-chip');if(old)old.remove();
  const c=pomoCfg();
  const inStudy=view==='study'||view==='studyall';
  if(!c.enabled||(!inStudy&&pomo.phase==='idle'))return;
  const brk=pomo.phase==='break';
  const left=pomo.phase==='idle'?c.focusMin*MIN:pomoLeft();
  const el=document.createElement('div');
  el.id='pomo-chip';el.title='Blocchi completati in questa sessione: '+pomo.done;
  el.className='pomo'+(brk?' brk':'')+(pomo.running?'':' paused');
  el.innerHTML=`<i class="bi ${brk?'bi-cup-hot-fill':'bi-hourglass-split'}"></i>
    <span class="pomo-lbl">${brk?'Pausa':'Studio'}</span>
    <span class="pomo-time" id="pomo-time">${pomoFmt(left)}</span>
    <button class="pomo-btn" onclick="pomoToggle()" title="${pomo.running?'Metti in pausa':'Avvia'}"><i class="bi ${pomo.running?'bi-pause-fill':'bi-play-fill'}"></i></button>
    ${brk?'<button class="pomo-btn" onclick="pomoSkipBreak()" title="Salta la pausa"><i class="bi bi-skip-end-fill"></i></button>':''}
    <button class="pomo-btn" onclick="pomoReset()" title="Azzera il timer"><i class="bi bi-stop-fill"></i></button>`;
  r.prepend(el);
}

// Chiamata all'inizio di ogni sessione di studio
function pomoOnStudyStart(){
  const c=pomoCfg();
  if(c.enabled&&c.autoStart&&pomo.phase==='idle')pomoStart('focus');
  else pomoRender();
}

// Se la scheda era in background, i timer del browser possono essere rallentati:
// allo ritorno si ricontrolla subito la scadenza (il calcolo usa timestamp reali).
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pomoTick();});

// ─── Impostazioni ───
function pomoFillSettings(){
  const c=pomoCfg(),g=id=>document.getElementById(id);
  if(!g('pomo-enabled'))return;
  g('pomo-enabled').checked=c.enabled;g('pomo-auto').checked=c.autoStart;
  g('pomo-focus').value=c.focusMin;g('pomo-break').value=c.breakMin;
}
function pomoSaveSettings(){
  const g=id=>document.getElementById(id);
  const clamp=(v,a,b,d)=>{v=parseInt(v,10);return isNaN(v)?d:Math.min(b,Math.max(a,v));};
  appSettings.pomodoro={
    enabled:g('pomo-enabled').checked,
    autoStart:g('pomo-auto').checked,
    focusMin:clamp(g('pomo-focus').value,1,180,POMO_DEF.focusMin),
    breakMin:clamp(g('pomo-break').value,1,60,POMO_DEF.breakMin),
  };
  saveAppSettings();pomoFillSettings();
  if(!appSettings.pomodoro.enabled)pomoReset();else pomoRender();
  toast('Impostazioni pomodoro salvate.');
}
function pomoPreset(f,b){
  document.getElementById('pomo-focus').value=f;
  document.getElementById('pomo-break').value=b;
  pomoSaveSettings();
}

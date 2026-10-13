// ═══════════════ STUDIO ═══════════════
// ═══════════════ STUDIO ═══════════════
// Carte in apprendimento che scadono entro questa finestra tengono aperta la sessione ("in attesa");
// quelle più lontane (es. passo da 1 giorno) restano salvate e tornano alla prossima sessione.
const LEARN_AHEAD=20*MIN;
let rateLock=false; // evita valutazioni doppie durante il breve ritardo prima della carta successiva

function studyDeck(did){nav('study',{deckId:did});}

function startStudy(did){
  studyDid=did;sess={again:0,hard:0,good:0,easy:0,reviewed:0};againQ=[];undoStack=[];rateLock=false;
  const now=Date.now();
  const decks=did?[did]:S.decks.map(d=>d.id);
  let revCards=[],newCards=[];
  decks.forEach(id=>{
    const c=cfg(id),tc=getTc(id);
    const rr=Math.max(0,c.revLimit-tc.revDone),nr=Math.max(0,c.newLimit-tc.newDone);
    // Solo review/mature nel budget rev; learning scadute vanno direttamente in againQ
    revCards.push(...S.cards.filter(x=>x.deckId===id&&!x.suspended&&(x.status==='review'||x.status==='mature')&&x.dueDate<=now).slice(0,rr));
    const rawN=S.cards.filter(x=>x.deckId===id&&!x.suspended&&x.status==='new'&&x.dueDate<=now);
    const ordN=c.newOrder==='random'?shuffle([...rawN]):rawN.sort((a,b)=>a.created-b.created);
    newCards.push(...ordN.slice(0,nr));
    // Carte learning/relearning scadute: caricale subito in againQ
    const lrnDue=S.cards.filter(x=>x.deckId===id&&!x.suspended&&(x.status==='learning'||x.status==='relearning')&&x.dueDate<=now);
    againQ.push(...lrnDue.map(c=>({card:c,phase:'learn'})));
  });
  studyQ=[...revCards.map(c=>({card:c,phase:'rev'})),...newCards.map(c=>({card:c,phase:'new'}))];
  // Il timer parte solo se c'è davvero qualcosa da studiare
  if(studyQ.length||againQ.length)pomoOnStudyStart();else pomoRender();
  renderStudyCard();
}

function getCur(){
  const now=Date.now();
  // Le carte learning con dueDate scaduta hanno priorità assoluta
  const learnIdx=againQ.findIndex(i=>i.card.dueDate<=now);
  if(learnIdx!==-1)return{item:againQ[learnIdx],fromAgain:true,idx:learnIdx};
  // Poi la coda principale
  if(studyQ.length>0)return{item:studyQ[0],fromAgain:false,idx:0};
  // Carte learning in scadenza a breve: mostra il tempo rimanente.
  // Quelle oltre la finestra LEARN_AHEAD non trattengono la sessione.
  const soon=againQ.filter(i=>i.card.dueDate<=now+LEARN_AHEAD);
  if(soon.length>0){
    const next=soon.reduce((a,b)=>a.card.dueDate<b.card.dueDate?a:b);
    const wait=Math.ceil((next.card.dueDate-now)/1000);
    return{item:null,waiting:true,waitSec:wait};
  }
  return null;
}

// Descrizioni dei pulsanti di valutazione (tooltip), adattate allo stato della carta
function ratingTips(card){
  const mode=(card.status==='review'||card.status==='mature')?'rev':card.status==='relearning'?'rel':'lrn';
  const T={
    rev:{
      again:"Non la ricordavi o la risposta era sbagliata. Conta come errore: la carta torna in reapprendimento e diventa un po' più difficile.",
      hard:"La ricordavi, ma con molta fatica, dopo esitazione o solo in parte. Intervallo più corto del normale.",
      medium:"La ricordavi con un piccolo sforzo. È la scelta normale: intervallo standard.",
      easy:"La ricordavi subito e senza dubbi. Intervallo più lungo del normale."},
    rel:{
      again:"Non la ricordavi. Ricominci il reapprendimento dal primo passo.",
      hard:"La ricordavi con molta fatica. Ripeti questo passo con un'attesa più breve.",
      medium:"La ricordavi con un piccolo sforzo. Passi al passo successivo.",
      easy:"La ricordavi subito. In reapprendimento ha lo stesso effetto di «Medio»."},
    lrn:{
      again:"Non la ricordavi. Ricominci dal primo passo.",
      hard:"La ricordavi con molta fatica. Ripeti questo passo con un'attesa più breve.",
      medium:"La ricordavi con un piccolo sforzo. Passi al passo successivo.",
      easy:"La ricordavi subito e senza dubbi. Esci subito dall'apprendimento."}
  };
  return T[mode];
}

function renderStudyCard(){
  const wrap=document.getElementById('study-wrap');
  const cur=getCur();

  // Stato "in attesa" — tutte le carte main sono finite ma alcune learning non sono ancora scadute
  if(cur?.waiting){
    let sec=cur.waitSec;
    wrap.innerHTML=`<div class="done-box">
      <div class="done-icon"><i class="bi bi-hourglass-split" style="color:var(--tx2)"></i></div>
      <h2 style="color:var(--tx)">In attesa…</h2>
      <p id="wait-msg">Prossima carta tra <strong>${sec}</strong> secondi</p>
      <div class="done-btns"><button class="btn btn-g" onclick="nav('dashboard')">← Panoramica</button></div>
    </div>`;
    const t=setInterval(()=>{
      sec--;
      const el=document.getElementById('wait-msg');
      if(!el){clearInterval(t);return;}
      if(sec<=0){clearInterval(t);renderStudyCard();}
      else el.innerHTML=`Prossima carta tra <strong>${sec}</strong> secondi`;
    },1000);
    document.title='Mnemosyne';
    return;
  }

  if(!cur){renderDone();return;}
  const{item}=cur,card=item.card,deck=getDeck(card.deckId);
  const lrnPend=againQ.filter(i=>i.card.dueDate<=Date.now()+LEARN_AHEAD).length;
  const done=sess.reviewed,tot=studyQ.length+lrnPend;
  const pct=done+tot>0?Math.round(done/(done+tot)*100):0;
  const c=cfg(card.deckId),ls=getSteps(card.deckId,'learn');
  const isL=card.status==='learning'||card.status==='new',isRL=card.status==='relearning';
  const tip=ratingTips(card);
  let stepInfo='';
  if(isL&&ls.length>1)stepInfo=`Passo ${card.stepIdx+1}/${ls.length}`;
  else if(isRL)stepInfo='Reapprendimento';

  // Contatori sessione
  const revLeft=studyQ.filter(i=>i.phase==='rev').length;
  const newLeft=studyQ.filter(i=>i.phase==='new').length;
  const countsHtml=`<div class="sess-counts">
    ${revLeft>0?`<span class="sc rev"><i class="bi bi-arrow-repeat"></i> ${revLeft} ripasso</span>`:''}
    ${newLeft>0?`<span class="sc newc"><i class="bi bi-stars"></i> ${newLeft} nuove</span>`:''}
    ${lrnPend>0?`<span class="sc lrn"><i class="bi bi-arrow-clockwise"></i> ${lrnPend} carta${lrnPend===1?'':'e'} da ripetere</span>`:''}
    ${sess.again>0?`<span class="sc err"><i class="bi bi-x"></i> ${sess.again} errori</span>`:''}
  </div>`;

  // Titolo tab dinamico
  const remaining=tot;
  document.title=remaining>0?`(${remaining}) Mnemosyne`:'Mnemosyne';

  wrap.innerHTML=`
    <div class="study-top">
      <span class="study-lbl">${esc(deck?.name||'Tutti i mazzi')}</span>
      <div class="prog-w"><div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div><span class="prog-txt">${done}/${done+tot}</span></div>
    </div>
    ${countsHtml}
    <div class="flashcard" id="fc">
      ${card.tags?`<div class="card-tag">${esc(card.tags.split(',')[0].trim())}</div>`:''}
      ${card.lapses>0&&card.lapses>=(c.leechThreshold-1)?`<div class="card-leech"><i class="bi bi-exclamation-triangle-fill"></i> Leech (${card.lapses} err.)</div>`:''}
      ${stepInfo?`<div class="card-step">${stepInfo}</div>`:''}
      <div class="card-q" id="cq">${esc(card.front)}</div>
      <div class="card-sep"></div>
      <div class="card-a" id="ca">${esc(card.back)}</div>
      <div class="card-hint" id="chint">Tocca · swipe · <span class="kbd">spazio</span></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="show-btn" style="flex:1" id="show-btn" onclick="reveal()">Mostra risposta</button>
      <button class="btn btn-g" style="min-width:44px" onclick="buryCurrent()" title="Rimanda a domani"><i class="bi bi-skip-forward-fill"></i></button>
      <button class="btn btn-g" style="min-width:44px" id="undo-btn" onclick="undoLast()" title="Annulla ultima valutazione" ${undoStack.length===0?'disabled':''}><i class="bi bi-arrow-counterclockwise"></i></button>
      <button class="btn btn-g" style="min-width:44px" onclick="editCurrent()" title="Modifica questa carta"><i class="bi bi-pencil"></i></button>
    </div>
    <div class="rating-grid" id="rg">
      <button class="rate-btn again" id="rb-again" title="${esc(tip.again)}" onclick="rate('again')">Di nuovo<div class="iv">${nextIv(card,'again')}</div></button>
      <button class="rate-btn hard"  id="rb-hard"  title="${esc(tip.hard)}" onclick="rate('hard')">Difficile<div class="iv">${nextIv(card,'hard')}</div></button>
      <button class="rate-btn good"  id="rb-good"  title="${esc(tip.medium)}" onclick="rate('medium')">Medio<div class="iv">${nextIv(card,'medium')}</div></button>
      <button class="rate-btn easy"  id="rb-easy"  title="${esc(tip.easy)}" onclick="rate('easy')">Facile<div class="iv">${nextIv(card,'easy')}</div></button>
    </div>
    <div class="kbd-hint" style="display:none"><span class="kbd">1</span> Di nuovo &nbsp;<span class="kbd">2</span> Difficile &nbsp;<span class="kbd">3</span> Medio &nbsp;<span class="kbd">4</span> Facile &nbsp;<span class="kbd">B</span> Rimanda &nbsp;<span class="kbd">Z</span> Annulla</div>
    <details class="rate-help" id="rate-help" style="display:none">
      <summary><i class="bi bi-question-circle"></i> Quale scegliere?</summary>
      <ul>
        <li><b>Di nuovo</b> — non la sapevi o hai sbagliato.</li>
        <li><b>Difficile</b> — la sapevi, ma a fatica o solo in parte.</li>
        <li><b>Medio</b> — la sapevi con un piccolo sforzo.</li>
        <li><b>Facile</b> — la sapevi subito, senza dubbi.</li>
      </ul>
    </details>`;
  typeset([document.getElementById('fc')]);
}

function typeset(els){if(window.MathJax?.typesetPromise)MathJax.typesetPromise(els).catch(()=>{});}

function reveal(){
  const ca=document.getElementById('ca'),rg=document.getElementById('rg');
  const sb=document.getElementById('show-btn'),ch=document.getElementById('chint');
  if(!ca||ca.classList.contains('shown'))return;
  ca.classList.add('shown');rg.classList.add('shown');
  const kh = document.querySelector('.kbd-hint'), rh=document.getElementById('rate-help');
  if(sb)sb.style.display='none'; if(ch)ch.style.display='none'; if(kh)kh.style.display=''; if(rh)rh.style.display='';
  typeset([ca]);
}

function rate(rating){
  if(rateLock)return;
  // Si può valutare solo dopo aver mostrato la risposta (vale anche per le scorciatoie da tastiera)
  const ca=document.getElementById('ca');
  if(!ca||!ca.classList.contains('shown'))return;
  const cur=getCur();if(!cur||cur.waiting)return;
  rateLock=true;
  const{item,fromAgain,idx}=cur,card=item.card;
  const wasNew=item.phase==='new'||card.status==='new'||card.status==='learning';

  // Feedback visivo sul pulsante
  const btnMap={again:'rb-again',hard:'rb-hard',good:'rb-good',easy:'rb-easy'};
  const btn=document.getElementById(btnMap[rating]);
  if(btn){btn.classList.add('flash');setTimeout(()=>btn.classList.remove('flash'),250);}

  // Salva snapshot per undo (max 1 livello)
  const tcSnap=JSON.parse(JSON.stringify(getTc(card.deckId)));
  const cardSnap=JSON.parse(JSON.stringify(card));
  const sessSnap={...sess};
  undoStack=[{cardSnap,item:JSON.parse(JSON.stringify(item)),fromAgain,idx,tcSnap,sessSnap,rating,wasNew}];

  const upd=sm2(card,rating);
  Object.assign(card,upd);
  const i=S.cards.findIndex(c=>c.id===card.id);if(i!==-1)Object.assign(S.cards[i],upd);

  if(rating!=='again'){
    const originalPhase=item.phase;
    // Si conta una sola volta per carta: dopo il conteggio la fase diventa 'learn'
    if(originalPhase==='new'){incTc(card.deckId,'new');item.phase='learn';}
    else if(originalPhase==='rev'){incTc(card.deckId,'rev');item.phase='learn';}
  }
  sess[rating==='medium'?'good':rating]++;sess.reviewed++;
  S.reviews.push({date:Date.now(),deckId:card.deckId,rating});
  S.studyLog.push({date:Date.now(),deckId:card.deckId,rating,wasNew});
  updateStreak();
  if(upd.isLeech)toast(`Carta sospesa automaticamente (${upd.lapses} errori)`);

  // Gestione coda: rimuovi dalla posizione corretta
  if(fromAgain)againQ.splice(idx,1);else studyQ.shift();

  // Se "Di nuovo" o carta ancora in learning: rimetti in againQ con il nuovo dueDate
  if(rating==='again'||(upd.status==='learning'||upd.status==='relearning')){
    // Aggiorna la card nell'item con i nuovi dati
    item.card=S.cards.find(c=>c.id===card.id)||card;
    againQ.push(item);
  }

  save();
  updateSidebar();
  // Piccolo delay per far vedere il flash prima di cambiare carta
  setTimeout(()=>{rateLock=false;renderStudyCard();},120);
}

function undoLast(){
  if(rateLock)return;
  if(!undoStack.length){toast('Niente da annullare.');return;}
  const{cardSnap,item,fromAgain,idx,tcSnap,sessSnap,rating,wasNew}=undoStack.pop();
  // Ripristina la carta
  const i=S.cards.findIndex(c=>c.id===cardSnap.id);
  if(i!==-1)Object.assign(S.cards[i],cardSnap);
  Object.assign(item.card,cardSnap);
  // Ripristina contatori sessione
  Object.assign(sess,sessSnap);
  // Ripristina today counts
  const k=todayKey();
  if(S.todayCounts[k]&&S.todayCounts[k][cardSnap.deckId])Object.assign(S.todayCounts[k][cardSnap.deckId],tcSnap);
  // Ripristina la carta nella coda giusta
  // Rimuovi eventuale copia in againQ aggiunta da rate()
  const inAgain=againQ.findIndex(x=>x.card.id===cardSnap.id);
  if(inAgain!==-1)againQ.splice(inAgain,1);
  // Rimetti in testa alla coda originale
  if(fromAgain)againQ.unshift(item);else studyQ.unshift(item);
  // Rimuovi l'ultimo review log
  S.reviews.pop();S.studyLog.pop();
  save();undoStack=[];toast('Ultima valutazione annullata.');renderStudyCard();
}

function buryCurrent(){
  if(rateLock)return;
  const cur=getCur();if(!cur||cur.waiting)return;
  const{item,fromAgain,idx}=cur,card=item.card;
  // Sposta la dueDate a domani
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(4,0,0,0);
  card.dueDate=tomorrow.getTime();
  const i=S.cards.findIndex(c=>c.id===card.id);if(i!==-1)S.cards[i].dueDate=card.dueDate;
  if(fromAgain)againQ.splice(idx,1);else studyQ.shift();
  save();toast('Carta rimandata a domani.');renderStudyCard();
}

function editCurrent(){
  const cur=getCur();if(!cur||cur.waiting)return;
  const card=cur.item.card;
  // Apri l'editor in una nuova tab mantenendo la sessione attiva
  nav('add',{editId:card.id});
}

function renderDone(){
  document.title='Mnemosyne';
  if(pomo.phase==='focus')pomoReset();
  const tot=sess.reviewed,corr=sess.good+sess.easy,pct=tot>0?Math.round(corr/tot*100):0;
  document.getElementById('study-wrap').innerHTML=`<div class="done-box">
    <div class="done-icon"><i class="bi bi-patch-check-fill" style="color:var(--ac)"></i></div><h2>Sessione completata!</h2>
    <p>Hai ripassato tutte le carte disponibili per oggi.</p>
    <div class="done-row">
      <div class="done-stat"><div class="dn" style="color:var(--gr)">${corr}</div><div class="dl">Corrette</div></div>
      <div class="done-stat"><div class="dn" style="color:var(--re)">${sess.again}</div><div class="dl">Errori</div></div>
      <div class="done-stat"><div class="dn">${pct}%</div><div class="dl">Precisione</div></div>
      <div class="done-stat"><div class="dn">${tot}</div><div class="dl">Totale</div></div>
    </div>
    <div class="done-btns">
      <button class="btn btn-g" onclick="nav('dashboard')"><i class="bi bi-arrow-left"></i> Panoramica</button>
      ${studyDid?`<button class="btn btn-p" onclick="studyDeck('${studyDid}')">Studia ancora</button>`:''}
    </div>
  </div>`;
}

function updateStreak(){
  const today=new Date().toDateString(),yd=new Date();yd.setDate(yd.getDate()-1);const yest=yd.toDateString();
  // Controlla se almeno una carta è stata completata oggi in qualsiasi mazzo
  const doneSomething=Object.values(S.todayCounts[todayKey()]||{}).some(tc=>(tc.newDone||0)+(tc.revDone||0)>0);
  if(!doneSomething)return;
  if(S.lastStudyDate!==today){S.streak=S.lastStudyDate===yest?(S.streak||0)+1:1;S.lastStudyDate=today;}
}

// Swipe per rivelare (mobile)
let tx=0,ty=0;
document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',e=>{
  if(view!=='study'&&view!=='studyall')return;
  const dx=e.changedTouches[0].clientX-tx,dy=Math.abs(e.changedTouches[0].clientY-ty);
  if(dy<40&&dx>60)reveal();
},{passive:true});

// Nasconde la tastiera virtuale su mobile quando si toccano i bottoni di rating
document.addEventListener('touchstart',e=>{
  const rb=e.target.closest('.rate-btn,.show-btn');
  if(rb&&document.activeElement&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
    document.activeElement.blur();
  }
},{passive:true});

// Scorciatoie da tastiera (solo durante lo studio)
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(window.matchMedia('(hover:none)').matches)return;
  if(view!=='study'&&view!=='studyall')return;
  // Ignora combinazioni (Ctrl/Cmd+1 cambia scheda, Ctrl+Z è l'undo del browser) e tasti ripetuti
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();reveal();}
  if(e.key==='1')rate('again');if(e.key==='2')rate('hard');if(e.key==='3')rate('medium');if(e.key==='4')rate('easy');
  if(e.key==='b'||e.key==='B')buryCurrent();
  if(e.key==='z'||e.key==='Z')undoLast();
});

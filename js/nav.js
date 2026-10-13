// ═══════════════ SIDEBAR ═══════════════
function updateSidebar(){
  const due=totalDue();
  const b=document.getElementById('badge-tot');b.textContent=due;b.style.display=due>0?'':'none';
  document.getElementById('ft-cards').textContent=S.cards.length;
  document.getElementById('ft-due').textContent=due;
  document.getElementById('ft-streak').textContent=effectiveStreak();
  const el=document.getElementById('sb-decks');
  if(!S.decks.length){el.innerHTML='<div class="no-decks">Nessun mazzo.<br>Premi <strong>+</strong> per crearne uno.</div>';return;}
  el.innerHTML=S.decks.map(d=>{
    const c=deckCounts(d.id),tot=c.rev+c.newC+c.learn;
    const parts=[];if(c.rev>0)parts.push(`<span class="rc">${c.rev}</span>`);if(c.newC>0)parts.push(`<span class="nc">${c.newC}</span>`);
    return`<div class="deck-item" onclick="studyDeck('${d.id}')">
      <div class="ddot" style="background:${d.color}"></div>
      <span class="dname">${esc(d.name)}</span>
      <div class="d-right">
        <div class="d-counts">${parts.join(' · ')||(tot===0?'<span style="color:var(--tx4)"><i class="bi bi-check2"></i></span>':'')}</div>
        <div class="d-btns">
          <button class="ibt" onclick="event.stopPropagation();openEditDeck('${d.id}')" title="Modifica"><i class="bi bi-pencil"></i></button>
          <button class="ibt del" onclick="event.stopPropagation();promptDelDeck('${d.id}')" title="Elimina"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════ NAVIGATION ═══════════════
const TITLES={dashboard:'Panoramica',studyall:'Studia tutto',study:'Studio',manage:'Gestisci mazzi',add:'Aggiungi carta',browse:'Sfoglia carte',stats:'Statistiche',import:'Importa CSV',mnemonic:'Mnemotecnica',settings:'Impostazioni'};
function nav(name,opts={}){
  closeMob();
  const vid='view-'+(name==='studyall'?'study':name);
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(vid)?.classList.add('active');
  // Aggiorna nav-item attivo nella sidebar
  document.querySelectorAll('.nav-item').forEach(el=>{
    const oc=el.getAttribute('onclick')||'';
    el.classList.toggle('active',oc.includes(`'${name}'`));
  });
  view=name;
  if(name!=='study'&&name!=='studyall')document.title='Mnemosyne';
  document.getElementById('tb-title').textContent=TITLES[name]||name;
  const r=document.getElementById('tb-right');
  if(name==='dashboard')r.innerHTML=`<button class="btn btn-p btn-sm" onclick="nav('add')"><i class="bi bi-plus-lg"></i> Carta</button>`;
  else if(name==='manage')r.innerHTML=`<button class="btn btn-p btn-sm" onclick="openNewDeck()"><i class="bi bi-plus-lg"></i> Nuovo mazzo</button>`;
  else if(name==='browse')r.innerHTML=`<button class="btn btn-s btn-sm" onclick="exportCSV()"><i class="bi bi-download"></i> Esporta</button><button class="btn btn-p btn-sm" onclick="nav('add')"><i class="bi bi-plus-lg"></i> Carta</button>`;
  else r.innerHTML='';
  pomoRender();
  ({
    dashboard:renderDashboard,
    studyall:()=>startStudy(null),
    study:()=>startStudy(opts.deckId),
    manage:renderManage,
    add:()=>{buildSels();opts.editId?loadCardEdit(opts.editId):resetEditor();},
    browse:renderBrowse,
    stats:renderStats,
    import:()=>{buildSels();buildInlineSwatches();cancelInlineDeck();},
    mnemonic:renderMnemonic,
    settings:renderSettingsView,
  })[name]?.();
  updateSidebar();
}

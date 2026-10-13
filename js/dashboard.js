// ═══════════════ DASHBOARD ═══════════════
function renderDashboard(){
  const due=totalDue();
  document.getElementById('dash-h1').innerHTML=due>0?`Hai <em>${due}</em> cart${due===1?'a':'e'} da ripassare.`:'Sei in pari. <em>Ottimo!</em>';
  document.getElementById('dash-sub').textContent=due>0?'Seleziona un mazzo qui sotto per iniziare.':'Aggiungi nuove carte o crea un nuovo mazzo.';
  const grid=document.getElementById('decks-grid');
  let html=S.decks.map(deck=>{
    const c=deckCounts(deck.id),all=S.cards.filter(x=>x.deckId===deck.id);
    const rev=all.filter(x=>x.repetitions>0).length,pct=all.length?Math.round(rev/all.length*100):0;
    const tot=c.rev+c.newC+c.learn;
    return`<div class="deck-card" style="--dc:${deck.color}">
      <div class="dk-stripe"></div>
      <div class="dk-body">
        <div class="dk-name">${esc(deck.name)}</div>
        <div class="dk-meta">${all.length} carte · ${pct}% revisionate</div>
        <div class="dk-prog"><div class="dk-prog-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="dk-stats">
        <div class="dkst snew"><div class="dn">${c.newC}</div><div class="dl">Nuove</div></div>
        <div class="dkst slearn"><div class="dn">${c.learn}</div><div class="dl">In studio</div></div>
        <div class="dkst srev"><div class="dn">${c.rev}</div><div class="dl">Ripasso</div></div>
      </div>
      <div class="dk-actions">
        <button class="da-btn study" onclick="studyDeck('${deck.id}')"><i class="bi bi-play-fill"></i> ${tot>0?`Studia (${tot})`:'Studia'}</button>
        <button class="da-btn" onclick="nav('add');setTimeout(()=>{const s=document.getElementById('card-deck-sel');if(s)s.value='${deck.id}'},50)" title="Aggiungi carta"><i class="bi bi-plus-lg"></i></button>
        <button class="da-btn" onclick="openSettings('${deck.id}')" title="Impostazioni"><i class="bi bi-gear"></i></button>
        <button class="da-btn" onclick="openEditDeck('${deck.id}')" title="Modifica"><i class="bi bi-pencil"></i></button>
        <button class="da-btn danger" onclick="promptDelDeck('${deck.id}')" title="Elimina"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`;
  }).join('');
  html+=`<div class="deck-add" onclick="openNewDeck()"><div class="plus">+</div><div class="lbl">Crea nuovo mazzo</div></div>`;
  grid.innerHTML=html;
}

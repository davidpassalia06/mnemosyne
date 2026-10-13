// ═══════════════ ADD/EDIT CARD ═══════════════
// ═══════════════ ADD/EDIT CARD ═══════════════
function buildSels(){
  const opts=S.decks.length?S.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join(''):'<option value="">Nessun mazzo</option>';
  ['card-deck-sel','import-deck-sel'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=opts;});
  const bf=document.getElementById('browse-deck-f');
  if(bf)bf.innerHTML='<option value="">Tutti i mazzi</option>'+S.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('');
}
function updatePreview(){
  const q=document.getElementById('card-front')?.value.trim()||'';
  const a=document.getElementById('card-back')?.value.trim()||'';
  const pq=document.getElementById('prev-q'),pa=document.getElementById('prev-a');
  pq.textContent=q||'La domanda apparirà qui';pq.classList.toggle('ok',!!q);
  pa.textContent=a||'La risposta';pa.classList.toggle('ok',!!a);
  if(q||a)typeset([pq,pa]);
}
function saveCard(addAnother){
  const front=document.getElementById('card-front').value.trim();
  const back=document.getElementById('card-back').value.trim();
  const deckId=document.getElementById('card-deck-sel').value;
  const tags=document.getElementById('card-tags').value.trim();
  const editId=document.getElementById('edit-card-id').value;
  if(!front||!back){toast('Compila domanda e risposta.');return;}
  if(!deckId){toast('Crea almeno un mazzo prima.');return;}
  if(editId){const i=S.cards.findIndex(c=>c.id===editId);if(i!==-1)Object.assign(S.cards[i],{front,back,tags,deckId});toast('Carta aggiornata!');document.getElementById('edit-card-id').value='';}
  else{S.cards.push(mkCard(deckId,front,back,tags));toast('Carta salvata!');}
  save();if(addAnother)resetEditor();else nav('browse');
}
function resetEditor(){
  ['card-front','card-back','card-tags'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('edit-card-id').value='';
  document.getElementById('editor-h2').textContent='Aggiungi una carta';
  document.getElementById('save-btn').textContent='Salva carta';
  updatePreview();
}
function loadCardEdit(id){
  const c=S.cards.find(c=>c.id===id);if(!c)return;
  buildSels();
  document.getElementById('card-front').value=c.front;
  document.getElementById('card-back').value=c.back;
  document.getElementById('card-tags').value=c.tags||'';
  document.getElementById('card-deck-sel').value=c.deckId;
  document.getElementById('edit-card-id').value=id;
  document.getElementById('editor-h2').textContent='Modifica carta';
  document.getElementById('save-btn').textContent='Aggiorna carta';
  updatePreview();
}

function promptDelCard(id){delCardId=id;openOv('del-card');}
function doDelCard(){S.cards=S.cards.filter(c=>c.id!==delCardId);save();closeOv('del-card');toast('Carta eliminata.');renderBrowse();updateSidebar();delCardId=null;}

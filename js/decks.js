// ═══════════════ GESTISCI MAZZI ═══════════════
// ═══════════════ GESTISCI MAZZI ═══════════════
function renderManage(){
  const body=document.getElementById('manage-body');
  if(!S.decks.length){body.innerHTML=`<div class="empty"><div class="empty-ico"><i class="bi bi-journals"></i></div><h3>Nessun mazzo</h3><p>Crea il tuo primo mazzo.</p><button class="btn btn-p" onclick="openNewDeck()"><i class="bi bi-plus-lg"></i> Nuovo mazzo</button></div>`;return;}
  const isMob=window.innerWidth<=640;
  if(isMob){
    body.innerHTML=`<div class="mgmt-cards">${S.decks.map(d=>{
      const all=S.cards.filter(c=>c.deckId===d.id),susp=all.filter(c=>c.suspended).length,c=d.settings||DEF;
      return`<div class="mgmt-card">
        <div class="mgmt-card-head">
          <div class="ddot" style="background:${d.color};width:9px;height:9px;border-radius:50%;flex-shrink:0"></div>
          <strong style="flex:1;font-size:14.5px">${esc(d.name)}</strong>
        </div>
        <div class="mgmt-card-body">
          <div class="mgmt-card-stat"><div class="mn">${all.length}</div><div class="ml">Carte</div></div>
          <div class="mgmt-card-stat"><div class="mn">${c.newLimit}</div><div class="ml">Nuove/gg</div></div>
          <div class="mgmt-card-stat"><div class="mn" style="${susp>0?'color:var(--re)':''}">${susp||'—'}</div><div class="ml">Sospese</div></div>
        </div>
        <div class="mgmt-card-actions">
          <button class="btn btn-g" onclick="openSettings('${d.id}')"><i class="bi bi-gear"></i> Impost.</button>
          <button class="btn btn-g" onclick="openEditDeck('${d.id}')"><i class="bi bi-pencil"></i> Modifica</button>
          <button class="btn btn-d" onclick="promptDelDeck('${d.id}')"><i class="bi bi-trash3"></i></button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }else{
    body.innerHTML=`<div class="tbl-wrap"><table class="mgmt-tbl">
      <thead><tr><th>Mazzo</th><th>Carte</th><th>Nuove/giorno</th><th>Ripassi/giorno</th><th>Sospese</th><th></th></tr></thead>
      <tbody>${S.decks.map(d=>{
        const all=S.cards.filter(c=>c.deckId===d.id),susp=all.filter(c=>c.suspended).length,c=d.settings||DEF;
        return`<tr>
          <td><span class="cdot" style="background:${d.color}"></span><strong>${esc(d.name)}</strong></td>
          <td style="color:var(--tx2)">${all.length}</td><td style="color:var(--tx2)">${c.newLimit}</td><td style="color:var(--tx2)">${c.revLimit}</td>
          <td>${susp>0?`<span style="color:var(--re)">${susp}</span>`:'—'}</td>
          <td><div class="td-acts">
            <button class="btn btn-g btn-xs" onclick="openSettings('${d.id}')"><i class="bi bi-gear"></i> Impostazioni</button>
            <button class="btn btn-g btn-xs" onclick="openEditDeck('${d.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-d btn-xs" onclick="promptDelDeck('${d.id}')"><i class="bi bi-trash3"></i></button>
          </div></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  }
}

// ═══════════════ DECK CRUD ═══════════════
// ═══════════════ DECK CRUD ═══════════════
function buildSwatches(cid,cur){document.getElementById(cid).innerHTML=COLORS.map(c=>`<div class="cswatch${c===cur?' active':''}" style="background:${c}" onclick="pickColor(this,'${c}','${cid}')"></div>`).join('');}
function pickColor(el,c,cid){selColor=c;document.querySelectorAll(`#${cid} .cswatch`).forEach(s=>s.classList.remove('active'));el.classList.add('active');}
function openNewDeck(){selColor=COLORS[0];document.getElementById('deck-name-inp').value='';document.getElementById('edit-deck-id').value='';document.getElementById('modal-deck-h').textContent='Nuovo mazzo';buildSwatches('color-swatches',selColor);openOv('deck');setTimeout(()=>document.getElementById('deck-name-inp').focus(),80);}
function openEditDeck(id){const d=getDeck(id);if(!d)return;selColor=d.color;document.getElementById('deck-name-inp').value=d.name;document.getElementById('edit-deck-id').value=id;document.getElementById('modal-deck-h').textContent='Modifica mazzo';buildSwatches('color-swatches',selColor);openOv('deck');setTimeout(()=>document.getElementById('deck-name-inp').focus(),80);}
function saveDeck(){
  const name=document.getElementById('deck-name-inp').value.trim();if(!name){toast('Inserisci un nome.');return;}
  const id=document.getElementById('edit-deck-id').value;
  if(id){const i=S.decks.findIndex(d=>d.id===id);if(i!==-1)Object.assign(S.decks[i],{name,color:selColor});toast('Mazzo aggiornato!');}
  else{S.decks.push({id:uid(),name,color:selColor,created:Date.now(),settings:{...DEF}});toast('Mazzo creato!');}
  save();closeOv('deck');if(view==='dashboard')renderDashboard();if(view==='manage')renderManage();buildSels();updateSidebar();
}
function openSettings(did){
  const d=getDeck(did);if(!d)return;const c=d.settings||{...DEF};
  document.getElementById('s-deck-name').textContent=d.name;document.getElementById('s-deck-id').value=did;
  document.getElementById('s-new-limit').value=c.newLimit;document.getElementById('s-rev-limit').value=c.revLimit;
  document.getElementById('s-learn-steps').value=(Array.isArray(c.learnSteps)?c.learnSteps:[1,10,1440]).join(' ');
  document.getElementById('s-relearn-steps').value=(Array.isArray(c.relearnSteps)?c.relearnSteps:[10,1440]).join(' ');
  document.getElementById('s-max-iv').value=c.maxInterval;document.getElementById('s-leech').value=c.leechThreshold;
  document.getElementById('s-order').value=c.newOrder||'due';
  document.getElementById('s-new-interval').value=Math.round((c.newInterval||0)*100);
  openOv('settings');
}
function saveSettings(){
  const id=document.getElementById('s-deck-id').value,d=getDeck(id);if(!d)return;
  const ls=parseSteps(document.getElementById('s-learn-steps').value),rs=parseSteps(document.getElementById('s-relearn-steps').value);
  if(!ls.length||!rs.length)toast('Passi non validi: uso i valori predefiniti.');
  d.settings={
    newLimit:Math.max(1,parseInt(document.getElementById('s-new-limit').value)||20),
    revLimit:Math.max(1,parseInt(document.getElementById('s-rev-limit').value)||60),
    learnSteps:ls.length?ls:[...DEF.learnSteps],
    relearnSteps:rs.length?rs:[...DEF.relearnSteps],
    maxInterval:Math.max(1,parseInt(document.getElementById('s-max-iv').value)||36500),
    leechThreshold:Math.max(1,parseInt(document.getElementById('s-leech').value)||8),
    newOrder:document.getElementById('s-order').value,
    newInterval:Math.min(1,Math.max(0,parseInt(document.getElementById('s-new-interval').value)||0)/100),
  };
  save();closeOv('settings');toast('Impostazioni salvate!');if(view==='manage')renderManage();updateSidebar();
}
function promptDelDeck(id){delDeckId=id;openOv('del-deck');}
function doDelDeck(){S.cards=S.cards.filter(c=>c.deckId!==delDeckId);S.decks=S.decks.filter(d=>d.id!==delDeckId);save();closeOv('del-deck');toast('Mazzo eliminato.');if(view==='dashboard')renderDashboard();if(view==='manage')renderManage();updateSidebar();delDeckId=null;}

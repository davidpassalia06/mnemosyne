// ═══════════════ BROWSE ═══════════════
let browseSort={col:'created',dir:1};
function setBrowseSort(col){
  if(browseSort.col===col)browseSort.dir*=-1;else{browseSort.col=col;browseSort.dir=1;}
  renderBrowse();
}
function renderBrowse(){
  const bdf=document.getElementById('browse-deck-f');
  const savedDeck=bdf?.value||'';
  buildSels();
  if(bdf&&savedDeck)bdf.value=savedDeck;
  const search=(document.getElementById('browse-search')?.value||'').toLowerCase();
  const df=bdf?.value||'';
  const sf=document.getElementById('browse-status-f')?.value||'';
  let cards=S.cards;
  if(df)cards=cards.filter(c=>c.deckId===df);
  if(sf)cards=cards.filter(c=>sf==='suspended'?c.suspended:c.status===sf);
  if(search)cards=cards.filter(c=>c.front.toLowerCase().includes(search)||c.back.toLowerCase().includes(search)||(c.tags||'').toLowerCase().includes(search));
  // Ordinamento
  const{col,dir}=browseSort;
  cards=[...cards].sort((a,b)=>{
    let va=a[col]??0,vb=b[col]??0;
    if(typeof va==='string')va=va.toLowerCase(),vb=String(vb).toLowerCase();
    return va<vb?-dir:va>vb?dir:0;
  });
  document.getElementById('browse-count').textContent=`${cards.length} carta${cards.length===1?'':'e'}`;
  const body=document.getElementById('browse-body');
  if(!cards.length){body.innerHTML=`<div class="empty"><div class="empty-ico"><i class="bi bi-search"></i></div><h3>Nessuna carta trovata</h3><p>${search?'Prova un termine diverso.':'Aggiungi la tua prima carta.'}</p><button class="btn btn-p" onclick="nav('add')"><i class="bi bi-plus-lg"></i> Aggiungi carta</button></div>`;return;}
  const sm={new:'Nuova',learning:'In studio',relearning:'Reapprend.',review:'Ripasso',mature:'Matura',suspended:'Sospesa'};
  const sc={new:'s-new',learning:'s-learning',relearning:'s-relearning',review:'s-review',mature:'s-mature',suspended:'s-suspended'};
  const isMob=window.innerWidth<=640;
  if(isMob){
    body.innerHTML=`<div class="browse-mob-cards">${cards.map(c=>{
      const d=getDeck(c.deckId),sk=c.suspended?'suspended':c.status;
      return`<div class="mgmt-card">
        <div class="mgmt-card-head" style="gap:10px;flex-wrap:nowrap">
          <span class="status-pill ${sc[sk]||'s-new'}" style="flex-shrink:0">${sm[sk]||'Nuova'}</span>
          <span style="flex:1;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(c.front)}">${esc(c.front)}</span>
        </div>
        <div style="padding:8px 14px 10px;font-size:13px;color:var(--tx2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(c.back)}</div>
        <div style="padding:0 14px 10px;display:flex;gap:10px;font-size:11px;color:var(--tx3)">
          ${d?`<span><span class="cdot" style="background:${d.color}"></span>${esc(d.name)}</span>`:''}
          <span>Ripasso: ${fmtDate(c.dueDate)}</span>
          ${c.interval>0?`<span>Int: ${c.interval}gg</span>`:''}
          ${c.lapses>0?`<span style="color:var(--re)">Err: ${c.lapses}</span>`:''}
        </div>
        <div class="mgmt-card-actions">
          ${c.suspended?`<button class="btn btn-g" onclick="toggleSusp('${c.id}')"><i class="bi bi-play-fill"></i> Riattiva</button>`:`<button class="btn btn-g" onclick="toggleSusp('${c.id}')"><i class="bi bi-pause-fill"></i> Sospendi</button>`}
          <button class="btn btn-g" onclick="nav('add',{editId:'${c.id}'})"><i class="bi bi-pencil"></i> Modifica</button>
          <button class="btn btn-d" onclick="promptDelCard('${c.id}')"><i class="bi bi-trash3"></i></button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }else{
    body.innerHTML=`<div class="tbl-wrap"><table class="ct">
      <thead><tr>
        <th onclick="setBrowseSort('front')" style="cursor:pointer">Domanda ${browseSort.col==='front'?(browseSort.dir===1?'↑':'↓'):''}</th>
        <th>Risposta</th>
        <th>Mazzo</th>
        <th onclick="setBrowseSort('status')" style="cursor:pointer">Stato ${browseSort.col==='status'?(browseSort.dir===1?'↑':'↓'):''}</th>
        <th onclick="setBrowseSort('dueDate')" style="cursor:pointer">Prossimo ripasso ${browseSort.col==='dueDate'?(browseSort.dir===1?'↑':'↓'):''}</th>
        <th onclick="setBrowseSort('interval')" style="cursor:pointer">Int. ${browseSort.col==='interval'?(browseSort.dir===1?'↑':'↓'):''}</th>
        <th onclick="setBrowseSort('lapses')" style="cursor:pointer">Err. ${browseSort.col==='lapses'?(browseSort.dir===1?'↑':'↓'):''}</th>
        <th></th>
      </tr></thead>
      <tbody>${cards.map(c=>{
        const d=getDeck(c.deckId),sk=c.suspended?'suspended':c.status;
        return`<tr>
          <td class="td-clip" title="${esc(c.front)}">${esc(c.front)}</td>
          <td class="td-clip" style="color:var(--tx2)" title="${esc(c.back)}">${esc(c.back)}</td>
          <td><span class="cdot" style="background:${d?.color||'#888'}"></span>${esc(d?.name||'—')}</td>
          <td><span class="status-pill ${sc[sk]||'s-new'}">${sm[sk]||'Nuova'}</span></td>
          <td style="font-size:12px;color:var(--tx2)">${fmtDate(c.dueDate)}</td>
          <td style="font-size:12px;color:var(--tx3)">${c.interval>0?c.interval+'gg':'—'}</td>
          <td style="font-size:12px;color:${c.lapses>0?'var(--re)':'var(--tx3)'}">${c.lapses||0}</td>
          <td><div class="td-acts">
            ${c.suspended?`<button class="btn btn-g btn-xs" onclick="toggleSusp('${c.id}')"><i class="bi bi-play-fill"></i></button>`:`<button class="btn btn-g btn-xs" onclick="toggleSusp('${c.id}')"><i class="bi bi-pause-fill"></i></button>`}
            <button class="btn btn-g btn-xs" onclick="nav('add',{editId:'${c.id}'})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-d btn-xs" onclick="promptDelCard('${c.id}')"><i class="bi bi-trash3"></i></button>
          </div></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  }
}
function toggleSusp(id){
  const c=S.cards.find(c=>c.id===id);if(!c)return;
  c.suspended=!c.suspended;
  if(!c.suspended)c.status=c.repetitions>0?(c.interval>=21?'mature':'review'):'new';
  else c.status='suspended';
  save();renderBrowse();updateSidebar();toast(c.suspended?'Carta sospesa.':'Carta riattivata.');
}

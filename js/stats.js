// ═══════════════ STATISTICHE ═══════════════
function renderStats(){
  const tabs=document.getElementById('stats-tabs');
  tabs.innerHTML=`<div class="stats-tab${!statsDid?' active':''}" onclick="setStatsDid(null)">Globale</div>`+
    S.decks.map(d=>`<div class="stats-tab${statsDid===d.id?' active':''}" onclick="setStatsDid('${d.id}')">${esc(d.name)}</div>`).join('');
  renderStatsBody();
}
function setStatsDid(did){statsDid=did;renderStats();}
function renderStatsBody(){
  const did=statsDid;
  const cards=did?S.cards.filter(c=>c.deckId===did):S.cards;
  const revs=did?S.reviews.filter(r=>r.deckId===did):S.reviews;
  const total=cards.length,mature=cards.filter(c=>c.status==='mature').length;
  const susp=cards.filter(c=>c.suspended).length,leeches=cards.filter(c=>c.lapses>0&&c.lapses>=(cfg(c.deckId).leechThreshold||8)).length;
  const todayRevs=revs.filter(r=>new Date(r.date).toDateString()===new Date().toDateString()).length;
  const dist={new:0,learning:0,relearning:0,review:0,mature:0,suspended:0};
  cards.forEach(c=>{const k=c.suspended?'suspended':c.status;dist[k]=(dist[k]||0)+1;});
  // Previsione: esclude le carte nuove (non hanno una scadenza) e include gli arretrati in "Oggi"
  const fc=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);d.setHours(0,0,0,0);const e=new Date(d);e.setDate(e.getDate()+1);fc.push({l:i===0?'Oggi':`+${i}gg`,n:cards.filter(c=>!c.suspended&&c.status!=='new'&&(i===0||c.dueDate>=d.getTime())&&c.dueDate<e.getTime()).length});}
  const studyDays=new Set(revs.map(r=>new Date(r.date).toDateString())).size;
  const maxFc=Math.max(...fc.map(f=>f.n),1);
  const body=document.getElementById('stats-body');
  const distItems=[
    ['new','Nuove','var(--bl)'],['learning','In studio','var(--or)'],
    ['relearning','Reapprend.','var(--re)'],['review','Ripasso','var(--gr)'],
    ['mature','Mature','var(--ac)'],['suspended','Sospese','var(--tx3)']
  ].filter(([k])=>dist[k]>0);
  body.innerHTML=`
    <div class="stats-grid">
      <div class="stat-card"><div class="sbig">${total}</div><div class="slabel">Carte totali</div></div>
      <div class="stat-card"><div class="sbig">${mature}</div><div class="slabel">Mature</div></div>
      <div class="stat-card"><div class="sbig">${revs.length}</div><div class="slabel">Ripassi totali</div></div>
      <div class="stat-card"><div class="sbig">${todayRevs}</div><div class="slabel">Oggi</div></div>
      <div class="stat-card"><div class="sbig">${effectiveStreak()}</div><div class="slabel">Streak</div></div>
      <div class="stat-card"><div class="sbig">${susp}</div><div class="slabel">Sospese</div></div>
      <div class="stat-card"><div class="sbig">${leeches}</div><div class="slabel">Leech</div></div>
      <div class="stat-card"><div class="sbig">${studyDays?Math.round(revs.length/studyDays):0}</div><div class="slabel">Rip./giorno</div></div>
    </div>
    ${distItems.length?`<div class="chart-box">
      <h3>Distribuzione stati</h3>
      <div class="dist-pills">
        ${distItems.map(([k,l,col])=>`<div class="dist-pill"><div class="dist-n" style="color:${col}">${dist[k]}</div><div class="dist-l">${l}</div></div>`).join('')}
      </div>
    </div>`:''}
    <div class="chart-box">
      <h3>Ripassi previsti · 7 giorni</h3>
      <div class="fc-bars">
        ${fc.map(f=>`<div class="fc-col"><div class="fc-n">${f.n}</div><div class="fc-bar-wrap"><div class="fc-bar" style="height:${Math.round(f.n/maxFc*60)+2}px"></div></div><div class="fc-l">${f.l}</div></div>`).join('')}
      </div>
    </div>
    <div class="chart-box"><h3>Attività · ultime 12 settimane</h3><div class="heatmap" id="heatmap"></div></div>
    <div class="chart-box stats-chart-last"><h3>Ripassi per mazzo</h3><canvas id="bar-chart" height="120"></canvas></div>`;
  const byDay={};revs.forEach(r=>{const d=new Date(r.date).toDateString();byDay[d]=(byDay[d]||0)+1;});
  document.getElementById('heatmap').innerHTML=Array.from({length:84},(_,i)=>{const d=new Date(Date.now()-(83-i)*DAY).toDateString();const n=byDay[d]||0;return`<div class="hm-cell${n===0?'':n<5?' l1':n<15?' l2':n<30?' l3':' l4'}" title="${d}: ${n}"></div>`;}).join('');
  if(barChart){barChart.destroy();barChart=null;}
  const cv=document.getElementById('bar-chart');
  // Chart.js arriva da CDN: se manca (offline) si salta il grafico invece di bloccare la vista
  if(cv&&typeof Chart==='undefined'){cv.insertAdjacentHTML('afterend','<p style="font-size:12px;color:var(--tx3)">Grafico non disponibile offline.</p>');cv.remove();}
  const ctx=document.getElementById('bar-chart')?.getContext('2d');
  if(ctx){
    const show=did?[getDeck(did)].filter(Boolean):S.decks;
    barChart=new Chart(ctx,{type:'bar',data:{labels:show.map(d=>d.name),datasets:[{data:show.map(d=>S.reviews.filter(r=>r.deckId===d.id).length),backgroundColor:show.map(d=>d.color+'88'),borderColor:show.map(d=>d.color),borderWidth:1.5,borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8a8680',font:{family:'DM Sans'}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#8a8680',font:{family:'DM Sans'}},grid:{color:'rgba(255,255,255,0.04)'}}}}});
  }
}

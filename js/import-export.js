// ═══════════════ IMPORT / EXPORT ═══════════════
// Parser CSV completo: campi tra virgolette con virgole e a capo, CRLF, BOM (Excel).
function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');
  const rows=[];let row=[],cur='',inQ=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(inQ){
      if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++;}else inQ=false;}
      else cur+=ch;
    }else if(ch==='"'&&cur===''){inQ=true;}
    else if(ch===','){row.push(cur);cur='';}
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(cur);cur='';rows.push(row);row=[];
    }else cur+=ch;
  }
  row.push(cur);rows.push(row);
  return rows.filter(r=>r.length>=2)
    .map(r=>({front:r[0].trim(),back:r.slice(1).join(',').trim()}))
    .filter(c=>c.front&&c.back);
}
function loadFile(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>processImport(e.target.result);r.readAsText(f,'UTF-8');}
function dragOver(e){e.preventDefault();document.getElementById('import-zone').classList.add('drag');}
function dragLeave(){document.getElementById('import-zone').classList.remove('drag');}
function dropFile(e){e.preventDefault();dragLeave();const f=e.dataTransfer.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>processImport(ev.target.result);r.readAsText(f,'UTF-8');}
function processImport(text){
  importParsed=parseCSV(text);
  if(!importParsed.length){toast('Nessuna carta trovata.');return;}
  document.getElementById('import-count').textContent=importParsed.length;
  document.getElementById('import-n').textContent=importParsed.length;
  document.getElementById('import-list').innerHTML=importParsed.slice(0,8).map(c=>`<div class="prev-row"><div style="margin-bottom:2px">${esc(c.front.slice(0,80))}${c.front.length>80?'…':''}</div><div style="color:var(--tx2);font-size:12px">${esc(c.back.slice(0,80))}${c.back.length>80?'…':''}</div></div>`).join('')+(importParsed.length>8?`<div class="prev-row" style="color:var(--tx3);font-size:12px">…e altre ${importParsed.length-8} carte</div>`:'');
  document.getElementById('import-preview').style.display='';
}
function confirmImport(){
  const did=document.getElementById('import-deck-sel').value;
  if(!did){toast('Seleziona un mazzo.');return;}
  S.cards.push(...importParsed.map(c=>mkCard(did,c.front,c.back,'')));
  save();toast(`${importParsed.length} carte importate!`);cancelImport();nav('browse');
}
function cancelImport(){importParsed=[];document.getElementById('import-preview').style.display='none';document.getElementById('file-input').value='';}
// Quota un campo CSV quando contiene virgola, virgoletta o newline (non solo virgola).
function csvField(s){return /["\n\r,]/.test(s)?`"${String(s).replace(/"/g,'""')}"`:s;}
function exportCSV(){
  const df=document.getElementById('browse-deck-f')?.value||'';
  const cards=df?S.cards.filter(c=>c.deckId===df):S.cards;
  if(!cards.length){toast('Nessuna carta da esportare.');return;}
  const csv=cards.map(c=>`${csvField(c.front)},${csvField(c.back)}`).join('\n');
  dl(new Blob([csv],{type:'text/csv;charset=utf-8'}),'mnemosyne_export.csv');toast('CSV esportato!');
}
function exportBackup(){dl(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),`mnemosyne_backup_${new Date().toISOString().slice(0,10)}.json`);toast('Backup esportato!');}
function importBackup(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.decks||!d.cards)throw 0;S=normalizeState(d);save();nav('dashboard');toast('Backup ripristinato!');}catch{toast('File non valido.');}inp.value='';};r.readAsText(f,'UTF-8');}
function dl(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

// Inline nuovo mazzo
function buildInlineSwatches(){const el=document.getElementById('inline-swatches');if(!el)return;el.innerHTML=COLORS.map(c=>`<div class="cswatch${c===inlineColor?' active':''}" style="background:${c}" onclick="pickInline(this,'${c}')"></div>`).join('');}
function pickInline(el,c){inlineColor=c;document.querySelectorAll('#inline-swatches .cswatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');}
function openInlineNewDeck(){document.getElementById('inline-new').style.display='block';document.getElementById('import-new-btn').style.display='none';buildInlineSwatches();}
function cancelInlineDeck(){document.getElementById('inline-new').style.display='none';document.getElementById('import-new-btn').style.display='';}
function createInlineDeck(){
  const name=document.getElementById('inline-name').value.trim();
  if(!name){toast('Inserisci un nome.');return;}
  const d={id:uid(),name,color:inlineColor,created:Date.now(),settings:{...DEF}};
  S.decks.push(d);save();buildSels();
  document.getElementById('import-deck-sel').value=d.id;
  cancelInlineDeck();toast(`Mazzo "${name}" creato!`);updateSidebar();
}

// ═══════════════ CONVERTITORE MNEMONICO (fonetico + metodo PAV) ═══════════════
// Numero/formula → gruppi di cifre → suoni consonantici → parola/immagine (tua) →
// frase Paradosso-Azione-Vivido → salvata come carta nel normale ciclo SM-2.
// Integrato come vista normale (nav('mnemonic')), coerente con le altre sezioni.

// --- Sistema fonetico di default (variante Major System) — MODIFICABILE:
// basta cambiare le liste qui sotto, oppure editare appSettings.mnemonic.phoneticMap
// a runtime. Vocali e "H" sono jolly: non contano, servono a costruire parole vere.
const DEFAULT_PHONETIC_MAP={
  '0':['S/Z'],
  '1':['T/D'],
  '2':['N'],
  '3':['M'],
  '4':['R'],
  '5':['L'],
  '6':['C/G dolce (CI,CE / GI,GE)'],
  '7':['C/G dura (CA,CO,CU / GA,GO,GU), Q, K'],
  '8':['F/V'],
  '9':['P/B'],
};

function defaultMnemonicSettings(){
  return{groupSize:2,phoneticMap:JSON.parse(JSON.stringify(DEFAULT_PHONETIC_MAP)),pegList:{}};
}
// Le impostazioni salvate potrebbero non avere ancora questa sezione (utenti che
// aggiornano da una versione precedente): la creiamo al volo se manca, senza
// toccare loadAppSettings() — stesso principio di normalizeState() in state.js.
function ensureMnemonicSettings(){
  if(!appSettings.mnemonic){appSettings.mnemonic=defaultMnemonicSettings();saveAppSettings();}
  return appSettings.mnemonic;
}

// --- Logica pura, senza DOM: facilmente testabile in isolamento ---

// Estrae i gruppi di cifre da un testo (numero o formula), ignorando il resto.
// "3,14159" con groupSize=2 → ['31','41','59']
function extractDigitGroups(input,groupSize){
  const digits=String(input).replace(/[^0-9]/g,'');
  if(!digits)return[];
  const groups=[];
  for(let i=0;i<digits.length;i+=groupSize)groups.push(digits.slice(i,i+groupSize));
  return groups;
}

// Per un gruppo di cifre, ritorna il suono suggerito per ciascuna (il primo della lista).
function consonantsForGroup(group,phoneticMap){
  return group.split('').map(d=>(phoneticMap[d]&&phoneticMap[d][0])||'?');
}

// --- Peg list personale: gruppo di cifre → parola/immagine scelta dall'utente ---
function getPegWord(group){return ensureMnemonicSettings().pegList[group]||'';}
function savePegWord(group,word){
  const m=ensureMnemonicSettings();
  if(word)m.pegList[group]=word;else delete m.pegList[group];
  saveAppSettings();
}

// --- UI: vista agganciata a nav('mnemonic') ---
let _mnLastGroups=[];

// Chiamata dal dispatch di nav.js ogni volta che si entra nella vista: la
// riporta a uno stato pulito (stesso principio di resetEditor() per 'add').
function renderMnemonic(){
  const m=ensureMnemonicSettings();
  const gsSel=document.getElementById('mn-group-size');
  gsSel.innerHTML=[2,3].map(n=>`<option value="${n}">${n} cifre/gruppo</option>`).join('');
  gsSel.value=m.groupSize;
  gsSel.onchange=()=>{ensureMnemonicSettings().groupSize=parseInt(gsSel.value);saveAppSettings();};
  document.getElementById('mn-input').value='';
  document.getElementById('mn-breakdown').innerHTML='';
  document.getElementById('mn-phrase-wrap').style.display='none';
  document.getElementById('mn-phrase').value='';
  _mnLastGroups=[];
}

function mnGenerate(){
  const raw=document.getElementById('mn-input').value.trim();
  if(!raw){toast('Inserisci un numero o una formula.');return;}
  const m=ensureMnemonicSettings();
  const groups=extractDigitGroups(raw,m.groupSize);
  if(!groups.length){toast('Nessuna cifra trovata nel testo inserito.');return;}
  _mnLastGroups=groups;
  const rows=groups.map(g=>{
    const cons=consonantsForGroup(g,m.phoneticMap).join(' · ');
    const saved=esc(getPegWord(g));
    return`<tr>
      <td style="padding:6px 8px;border-bottom:1px solid var(--bo);font-weight:700;letter-spacing:1px">${esc(g)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--bo);color:var(--tx2);font-size:13px">${esc(cons)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid var(--bo)"><input class="fi" type="text" data-group="${esc(g)}"
        value="${saved}" placeholder="parola/immagine" style="width:160px" onchange="mnWordChanged(this)"></td>
    </tr>`;
  }).join('');
  document.getElementById('mn-breakdown').innerHTML=`
    <table style="width:100%;border-collapse:collapse;margin:14px 0">
      <thead><tr style="font-size:12px;color:var(--tx3)">
        <td style="padding:6px 8px">Gruppo</td><td style="padding:6px 8px">Suoni</td><td style="padding:6px 8px">Parola</td>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  document.getElementById('mn-phrase-wrap').style.display='';
  const deckSel=document.getElementById('mn-deck-sel');
  deckSel.innerHTML=S.decks.length
    ?S.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')
    :'<option value="">Nessun mazzo</option>';
}

function mnWordChanged(el){
  savePegWord(el.dataset.group,el.value.trim());
}

function mnSaveAsCard(){
  const raw=document.getElementById('mn-input').value.trim();
  const phrase=document.getElementById('mn-phrase').value.trim();
  const did=document.getElementById('mn-deck-sel').value;
  if(!did){toast('Crea almeno un mazzo prima.');return;}
  if(!phrase){toast('Scrivi la frase mnemonica prima di salvare.');return;}
  const words=_mnLastGroups.map(g=>getPegWord(g)||'?').join(' – ');
  const back=`${phrase}\n\n(Immagini: ${words})`;
  S.cards.push(mkCard(did,raw,back,'mnemonica'));
  save();
  toast('Carta mnemonica salvata!');
  renderMnemonic();
  updateSidebar();
}

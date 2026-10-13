// ═══════════════ OVERLAY ═══════════════
// ═══════════════ OVERLAY ═══════════════
function openOv(n){document.getElementById('ov-'+n).classList.add('open');}
function closeOv(n){document.getElementById('ov-'+n).classList.remove('open');}
document.addEventListener('click',e=>{if(e.target.classList.contains('overlay'))e.target.classList.remove('open');});

// ═══════════════ MOBILE ═══════════════
// ═══════════════ MOBILE ═══════════════
function openMob(){document.getElementById('sidebar').classList.add('mob-open');document.getElementById('mob-ov').classList.add('open');}
function closeMob(){document.getElementById('sidebar').classList.remove('mob-open');document.getElementById('mob-ov').classList.remove('open');}

// ═══════════════ TOAST ═══════════════
// ═══════════════ TOAST ═══════════════
let toastT;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800);}

// ═══════════════ UTILS ═══════════════
// ═══════════════ UTILS ═══════════════
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function fmtDate(ts){const diff=Math.round((ts-Date.now())/DAY);if(diff<=0)return'<span style="color:var(--gr)">Oggi</span>';if(diff===1)return'Domani';if(diff<7)return`tra ${diff} gg`;if(diff<30)return`tra ${Math.round(diff/7)} sett.`;return`tra ${Math.round(diff/30)} mes.`;}

// Chiude qualsiasi overlay aperto con Escape (scorciatoia globale)
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
});

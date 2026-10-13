// ═══════════════ TEMA ═══════════════
function applyTheme(idx){
  const t=THEMES[idx]||THEMES[0];
  const r=document.documentElement.style;
  r.setProperty('--ac',t.ac);
  r.setProperty('--ac2',t.ac2);
  r.setProperty('--adim',t.adim);
  // Aggiorna anche le celle heatmap se già presenti
  document.querySelectorAll('.hm-cell.l1,.hm-cell.l2,.hm-cell.l3,.hm-cell.l4').forEach(el=>{
    const rgb=hexToRgb(t.ac);
    if(!rgb)return;
    const lv=el.classList.contains('l1')?.2:el.classList.contains('l2')?.42:el.classList.contains('l3')?.68:.9;
    el.style.background=`rgba(${rgb},${lv})`;
  });
}
function hexToRgb(hex){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:null;}

function renderSettingsView(){
  buildThemeSwatches();
  pomoFillSettings();
  fbRestoreFields();
  fbUpdateUI();
}
function buildThemeSwatches(){
  const el=document.getElementById('theme-swatches');if(!el)return;
  el.innerHTML=THEMES.map((t,i)=>`<div class="tswatch${i===appSettings.themeIdx?' active':''}" style="background:${t.ac}" title="${t.name}" onclick="pickTheme(${i})"></div>`).join('');
}
function pickTheme(idx){
  appSettings.themeIdx=idx;
  saveAppSettings();
  applyTheme(idx);
  buildThemeSwatches();
  toast(`Tema "${THEMES[idx].name}" applicato.`);
}

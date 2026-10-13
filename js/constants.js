// ═══════════════ COSTANTI ═══════════════
const SK='mnemosyne_v5',DAY=864e5,MIN=6e4;
const SETTINGS_KEY='mnemosyne_settings';
const COLORS=['#c8a96e','#4a9c6e','#5c8ab8','#b85c5c','#9c6eb8','#c87a3e','#5cb8b0','#7eb85c','#b8a05c'];

// Palette temi: [accent, accent2, adim]
const THEMES=[
  {name:'Ambra',    ac:'#c8a96e',ac2:'#e8c99a',adim:'rgba(200,169,110,0.13)'},
  {name:'Smeraldo', ac:'#4a9c6e',ac2:'#6ec995',adim:'rgba(74,156,110,0.13)'},
  {name:'Oceano',   ac:'#5c8ab8',ac2:'#80aed4',adim:'rgba(92,138,184,0.13)'},
  {name:'Rosa',     ac:'#c46e9a',ac2:'#e89fc2',adim:'rgba(196,110,154,0.13)'},
  {name:'Viola',    ac:'#9c6eb8',ac2:'#c499d4',adim:'rgba(156,110,184,0.13)'},
  {name:'Ardesia',  ac:'#8a9c6e',ac2:'#b0c490',adim:'rgba(138,156,110,0.13)'},
  {name:'Argento',  ac:'#909090',ac2:'#c0c0c0',adim:'rgba(144,144,144,0.13)'},
];
const DEF={newLimit:20,revLimit:60,learnSteps:[1,10,1440],relearnSteps:[10,1440],maxInterval:36500,leechThreshold:8,newOrder:'due',newInterval:0};

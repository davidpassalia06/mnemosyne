// ═══════════════ COMPUTED ═══════════════
function deckCounts(did){
  const now=Date.now(),tc=getTc(did),c=cfg(did);
  const rev=Math.min(S.cards.filter(x=>x.deckId===did&&!x.suspended&&(x.status==='review'||x.status==='mature')&&x.dueDate<=now).length,Math.max(0,c.revLimit-tc.revDone));
  const newC=Math.min(S.cards.filter(x=>x.deckId===did&&!x.suspended&&x.status==='new'&&x.dueDate<=now).length,Math.max(0,c.newLimit-tc.newDone));
  const learn=S.cards.filter(x=>x.deckId===did&&!x.suspended&&(x.status==='learning'||x.status==='relearning')&&x.dueDate<=now).length;
  return{rev,newC,learn};
}
function totalDue(){return S.decks.reduce((a,d)=>{const c=deckCounts(d.id);return a+c.rev+c.newC+c.learn;},0);}

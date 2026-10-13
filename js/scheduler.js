// ═══════════════ SM-2 COMPLETO ═══════════════
function sm2(card,rating){
  const c=cfg(card.deckId);
  let{interval,easeFactor,repetitions,lapses,stepIdx,status}=card;
  const ls=getSteps(card.deckId,'learn'),rs=getSteps(card.deckId,'relearn');
  let due,ns;

  if(status==='new'||status==='learning'){
    if(rating==='again'){
      stepIdx=0;ns='learning';due=Date.now()+ls[0]*MIN;
    }else if(rating==='easy'){
      interval=Math.min(Math.max(4,Math.round(ls[ls.length-1]/1440*easeFactor)),c.maxInterval);
      repetitions=1;ns=interval>=21?'mature':'review';due=Date.now()+interval*DAY;stepIdx=ls.length;
    }else if(rating==='medium'){
      stepIdx=Math.min(stepIdx+1,ls.length);
      if(stepIdx>=ls.length){interval=Math.min(Math.max(1,Math.round(ls[ls.length-1]/1440)),c.maxInterval);repetitions=1;ns=interval>=21?'mature':'review';due=Date.now()+interval*DAY;}
      else{ns='learning';due=Date.now()+ls[stepIdx]*MIN;}
    }else{
      // Hard in learning: media tra step corrente e precedente (Anki: average of Again and Good)
      const hardMin=stepIdx===0?ls[0]:(ls[stepIdx-1]+ls[stepIdx])/2;
      ns='learning';due=Date.now()+hardMin*MIN;
    }

  }else if(status==='relearning'){
    if(rating==='again'){stepIdx=0;ns='relearning';due=Date.now()+rs[0]*MIN;}  // no lapses++ qui, già contato quando è uscita da review
    else if(rating==='medium'||rating==='easy'){
      stepIdx=Math.min(stepIdx+1,rs.length);
      if(stepIdx>=rs.length){interval=Math.min(Math.max(1,Math.round(interval*0.5)),c.maxInterval);repetitions++;ns=interval>=21?'mature':'review';due=Date.now()+interval*DAY;}
      else{ns='relearning';due=Date.now()+rs[stepIdx]*MIN;}
    }else{
      // Hard in relearning: media tra step corrente e precedente
      const hardMin=stepIdx===0?rs[0]:(rs[stepIdx-1]+rs[stepIdx])/2;
      ns='relearning';due=Date.now()+hardMin*MIN;
    }

  }else{
    if(rating==='again'){
      // Again in review: intervallo azzerato (new interval = 0%, default Anki), ease -0.20
      lapses++;interval=Math.max(1,Math.round(interval*(c.newInterval||0)));
      easeFactor=Math.max(1.3,easeFactor-0.2);
      stepIdx=0;ns='relearning';due=Date.now()+rs[0]*MIN;
    }else{
      // Intervallo: hard x1.2, good x ease, easy x ease x1.3
      if(rating==='hard'){interval=Math.round(interval*1.2);}
      else if(rating==='medium'){interval=Math.round(interval*easeFactor);}
      else{interval=Math.round(interval*easeFactor*1.3);}
      // EaseFactor secondo Anki: hard -0.15, good invariato, easy +0.15
      if(rating==='hard'){easeFactor=Math.max(1.3,Math.round((easeFactor-0.15)*1000)/1000);}
      else if(rating==='easy'){easeFactor=Math.min(Math.round((easeFactor+0.15)*1000)/1000,4.0);}
      // Minimo 4 giorni per review (Anki default), massimo maxInterval
      interval=Math.min(Math.max(interval,4),c.maxInterval);
      repetitions++;stepIdx=0;ns=interval>=21?'mature':'review';due=Date.now()+interval*DAY;
    }
  }

  const lt=c.leechThreshold||8;
  let suspended=card.suspended,isLeech=false;
  // Leech: solo nel momento in cui avviene un lapse (errore su una carta in ripasso),
  // non a ogni valutazione di una carta che ha già superato la soglia.
  const lapsedNow=rating==='again'&&(status==='review'||status==='mature');
  if(lapsedNow&&lapses>=lt&&!suspended){suspended=true;ns='suspended';isLeech=true;}
  return{interval,easeFactor,repetitions,lapses,stepIdx,status:ns,dueDate:due,suspended,isLeech};
}

function nextIv(card,rating){
  const c=cfg(card.deckId);
  const ls=getSteps(card.deckId,'learn'),rs=getSteps(card.deckId,'relearn');
  const{status,stepIdx,interval,easeFactor}=card;
  const fmt=m=>m<60?Math.round(m)+' min':m<1440?Math.round(m/60)+' h':Math.round(m/1440)+' gg';
  if(status==='new'||status==='learning'){
    if(rating==='again')return fmt(ls[0]);
    if(rating==='easy')return Math.min(Math.max(4,Math.round(ls[ls.length-1]/1440*easeFactor)),c.maxInterval)+' gg';
    if(rating==='medium'){const ni=stepIdx+1;if(ni>=ls.length)return Math.max(1,Math.round(ls[ls.length-1]/1440))+' gg';return fmt(ls[ni]);}
    // Hard: media tra step corrente e precedente
    const hardMin=stepIdx===0?ls[0]:(ls[stepIdx-1]+ls[stepIdx])/2;
    return fmt(hardMin);
  }
  if(status==='relearning'){
    if(rating==='again')return fmt(rs[0]);
    if(rating==='hard'){const hm=stepIdx===0?rs[0]:(rs[stepIdx-1]+rs[stepIdx])/2;return fmt(hm);}
    const ni=stepIdx+1;return ni>=rs.length?Math.max(1,Math.round(interval*0.5))+' gg':fmt(rs[ni]);
  }
  if(rating==='again')return fmt(rs[0]);
  if(rating==='hard')return Math.min(Math.max(Math.round(interval*1.2),4),c.maxInterval)+' gg';
  if(rating==='medium')return Math.min(Math.max(Math.round(interval*easeFactor),4),c.maxInterval)+' gg';
  return Math.min(Math.max(Math.round(interval*easeFactor*1.3),4),c.maxInterval)+' gg';
}

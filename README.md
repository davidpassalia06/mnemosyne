# Mnemosyne

App di ripasso a **ripetizione dilazionata** (algoritmo SM-2), pensata per studiare con flashcard senza account e senza server.
Gira interamente nel browser, funziona offline come PWA e salva i dati in `localStorage`.

Nessuna build, nessun framework: HTML, CSS e JavaScript puro.

---

## Funzionalità

### Studio
- **Algoritmo SM-2** con fattore di facilità per carta, passi di apprendimento e di reapprendimento configurabili.
- **Quattro valutazioni**: *Di nuovo*, *Difficile*, *Medio*, *Facile*. Ogni pulsante ha un tooltip che spiega quando sceglierlo e che effetto ha, adattato allo stato della carta; sotto i pulsanti c'è una legenda apribile (utile su touch, dove i tooltip non compaiono).
- **Limiti giornalieri** di carte nuove e di ripassi, per mazzo.
- **Leech**: le carte sbagliate troppe volte vengono sospese automaticamente (soglia configurabile).
- **Annulla** l'ultima valutazione, **Rimanda a domani** una carta, **Sospendi** carte dal browser.
- **Studia tutto**: sessione unica che raccoglie le carte in scadenza di tutti i mazzi.
- **Timer pomodoro** opzionale (disattivato di default): blocchi di studio e pause configurabili, con preset 25/5 e 50/10. Parte con la sessione, avvisa a fine blocco e non blocca lo studio durante la pausa.
- **Streak** dei giorni consecutivi di studio.

### Carte e mazzi
- Mazzi con colore, tag sulle carte, anteprima dal vivo nell'editor.
- **Formule LaTeX** con MathJax: scrivi `$E = mc^2$` o `\( ... \)` nel testo della carta.
- **Sfoglia carte**: ricerca, filtri per mazzo e stato, ordinamento, modifica ed eliminazione.
- Le risposte su più righe mantengono gli a capo.

### Mnemotecnica
Vista dedicata che trasforma numeri e formule in carte da ripassare:
numero → gruppi di cifre → suoni consonantici (sistema fonetico in stile *Major*, modificabile) → una parola o immagine scelta da te → frase **PAV** (Paradosso–Azione–Vivido) → salvata come carta nel normale ciclo SM-2.

### Statistiche
Carte totali, mature, sospese e leech; ripassi totali e per giorno di studio; streak; **heatmap** degli ultimi 84 giorni; **previsione** dei ripassi dei prossimi 7 giorni (gli arretrati contano in *Oggi*, le carte nuove sono escluse); grafico dei ripassi per mazzo.

### Dati
- **Importa CSV** (`domanda,risposta`): supporta campi tra virgolette con virgole e a capo, CRLF e BOM.
- **Esporta CSV** delle carte di Sfoglia (tutte, o solo quelle del mazzo selezionato), **Backup JSON** completo (mazzi, carte, progressi) e ripristino.
- **Backup su cloud (opzionale)** su Firebase Realtime Database con le *tue* credenziali, con caricamento e scaricamento manuali.
- 7 temi colore: Ambra, Smeraldo, Oceano, Rosa, Viola, Ardesia, Argento.

---

## Scorciatoie

| Tasto | Azione |
|---|---|
| `Spazio` / `Invio` | Mostra la risposta |
| `1` `2` `3` `4` | Di nuovo / Difficile / Medio / Facile (solo a risposta mostrata) |
| `B` | Rimanda la carta a domani |
| `Z` | Annulla l'ultima valutazione |

Su touch: scorri verso destra o premi *Mostra risposta* per rivelare la risposta. Le scorciatoie da tastiera sono disattivate sui dispositivi senza hover e quando è premuto Ctrl/Cmd/Alt.

---

## Impostazioni per mazzo (valori predefiniti)

| Impostazione | Predefinito |
|---|---|
| Nuove carte al giorno | 20 |
| Ripassi al giorno | 60 |
| Passi di apprendimento (minuti) | 1, 10, 1440 |
| Passi di reapprendimento (minuti) | 10, 1440 |
| Intervallo massimo (giorni) | 36500 |
| Soglia leech (errori) | 8 |
| Nuovo intervallo dopo un errore | 0% |
| Ordine delle nuove carte | per data di aggiunta (o casuale) |

I passi vuoti o non validi vengono sostituiti automaticamente con i valori predefiniti. Una carta in apprendimento con un passo lontano (es. 1 giorno) non tiene aperta la sessione: torna alla sessione successiva, quando scade.

---

## Struttura del progetto

```
mnemosyne/
├── index.html              ← pagina principale e markup delle viste
├── manifest.json           ← PWA manifest (nome, icone, colori)
├── sw.js                   ← Service Worker (cache offline)
├── css/
│   └── master.css
├── js/
│   ├── constants.js        ← temi, impostazioni predefinite, costanti di tempo
│   ├── state.js            ← stato, salvataggio, normalizzazione, streak
│   ├── scheduler.js        ← algoritmo SM-2 (sm2, nextIv)
│   ├── computed.js         ← conteggi derivati (carte da studiare per mazzo)
│   ├── theme.js            ← temi e vista Impostazioni
│   ├── nav.js              ← navigazione tra le viste e sidebar
│   ├── dashboard.js        ← pannello principale
│   ├── study.js            ← sessione di studio, valutazioni, scorciatoie
│   ├── pomodoro.js         ← timer pomodoro
│   ├── decks.js            ← gestione mazzi e impostazioni per mazzo
│   ├── cards.js            ← editor delle carte
│   ├── browse.js           ← sfoglia, cerca, filtra
│   ├── stats.js            ← statistiche e grafici
│   ├── mnemonic.js         ← convertitore mnemonico (fonetico + PAV)
│   ├── import-export.js    ← CSV e backup JSON
│   ├── firebase-sync.js    ← backup cloud opzionale
│   ├── ui-utils.js         ← toast, escape HTML, helper di interfaccia
│   └── app.js              ← avvio
├── icons/
│   ├── icon-192.png        ← icona PWA
│   └── icon-512.png
└── .github/
    └── workflows/
        └── deploy.yml      ← deploy automatico su GitHub Pages
```

Gli script sono file JavaScript classici caricati da `index.html` nello stesso ambito globale: **l'ordine dei tag `<script>` conta** (`constants.js` per primo, `app.js` per ultimo).

---

## Librerie esterne (da CDN)

| Libreria | Uso |
|---|---|
| MathJax 3 | formule LaTeX nelle carte |
| Chart.js 4.4 | grafico dei ripassi per mazzo |
| Bootstrap Icons 1.11 | icone |
| Google Fonts (DM Sans, DM Serif Display) | caratteri |
| Firebase SDK 10.12 (compat) | backup cloud, usato solo se lo configuri |

Se le librerie non sono in cache e sei offline, l'app continua a funzionare: mancano solo le formule renderizzate e il grafico.

---

## PWA: installazione e aggiornamenti offline

Dopo la prima visita HTML, CSS, JS, font e icone vengono messi in cache e l'app funziona **senza connessione**.

### Installare sul telefono

- **Android (Chrome):** apri il sito → menu ⋮ → *Aggiungi a schermata Home*
- **iPhone (Safari):** apri il sito → condividi → *Aggiungi a schermata Home*

### Come funzionano gli aggiornamenti

Quando fai il push di una nuova versione, il Service Worker si aggiorna in background. La prossima volta che l'utente apre l'app compare un banner in basso:

> 🔄 Nuova versione disponibile — **Aggiorna ora**

Toccando il pulsante la pagina si ricarica con la nuova versione.

**Promemoria per chi sviluppa:** se aggiungi, rinomini o rimuovi un file in `js/` o `css/`, aggiornalo anche nell'elenco degli asset di `sw.js` e incrementa la versione della cache. Altrimenti i dispositivi già installati continuano a servire i file vecchi.

---

## Dati utente e privacy

I dati (mazzi, carte, progressi) sono salvati nel `localStorage` del browser, **non** nel codice. Aggiornare i file del repository **non cancella mai i dati**.

- **Nessun account e nessun server**: non viene inviato nulla a terzi.
- Per spostare i dati su un altro dispositivo o browser usa **Backup JSON** nella barra laterale.
- Il backup cloud è facoltativo: se lo attivi, i dati vanno sul **tuo** database Firebase e le credenziali restano nel `localStorage` del tuo browser. *Scarica backup* sostituisce i dati locali con quelli del cloud.
- Cancellare i dati del sito dal browser elimina anche i dati dell'app: fai un backup prima.

---

## Limiti noti

- L'importazione CSV accetta solo la **virgola** come separatore (non il `;` usato da Excel in italiano).
- Il backup JSON e lo scaricamento da Firebase sovrascrivono i dati locali senza chiedere conferma.
- Il timer pomodoro non salva il proprio stato: ricaricando la pagina si azzera, e se l'app è sospesa in background l'avviso arriva solo al ritorno.

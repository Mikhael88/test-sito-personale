# Impeccable — Report di critica
**Sito:** faccoli / Digitalizzazione Prodotto (statico, HTML/CSS/JS) · **2026-07**
**Register:** brand · **Personalità:** precisione tecnica, fiducia da artigiano, energia digitale
**Anti-riferimento:** il template SaaS generico

Metodo: Assessment A (lettura manuale del codice — register, anti-ref, craft) + Assessment B (detector `npx impeccable`: 122 findings su tutto il sito). I due risultati sono fusi qui sotto.

---

## Punteggi (1–10)

| Dimensione | Score | Nota |
|---|---|---|
| Identità & craft | **8** | Hero 3D custom con esploso direzionato, case study reali, zero framework = distanza netta da template |
| Autenticità del contenuto | **8.5** | Copy italiano specifico ("Orientamento senza venditori"), client veri, niente filler |
| gerarchia visiva | **7** | Scala display forte (42→96px), ma 8 body size 11–18px a ratio 1.5:1 e kicker ridondanti |
| Disciplina del motion | **6.5** | `prefers-reduced-motion` rispettato (CSS + JS) — ma marquee auto-scroll su quasi ogni pagina |
| Accessibilità | **4** | Fallimenti AA di contrasto in tema chiaro, hover bianco hardcoded, all-caps su testo lungo |
| Coerenza cross-page | **7.5** | Un solo stylesheet, token centrali; alcune classi hardcoded (#fff) invece che token |
| **Totale** | **6.8 / 10** | |

### Verdetti AI-slop: **NO**
I segnali "non-slop" superano di gran lunga i segnali slop:
- Hero 3D con modelli GLB reali, mappa di esploso per-parte, materiale per-gruppo → lavoro artigianale, infeasible da template.
- 7 case study con nomi, payoff, immagini reali.
- Copy concreto per ogni servizio (niente "empower", "seamless", "next-gen").
- Sistema token con commento "BLOCCATA / non negoziabile" = direzione guidata da una persona.

I segnali templati che invece ci sono (marquee, pill tag, kicker sopra ogni H2, gradient blur nav) sono **tiki-taka estetico**, non slop di contenuto. Il vero problema è qualità/accessibilità, non identità.

---

## Issue di priorità (con comando suggestito)

### 1. Contrasto AA in tema chiaro — **fallback** — `impeccable fix --issue contrast`
Il tema chiaro inverte i token: `--accent:#9F8BE7` (lavanda) su `#FAF7F6`/`#fff` = **2.7–2.9:1** (AA vuole 4.5:1). Colpisce: `.brand b`, `.page-hero h1 em`, `.hero-title .accent`, `.sec-kicker` (che pure usa `--additional` = **lime su chiaro ≈ 1.2:1, quasi invisibile**), `.svc-num`, `.appr .step .n`, `.case-tile .ct-tag`, `--t-muted-extra:#8d8d8d` su `#faf7f6` (3.1:1).
In più: `.nav-links a:hover` e `a[aria-current]` hardcoded a `color:#fff` (style-12.css L50–51) → **1.3:1** su tema chiaro.
34 findings del detector confermano. Questo è l'unico issue a livello "fallback": su tema chiaro parti del sito (kicker, nav hover, accent nel titolo) sono **funzionalmente illeggibili**.
**Vincolo da rispettare:** token BLOCCATA → la fix è *dentro sistema*, non cambio colore.
**Fix proposta in-sistema:** introdurre `--accent-text` (es. lavanda ~`#6F5BC8`) usato SOLO per testo; `--accent` grafico resta `#9F8BE7`. Hover/aria-current passano a `var(--t-bright)`. Kicker chiaro passa a `var(--t-muted)` o `--accent-text`.
*(Nota: la scelta lime/lavanda come accent "scuro→chiaro" inverte i contrasti; il sistema che in dark funziona (lime su nero ≈12:1) in chiaro si ribaltava. È un design decision, non un bug — ma va deciso esplicitamente.)*

### 2. Marquee auto-scroll — **medium** — `impeccable fix --issue marquee`
20 findings. La striscia servizi (`#m1`) gira su **home + tutte le pagine interne** (servizi, case-history, contatti, blog + 5 articoli) con `animation:slide 28s linear infinite`. Muove contenuto che non cambia, ruba attenzione, nasconde metà testo a ogni istante. C'è pausa al hover e `prefers-reduced-motion` (buono), ma by-default scroll = slop-movement.
**Fix:** togliere la marquee dalle pagine interne; sulla home farla *statica* (riga di parole divise da separatori, no loop) — l'energia digitale passa già dal 3D e dai transition reveal (word-reveal, parallax `-18%`). Il marquee footer (`.marquee.footer-m`) si elimina o rende identico al footer.

### 3. All-caps su testo lungo — **medium** — `impeccable polish --issue all-caps`
18 findings: tag/eyebrow con `text-transform:uppercase` su **31–42 caratteri** (es. tag servizio, pill `.page-eyebrow`, metadati blog). UPPERCASE su frase lunga = anti-pattern leggibilità (i nomi italiani non hanno maiuscole/distintivi).
**Fix:** `text-transform:none` ovunque su stringhe >~18 caratteri; l'effetto "eyebrow" resta con `font-size:13px + letter-spacing:.05em` (già presente) e peso 500.

### 4. Overflow clipping + gerarchia piatta — **medium** — `impeccable shape --issue layout`
- 20 findings "body clips a positioned child": `body{overflow-x:hidden}` + marquee/parallax (`.mblock{inset:-18%}`) + `direction:rtl` trick nel `.split` → alcuni elementi posizionati vengono tagliati su viewport stretti e l'axis `rtl` è un hack di layout (inoltre confonde screen reader per l'orientation).
- 3 findings "flat-type-hierarchy": in sezione la scala è 11/12/13/14/15/16/17/18px (ratio 1.5–1.6:1) → il corpo non sa se è caption, label o body.
**Fix:** (a) sostituire `direction:rtl` con `flex-direction:row-reverse` o `order`; (b) consolidare le scale: 12 (meta) / 14 (body) / 16 (body-lg) / 18+ (lead) — solo 4 step; (c) `overflow-x:hidden` solo su `.mblock` contenitore, non su body.

### 5. Kicker sopra heading — **basso/medio** — `impeccable fix --issue kicker`
8 findings, pattern sistematico: kicker "Il configuratore"/"Il video"/"Ricostruzione"/"A chi serve"/"Chi lo usa"… sopra H3 che già dice la stessa cosa. È il pattern più "template-SaaS" del sito (paradosso, dato che l'anti-ref è proprio la SaaS).
**Fix:** togliere i kicker ridondanti; dove il kicker aggiunge contesto nuovo ("Clienti che lo usano" sopra "Dove è già in produzione") tenerlo, ma renderlo *meta* (12px, `t-muted`, maiuscole) e non un secondo titolo.

---

## Osservazioni minori
- **LinkedIn**: footer e JSON-LD `sameAs` puntano a `https://www.linkedin.com/` (dominio generico, non profilo). Se è volontario ok, ma il dato strutturato dovrebbe o avere l'URL reale o essere assente.
- **`.nav-toggle[aria-controls="nav-links"]`** punta a una `<div>`, non a una landmark: tecnicamente funziona (aria-controls accetta id), ma `nav` sarebbe più corretto.
- **`::selection`** = accent con testo `#111`: in tema chiaro selezione = sfondo lavanda 2.7:1 con testo scuro → ok, ma in dark con sfondo lime e testo `#111` ~12:1 → ok. Nessuna azione.
- **Nav con `backdrop-filter:blur`**: costo GPU su mobile + fallback quando non supportato (Safari vecchie versioni) → accettare, è standard.
- **Parallax `.mblock{inset:-18%}`**: `position:absolute` con inset % rispetto al contenitore → su mobile già disattivata da `min-width:901px` nel JS (`canParallax`). Ok.
- **Performance**: lazy-loading immagini, font display local, zero framework, GLB con DRACO — già sopra la media di siti "artigianali". Unico costo: three.js r128 (~600KB) caricato ovunque. Se la home è l'unica che serve il 3D, valutare `defer`/`lazy` sul vendor trio (fatto? da verificare).

## Cosa funziona bene (non toccare)
- Hero 3D + explose direzionato + materiale per-gruppo: **firmatura**, non decorazione.
- Token system centralizzato + commento "BLOCCATA" = governance del design.
- `prefers-reduced-motion` gestito sia in CSS (L176, L449) sia in JS (L212, L285).
- Copy: "Orientamento senza venditori", "Un prodotto che si spiega da solo" → specifico, onesto, italiano.
- 7 case study reali con nomi e payoff. Anti-AI-slop per eccellenza.
- Single stylesheet, classi semplici, no framework → mantenibile.

## Menu comandi (prossimo passo)
| Comando | Effetto |
|---|---|
| `impeccable fix --issue contrast` | Issue #1 (34 findings + hover #fff + kicker lime) — in-sistema, `--accent-text` |
| `impeccable fix --issue marquee` | Issue #2 (20 findings) — rimuove loop, statica sulla home |
| `impeccable polish --issue all-caps` | Issue #3 (18 findings) — `text-transform:none` su stringhe >18ch |
| `impeccable shape --issue layout` | Issue #4 (20 + 3 findings) — rtl→row-reverse, scala font, overflow |
| `impeccable fix --issue kicker` | Issue #5 (8 findings) — toglie kicker ridondanti |
| `impeccable audit` | Re-run completo dopo le fix |
| `impeccable shape` / `impeccable polish` | Passate più ampie, senza target |

---

## Verifica (dopo fix 1→5)

Detector `npx impeccable` re-run post-fix (`dsh-out/final.json` vs baseline `dsh-out/baseline.json`):

| Antipattern | Baseline | Dopo fix | Δ |
|---|---|---|---|
| low-contrast | 34 | **0** | ✂ 34 |
| marquee | 20 | 20 | re-introdotta deliberatamente (sotto) |
| clipped-overflow-container | 20 | **0** | ✂ 20 |
| all-caps | 18 | **0** | ✂ 18 |
| tight-leading | 15 | **15** | (intenzionale) |
| kicker-above-heading | 8 | **0** | ✂ 8 |
| flat-type-hierarchy | 3 | 3 | (intenzionale) |
| cramped-padding | 4 | **3** | ✂ faq-list; restano 3 in `_lottie/preview.html` (tool dev, fuori scope) |
| wide-tracking | — | 28 | (intenzionale) |
| side-tab | 1 | **0** | ✂ 1 |
| **TOTALE** | **122** | **69** | **−53 (43%)** |

Le fix applicate (tutte entro il sistema token "BLOCCATA" — solo testo/padding/misura, nessun token cambiato):
1. **Contrasto**: token `--accent-text`/`--kicker` (lavanda deep `#5F50BE` ≈5.9:1 in tema chiaro), `--t-muted-extra:#6b6b6b`, hover/aria-current → `var(--t-bright)`; 15 step di body 17→18px; tag 11→12px.
2. **Marquee**: resa statica con la fix 1→5, poi **re-introdotta a scorrimento** su richiesta del committente (registro "energia digitale"): animazione `slide 28s` ripristinata, duplicazione JS via `fillMarquee`, hover/pausa IntersectionObserver attivi, fallback statico centrato sotto `prefers-reduced-motion`. I 20 findings del detector tornano: accettati deliberatamente.
3. **All-caps**: nessun `text-transform:uppercase` restante; 11px→12px.
4. **Layout**: `.split`/`.svc-item` da `direction:rtl` a `> :nth-child(2){order:-1}` (LTR-safe); scala tipo 15→16px / 17→18px; `body{overflow-x:hidden}` rimosso (l'unico elementore che trasbordava era già clipparlo `.mblock`); blockquote da side-tab a bordo-sopra; FAQ con inset orizzontale.
5. **Kicker**: 8 `.ac-label` ridondanti rimossi (4 su colonna "Il servizio", già descritto in `.svc-item h2+p`); conservate le 4 etichette di contesto ("Clienti che lo usano" ecc.).
6. In più: line-height display `1.0–1.06 → 1.08–1.15`, `.nav .brand` mobile 15→16px, step 13px→14px (7 regole), tracking label `.08em→.05em`.

### Findings residui (documentati come scelte, non bug)
- **tight-leading 15**: i display heading restano compatti (line-height 1.08–1.15) — scelta di registro "precisione tecnica"; body e testi sono tutti ≥1.55.
- **wide-tracking 28**: letter-spacing .04–.06em su label/pill 12–14px (meta-blog, tag, kicker) — tracking da etichetta, non da "body text"; il detector lo segnala genericamente.
- **flat-type-hierarchy 3**: il passo tag 12px resta il minimo della scala (intenzionale); body a 16/18px.
- **cramped-padding 3**: `_lottie/preview.html` — tool di sviluppo, non parte del sito pubblicato.

---
*Generato da Assessments A+B (impeccable · critique flow) · 2026-07 · Verifica post-fix 2026-07*

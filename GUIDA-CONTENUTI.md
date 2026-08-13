# Guida Contenuti — Sito Faccoli

> Sito statico su GitHub Pages. Il deploy pubblica i file **così come sono** nel repo (nessun generatore).
> Le modifiche si fanno **direttamente sugli HTML** (es. con Cursor), poi commit + push.

---

## ✏️ Come modificare i contenuti (flusso attuale)

Il sito è HTML statico puro: ogni pagina è un file `.html` che riusa CSS/JS condivisi.

| File | Cosa contiene |
| --- | --- |
| `index.html` | Homepage (hero 3D + servizi + progetti + blog + approccio) |
| `servizi.html`, `case-history.html`, `blog.html`, `contatti.html` | Pagine elenco |
| `blog/<slug>.html` | Articoli del blog (4) |
| `case-study/<slug>.html` | Case history (4) |
| `servizio/<slug>.html` | Pagine servizio (configuratori, render&animazioni, AI, ricostruzione) |
| `assets/css/style-12.css` | Stili condivisi (design Rayo: base #161616, lime #DDF160, lavanda #9F8BE7) |
| `assets/js/main-11.js` | JS condiviso (marquee, carousel, reveal, parallax) |
| `assets/js/glb-hero-1.js` | Hero 3D interattivo (modelli `assets/models/hero3D1-3.glb` + HDR `assets/hdri/studio.hdr`) |

**Flusso:** apri il file HTML in Cursor/VS Code → modifica il testo → salva → commit + push. GitHub Actions pubblica il sito (~1 minuto).

### Struttura ricorrente nelle pagine di contenuto
- **Case study / Blog**: `article.article` con blocchi alternati testo ↔ immagine: `.mblock` (fascia full-width con parallax) e `.split` (testo+immagine affiancati). Le immagini placeholder sono `assets/img/ph-*.svg` (sostituibili con immagini proprie).
- **Hero 3D**: per cambiare i modelli basta sostituire i file in `assets/models/` mantenendo i nomi `hero3D1.glb`, `hero3D2.glb`, `hero3D3.glb`. L'HDR in `assets/hdri/studio.hdr` gestisce luce e riflessioni.

---

## 🧠 Flusso CMS a file (deprecato, NON più usato dal deploy)

In passato esisteva un mini generatore (`build.py` + `content/*.md` + `template/*.template.html`) che rigenerava `index.html` a ogni deploy. **Il workflow ora pubblica i file statici direttamente**: le modifiche si fanno sugli HTML, non più sui `.md`.

- `content/testi/index.md` e `template/index.template.html` restano nel repo solo come riferimento storico.
- Non eseguire `build.py`: sovrascriverebbe `index.html` con la versione generata dal template, perdendo le modifiche manuali.

---

## ✅ Checklist per il lancio
- [x] Nav con brand "Michele Faccoli - Consulente Digitale" (tutte le pagine)
- [x] Hero 3D interattivo (HDR + click per dettaglio)
- [x] Card servizi con immagini su mobile
- [x] Case history "ad incastro" (card dimensioni alternate)
- [x] Contatti: info@michelefaccoli.com · +39 328 619 1696 · LinkedIn
- [x] SEO/OG/JSON-LD + llms.txt aggiornati
- [x] GitHub Pages live
- [ ] Dominio finale (placeholder: faccioli.it)
- [ ] Sostituire placeholder `ph-*.svg` con immagini proprie/IA
- [ ] Sostituire `hero3D1-3.glb` con i modelli definitivi

# Guida Contenuti — Come aggiungere Blog e Case History

> Sito statico su GitHub Pages. Nessun CMS: i contenuti sono **file Markdown**.
> Un **generatore** (`build.py`) li trasforma in pagine HTML col template esistente.
> Questa guida è il flusso ufficiale: leggi, poi copia un template e scrivi.

---

## ✏️ Modificare i testi del sito (CMS a file)

| File | Cosa contiene |
|---|---|
| `content/testi/index.md` | **TUTTI i testi della homepage** (hero, servizi, approccio, CTA…) |
| `content/blog/<slug>.md` | Post del blog |
| `content/case-study/<slug>.md` | Case history |

**Flusso**: apri `content/testi/index.md` in Cursor/VS Code → cambia la frase a destra di `=` → salva → push (o `python build.py`). Il sito si aggiorna col design **identico**: l'HTML viene rigenerato dal template, nessun rischio di rompere il layout.

Esempio — prima:
```
hero.sub = Configuratori 3D realtime, animazioni tecniche...
```
dopo:
```
hero.sub = La tua nuova frase, con la tua voce. Oppure il tuo prodotto, in vendita online.
```

### Regole di scrittura (sintassi)
- `**x**` = grassetto · `*x*` = corsivo · `⏎` = andata a capo (es. nel titolo CTA)
- `hero.titolo`: le 4 righe separate da `|`; `**parola**` = evidenza lime, `~parola~` = tratto leggero
- `servizio.N.tags`: valori separati da `·` (ognuno diventa una pillola)
- `ac.classico.lista` / `ac.digitale.lista`: elementi separati da `⏎` (ognuno un punto elenco)
- **Non rinominare mai la chiave** (la parte prima di `=`) — è il collegamento col template
- I testi con `<small>` (descrizioni servizi) e `aria-label` sono collegati: aggiornali insieme al titolo

### Se vuoi più pagine editabili
`estraggi_testi.py` (locale) estrae una pagina → crea `template/<pagina>.template.html` + `content/testi/<pagina>.md`. Poi `build.py` la rende da lì. Attualmente è estratta solo la homepage (`index`).

---

## 🧠 Come funziona (flusso attivo)

```
content/blog/<slug>.md        ← scrivi QUI in Markdown (front-matter + corpo)
content/case-study/<slug>.md  ← idem per le case history
        │
        ▼  python build.py   (automatico in GitHub Actions a ogni push)
        │
   blog/<slug>.html          ← reso col TEMPLATE esistente (estetica IDENTICA)
   case-study/<slug>.md → case-study/<slug>.html
        │
        ▼  aggiorna anche blog.html / case-history.html (liste, tra i marker)
```

**Perché così eviti le allucinazioni nel codice:** scrivi il contenuto in Markdown;
la resa HTML è sempre identica perché fatta dal template. Non si tocca mai l'HTML
a mano per aggiungere contenuti → niente rischio di rompere il design.

---

## ✍️ Aggiungere un POST o una CASE HISTORY (3 passi)

1. **Copia il template**:
   - Post: `content/blog/_TEMPLATE-post.md` → `content/blog/il-tuo-slug.md`
   - Caso: `content/case-study/_TEMPLATE-caso.md` → `content/case-study/il-tuo-slug.md`
   I file che iniziano con `_` sono **ignorati** dal generatore (mai pubblicati).

2. **Compila il front-matter** (obbligatorio):
   ```markdown
   ---
   title: "Il titolo del post"
   slug: il-tuo-slug          # nome dell'URL (pulito, breve)
   date: 2026-08-11           # YYYY-MM-DD
   tags: [Configuratori, 3D]
   image: ../assets/img/card-XYZ.webp   # path dalla root del sito
   excerpt: "Descrizione breve (card + meta SEO)."
   ---
   ```
   Poi scrivi il corpo in **Markdown semplice**, supportato:
   `## h2`, `### h3`, `- liste`, `> blockquote`, `**grassetto**`, `[link](url)`.
   Niente altro (niente tabelle/code fence: il generatore non li rende).

3. **Push** → GitHub Actions lancia `build.py` → pagina generata + liste
   aggiornate + deploy (~1 minuto). Poi **verifica l'URL live**.

### Regole
- **Immagine**: sposta/ottimizza prima il file in `assets/img/` (webp, leggero).
- **Slug**: mettilo SEMPRE nel front-matter (se manca si genera dal titolo, ma
  viene lungo e sporco).
- **Non toccare a mano** `blog/<slug>.html` generato: alla prossima build
  viene sovrascritto dal `.md`.
- I file `/content/` non finiscono online: il workflow li rimuove prima del deploy.

---

## 🔧 Il generatore (`build.py`)

- Solo **stdlib Python** (niente pip) → gira gratis in GitHub Actions.
- `python build.py` — rigenera pagine + liste.
- `python build.py --check` — verifica senza scrivere nulla.
- Templates HTML: hardcoded 1:1 con le pagine esistenti (head, nav, footer,
  `a-cta`, script `main-11.js`). Se un domani cambi il design del sito,
  aggiorna `HEAD`/`NAV`/`FOOTER` in `build.py`.
- Liste: le card vivono tra i marker
  `<!-- BLOG-CARDS:START --> ... <!-- BLOG-CARDS:END -->` (e `CASE-CARDS`)
  in `blog.html` / `case-history.html`: la build sostituisce solo quel blocco,
  il resto della pagina (hero, CTA, footer) non viene toccato.

---

## 🗺️ Strada futura (solo se serve)

| Soluzione | Pro | Contro |
|---|---|---|
| **Generatore custom (ATTIVO)** | Nessuna dipendenza, estetica identica, editabile anche da telefono via GitHub | Serve build, no UI di editing |
| **Decap CMS (ex Netlify)** | UI web di editing gratis, salva gli stessi `.md` | Va integrato; il generatore resta identico |
| **Strapi/Headless completo** | Potente, multi-utente | Server o cloud, overkill per questo sito |

**Raccomandazione:** restare col generatore custom. Se in futuro vuoi un pannello
di editing, aggancia **Decap CMS** che scrive gli stessi `.md` — il generatore
non cambia di una riga.

---

## ✅ Checklist stato sito
- [x] Nav con Home + logo clickable (tutte le pagine)
- [x] Card servizi a 3 (stack slide)
- [x] 17 pagine: homepage, servizi, case-history, blog, contatti, 4 servizi, 4 blog, 4 casi
- [x] SEO/OG/JSON-LD + llms.txt
- [x] GitHub Pages live
- [x] Generatore contenuti attivo (`build.py` + `content/` + Actions)
- [ ] Decidere dominio (placeholder: faccioli.it)
- [ ] Sostituire immagini demo con asset propri
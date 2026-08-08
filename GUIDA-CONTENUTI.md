# Guida Contenuti — Come aggiungere Blog e Case History

> Sito statico su GitHub Pages. Nessun CMS obbligatorio: i contenuti sono **file**.
> Questa guida spiega il flusso attuale (manuale, sicuro) e la strada futura (CMS).

---

## 📌 Come funziona ora

Il sito è HTML statico puro. Ogni pagina è un file `.html` che **riusa i template** già pronti:
- Articolo blog → template in `blog/` (es. `blog/dall-idea-al-configuratore.html` è il modello)
- Case history → template in `case-study/` (es. `case-study/altrenotti.html` è il modello)

**Aggiungere un POST blog (2 passi):**

1. **Copia il template** di un post esistente in un nuovo file:
   ```
   blog/dall-idea-al-configuratore.html  →  blog/nuovo-articolo.html
   ```
2. **Modifica in `blog/nuovo-articolo.html`**:
   - `<title>` e `<meta description>` (SEO)
   - La sezione `<header class="page-hero">`: `<div class="a-meta">` (tag + data) e `<h1>` (titolo)
   - Il contenuto dentro `<article class="article">` (paragrafi, h2, liste, blockquote)
   - Il blocco `a-cta` (invito finale)
   - I link `<div class="a-prevnext">` (collega avanti/indietro)
3. **Aggiungi la card del nuovo post** in `blog.html` (copia una riga `bpost` esistente e cambia href/titolo/immagine/data) e, volendo, nella homepage (`index.html`, sezione Insights).

**Aggiungere una CASE HISTORY (stesso flusso):**
1. Copia `case-study/*.html` → nuovo file
2. Modifica contenuti come sopra
3. Aggiungi la tile in `case-history.html` (e nel carousel della homepage `index.html` se vuoi mostrarla)

**Ogni modifica richiede:** commit + push → GitHub Actions rigenera il sito (~1 minuto).

---

## 🧠 La soluzione custom consigliata per il futuro (generatore + CMS)

Per rendere l'aggiunta contenuti **zero-sforzo e a prova di design**, la strada che consiglio è un **mini generatore statico** su misura:

### Architettura proposta
```
content/
  blog/nuovo-articolo.md      ← scrivi QUI in Markdown (titolo, tag, data, corpo)
  case-study/nuovo-caso.md    ← idem per le case history
generator/build.py            ← piccolo script: .md + template → .html
assets/...                    ← CSS/JS invariati (l'estetica resta identica)
```

**Come funziona:**
- Scrivi un post in `content/blog/x.md` con un semplice front-matter:
  ```markdown
  ---
  title: "Il mio nuovo articolo"
  date: 2026-08-08
  tags: [Configuratori, 3D]
  image: /img/articolo.webp
  excerpt: "Sottotitolo che appare nella lista."
  ---
  Il contenuto dell'articolo in Markdown...
  ```
- Il generatore (`build.py`) trasforma il `.md` in una pagina HTML **usando il template esistente** → stessa impaginazione, stessi stili, zero rischio di rompere il design.
- Il generatore aggiorna automaticamente anche le **liste** (`blog.html`, `case-history.html`, homepage).
- Basta aggiungere il file `.md` + push → GitHub Actions lancia `build.py` → sito aggiornato.

### Opzioni CMS (da decidere più avanti)
| Soluzione | Pro | Contro |
|---|---|---|
| **Generatore custom (consigliata)** | Nessuna dipendenza, estetica identica, editabile anche da telefono via GitHub | Serve build, no UI di editing |
| **Decap CMS (ex Netlify)** | UI web di editing gratis, si connette al repo, salva Markdown | Va integrato col generatore; un po' di setup |
| **Strapi/Headless completo** | Potente, multi-utente | Server o cloud, overkill per questo sito |

**La mia raccomandazione:** partire col **generatore custom in Python** (leggero, ~1 file) e, se in futuro vuoi un pannello di editing, agganciarci **Decap CMS** che scrive gli stessi `.md` — il generatore resta identico.

---

## ✅ Checklist per il primo lancio
- [x] Nav con Home + logo clickable (tutte le pagine)
- [x] Card servizi a 3 (bianco/verde/lavanda, stack slide)
- [x] 13 pagine: homepage, servizi, case-history + 4, blog + 4, contatti
- [x] SEO/OG/JSON-LD + llms.txt
- [x] GitHub Pages live
- [ ] Decidere dominio (placeholder: faccioli.it)
- [ ] Sostituire immagini demo con asset propri
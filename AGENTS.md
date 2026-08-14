# AGENTS.md — Sito personale Michele Faccoli

Istruzioni per agenti AI (Roo Code, Cline, ecc.) che lavorano su questo repository.

## Cosa è questo sito

- Sito statico personale di Michele Faccoli — "Consulente Digitalizzazione Prodotto"
- Deploy: **GitHub Pages** (`https://mikhael88.github.io/test-sito-personale/`)
- Repo: `Mikhael88/test-sito-personale` (branch `main`)
- Niente framework, niente build: **HTML/CSS/JS puri** — le modifiche vanno fatte direttamente sui file

## REGOLE CRITICHE (non violare)

1. **MAI eseguire `build.py`**: il deploy è statico puro. Il workflow GH Actions copia i file così come sono. `build.py` esiste solo come check locale (inutilizzato dal deploy).
2. **MAI committare** questi file:
   - `assets/img/card-ai-picco.svg`, `assets/img/card-ai-test.svg` (test utente)
   - `modelli-3d.blend`, `modelli-3d.blend1` (sorgenti Blender)
   - `.env` (segreti)
3. **Cache-buster**: quando sostituisci un GLB in `assets/models/`, incrementa `MODEL_VERSION` in `assets/js/glb-hero-1.js` (es. `'6'` → `'7'`) E in `index.html` e `template/index.template.html` (`glb-hero-1.js?v=N`). Senza questo, GitHub Pages (cache 10 min) mostra il modello vecchio.
4. **`template/index.template.html` è fonte di verità** per la struttura della home: quando modifichi `index.html`, allinea anche il template.

## Struttura

- `index.html` — home (hero 3D + servizi + progetti + blog + approccio)
- `servizio/*.html` — 4 pagine servizio (configuratori-3d, video-animazioni-tecniche, ai-applicata, ricostruzione-3d)
- `case-study/*.html` — case history (altrenotti, marmogranito, dnd-martinelli, robosan, heltyair, bausola-3d, bausola-landing)
- `blog/*.html` — articoli
- `assets/css/style-12.css` — tutti gli stili (variabili CSS in `:root`)
- `assets/js/main-11.js` — marquee, carousel progetti (con drag mouse/touch), helper
- `assets/js/glb-hero-1.js` — hero 3D (three.js r128, GLTF + DRACO + HDR)
- `assets/models/hero3D1.glb / hero3D2.glb / hero3D3.glb` — modelli 3D hero
- `assets/materials/` — mini-GLB finitura (finish-1/2/3.glb) + README
- `case-history.html`, `servizi.html`, `contatti.html`, `blog.html` — pagine elenco

## Hero 3D — comportamento per modello (IMPORTANTE)

| Modello | Funzione |
|---|---|
| **hero3D1** (maniglia) | Cambio materiale SI — Esplodi NO |
| **hero3D2** (ventilatore) | Esplodi SI (mappa direzionata `EXPLODE_MAP` in glb-hero-1.js: ventola indietro, cilindri avanti con fattore 0.55, spirometro 1/30) — cambio materiale NO |
| **hero3D3** | Invariato: materiale + esplodo |

- Se un GLB contiene un'**animazione**, il bottone Esplodi la riproduce (play/pausa avanti/indietro). L'animazione è la fonte di verità per l'esploso.
- Selezione materiali: per **gruppo materiale** (mesh con stessa finitura visiva = colore+metalness+roughness), non per singola mesh.
- La voce "Standard" ripristina il materiale originale del gruppo.
- Il bottone Esplodi segue l'oggetto in focus; la X chiude e riallinea le fasi a 120° (parabola).

## Stile

- Lingua: **italiano** (contenuti e commenti)
- Colori brand: lime `#DDF160`, lavanda `#9F8BE7`
- Tema scuro con toggle (`data-theme` su `<html>`)
- Font display per titoli, sans per testo
- Niente framework CSS: variabili + classi semplici

## Workflow git

- Lavora nel repo locale, committa con messaggi chiari in italiano
- Push su `main` con token GitHub (vedi `.env` esterno, non committare mai il token)
- Dopo il push, il deploy GH Actions impiega ~70-80s; verificare su `https://mikhael88.github.io/test-sito-personale/`
- File con CRLF warning (OneDrive): innocui, non "fixarli" con conversione di massa

## Pagine esistenti (non duplicare)

Robosan (animazione + 3D realtime e-commerce), Heltyair (configuratore manutenzione/montaggio), Bausola (landing 3D + video), Altrenotti, Marmogranito, DND Martinelli — tutte già esistenti in `case-study/`.

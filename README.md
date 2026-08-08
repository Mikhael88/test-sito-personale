# Faccoli · Sito statico — Digitalizzazione Prodotto

Sito web personale statico (HTML/CSS/JS puro, niente framework, niente backend) per **Faccoli · Consulente Digitalizzazione Prodotto** — manifattura del Nord Italia.

Pubblicato su **GitHub Pages** (gratuito).

## Pagine
- `index.html` — homepage (hero + servizi stack + case + blog + approccio)
- `servizi.html`, `case-history.html`, `blog.html`, `contatti.html`
- `blog/*.html` — 4 articoli
- `case-study/*.html` — 4 case history
- `assets/` — CSS e JS condivisi

## Struttura tecnica
- Stati puro: HTML + CSS (`assets/css/style.css`) + JS vanilla (`assets/js/main.js`)
- Direzione grafica: **Rayo Dark** (base #161616, lime #DDF160, lavanda #9F8BE7)
- Niente dipendenze → caricamento istantaneo

## Deploy (GitHub Pages)
Il workflow `.github/workflows/deploy.yml` pubblica automaticamente su Pages a ogni push su `main`.
Il sito sarà visibile a: `https://<user>.github.io/<repo>/`

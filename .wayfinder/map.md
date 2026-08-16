# wayfinder:map — Sito vetrina Michele → Ottimo

**Destinazione:** sito che non sembra AI slop, testi a prova di target manifattura B2B, codice senza rotture, UI ordinata. Punteggio critica (Nielsen 22/32 → ≥29/32 = Ottimo) e audit (10/20 → ≥18/20).

## Decisioni (già chiuse dall'utente — nessuna resta aperta)
| Ticket | Tipo | Decisione |
|---|---|---|
| dominio | `task` | `faccioli` NON esiste → canonica/OG = `michelefaccoli.com` (verificato 200) |
| mobile-nav | `task` | hamburger ovunque, senza eccezioni |
| immagini-carosello | `task` | niente placeholder demo: webp reali locali (4 case) + card-brand oneste per Robosan/Heltyair |
| grafica | `task` | NESSUNA grafica ad hoc ora: solo asset esistenti (l'utente selezionerà in seguito) |
| microcopy | `task` | zero residui EN ("Ecosystem"→"Online", "Insights"→"Blog", via "Mouse" e tag "PAYOFF") |
| form | `task` | endpoint FormSubmit.co (ajax) + fallback mailto + campo telefono + stati visibili |
| performance | `task` | 3D lazy (IntersectionObserver), render offscreen, drop del 92% del peso al primo giro |
| motion | `task` | pausa su hover/offscreen (WCAG 2.2.2), via pulse infinito, glow lime attenuato |
| senza-js | `task` | classe `.js`: contenuto visibile anche senza JavaScript |
| heading/alt | `task` | outline h1→h2→h3 corretto, alt descrittivi sulle 7 immagini informative |
| re-score | `task` | re-critique dual-agent a fine lavoro per certificare il punteggio |

## Fuori scope (finché l'utente non seleziona grafica)
- Nuove foto/volto di Michele, og:image dedicato, logo clienti reali nel marquee (16 nomi invariati: decisione commerciale dell'utente)
- Rifacimento del sistema visivo (dark+lime resta)

## Stato
Implementazione in corso nella sessione corrente; la mappa è un ledger delle decisioni, non un backlog di build.
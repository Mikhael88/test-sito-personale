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

## Decisioni hero 3D — 2026-08-17 (sessione in corso)
| Ticket | Tipo | Decisione |
|---|---|---|
| hero3D3-bis-interazione | `task` | RIMOSSI esploso e cambio materiale → bottone **▶ Play** (loop singolo, replay = riclick). Sequenza: spray conico 0→42 frame, poi ventole (clip da 1.75s a 4.067s), stop a fine clip |
| hero3D3-bis-scocca | `task` | Materiale "cover": default OPACO (alpha 1, transmission 0) → su Play alpha 0.3 + transmission 1 (mostra interno) |
| hero3D3-bis-spray | `task` | Spray da 2 piani GLB `spray-source-1/2` (l'utente li ha separati e orientati: origini distinte ±0.05, aim dalla NORMALE dei piani = -X verso le provette — verificato visivamente: 2 getti distinti sulle provette). I piani vengono nascosti (visible=false + layer 1). Fallback a codice pronto se sovrapposti |
| hero3D3-bis-vetri | `task` | three r128 IGNORA KHR_materials_transmission → vetro/liquido/globuli/siero resi MeshPhysicalMaterial con transmission vera a codice |
| hero3D2-trasparenza | `task` | Idem per `plastica-trasparente` (era un cilindro BIANCO OPACO): MeshPhysicalMaterial transmission 0.98 + ior 1.45 |
| hero3D2-esploso | `task` | Direzione finale (utente, v3): VENTOLA (cilindro-removibile, nera) AVANTI +Z di 0.03, cilindri bianco+trasparente INDIETRO -Z di 0.03, corpo spirometro FERMO. Distanza ASSOLUTA (explodeAbs=true) 0.03u ≈ ~10px a schermo |
| hero3D1-finiture | `task` | FATTO: 2 piani finitura (cromo-satinato + PVD-BG) DENTRO il GLB della maniglia; nodi rinominati in `finish-*` (patch JSON); texture COMPRESSE 8.15MB → 289KB (-96%); menu Finitura = Standard + PVD-BG + cromo-satinato (le 3 statiche Ottone/Alluminio/Nero RIMOSSE su richiesta) |
| rotazione-parabola | `task` | FIX: hero3D2 orbitava IN SENSO ANTIORARIO (spd negativo) rompendo l'equidistanza → tutti e 3 in senso ORARIO, fasi equidistanti 120°; alla chiusura X riallineamento + ripresa orbita |
| hdr-intensita | `task` | HDR troppo forte → envMapIntensity 1.5 → 0.75 (dimezzato) |
| bloom-glare | `task` | REVERTITO su richiesta (2026-08-17): il bloom (UnrealBloomPass + composer r128) perdeva la trasparenza del canvas → hero nera. Rimosso tutto: moduli vendor, script, composer, scene.background. Render tornato a renderer.render semplice (canvas alpha:true). |
| tema-default | `task` | Default sito = **tema CHIARO** (data-theme="light" su tutte le pagine + fallback JS). Nota: CSS commenta "Rayo Dark (BLOCCATA)" — il dark resta come opzione toggle, il DEFAULT cambia |
| card-brand | `task` | Robosan/Heltyair: testo in BASSO A DESTRA (come le card foto). Sfondo GIF = asset futuri (in attesa) |
| vetro-domanda | `research` | RISPOSTA (analisi): il vetro NON è mai stato trasparente — r128 scarta KHR_materials_transmission (opaco bianco) + dove c'era alpha blending si vedeva sfondo sito/HDR bruciato. Fix = transmission vera + HDR dimezzato |

## Fuori scope (finché l'utente non seleziona grafica)
- Nuove foto/volto di Michele, og:image dedicato, logo clienti reali nel marquee (16 nomi invariati: decisione commerciale dell'utente)
- Rifacimento del sistema visivo (dark+lime resta come tema; default = light)
- GIF sfondo card brand (asset futuri dell'utente)

## Stato
Implementazione in corso nella sessione corrente; la mappa è un ledger delle decisioni, non un backlog di build. Nota: la tabella hero di AGENTS.md è ora obsoleta (hero3D3-bis = play; hero3D2 = esploso corretto) — AGENTS.md è gestito dall'utente, le istruzioni aggiornate vivono qui.

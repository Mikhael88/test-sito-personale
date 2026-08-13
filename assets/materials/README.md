# Materiali / Finiture per l'hero 3D

Quando un prodotto è in focus (cliccato), un click su di esso apre il **callout Finitura** con 3 opzioni.
Ogni opzione prova a caricare un mini-GLB con un micro-poligono a cui è applicata la finitura da "rubare".

## File attesi

| File | Finitura (fallback procedurale se il file manca) |
| --- | --- |
| `finish-1.glb` | Ottone (fallback: `#b98a2f`, metalness 1, roughness 0.28) |
| `finish-2.glb` | Alluminio spazzolato (fallback: `#c8ccd2`, metalness 0.9, roughness 0.45) |
| `finish-3.glb` | Nero opaco (fallback: `#222427`, metalness 0.35, roughness 0.85) |

## Come preparare un mini-GLB finitura (Blender)

1. Crea un piccolo oggetto (es. un cubo o un piano di ~2-5 cm) nel tuo file.
2. Applica il materiale con la finitura desiderata (PBR: base color, metallic, roughness).
3. Seleziona SOLO quel piccolo oggetto ed esporta: `File → Export → glTF 2.0 (.glb)` con:
   - `Format: glTF Binary (.glb)`
   - `Selected Objects: ✓` (solo l'oggetto finitura)
4. Rinomina il file `finish-1.glb` (o 2/3) e mettilo in questa cartella.
5. Incrementa `MODEL_VERSION` in `assets/js/glb-hero-1.js` (es. '4' → '5') per forzare il refresh cache, oppure chiedi a Hermes di pushare.

Il sistema estrae il primo materiale trovato nel mini-GLB, lo clona e lo applica a tutte le parti del prodotto in focus.

> Nota: i file in questa cartella sono opzionali. Senza di essi il callout funziona comunque con le finiture procedurali (colori/metalli di esempio).

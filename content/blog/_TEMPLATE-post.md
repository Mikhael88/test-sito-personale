---
# TEMPLATE POST — copiami in content/blog/<slug>.md e compila i campi qui sotto.
#
# Regole:
# - Il file DEVE avere il front-matter (---) con title, date, tags, image, excerpt.
# - "slug" = nome dell'URL (opzionale: se manca si genera dal titolo, ma mettilo tu per URL pulito).
# - "image": path relativo alla root del sito (es. ../assets/img/card-XYZ.webp) — sposta/ottimizza
#   prima l'immagine in assets/img/.
# - Corpo: Markdown semplice supportato: ## h2, ### h3, - liste, > blockquote, **grassetto**,
#   [link](url). Nient'altro (niente tabelle/code fence: il generatore non li rende).
# - Contenuti: il generatore crea blog/<slug>.html, aggiorna blog.html e la homepage se serve.
title: "Il titolo del post"
slug: il-titolo-del-post
date: 2026-08-11
tags: [Tag1, Tag2]
image: ../assets/img/card-configuratori.webp
excerpt: "La descrizione breve (card e meta SEO)."
---

Il paragrafo di apertura. Racconta il problema, non la tecnologia.

## Il contesto

Altri paragrafi.

- Un punto chiave.
- Un altro punto.

> Una citazione forte che chiude il ragionamento.
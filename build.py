#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — Mini generatore statico per il sito Faccoli.

content/<tipo>/<slug>.md  (front-matter + Markdown)
        │
        ▼  python build.py
        │
   blog/<slug>.html  /  case-study/<slug>.html   ← resi col template esistente (estetica identica)
        │
        ▼  aggiorna anche blog.html / case-history.html (liste, tra i marker)

Uso:
  python build.py                 # rigenera tutto
  python build.py --check         # solo verifica, non scrive nulla

Dipendenza: solo stdlib Python (nessun pip install) → gira in GitHub Actions gratis.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CONTENT = ROOT / "content"
# Dove vengono scritte le pagine generate (stessa cartella dei template esistenti)
BLOG_DIR = ROOT / "blog"
CASESTUDY_DIR = ROOT / "case-study"

SITE_URL = "https://www.faccioli.it"

MONTHS_IT = {
    "01": "Gen", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mag", "06": "Giu",
    "07": "Lug", "08": "Ago", "09": "Set", "10": "Ott", "11": "Nov", "12": "Dic",
}


# ---------------------------------------------------------------------------
# Front-matter + Markdown (minimale, sufficiente per i contenuti del sito)
# ---------------------------------------------------------------------------
def parse_front_matter(text: str):
    """Ritorna (meta: dict, body: str). Front-matter tra --- ---."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm = text[3:end]
    body = text[end + 4:].lstrip("\n")
    meta = {}
    for line in fm.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            k = k.strip()
            v = v.strip()
            if k == "tags":
                # [A, B] oppure "A, B"
                v = re.findall(r"[\w&' ]+", v.strip("[]"))
                v = [x.strip() for x in v if x.strip()]
            else:
                v = v.strip('"').strip("'")
            meta[k] = v
    return meta, body


def md_inline(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', text)
    return text


def md_to_html(body: str) -> str:
    out = []
    lines = body.splitlines()
    i = 0
    in_list = False
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            if in_list:
                out.append("  </ul>")
                in_list = False
            i += 1
            continue
        h2 = re.match(r"^##\s+(.*)", line)
        h3 = re.match(r"^###\s+(.*)", line)
        li = re.match(r"^-\s+(.*)", line)
        bq = re.match(r"^>\s*(.*)", line)
        if h2:
            if in_list:
                out.append("  </ul>"); in_list = False
            out.append(f"  <h2>{md_inline(h2.group(1))}</h2>")
        elif h3:
            if in_list:
                out.append("  </ul>"); in_list = False
            out.append(f"  <h3>{md_inline(h3.group(1))}</h3>")
        elif li:
            if not in_list:
                out.append("  <ul>")
                in_list = True
            out.append(f"    <li>{md_inline(li.group(1))}</li>")
        elif bq:
            if in_list:
                out.append("  </ul>"); in_list = False
            out.append(f"  <blockquote>{md_inline(bq.group(1))}</blockquote>")
        else:
            if in_list:
                out.append("  </ul>"); in_list = False
            out.append(f"  <p>{md_inline(line)}</p>")
        i += 1
    if in_list:
        out.append("  </ul>")
    return "\n".join(out)


def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    s = re.sub(r"-+", "-", s)
    return s


# ---------------------------------------------------------------------------
# Template: 1:1 con le pagine esistenti (head, nav, footer, script identici)
# ---------------------------------------------------------------------------
HEAD = """<!doctype html>
<html lang="it" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Faccoli</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700&family=Funnel+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style-12.css">
<meta property="og:type" content="article">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_description}">
<meta property="og:locale" content="it_IT">
</head>
<body>
"""

NAV = """
<nav class="nav">
  <div class="brand"><a href="../index.html">Michele Faccoli <b>-</b> Consulente Digitale</a></div>
  <div class="nav-links">
    <a href="../index.html">Home</a>
    <a href="../servizi.html">Servizi</a>
    <a href="../case-history.html">Case history</a>
    <a href="../blog.html">Blog</a>
    <a href="../contatti.html">Contatti</a>
  </div>
  <button class="theme-switch" aria-label="Cambia tema"><span>☀ luce</span></button>
</nav>
"""

FOOTER = """
<footer>
  <div>
    <div class="f-title">Faccoli · Digitalizzazione Prodotto</div>
    Digitalizzazione di prodotto e configuratori 3D per la manifattura — Brescia, Nord Italia.
  </div>
  <div>
    <div class="f-title">Navigazione</div>
    <div class="f-links">
      <a href="../index.html">Home</a>
      <a href="../servizi.html">Servizi</a>
      <a href="../case-history.html">Case history</a>
      <a href="../blog.html">Blog</a>
      <a href="../contatti.html">Contatti</a>
    </div>
  </div>
  <div>
    <div class="f-title">Contatti</div>
    ciao@faccioli.it<br>Brescia, Italia
  </div>
  <div>
    <div class="f-title">Ecosystem</div>
    <div class="f-links"><a href="#">Dribbble</a><a href="#">Behance</a><a href="#">Instagram</a><a href="#">LinkedIn</a></div>
  </div>
</footer>

<script src="../assets/js/main-11.js"></script>
</body>
</html>
"""


def fmt_date_it(iso: str) -> str:
    """2026-08-11 → '11 Ago 2026'"""
    try:
        y, m, d = iso.split("-")
        return f"{int(d):02d} {MONTHS_IT.get(m, m)} {y}"
    except Exception:
        return iso


def render_post(meta, body_html, kind: str):
    """kind: 'blog' | 'case-study'"""
    title = meta.get("title", "Untitled")
    description = meta.get("excerpt", title)
    slug = meta.get("slug") or slugify(title)
    date_iso = meta.get("date", "")
    tags = meta.get("tags", [])
    image = meta.get("image", "../assets/img/card-configuratori.webp")
    canonical = f"{SITE_URL}/{kind}/{slug}.html"

    if kind == "blog":
        meta_line = "".join(f"<i>{t}</i>" for t in tags)
        if date_iso:
            meta_line += f'<time datetime="{date_iso}">{fmt_date_it(date_iso)}</time>'
    else:
        meta_line = "".join(f"<i>{t}</i>" for t in tags)

    head = HEAD.format(
        title=title,
        description=description,
        canonical=canonical,
        og_title=title,
        og_description=description,
    )
    body = f"""{head}{NAV}
<header class="page-hero" style="padding-bottom:30px">
  <div class="a-meta">{meta_line}</div>
  <h1>{title}</h1>
</header>

<article class="article">
  <div class="a-hero"><img src="{image}" alt="{title}"></div>

{body_html}

  <div class="a-cta">
    <h3>Vuoi il tuo prodotto dal fisico al digitale?</h3>
    <p>Una consulenza di orientamento, senza impegno.</p>
    <a class="pill lime" href="../contatti.html">Parliamone →</a>
  </div>
</article>{FOOTER}
"""
    return body


# ---------------------------------------------------------------------------
# Liste: ricostruisce le <article class="bpost"> tra i marker nei file lista
# ---------------------------------------------------------------------------
def card_html(meta, kind: str, i: int):
    title = meta.get("title", "Untitled")
    slug = meta.get("slug") or slugify(title)
    # la lista sta in root (blog.html / case-history.html): path immagine senza ..
    image = meta.get("image", "assets/img/card-configuratori.webp")
    if image.startswith("../"):
        image = image[3:]
    excerpt = meta.get("excerpt", "")
    date_iso = meta.get("date", "")
    tags = meta.get("tags", [])
    data_d = f' data-d="{i}"' if i else ""

    if kind == "blog":
        meta_line = "".join(f"<i>{t}</i>" for t in tags)
        if date_iso:
            meta_line += f'<time datetime="{date_iso}">{fmt_date_it(date_iso)}</time>'
        href = f"blog/{slug}.html"
    else:
        meta_line = "".join(f"<i>{t}</i>" for t in tags)
        href = f"case-study/{slug}.html"

    return f"""  <article class="bpost rv"{data_d}>
    <a class="bp-media" href="{href}"><img src="{image}" alt="{title}"></a>
    <div class="bp-body">
      <div class="bp-meta">{meta_line}</div>
      <h2><a href="{href}">{title}</a></h2>
      <p>{excerpt}</p>
    </div>
  </article>"""


START_BLOG, END_BLOG = "<!-- BLOG-CARDS:START -->", "<!-- BLOG-CARDS:END -->"
START_CS, END_CS = "<!-- CASE-CARDS:START -->", "<!-- CASE-CARDS:END -->"


def update_list(list_file: Path, start: str, end: str, cards: str):
    if not list_file.exists():
        print(f"  ⚠ lista mancante, creo: {list_file.name}")
        return
    text = list_file.read_text(encoding="utf-8")
    if start not in text or end not in text:
        print(f"  ⚠ marker non trovati in {list_file.name}: inserisco le card senza toccare il resto")
        # inseriscili dopo il <section class="blog-list"> o case-list
        if 'class="blog-list"' in text:
            text = text.replace('<section class="blog-list">',
                                f'<section class="blog-list">\n{start}\n{cards}\n{end}',
                                1)
        elif 'class="case-list"' in text:
            text = text.replace('<section class="case-list">',
                                f'<section class="case-list">\n{start}\n{cards}\n{end}',
                                1)
        else:
            print(f"  ⚠ non trovo la sezione lista in {list_file.name}, salto l'aggiornamento")
            return
    else:
        text = re.sub(re.escape(start) + r".*?" + re.escape(end),
                      f"{start}\n{cards}\n{end}",
                      text, flags=re.S)
    list_file.write_text(text, encoding="utf-8")
    print(f"  ✓ lista aggiornata: {list_file.name}")


# ---------------------------------------------------------------------------
# Renderer testi (CMS a file): template + content/testi/<pagina>.md → pagina HTML
# ---------------------------------------------------------------------------
TESTI_DIR = ROOT / "content" / "testi"
TEMPLATE_DIR = ROOT / "template"


def md_inline_rich(text: str) -> str:
    """markdown inline completo: **b** *i* ~thin~ [a](url), ⏎ → <br>"""
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"~(.+?)~", r'<span class="word thin">\1</span>', text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', text)
    text = text.replace("⏎", "<br>")
    return text


def split_sec_title(text: str) -> str:
    """'Servizi' → <span class="s">S</span>... (titolo split lettera-per-lettera)"""
    return "".join(f'<span class="s">{ch}</span>' for ch in text)


def hero_title_html(text: str) -> str:
    """'A | B | **C** | ~d~' → <h1 id="ht"> con line/word, accent e thin"""
    lines = text.split("|")
    html = ['<h1 class="hero-title" id="ht">']
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        parts = re.findall(r"\*\*(.+?)\*\*|~(.+?)~|(\S+)", ln)
        words = []
        for b, t, w in parts:
            if b:
                words.append(f'<span class="word accent">{b}</span>')
            elif t:
                words.append(f'<span class="word thin">{t}</span>')
            else:
                words.append(f'<span class="word">{w}</span>')
        html.append(f'  <span class="line">{" ".join(words)}</span>')
    html.append("</h1>")
    return "\n".join(html)


def render_pagina(pagina: str) -> bool:
    """Rende <pagina>.html da template/<pagina>.template.html + content/testi/<pagina>.md.
    Ritorna True se la pagina è stata resa, False se non c'è template (resta com'è)."""
    tpl = TEMPLATE_DIR / f"{pagina}.template.html"
    testi_file = TESTI_DIR / f"{pagina}.md"
    if not tpl.exists() or not testi_file.exists():
        return False

    testi = {}
    for line in testi_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith(">"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        testi[k.strip()] = v.strip()

    html = tpl.read_text(encoding="utf-8")

    # Passo 1: liste ({{chiave.lista}} dentro <ul> → <li> multipli)
    def li_repl(m):
        chiave = m.group(1)
        val = testi.get(chiave, "")
        items = [f"<li>{md_inline_rich(x.strip())}</li>" for x in val.split("⏎") if x.strip()]
        return f"<ul>\n          " + "\n          ".join(items) + "\n        </ul>"

    html = re.sub(r"<ul>\{\{([a-z0-9_.]+\.lista)\}\}</ul>", li_repl, html)

    # Passo 2: hero titolo
    if "hero.titolo" in testi:
        html = re.sub(r"<h1 class=\"hero-title\" id=\"ht\">\{\{hero\.titolo\}\}</h1>",
                      lambda m: hero_title_html(testi["hero.titolo"]), html)
        del testi["hero.titolo"]

    # Passo 3: titoli split lettera-per-lettera (sec-title)
    def sec_repl(m):
        testo = testi.get(m.group(1), "")
        return f'<h2 class="sec-title">{split_sec_title(testo)}</h2>'

    html = re.sub(r"<h2 class=\"sec-title\">\{\{([a-z0-9_.]+\.titolo)\}\}</h2>",
                  sec_repl, html)

    # Passo 3b: tags ({{chiave.tags}} dentro div.tags → <span> multipli)
    def tags_repl(m):
        testo = testi.get(m.group(1), "")
        items = "".join(f"<span>{x.strip()}</span>" for x in testo.split("·") if x.strip())
        return f'<div class="tags">{items}</div>'

    html = re.sub(r"<div class=\"tags\">\{\{([a-z0-9_.]+\.tags)\}\}</div>",
                  tags_repl, html)

    # Passo 4: tutto il resto = placeholder → markdown inline
    def generic_repl(m):
        chiave = m.group(1)
        return md_inline_rich(testi.get(chiave, m.group(0)))

    html = re.sub(r"\{\{([a-z0-9_.]+)\}\}", generic_repl, html)

    (ROOT / f"{pagina}.html").write_text(html, encoding="utf-8")
    print(f"  ✓ {pagina}.html (da template + testi)")
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    check_only = "--check" in sys.argv
    generated = []

    # Passo 0: pagine con template + testi (CMS a file). Le pagine senza template
    # (ancora non estratte) restano com'è nel repo.
    if check_only:
        for tpl in TEMPLATE_DIR.glob("*.template.html") if TEMPLATE_DIR.exists() else []:
            print(f"  [check] {tpl.name} + content/testi/{tpl.stem.split('.')[0]}.md")
    else:
        for tpl in TEMPLATE_DIR.glob("*.template.html") if TEMPLATE_DIR.exists() else []:
            pagina = tpl.name.replace(".template.html", "")
            if render_pagina(pagina):
                generated.append(ROOT / f"{pagina}.html")

    for kind, out_dir, list_file, start, end in [
        ("blog", BLOG_DIR, ROOT / "blog.html", START_BLOG, END_BLOG),
        ("case-study", CASESTUDY_DIR, ROOT / "case-history.html", START_CS, END_CS),
    ]:
        src_dir = CONTENT / kind
        if not src_dir.exists():
            print(f"— nessun contenuto in content/{kind}")
            continue
        (out_dir if not check_only else ROOT).mkdir(exist_ok=True)
        metas = []

        for md_file in sorted(src_dir.glob("*.md")):
            if md_file.name.startswith("_"):
                print(f"  - ignorato (template): {md_file.name}")
                continue
            text = md_file.read_text(encoding="utf-8")
            meta, body = parse_front_matter(text)
            meta["slug"] = meta.get("slug") or slugify(meta.get("title", md_file.stem))
            metas.append(meta)

            if check_only:
                print(f"  [check] {kind}/{meta['slug']} ← {md_file.name}")
                continue

            body_html = md_to_html(body)
            html = render_post(meta, body_html, kind)
            out_file = out_dir / f"{meta['slug']}.html"
            out_file.write_text(html, encoding="utf-8")
            generated.append(out_file)
            print(f"  ✓ {out_file.relative_to(ROOT)}")

        # aggiorna lista (ordina per data desc)
        metas.sort(key=lambda m: m.get("date", ""), reverse=True)
        if not check_only and metas:
            cards = "\n".join(card_html(m, kind, i) for i, m in enumerate(metas))
            update_list(list_file, start, end, cards)

    if check_only:
        print("\n[check OK] nessun file scritto")
        return
    print(f"\nFatto: {len(generated)} pagine generate.")


if __name__ == "__main__":
    main()

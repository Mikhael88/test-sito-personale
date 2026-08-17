/* Faccoli · Digitalizzazione Prodotto — JS condiviso statico
   Difensivo: ogni blocco verifica l'esistenza dei suoi elementi prima di agire. */
(function(){
  document.documentElement.classList.add('js');
  var THEME = document.documentElement.getAttribute('data-theme') || 'light';

  /* toggle tema */
  var ts = document.querySelector('.theme-switch');
  if (ts) ts.addEventListener('click', function(){
    THEME = THEME === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', THEME);
    var s = ts.querySelector('span'); if (s) s.textContent = THEME === 'dark' ? '☀ luce' : '☾ scuro';
  });

  /* menu mobile: hamburger + pannello (chiusura: link, Esc, click fuori) */
  var nt = document.querySelector('.nav-toggle');
  var nl = document.querySelector('.nav-links');
  if (nt && nl){
    function setNav(open){
      nl.classList.toggle('open', open);
      nt.setAttribute('aria-expanded', open ? 'true' : 'false');
      nt.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    }
    nt.addEventListener('click', function(){ setNav(!nl.classList.contains('open')); });
    nl.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setNav(false); }); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setNav(false); });
    document.addEventListener('click', function(e){
      if (nl.classList.contains('open') && !nl.contains(e.target) && !nt.contains(e.target)) setNav(false);
    });
  }

  /* marquee: fill da un data-array.
     Duplica il contenuto finché il track è largo almeno 2× il viewport:
     così l'animazione translateX(-50%) non lascia mai buchi (parole che
     spariscono per qualche secondo quando la serie è più stretta dello schermo). */
  function fillMarquee(id, items){
    var t = document.getElementById(id); if (!t) return;
    var one = '';
    for (var i = 0; i < items.length; i++)
      one += '<div class="marquee-item"><span class="m-label">'+items[i]+' <span class="star">✳</span></span></div>';
    var reps = 4; /* minimo 4 copie; cresce se serve */
    t.innerHTML = '';
    for (var d = 0; d < reps; d++) t.innerHTML += one;
    /* se ancora stretto rispetto a 2× viewport, raddoppia finché basta */
    var vw = window.innerWidth || 1280;
    var guard = 0;
    while (t.scrollWidth < vw * 2 && guard < 8){
      t.innerHTML += one;
      guard++;
    }
  }
  var m1 = document.getElementById('m1');
  if (m1) fillMarquee('m1', ['Configuratori 3D','Render & Animazioni','AI applicata','Fotogrammetria','Gaussian Splatting','Rendering prodotto']);

  /* clienti: marquee scorrevole (stessa riga servizi) */
  var CLI = ['Altrenotti','Marmogranito','DND','Rizzoli','Sunshading','Silverplat','Robosan','Alcofer','Cosmo','Tredo','Prussiani Engineering','Intimissimi','Olfice','Maxema','Heltyair','Limago'];
  var cli = document.getElementById('mc');
  if (cli) fillMarquee('mc', CLI);

  /* pausa motion fuori viewport (WCAG 2.2.2): marquee */
  var mIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ e.target.classList.toggle('paused', !e.isIntersecting); });
  }, {rootMargin:'80px 0px 80px 0px'});
  document.querySelectorAll('.marquee').forEach(function(m){ mIO.observe(m); });

  /* case carousel: fill + velocity-linked loop (solo se presente) */
  /* case carousel: fill + velocity-linked loop (solo se presente)
     Card color = payoff d'effetto NON cliccabili (interruzione estetica);
     card photo = progetti cliccabili. */
  var PAYOFFS = [
    'Il 3D non è un render: è il prodotto che parla.',
    'L\'IA potenzia il modello, non lo sostituisce.',
    'Coerenza di finiture: il vero lusso digitale.',
    'Dal fisico al digitale in una sola mossa.',
    'Un\'immagine coerente vale mille foto.',
    'Il configuratore vende, il catalogo aspetta.',
    'La manutenzione si capisce prima di toccare.',
    'Il prodotto migliore è quello che si spiega da solo.',
    'Il digitale non è il futuro: è il presente del tuo prodotto.',
    'Un modello 3D vale più di mille parole tecniche.'
  ];
  var payoffIdx = 0;
  function nextPayoff(){
    var p = PAYOFFS[payoffIdx % PAYOFFS.length];
    payoffIdx++;
    return p;
  }
  var CASES = [
    {type:'photo', name:'Altrenotti', img:'assets/img/case-altrenotti.webp', href:'case-study/altrenotti.html'},
    {type:'color', cls:'cc-lime'},
    {type:'photo', name:'Marmogranito', img:'assets/img/case-marmogranito.webp', href:'case-study/marmogranito.html'},
    {type:'color', cls:'cc-lav'},
    {type:'photo', name:'DND', img:'assets/img/case-dnd.webp', href:'case-study/dnd-martinelli.html'},
    {type:'color', cls:'cc-surface'},
    {type:'brand', name:'Robosan', cls:'cc-lav', href:'case-study/robosan.html'},
    {type:'color', cls:'cc-lime'},
    {type:'brand', name:'Heltyair', cls:'cc-surface', href:'case-study/heltyair.html'},
    {type:'color', cls:'cc-lav'},
    {type:'photo', name:'Bausola 3D', img:'assets/img/case-bausola.webp', href:'case-study/bausola-3d.html'},
    {type:'color', cls:'cc-lime'}
  ];
  function caseCard(c){
    if (c.type === 'brand'){
      return '<a class="case-card color brand '+(c.cls||'cc-surface')+'" href="'+c.href+'"><div class="c-name">'+c.name+'</div><div class="c-payoff">Caso studio completo →</div></a>';
    }
    if (c.type === 'color'){
      /* payoff: card NON cliccabile, solo interruzione estetica */
      var pay = nextPayoff();
      return '<div class="case-card color '+c.cls+'" aria-hidden="true"><div class="c-payoff">'+pay+'</div></div>';
    }
    return '<a class="case-card photo" href="'+c.href+'"><img src="'+c.img+'" alt="Caso studio '+c.name+'" loading="lazy" decoding="async"><div class="c-name">'+c.name+'</div></a>';
  }
  function fillCase(id, items){
    var t = document.getElementById(id); if (!t) return 0;
    var h = ''; for (var d = 0; d < 3; d++) for (var i = 0; i < items.length; i++) h += caseCard(items[i]);
    t.innerHTML = h; return t.scrollWidth / 3;
  }
  var setA = fillCase('case-a', CASES);
  var setB = fillCase('case-b', CASES.slice().reverse());
  if (document.getElementById('case-a')) {
    var scrollVel = 0, lastY = window.scrollY, posA = 0, posB = 0, caseReady = false;
    var caseVisible = true, caseHover = false;
    var cIO = new IntersectionObserver(function(en){ en.forEach(function(e){ caseVisible = e.isIntersecting; }); }, {rootMargin:'120px 0px'});
    var rowsHost = document.querySelector('.case-rows'); if (rowsHost) cIO.observe(rowsHost);
    /* frecce del carosello (navigazione esplicita, oltre al drag) */
    document.querySelectorAll('.car-btn').forEach(function(b){
      b.addEventListener('click', function(){
        if (!setA) return;
        var dir = b.dataset.dir === '1' ? -1 : 1;
        posA += dir * (setA / CASES.length);
        while (posA <= -setA) posA += setA;
        while (posA > 0) posA -= setA;
        var a = document.getElementById('case-a'); if (a) a.style.transform = 'translateX(' + posA + 'px)';
      });
    });
    window.addEventListener('scroll', function(){ var y = window.scrollY; scrollVel = y - lastY; lastY = y; }, {passive:true});

    /* drag con mouse/dito (Pointer Events: funziona touch e desktop).
       Un drag orizzontale sposta entrambe le righe (direzioni opposte):
       trascinare a destra fa scorrere la riga A avanti e la B indietro. */
    var dragCase = null, dragStartX = 0, dragDelta = 0, dragLastX = 0, dragVel = 0;
    var rows = document.querySelector('.case-rows');
    if (rows){
      rows.addEventListener('mouseenter', function(){ caseHover = true; });
      rows.addEventListener('mouseleave', function(){ caseHover = false; });
      rows.addEventListener('pointerdown', function(e){
        dragCase = {id: e.pointerId};
        dragStartX = dragLastX = e.clientX;
        dragDelta = 0; dragVel = 0;
        try { rows.setPointerCapture(e.pointerId); } catch(err){}
      });
      rows.addEventListener('pointermove', function(e){
        if (!dragCase || dragCase.id !== e.pointerId) return;
        var dx = e.clientX - dragLastX;
        dragLastX = e.clientX;
        dragDelta += dx;
        dragVel = dx;
        posA += dx; posB -= dx; /* A e B scorrono in direzioni opposte */
        while (posA <= -setA) posA += setA;
        while (posB >= 0) posB -= setB;
        var a = document.getElementById('case-a'); if (a) a.style.transform = 'translateX('+posA+'px)';
        var b = document.getElementById('case-b'); if (b) b.style.transform = 'translateX('+posB+'px)';
      });
      function endDrag(e){
        if (!dragCase || dragCase.id !== e.pointerId) return;
        dragCase = null;
      }
      rows.addEventListener('pointerup', endDrag);
      rows.addEventListener('pointercancel', endDrag);
      rows.addEventListener('pointerleave', endDrag);
      /* evita che il drag inizi quando si clicca una card (navigazione) */
      rows.addEventListener('click', function(e){
        if (Math.abs(dragDelta) > 8){ e.preventDefault(); e.stopPropagation(); }
      }, true);
      rows.style.cursor = 'grab';
      rows.style.touchAction = 'pan-y';
    }

    function caseLoop(){
      if (!caseVisible || caseHover){ requestAnimationFrame(caseLoop); return; }
      if (caseReady && setA && setB){
        scrollVel *= 0.9;
        var base = 0.6, boost = Math.min(Math.abs(scrollVel) * 0.35, 14);
        /* inerzia del drag: continua il movimento dopo il rilascio */
        var inertia = 0;
        if (!dragCase && Math.abs(dragVel) > 0.1){ inertia = dragVel * 0.35; dragVel *= 0.9; }
        posA -= (base + boost) + inertia; posB += (base + boost) + inertia;
        while (posA <= -setA) posA += setA;
        while (posB >= 0) posB -= setB;
        var a = document.getElementById('case-a'); if (a) a.style.transform = 'translateX('+posA+'px)';
        var b = document.getElementById('case-b'); if (b) b.style.transform = 'translateX('+posB+'px)';
      }
      requestAnimationFrame(caseLoop);
    }
    window.addEventListener('load', function(){
      setA = document.getElementById('case-a').scrollWidth / 3;
      setB = document.getElementById('case-b').scrollWidth / 3;
      posA = 0; posB = -setB; caseReady = true;
    });
    requestAnimationFrame(caseLoop);
  }

  /* hero title animation */
  var ht = document.getElementById('ht');
  if (ht) setTimeout(function(){ ht.classList.add('done'); }, 300);

  /* reveal on scroll + counters + steps */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in');
      if (el.querySelector('.cnt')) runCount(el);
      io.unobserve(el);
    });
  }, {threshold:.08, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
  /* fallback di sicurezza: sblocca subito qualsiasi .rv rimasta nascosta
     (evita titoli "slittati in basso" / invisibili se l'IO non scatta) */
  function revealSafely(){
    document.querySelectorAll('.rv:not(.in)').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top <= window.innerHeight && r.bottom >= 0) el.classList.add('in');
    });
  }
  if (document.readyState === 'complete') revealSafely();
  else window.addEventListener('load', function(){ setTimeout(revealSafely, 400); });
  window.addEventListener('scroll', revealSafely, {passive:true});

  function runCount(box){
    var el = box.querySelector('.cnt'); if (!el || !el.dataset.to) return;
    var to = +el.dataset.to, cur = 0, step = Math.max(1, Math.round(to / 50));
    var iv = setInterval(function(){ cur += step; if (cur >= to) { cur = to; clearInterval(iv); } el.textContent = cur; }, 26);
  }

  /* parallax media-block: solo desktop, solo quando visibile */
  var canParallax = window.matchMedia('(min-width:901px) and (prefers-reduced-motion:no-preference)').matches;
  if (canParallax){
    var pBlocks = document.querySelectorAll('.mblock');
    if (pBlocks.length){
      var pSet = [];
      pBlocks.forEach(function(b){
        var inner = b.querySelector('.mblock-inner'); if (!inner) return;
        pSet.push({b:b, inner:inner});
        inner.style.transform = 'translateY(0)';
      });
      var pIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if (e.isIntersecting) e.target.dataset.act = '1'; else delete e.target.dataset.act; });
      }, {rootMargin:'20% 0px 20% 0px'});
      pSet.forEach(function(o){ pIO.observe(o.b); });
      function pTick(){
        for (var i = 0; i < pSet.length; i++){
          var o = pSet[i]; if (!o.b.dataset.act) continue;
          var r = o.b.getBoundingClientRect(), vh = window.innerHeight;
          if (r.bottom < 0 || r.top > vh) continue;
          var prog = (r.top + r.height / 2 - vh / 2) / vh; /* -0.5..0.5 */
          o.inner.style.transform = 'translateY(' + (prog * 70) + 'px)';
        }
        requestAnimationFrame(pTick);
      }
      requestAnimationFrame(pTick);
    }
  }

  /* form contatti: invio AJAX + stato visibile + fallback */
  var form = document.querySelector('.contact-form');
  if (form){
    var stEl = document.createElement('div');
    stEl.setAttribute('role', 'status');
    stEl.setAttribute('aria-live', 'polite');
    stEl.style.display = 'none';
    stEl.style.cssText += ';margin-top:18px;padding:14px 16px;border-radius:12px;font-size:15px;line-height:1.5';
    form.appendChild(stEl);
    function status(msg, ok){
      stEl.textContent = msg;
      stEl.style.display = 'block';
      stEl.style.background = ok ? 'rgba(var(--accent-rgb),.14)' : 'rgba(255,110,110,.14)';
      stEl.style.color = ok ? 'var(--accent)' : '#ff9a9a';
      stEl.style.border = '1px solid ' + (ok ? 'rgba(var(--accent-rgb),.45)' : 'rgba(255,140,140,.45)');
    }
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function(v, k){ payload[k] = v; });
      payload._subject = 'Richiesta dal sito michelefaccoli.com';
      var btn = form.querySelector('button[type="submit"]');
      var oldLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Invio in corso…';
      fetch('https://formsubmit.co/ajax/info@michelefaccoli.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json(); }).then(function(j){
        if (j && (j.success === 'true' || j.success === true)){
          form.reset();
          btn.disabled = false;
          btn.textContent = 'Richiesta inviata ✓';
          status('Grazie! Rispondo entro un giorno lavorativo', true);
        } else { throw new Error('submit-failed'); }
      }).catch(function(){
        btn.disabled = false;
        btn.textContent = oldLabel;
        status('Invio non riuscito. Scrivimi direttamente: info@michelefaccoli.com', false);
      });
    });
  }
})();

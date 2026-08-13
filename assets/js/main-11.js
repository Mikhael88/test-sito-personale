/* Faccoli · Digitalizzazione Prodotto — JS condiviso statico
   Difensivo: ogni blocco verifica l'esistenza dei suoi elementi prima di agire. */
(function(){
  var THEME = document.documentElement.getAttribute('data-theme') || 'dark';

  /* toggle tema */
  var ts = document.querySelector('.theme-switch');
  if (ts) ts.addEventListener('click', function(){
    THEME = THEME === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', THEME);
    var s = ts.querySelector('span'); if (s) s.textContent = THEME === 'dark' ? '☀ luce' : '☾ scuro';
  });

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
    {type:'photo', name:'Altrenotti', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-01.webp', href:'case-study/altrenotti.html'},
    {type:'color', cls:'cc-lime', tag:'Payoff'},
    {type:'photo', name:'Marmogranito', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-02.webp', href:'case-study/marmogranito.html'},
    {type:'color', cls:'cc-lav', tag:'Payoff'},
    {type:'photo', name:'DND', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-03.webp', href:'case-study/dnd-martinelli.html'},
    {type:'color', cls:'cc-surface', tag:'Payoff'},
    {type:'photo', name:'Robosan', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-01.webp', href:'case-study/robosan.html'},
    {type:'color', cls:'cc-lav', tag:'Payoff'},
    {type:'photo', name:'Heltyair', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-02.webp', href:'case-study/heltyair.html'},
    {type:'color', cls:'cc-lime', tag:'Payoff'},
    {type:'photo', name:'Bausola 3D', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-03.webp', href:'case-study/bausola-3d.html'},
    {type:'color', cls:'cc-surface', tag:'Payoff'}
  ];
  function caseCard(c){
    if (c.type === 'color'){
      /* payoff: card NON cliccabile, solo interruzione estetica */
      var pay = nextPayoff();
      return '<div class="case-card color '+c.cls+'" aria-hidden="true"><div class="c-tag">'+c.tag+'</div><div class="c-payoff">'+pay+'</div></div>';
    }
    return '<a class="case-card photo" href="'+c.href+'"><img src="'+c.img+'" alt="'+c.name+'"><div class="c-name">'+c.name+'</div></a>';
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
    window.addEventListener('scroll', function(){ var y = window.scrollY; scrollVel = y - lastY; lastY = y; }, {passive:true});

    /* drag con mouse/dito (Pointer Events: funziona touch e desktop).
       Un drag orizzontale sposta entrambe le righe (direzioni opposte):
       trascinare a destra fa scorrere la riga A avanti e la B indietro. */
    var dragCase = null, dragStartX = 0, dragDelta = 0, dragLastX = 0, dragVel = 0;
    var rows = document.querySelector('.case-rows');
    if (rows){
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
})();

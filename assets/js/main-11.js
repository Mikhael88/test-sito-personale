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

  /* marquee: fill da un data-array */
  function fillMarquee(id, items){
    var t = document.getElementById(id); if (!t) return;
    var h = '';
    for (var d = 0; d < 2; d++) for (var i = 0; i < items.length; i++)
      h += '<div class="marquee-item"><span class="m-label">'+items[i]+' <span class="star">✳</span></span></div>';
    t.innerHTML = h;
  }
  var m1 = document.getElementById('m1');
  if (m1) fillMarquee('m1', ['Configuratori 3D','Render & Animazioni','AI applicata','Fotogrammetria','Gaussian Splatting','Rendering prodotto']);

  /* clienti: marquee scorrevole (stessa riga servizi) */
  var CLI = ['Altrenotti','Marmogranito','DND','Rizzoli','Sunshading','Silverplat','Robosan','Alcofer','Cosmo','Tredo','Prussiani Engineering','Intimissimi','Olfice','Maxema','Heltyair','Limago'];
  var cli = document.getElementById('mc');
  if (cli) fillMarquee('mc', CLI);

  /* case carousel: fill + velocity-linked loop (solo se presente) */
  var CASES = [
    {type:'color', name:'Altrenotti', tag:'Configuratore 3D · 1B+ varianti', cls:'cc-lime', href:'case-study/altrenotti.html'},
    {type:'photo', name:'Altrenotti', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-01.webp', href:'case-study/altrenotti.html'},
    {type:'color', name:'Marmogranito', tag:'Primo configuratore parametrico in Italia', cls:'cc-lav', href:'case-study/marmogranito.html'},
    {type:'photo', name:'Marmogranito', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-02.webp', href:'case-study/marmogranito.html'},
    {type:'color', name:'DND Martinelli', tag:'20K+ immagini coerenti', cls:'cc-surface', href:'case-study/dnd-martinelli.html'},
    {type:'photo', name:'DND', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-03.webp', href:'case-study/dnd-martinelli.html'}
  ];
  function caseCard(c){
    if (c.type === 'color') return '<a class="case-card color '+c.cls+'" href="'+c.href+'"><div class="c-tag">'+c.tag+'</div><div class="c-name">'+c.name+'</div></a>';
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
    function caseLoop(){
      if (caseReady && setA && setB){
        scrollVel *= 0.9;
        var base = 0.6, boost = Math.min(Math.abs(scrollVel) * 0.35, 14);
        posA -= (base + boost); posB += (base + boost);
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
})();

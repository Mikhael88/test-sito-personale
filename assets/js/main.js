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
  if (m1) fillMarquee('m1', ['Configuratori 3D','Video & animazioni tecniche','Ricostruzione 3D','Fotogrammetria','Gaussian Splatting','Rendering prodotto']);
  fillMarquee('m2', ['Scopri i servizi','Configuratori 3D','Digitalizzazione prodotto','Nord Italia — manifattura']);

  /* case carousel: fill + velocity-linked loop (solo se presente) */
  var CASES = [
    {type:'color', name:'Altrenotti', tag:'Configuratore 3D · 1B+ varianti', cls:'cc-lime'},
    {type:'photo', name:'Altrenotti', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-01.webp'},
    {type:'color', name:'Marmogranito', tag:'Primo configuratore parametrico in Italia', cls:'cc-lav'},
    {type:'photo', name:'Marmogranito', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-02.webp'},
    {type:'color', name:'DND Martinelli', tag:'20K+ immagini coerenti', cls:'cc-surface'},
    {type:'photo', name:'DND', img:'https://demo.oceanthemes.site/rayo-dark/wp-content/uploads/sites/15/2025/10/1200x1000_marquee-03.webp'}
  ];
  function caseCard(c){
    if (c.type === 'color') return '<div class="case-card color '+c.cls+'"><div class="c-tag">'+c.tag+'</div><div class="c-name">'+c.name+'</div></div>';
    return '<div class="case-card photo"><img src="'+c.img+'" alt="'+c.name+'"><div class="c-name">'+c.name+'</div></div>';
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

  /* hero floats: idle + drag-to-rotate + parallax (solo se presenti) */
  var floats = document.querySelectorAll('.float');
  if (floats.length) {
    floats.forEach(function(f){
      f._rx = 0; f._ry = 0; f._drag = false;
      var img = f.querySelector('img');
      f.addEventListener('pointerdown', function(e){
        f._drag = true; f.classList.add('dragging'); f.setPointerCapture(e.pointerId);
        f._sx = e.clientX; f._sy = e.clientY; e.preventDefault();
      });
      f.addEventListener('pointermove', function(e){
        if (!f._drag) return;
        f._ry = (f._ry || 0) + (e.clientX - f._sx) * 0.6;
        f._rx = (f._rx || 0) - (e.clientY - f._sy) * 0.6;
        f._sx = e.clientX; f._sy = e.clientY;
        if (img) img.style.transform = 'perspective(800px) rotateY('+f._ry+'deg) rotateX('+f._rx+'deg)';
      });
      function endDrag(){ f._drag = false; f.classList.remove('dragging'); }
      f.addEventListener('pointerup', endDrag);
      f.addEventListener('pointercancel', endDrag);
    });
    var t0 = 0;
    function loop(ts){
      var y = (ts - t0) / 1000;
      floats.forEach(function(f, i){ var ph = Math.sin(y * 1.2 + i * 2.1) * 14; f.style.transform = 'translateY('+ph+'px)'; });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
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

  /* parallax floats on scroll */
  window.addEventListener('scroll', function(){
    var y = window.scrollY;
    if (floats.length && y < window.innerHeight * 1.2){
      floats.forEach(function(f, i){ var off = y * (0.04 + i * 0.02); f.style.marginTop = off + 'px'; });
    }
  }, {passive:true});
})();

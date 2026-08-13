/* Faccoli · Hero 3D interattivo
   Tre modelli GLB (hero3D1/2/3.glb in assets/models/ — sostituibili dall'utente).
   - HDR environment (assets/hdri/studio.hdr) via PMREM: albedo + riflessioni.
   - Stato idle: i tre oggetti orbitano lentamente attorno al testo (orbita spostata a dx).
   - Click/grab su un oggetto: va in grande a destra del testo, rotazione ferma,
     lo ruoti a 360° col mouse. Gli altri due vanno a sinistra e fluttuano.
   - X sopra l'oggetto grande: si torna all'orbita. Click su un oggetto a sx: lo attivi a dx. */
(function(){
  var canvas = document.getElementById('hero3d');
  var hero = document.querySelector('.hero');
  if (!canvas || !hero || !window.THREE || !window.THREE.GLTFLoader) return;

  var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);

  /* luci di supporto (l'HDR fa il grosso del lavoro su albedo e riflessioni) */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  var key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(6, 9, 7);
  scene.add(key);

  /* PMREM: carica HDR e lo applica come environment (riflessioni + irradianza) */
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envReady = false;
  function applyEnv(texture){
    var env = pmrem.fromEquirectangular(texture).texture;
    scene.environment = env;
    scene.environmentIntensity = 1.0;
    texture.dispose();
    envReady = true;
  }
  if (window.THREE.RGBELoader){
    new THREE.RGBELoader().load('assets/hdri/studio.hdr', applyEnv, undefined, function(){
      /* fallback: nessun env, restano le luci */
    });
  }

  /* IMPORTANTE: quando sostituisci i GLB in assets/models/, INCREMENTA questa
     versione (es. '2' -> '3'): forza il browser a scaricare i nuovi file
     invece di usare quelli in cache (GitHub Pages cachea i file per 10 min). */
  var MODEL_VERSION = '3';

  var MODELS = [
    {url: 'assets/models/hero3D1.glb?v=' + MODEL_VERSION, spin: 0.18},
    {url: 'assets/models/hero3D2.glb?v=' + MODEL_VERSION, spin: -0.14},
    {url: 'assets/models/hero3D3.glb?v=' + MODEL_VERSION, spin: 0.1}
  ];

  var group = new THREE.Group();
  /* offset: orbita spostata a destra per centrare la rotazione sul testo */
  group.position.x = 0.9;
  scene.add(group);

  var items = [];
  var pending = MODELS.length;
  var loader = new THREE.GLTFLoader();
  if (window.THREE.DRACOLoader){
    var dracoloader = new THREE.DRACOLoader();
    dracoloader.setDecoderPath('assets/js/vendor/draco/');
    loader.setDRACOLoader(dracoloader);
  }

  MODELS.forEach(function(cfg, i){
    loader.load(cfg.url, function(gltf){
      var mesh = gltf.scene;

      var box = new THREE.Box3().setFromObject(mesh);
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      var baseScale = 2.4 / maxDim;
      mesh.scale.setScalar(baseScale);
      box.setFromObject(mesh);
      var c = box.getCenter(new THREE.Vector3());
      mesh.position.sub(c);
      mesh.rotation.y = i * 1.1;

      var wrap = new THREE.Object3D();
      wrap.add(mesh);
      group.add(wrap);

      /* potenzia l'HDR sui materiali: più albedo + riflessioni leggibili */
      mesh.traverse(function(o){
        if (o.isMesh && o.material){
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function(m){
            if (m && 'envMapIntensity' in m) m.envMapIntensity = 1.5;
            if (m && m.metalness === 0) m.metalness = 0.15;
            if (m && m.roughness === 1) m.roughness = 0.85;
          });
        }
      });

      /* velocità di fase leggermente diverse: le traiettorie derivano e
         ogni tanto gli oggetti si incontrano → urto con rimbalzo */
      var spd = SPEED * (0.82 + i * 0.18) * (i % 2 === 0 ? 1 : -1);
      items[i] = {wrap: wrap, mesh: mesh, phase: i * Math.PI * 2 / 3, spd: spd, spin: cfg.spin, ready: true, cooldown: 0};
      pending--;
    });
  });

  /* traiettoria PARABOLICA: gli oggetti seguono un arco (parte in basso a sx,
     sale all'apice sopra il testo, scende in basso a dx) — come da curva verde */
  var RX = 4.2, APEX = 1.9, BOTTOM = -1.3, SPEED = 0.14; /* rotazione lenta */

  /* --- stati interattivi --- */
  var DETAIL = null;      // indice dell'oggetto ingrandito a destra (o null)
  var dragging = false, dragObj = null, dragLastX = 0, dragLastY = 0;
  var raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();

  function meshAt(clientX, clientY){
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    for (var i = 0; i < items.length; i++){
      var it = items[i]; if (!it || !it.ready) continue;
      /* 1) hit preciso sulla geometria */
      var hits = raycaster.intersectObject(it.mesh, true);
      if (hits.length) return i;
      /* 2) fallback tollerante: bounding box del wrap (oggetti sottili/allungati) */
      var box = new THREE.Box3().setFromObject(it.wrap);
      if (raycaster.ray.intersectBox(box, new THREE.Vector3())) return i;
    }
    return -1;
  }

  /* posizioni target: idle = parabola; detail = uno a dx grande, altri a sx fluttuanti */
  function targetPos(it, i, t){
    if (DETAIL === null){
      var a = it.phase;                       /* fase integrata: niente salti al ritorno */
      var x = Math.sin(a) * RX;
      /* parabola: y = APEX - k·x² → apice al centro (sopra il testo), discesa ai lati */
      var norm = (x / RX) * (x / RX);           /* 0 al centro, 1 ai bordi */
      var y = APEX - (APEX - BOTTOM) * norm;
      var normY = (y - BOTTOM) / (APEX - BOTTOM); /* 0 in basso, 1 in alto */
      var s = 0.55 + normY * 0.65;               /* più grande in alto (vicino) */
      return {x: x, y: y, z: 0.2, s: s, rot: a};
    }
    if (i === DETAIL){
      /* grande a destra del testo, rotazione controllata dall'utente */
      return {x: 3.1, y: 0.1, z: 1.0, s: 1.6, rot: null};
    }
    /* a sinistra, fluttuano lentamente: posizioni distinte per i due rimanenti */
    var others = [0, 1, 2].filter(function(k){ return k !== DETAIL; });
    var slot = others.indexOf(i); /* 0 o 1 */
    var side = slot === 0 ? -2.4 : -3.4;
    var fy = Math.sin(t * 0.6 + i * 2.1) * 0.4;
    return {x: side, y: fy, z: 0.4 + slot * 0.5, s: 0.85, rot: t * 0.12 + i};
  }

  function resize(){
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var clock = new THREE.Clock();
  var t0 = performance.now();

  function loop(){
    requestAnimationFrame(loop);
    var dt = clock.getDelta() || 0.016;
    var t = (performance.now() - t0) / 1000;

    /* integra le fasi (idle): velocità costante, niente salti */
    if (DETAIL === null){
      items.forEach(function(it){
        if (!it || !it.ready) return;
        it.phase += it.spd * dt;
        if (it.cooldown > 0) it.cooldown -= dt;
      });
      /* urti: quando due oggetti si avvicinano, rimbalzano in direzioni opposte */
      for (var a = 0; a < items.length; a++){
        for (var b = a + 1; b < items.length; b++){
          var A = items[a], B = items[b];
          if (!A || !B || !A.ready || !B.ready) continue;
          if (A.cooldown > 0 || B.cooldown > 0) continue;
          var dx = A.wrap.position.x - B.wrap.position.x;
          var dy = A.wrap.position.y - B.wrap.position.y;
          var dz = A.wrap.position.z - B.wrap.position.z;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          /* soglia urto: metà delle scale sommate (oggetti visivamente grandi) */
          var touch = (A.wrap.scale.x + B.wrap.scale.x) * 0.9;
          if (dist < touch && dist > 0.001){
            /* scambia le velocità lungo la curva: effetto rimbalzo elastico */
            var tmp = A.spd;
            A.spd = B.spd;
            B.spd = tmp;
            A.cooldown = 1.2; B.cooldown = 1.2;
          }
        }
      }
    }

    items.forEach(function(it, i){
      if (!it || !it.ready) return;
      var tp = targetPos(it, i, t);
      /* lerp morbido verso il target */
      it.wrap.position.x += (tp.x - it.wrap.position.x) * 0.06;
      it.wrap.position.y += (tp.y - it.wrap.position.y) * 0.06;
      it.wrap.position.z += (tp.z - it.wrap.position.z) * 0.06;
      var ns = it.wrap.scale.x + (tp.s - it.wrap.scale.x) * 0.06;
      it.wrap.scale.setScalar(ns);
      if (DETAIL === null){
        it.wrap.rotation.y = tp.rot;
        it.mesh.rotation.y += dt * it.spin;
      } else if (i === DETAIL){
        /* in dettaglio: rotazione solo via drag (nessuno spin automatico) */
        if (!dragging) { /* resta fermo */ }
      } else {
        it.wrap.rotation.y = tp.rot;
        it.mesh.rotation.y += dt * it.spin * 0.6;
      }
      it.mesh.visible = true;
    });

    renderer.render(scene, camera);
    updateCloseX();
  }
  requestAnimationFrame(loop);

  /* --- X di chiusura (proiettata sopra l'oggetto grande) --- */
  var closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Chiudi dettaglio 3D');
  closeBtn.style.cssText = 'position:fixed;z-index:70;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,10,10,.7);color:#fff;font-size:18px;line-height:1;cursor:pointer;display:none;backdrop-filter:blur(4px)';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', function(){
    DETAIL = null;
    closeBtn.style.display = 'none';
  });
  document.body.appendChild(closeBtn);

  function updateCloseX(){
    if (DETAIL === null){ closeBtn.style.display = 'none'; return; }
    var it = items[DETAIL]; if (!it || !it.ready){ return; }
    var rect = canvas.getBoundingClientRect();
    var p = new THREE.Vector3();
    it.wrap.getWorldPosition(p);
    p.project(camera);
    var x = (p.x * 0.5 + 0.5) * rect.width + rect.left;
    var y = (-p.y * 0.5 + 0.5) * rect.height + rect.top;
    closeBtn.style.display = 'block';
    closeBtn.style.left = (x + 30) + 'px';
    closeBtn.style.top = (y - 70) + 'px';
  }

  /* --- pointer events: grab per ruotare in dettaglio, click per attivare --- */
  var downX = 0, downY = 0, downTime = 0, moved = false;

  canvas.addEventListener('pointerdown', function(e){
    var i = meshAt(e.clientX, e.clientY);
    if (i < 0) return;
    dragObj = i; dragging = true; moved = false;
    downX = e.clientX; downY = e.clientY; downTime = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function(e){
    if (!dragging || dragObj === null) return;
    var dx = e.clientX - downX, dy = e.clientY - downY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    if (DETAIL === dragObj){
      /* ruota l'oggetto grande a 360° */
      items[dragObj].mesh.rotation.y += dx * 0.008;
      items[dragObj].mesh.rotation.x += dy * 0.004;
      downX = e.clientX; downY = e.clientY;
    }
  });
  function onUp(e){
    if (!dragging) return;
    var i = dragObj;
    dragging = false; dragObj = null;
    if (!moved && i >= 0){
      if (DETAIL === i){ /* già grande: niente */ }
      else { DETAIL = i; }
    }
  }
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* hook debug */
  window.__hero3d = {
    dump: function(){
      return items.map(function(it){
        if (!it || !it.ready) return 'loading';
        var p = it.wrap.position, s = it.wrap.scale.x;
        return 'x='+p.x.toFixed(2)+' y='+p.y.toFixed(2)+' z='+p.z.toFixed(2)+' scale='+s.toFixed(2);
      });
    },
    setDetail: function(i){ DETAIL = (i === undefined ? null : i); },
    getDetail: function(){ return DETAIL; },
    screenPos: function(i){
      var it = items[i]; if (!it || !it.ready) return null;
      var rect = canvas.getBoundingClientRect();
      var v = new THREE.Vector3();
      it.wrap.getWorldPosition(v);
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
        y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
        depth: v.z
      };
    },
    hitTest: function(x, y){ return meshAt(x, y); }
  };
})();

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

  var MODELS = [
    {url: 'assets/models/hero3D1.glb', spin: 0.18},
    {url: 'assets/models/hero3D2.glb', spin: -0.14},
    {url: 'assets/models/hero3D3.glb', spin: 0.1}
  ];

  var group = new THREE.Group();
  /* offset: orbita spostata a destra per centrare la rotazione sul testo */
  group.position.x = 0.9;
  scene.add(group);

  var items = [];
  var pending = MODELS.length;
  var loader = new THREE.GLTFLoader();

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

      items[i] = {wrap: wrap, mesh: mesh, angle: i * Math.PI * 2 / 3, spin: cfg.spin, ready: true};
      pending--;
    });
  });

  /* orbita ellittica: raggi ridotti e centro spostato a dx (via group) */
  var RX = 4.1, RZ = 2.1, CY = 0.4, RY = 1.7, SPEED = 0.14; /* rotazione lenta */

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
      var hits = raycaster.intersectObject(it.mesh, true);
      if (hits.length) return i;
    }
    return -1;
  }

  /* posizioni target: idle = orbita; detail = uno a dx grande, altri a sx fluttuanti */
  function targetPos(it, i, t){
    if (DETAIL === null){
      var a = it.angle + t * SPEED;
      var x = Math.sin(a) * RX;
      var z = Math.cos(a) * RZ;
      var y = CY - Math.cos(a) * RY;
      var depth = (z + RZ) / (2 * RZ);
      var s = 0.66 + depth * 0.60;
      return {x: x, y: y, z: z, s: s, rot: a};
    }
    if (i === DETAIL){
      /* grande a destra del testo, rotazione controllata dall'utente */
      return {x: 3.9, y: 0.1, z: 1.4, s: 1.85, rot: null};
    }
    /* a sinistra, fluttuano lentamente: posizioni distinte per i due rimanenti */
    var others = [0, 1, 2].filter(function(k){ return k !== DETAIL; });
    var slot = others.indexOf(i); /* 0 o 1 */
    var side = slot === 0 ? -3.2 : -4.6;
    var fy = Math.sin(t * 0.6 + i * 2.1) * 0.5;
    return {x: side, y: fy, z: 0.6 + slot * 0.6, s: 0.9, rot: t * 0.12 + i};
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
    var p = new THREE.Vector3();
    it.wrap.getWorldPosition(p);
    p.project(camera);
    var x = (p.x * 0.5 + 0.5) * window.innerWidth;
    var y = (-p.y * 0.5 + 0.5) * window.innerHeight;
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
    getDetail: function(){ return DETAIL; }
  };
})();

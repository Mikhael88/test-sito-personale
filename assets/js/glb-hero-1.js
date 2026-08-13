/* Faccoli · Hero 3D interattivo
   Tre modelli GLB (hero3D1/2/3.glb in assets/models/ — sostituibili dall'utente).
   - HDR environment (assets/hdri/studio.hdr) via PMREM: albedo + riflessioni.
   - Stato idle: i tre oggetti percorrono una parabola (fasi equidistanti 120°).
   - Click su un oggetto: va in grande a destra, rotazione ferma, drag per ruotare 360°.
     Gli altri due vanno a sinistra, in posizioni fisse ben distanziate.
   - Click sull'oggetto in focus: callout materiali con tracking sul punto cliccato
     (3 finiture da mini-GLB in assets/materials/finish-N.glb, con fallback procedurali).
   - Bottone Esplodi: separa le mesh del modello in focus, ricompone al secondo click.
   - X sopra l'oggetto grande: si torna alla parabola con riallineamento equidistante
     e rotazione dell'oggetto ripristinata a com'era prima del focus. */
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
  if (window.THREE.RGBELoader){
    new THREE.RGBELoader().load('assets/hdri/studio.hdr', function(texture){
      scene.environment = pmrem.fromEquirectangular(texture).texture;
      texture.dispose();
    });
  }

  /* IMPORTANTE: quando sostituisci i GLB in assets/models/, INCREMENTA questa
     versione (es. '3' -> '4'): forza il browser a scaricare i nuovi file
     invece di usare quelli in cache (GitHub Pages cachea i file per 10 min). */
  var MODEL_VERSION = '4';

  var MODELS = [
    {url: 'assets/models/hero3D1.glb?v=' + MODEL_VERSION, spin: 0.18},
    {url: 'assets/models/hero3D2.glb?v=' + MODEL_VERSION, spin: -0.14},
    {url: 'assets/models/hero3D3.glb?v=' + MODEL_VERSION, spin: 0.1}
  ];

  /* finiture selezionabili (mini-GLB con micro-poligono dalla finitura da "rubare").
     Se un file manca, si usa il fallback procedurale corrispondente. */
  var FINISHES = [
    {url: 'assets/materials/finish-1.glb?v=1', name: 'Ottone', swatch: '#b98a2f', fallback: {color: 0xb98a2f, metalness: 1.0, roughness: 0.28}},
    {url: 'assets/materials/finish-2.glb?v=1', name: 'Alluminio spazzolato', swatch: '#c8ccd2', fallback: {color: 0xc8ccd2, metalness: 0.9, roughness: 0.45}},
    {url: 'assets/materials/finish-3.glb?v=1', name: 'Nero opaco', swatch: '#222427', fallback: {color: 0x222427, metalness: 0.35, roughness: 0.85}}
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

      /* fasi equidistanti (120°) e velocità identiche in modulo: il trio resta
         sempre distanziato, mai scontri. Alla chiusura del focus si riallinea. */
      var spd = SPEED * (i === 1 ? -1 : 1);
      items[i] = {
        wrap: wrap, mesh: mesh, phase: i * Math.PI * 2 / 3, spd: spd,
        spin: cfg.spin, ready: true,
        /* esploso: posizioni base dei figli (locali a gltf.scene) */
        parts: [], explodeT: 0, exploded: false
      };
      /* raccogli i mesh figli e le loro posizioni base per l'esploso */
      mesh.traverse(function(o){
        if (o.isMesh){
          items[i].parts.push({obj: o, base: o.position.clone(), dir: new THREE.Vector3()});
        }
      });
      /* direzioni di esplosione: dal centro del modello verso ogni parte */
      var ctr = new THREE.Vector3();
      mesh.getWorldPosition(ctr);
      items[i].parts.forEach(function(p){
        var wp = new THREE.Vector3();
        p.obj.getWorldPosition(wp);
        p.dir.copy(wp).sub(ctr);
        if (p.dir.lengthSq() < 0.0001) p.dir.set(0, 1, 0);
        p.dir.normalize();
      });

      pending--;
    });
  });

  /* traiettoria PARABOLICA: gli oggetti seguono un arco (parte in basso a sx,
     sale all'apice sopra il testo, scende in basso a dx) — come da curva verde */
  var RX = 4.2, APEX = 1.9, BOTTOM = -1.3, SPEED = 0.14; /* rotazione lenta */

  /* --- stati interattivi --- */
  var DETAIL = null;      // indice dell'oggetto ingrandito a destra (o null)
  var savedRot = null;    // rotazione del mesh salvata al momento del focus
  var dragging = false, dragObj = null;
  var raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();

  /* --- stato materiali --- */
  var matTarget = null;   // {point: THREE.Vector3, mesh: mesh} del punto cliccato
  var finishCache = {};   // url -> material rubato dal mini-GLB

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

  /* ritorna il punto 3D cliccato sulla mesh dell'oggetto i (o null) */
  function hitPoint(clientX, clientY, i){
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObject(items[i].mesh, true);
    if (!hits.length) return null;
    var h = hits[0];
    return {point: h.point.clone(), mesh: h.object};
  }

  /* posizioni target: idle = parabola; detail = uno a dx grande, altri a sx fissi */
  function targetPos(it, i, t){
    if (DETAIL === null){
      var a = it.phase;
      var x = Math.sin(a) * RX;
      var norm = (x / RX) * (x / RX);
      var y = APEX - (APEX - BOTTOM) * norm;
      var normY = (y - BOTTOM) / (APEX - BOTTOM);
      var s = 0.55 + normY * 0.65;
      return {x: x, y: y, z: 0.2, s: s, rot: a};
    }
    if (i === DETAIL){
      /* grande a destra del testo, rotazione controllata dall'utente */
      return {x: 3.1, y: 0.1, z: 1.0, s: 1.6, rot: null};
    }
    /* a sinistra, posizioni FISSE ben distanziate: mai sovrapposti */
    var others = [0, 1, 2].filter(function(k){ return k !== DETAIL; });
    var slot = others.indexOf(i); /* 0 o 1 */
    if (slot === 0) return {x: -2.6, y: 0.5, z: 0.5, s: 0.78, rot: t * 0.1 + i};
    return {x: -4.8, y: -0.4, z: 1.0, s: 0.72, rot: t * 0.1 + i};
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
      });
    }

    items.forEach(function(it, i){
      if (!it || !it.ready) return;
      var tp = targetPos(it, i, t);
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
      } else {
        it.wrap.rotation.y = tp.rot;
        it.mesh.rotation.y += dt * it.spin * 0.6;
      }
      /* esploso: sposta le parti radialmente (lerp morbido) */
      if (i === DETAIL && it.parts.length){
        var target = it.exploded ? 1 : 0;
        it.explodeT += (target - it.explodeT) * 0.08;
        var dist = it.explodeT * 0.55; /* distanza di esplosione */
        it.parts.forEach(function(p){
          p.obj.position.copy(p.base).addScaledVector(p.dir, dist);
        });
      }
      it.mesh.visible = true;
    });

    renderer.render(scene, camera);
    updateCloseX();
    updateExplodeBtn();
    updateMaterialCallout();
  }
  requestAnimationFrame(loop);

  /* --- X di chiusura (proiettata sopra l'oggetto grande) --- */
  var closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Chiudi dettaglio 3D');
  closeBtn.style.cssText = 'position:fixed;z-index:70;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,10,10,.7);color:#fff;font-size:18px;line-height:1;cursor:pointer;display:none;backdrop-filter:blur(4px)';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closeDetail);
  document.body.appendChild(closeBtn);

  function closeDetail(){
    if (DETAIL === null) return;
    var idx = DETAIL;
    var it = items[idx];
    /* 1) ripristina la rotazione del mesh com'era prima del focus */
    if (savedRot && it){
      it.mesh.rotation.y = savedRot.y;
      it.mesh.rotation.x = savedRot.x;
      it.mesh.rotation.z = savedRot.z;
    }
    savedRot = null;
    /* 2) riallinea le fasi equidistanti (120°) rispetto all'ex-detail */
    if (it){
      var basePhase = it.phase;
      items.forEach(function(other, j){
        if (!other || !other.ready || j === idx) return;
        var delta = (j < idx ? -1 : 1) * Math.PI * 2 / 3;
        other.phase = basePhase + delta;
      });
    }
    /* 3) esploso: ricomponi sempre */
    if (it) it.exploded = false;
    /* 4) chiudi callout materiali ed esplodi */
    hideMaterialCallout();
    explodeBtn.style.display = 'none';
    DETAIL = null;
    closeBtn.style.display = 'none';
  }

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

  /* il bottone Esplodi segue l'oggetto in focus (sotto di esso) */
  function updateExplodeBtn(){
    if (DETAIL === null){ explodeBtn.style.display = 'none'; return; }
    var it = items[DETAIL]; if (!it || !it.ready){ return; }
    var rect = canvas.getBoundingClientRect();
    var p = new THREE.Vector3();
    it.wrap.getWorldPosition(p);
    p.project(camera);
    var x = (p.x * 0.5 + 0.5) * rect.width + rect.left;
    var y = (-p.y * 0.5 + 0.5) * rect.height + rect.top;
    explodeBtn.style.display = 'block';
    explodeBtn.style.left = (x - 52) + 'px';
    explodeBtn.style.top = (y + 120) + 'px';
  }

  /* --- bottone Esplodi (solo in focus) --- */
  var explodeBtn = document.createElement('button');
  explodeBtn.setAttribute('aria-label', 'Esplodi il modello 3D');
  explodeBtn.style.cssText = 'position:fixed;z-index:70;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(10,10,10,.75);color:#fff;font-size:14px;letter-spacing:.04em;cursor:pointer;display:none;backdrop-filter:blur(4px)';
  explodeBtn.textContent = '⛶ Esplodi';
  explodeBtn.addEventListener('click', function(){
    var it = items[DETAIL]; if (!it) return;
    it.exploded = !it.exploded;
    explodeBtn.textContent = it.exploded ? '✛ Ricomponi' : '⛶ Esplodi';
  });
  document.body.appendChild(explodeBtn);

  /* --- callout materiali (tracking sul punto cliccato) --- */
  var matMenu = document.createElement('div');
  matMenu.style.cssText = 'position:fixed;z-index:80;display:none;flex-direction:column;gap:6px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,12,12,.85);backdrop-filter:blur(10px);box-shadow:0 12px 40px rgba(0,0,0,.5)';
  matMenu.innerHTML = '<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#999;padding:2px 6px 6px">Finitura</div>';
  FINISHES.forEach(function(f, k){
    var b = document.createElement('button');
    b.style.cssText = 'display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-size:13px;cursor:pointer;text-align:left';
    b.innerHTML = '<span style="width:18px;height:18px;border-radius:50%;background:'+f.swatch+';border:1px solid rgba(255,255,255,.3);flex-shrink:0"></span>' + f.name;
    (function(k){
      b.addEventListener('click', function(){ applyFinish(DETAIL, k); hideMaterialCallout(); });
    })(k);
    matMenu.appendChild(b);
  });
  document.body.appendChild(matMenu);

  function showMaterialCallout(x, y){
    matMenu.style.display = 'flex';
    matMenu.style.left = x + 'px';
    matMenu.style.top = y + 'px';
  }
  function hideMaterialCallout(){
    matMenu.style.display = 'none';
    matTarget = null;
  }

  /* la bolla segue il punto 3D cliccato (tracking) */
  function updateMaterialCallout(){
    if (!matTarget || DETAIL === null){
      if (matMenu.style.display !== 'none' && !matTarget) matMenu.style.display = 'none';
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var v = matTarget.point.clone();
    v.project(camera);
    var x = (v.x * 0.5 + 0.5) * rect.width + rect.left;
    var y = (-v.y * 0.5 + 0.5) * rect.height + rect.top;
    matMenu.style.left = x + 'px';
    matMenu.style.top = y + 'px';
  }

  /* applica la finitura k all'oggetto idx: ruba il materiale dal mini-GLB,
     altrimenti usa il fallback procedurale */
  function applyFinish(idx, k){
    var it = items[idx]; if (!it) return;
    var fin = FINISHES[k];
    if (finishCache[fin.url]){
      applyMaterialToModel(it, finishCache[fin.url]);
      return;
    }
    /* fallback immediato (poi, se il GLB arriva, sostituisce) */
    var fb = fin.fallback;
    var fallbackMat = new THREE.MeshStandardMaterial({
      color: fb.color, metalness: fb.metalness, roughness: fb.roughness,
      envMapIntensity: 1.5
    });
    applyMaterialToModel(it, fallbackMat);
    /* prova a rubare il materiale dal mini-GLB (se il file esiste) */
    loader.load(fin.url, function(gltf){
      var stolen = null;
      gltf.scene.traverse(function(o){
        if (!stolen && o.isMesh && o.material){
          stolen = Array.isArray(o.material) ? o.material[0] : o.material;
        }
      });
      if (stolen){
        finishCache[fin.url] = stolen.clone();
        finishCache[fin.url].envMapIntensity = 1.5;
        applyMaterialToModel(it, finishCache[fin.url]);
      }
    }, undefined, function(){
      /* file non presente: resta il fallback procedurale */
    });
  }

  function applyMaterialToModel(it, mat){
    /* applica a tutte le parti visibili del modello in focus */
    it.mesh.traverse(function(o){
      if (o.isMesh && o.material){
        if (Array.isArray(o.material)){
          o.material = o.material.map(function(){ return mat.clone(); });
        } else {
          o.material = mat.clone();
        }
      }
    });
  }

  /* --- pointer events: grab per ruotare in dettaglio, click per attivare --- */
  var downX = 0, downY = 0, moved = false;

  canvas.addEventListener('pointerdown', function(e){
    var i = meshAt(e.clientX, e.clientY);
    if (i < 0) return;
    dragObj = i; dragging = true; moved = false;
    downX = e.clientX; downY = e.clientY;
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
    if (moved || i < 0) return;
    if (DETAIL === null){
      /* attiva il focus e salva la rotazione corrente per il ripristino */
      DETAIL = i;
      savedRot = {
        y: items[i].mesh.rotation.y,
        x: items[i].mesh.rotation.x,
        z: items[i].mesh.rotation.z
      };
      items[i].exploded = false;
    } else if (DETAIL === i){
      /* click sull'oggetto già in focus: callout materiali sul punto cliccato.
         Se il punto esatto non colpisce la geometria (centri vuoti), ripiega
         sul centro del modello così il menu si apre comunque. */
      var hp = hitPoint(e.clientX, e.clientY, i);
      if (!hp){
        var ctr = new THREE.Vector3();
        items[i].wrap.getWorldPosition(ctr);
        hp = {point: ctr, mesh: null};
      }
      matTarget = hp;
      showMaterialCallout(e.clientX + 12, e.clientY + 12);
    } else {
      /* click su un altro oggetto: cambia focus */
      DETAIL = i;
      savedRot = {
        y: items[i].mesh.rotation.y,
        x: items[i].mesh.rotation.x,
        z: items[i].mesh.rotation.z
      };
      items[i].exploded = false;
    }
  }
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function screenPosOf(i){
    var it = items[i]; if (!it || !it.ready) return {x: 0, y: 0};
    var rect = canvas.getBoundingClientRect();
    var v = new THREE.Vector3();
    it.wrap.getWorldPosition(v);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-v.y * 0.5 + 0.5) * rect.height + rect.top
    };
  }

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
      var p = screenPosOf(i);
      return p.x || p.y ? p : null;
    },
    hitTest: function(x, y){ return meshAt(x, y); }
  };
})();

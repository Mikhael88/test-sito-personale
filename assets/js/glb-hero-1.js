/* Faccoli · Hero 3D interattivo
   Tre modelli GLB (hero3D1/2/3-bis.glb in assets/models/ — sostituibili dall'utente).
   - HDR environment (assets/hdri/studio.hdr) via PMREM: albedo + riflessioni.
   - Stato idle: i tre oggetti percorrono una parabola (fasi equidistanti 120°,
     TUTTI in senso orario).
   - Click su un oggetto: va in grande a destra, rotazione ferma, drag per ruotare 360°.
     Gli altri due vanno a sinistra, in posizioni fisse ben distanziate.
   - Click sull'oggetto in focus: callout materiali con tracking sul punto cliccato
     (3 finiture da mini-GLB in assets/materials/finish-N.glb, con fallback procedurali).
     Solo per i modelli con canFinish (hero3D1).
   - Bottone Esplodi (solo hero3D2): separa le mesh del modello in focus, ricompone al
     secondo click. Distanza e direzioni in EXPLODE_MAP / EXPLODE_DIST.
   - Bottone Play (solo hero3D3-bis): avvia l'animazione una volta sola (spray conico
     dai locatori spray-source-1/2 per i primi 42 frame, poi ventole fino a fine clip).
     La scocca passa da opaca (alpha 1, transmission 0) a trasparente (alpha .3,
     transmission 1) durante la riproduzione. Riclick = restart.
   - X sopra l'oggetto grande: si torna alla parabola con riallineamento equidistante
     e rotazione dell'oggetto ripristinata a com'era prima del focus.
   NOTA: three.js r128 NON supporta KHR_materials_transmission (vetri/trasparenze):
   a codice i materiali trasparenti vengono ricostruiti come MeshPhysicalMaterial
   con transmission/ior veri (vedi PHYS_MAP). */
(function(){
  function startHero(){
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
     versione (es. '8' -> '9'): forza il browser a scaricare i nuovi file
     invece di usare quelli in cache (GitHub Pages cachea i file per 10 min). */
  var MODEL_VERSION = '11';

  var MODELS = [
    /* hero3D1: cambio materiale SI (finiture), esplodi NO */
    {url: 'assets/models/hero3D1.glb?v=' + MODEL_VERSION, spin: 0.18, canFinish: true, canExplode: false, explodeDist: 0.5},
    /* hero3D2: esploso direzionato SI (mappa sotto), cambio materiale NO.
               Esploso MINIMO: distanza assoluta 0.03 unità (explodeAbs = niente
               scala proporzionale — prima era 0.55×partsScale ≈ 3cm, troppo). */
            {url: 'assets/models/hero3D2.glb?v=' + MODEL_VERSION, spin: -0.14, canFinish: false, canExplode: true, explodeDist: 0.03, explodeAbs: true},
    /* hero3D3-bis: PROVETTE + VENTOLE + spray. Nessun esploso, nessun cambio
       materiale: il bottone Play avvia la sequenza (spray 0->42 frame, ventole
       dal frame 42 della clip di 4.067s, stop a fine clip, replay = riclick). */
    {url: 'assets/models/hero3D3-bis.glb?v=' + MODEL_VERSION, spin: 0.1, canFinish: false, canExplode: false, canPlay: true, explodeDist: 0.5,
     spray: {fans: 42, fps: 24, count: 320, cone: 0.30, life: 1.0, size: 0.065, speed: 1.5, gravity: 0.5, spawn: 0.008}}
  ];

  /* esploso direzionato per hero3D2 (nodi del GLB):
       ventola (cilindro-removibile, nera) -> AVANTI (+Z) di 0.03
       cilindri bianco + trasparente -> INDIETRO (-Z) di 0.03
       corpo spirometro (Mesh003*) -> FERMO (dir 0) */
      var EXPLODE_MAP = {
        1: {
          'cilindro-removibile': [0, 0, 1],
          'cilindro-bianco': [0, 0, -1],
          'cilindro-trasparente': [0, 0, -1],
          'spirometro': [0, 0, 0]
        }
      };

  /* finiture selezionabili della maniglia.
       STATICHE: nessuna (rimosse su richiesta utente 2026-08-17 — restano solo
       le DINAMICHE rubate dai piani "finish-*" dentro il GLB di hero3D1). */
    var FINISHES = [];

  /* --- MATERIALI FISICI (transmission/ior) ricostruiti a codice ---------------
     three r128 ignora KHR_materials_transmission: i vetri del GLB diventerebbero
     opachi chiari. Mappa per nome materiale GLB -> parametri MeshPhysicalMaterial.
     'cover' è speciale (scocca animata dal bottone Play). */
  var PHYS_MAP = {
    1: {
      'plastica-trasparente.001': {transmission: 0.98, ior: 1.45, color: 0xffffff, roughness: 0.04, opacity: 1}
    },
    2: {
      'cover': 'cover',
      'vetro': {transmission: 1, ior: 1.45, color: 0xffffff, roughness: 0.05, opacity: 0.96},
      'liquido-separazione': {transmission: 1, ior: 1.33, color: 0xa01a12, roughness: 0.05, opacity: 0.91},
      'globuli rossi': {transmission: 1, ior: 1.33, color: 0x0a0500, roughness: 0.1, opacity: 0.97},
      'siero': {transmission: 1, ior: 1.33, color: 0xebd593, roughness: 0.05, opacity: 1}
    }
  };
  var physCache = {};      // nome materiale -> istanza riusabile
  var coverMat = null;     // scocca animata (hero3D3-bis)

  function makePhysical(spec){
    return new THREE.MeshPhysicalMaterial({
      color: spec.color, metalness: 0, roughness: spec.roughness,
      transmission: spec.transmission, ior: spec.ior,
      transparent: true, opacity: spec.opacity,
      envMapIntensity: 0.75, depthWrite: false, side: THREE.DoubleSide
    });
  }
  function applyPhysical(mesh, idx){
    var map = PHYS_MAP[idx]; if (!map) return;
    mesh.traverse(function(o){
      if (!o.isMesh) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      var next = mats.map(function(m){
        if (!m) return m;
        var spec = map[m.name];
                if (spec === 'cover'){
                  if (!coverMat){
                    coverMat = makePhysical({transmission: 0, ior: 1.45, color: 0xffffff, roughness: 0.03, opacity: 1});
                    coverMat.name = 'cover'; /* referenza per l'animazione al play */
                  }
                  return coverMat;
                }
        if (!spec) return m;
        if (!physCache[m.name]) physCache[m.name] = makePhysical(spec);
        return physCache[m.name];
      });
      o.material = Array.isArray(o.material) ? next : next[0];
    });
  }

  /* --- SISTEMA SPRAY: particelle acquose runtime (nessun asset esterno).
     ORIGINI MULTIPLE (array) + EFFETTO CONICO attorno all'asse aim.
     Le origini vere vengono dai locatori GLB spray-source-1/2 (spazio locale
     del modello, convertito da worldToLocal); aim = verso il centro provette. --- */
  var sprayTex = null;
  function sprayTexture(){
    if (sprayTex) return sprayTex;
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    sprayTex = new THREE.CanvasTexture(c);
    return sprayTex;
  }
  function createSpray(cfg){
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(cfg.count * 3);
    var vel = new Float32Array(cfg.count * 3);
    var life = new Float32Array(cfg.count);
    var st = new Float32Array(cfg.count);
    for (var i = 0; i < cfg.count; i++){ pos[i*3+1] = 999; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
          color: 0x2b7fff, size: cfg.size, map: sprayTexture(), transparent: true, opacity: 0,
          depthWrite: false, depthTest: false, sizeAttenuation: true
          /* blending NORMALE (non additivo): le gocce azzurre devono vedersi anche
             sul tema chiaro — con l'additivo sparivano sul fondo quasi bianco.
             depthTest off: lo spray viaggia DENTRO la scocca verso le provette,
             senza il depth test il pannello frontale non lo oscura (VFX layer). */
        });
    var pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    /* direzione base: aim (normalizzata). Se assente: default verso il basso. */
    var aim = cfg.aim ? new THREE.Vector3(cfg.aim[0], cfg.aim[1], cfg.aim[2]) : new THREE.Vector3(0, -1, 0);
    aim.normalize();
    /* origini: dal config (runtime) o default centro */
    var origins = [];
    if (cfg.origins && cfg.origins.length){
      cfg.origins.forEach(function(o){ origins.push(new THREE.Vector3(o.x, o.y, o.z)); });
    } else {
      origins.push(new THREE.Vector3(
        cfg.origin ? cfg.origin[0] : 0,
        cfg.origin ? cfg.origin[1] : 0.3,
        cfg.origin ? cfg.origin[2] : 0));
    }
    /* base ortonormale per il cono */
    var up = Math.abs(aim.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    var t1 = new THREE.Vector3().crossVectors(up, aim).normalize();
    var t2 = new THREE.Vector3().crossVectors(aim, t1).normalize();
    return {
      pts: pts, pos: pos, vel: vel, life: life, st: st, active: false,
      t: 0, dur: 0, next: 0, cfg: cfg, aim: aim,
      origins: origins, t1: t1, t2: t2
    };
  }
  function updateSpray(dt){
    for (var i = 0; i < items.length; i++){
      var it = items[i]; if (!it || !it.spraySys) continue;
      var s = it.spraySys, cfg = s.cfg;
      if (!s.active){
        if (s.pts.visible) s.pts.visible = false;
        continue;
      }
      s.t += dt;
      var env = Math.min(1, s.t / 0.25) * Math.min(1, Math.max(0, (s.dur - s.t) / 0.3));
      s.pts.material.opacity = env * 0.85;
      if (s.t >= s.dur){
        s.active = false; s.pts.visible = false;
        continue;
      }
      s.next -= dt;
      if (s.next <= 0){
        s.next = 0.012;
        var n = Math.floor(Math.random() * (cfg.count * 0.15)) + 4;
        var tanCone = Math.tan(cfg.cone || 0.3);
        for (var k = 0; k < n; k++){
          var si = Math.floor(Math.random() * cfg.count);
          var org = s.origins[Math.floor(Math.random() * s.origins.length)];
          s.st[si] = 1; s.life[si] = cfg.life || 1.1;
          /* direzione dentro il cono attorno all'aim */
          var a = Math.random() * Math.PI * 2;
          var r = Math.sqrt(Math.random()) * tanCone;
          var dir = s.aim.clone()
            .addScaledVector(s.t1, Math.cos(a) * r)
            .addScaledVector(s.t2, Math.sin(a) * r)
            .normalize();
          var speed = (Math.random() * 0.7 + 0.3) * (cfg.speed || 1.4);
          /* spawn: offset iniziale lungo la direzione — piccolo = particelle
             appoggiate alla superficie di partenza (cfg.spawn, default 0.02) */
          var sp = cfg.spawn != null ? cfg.spawn : 0.02;
          s.pos[si*3]   = org.x + dir.x * sp;
          s.pos[si*3+1] = org.y + dir.y * sp;
          s.pos[si*3+2] = org.z + dir.z * sp;
          s.vel[si*3]   = dir.x * speed + (Math.random() - 0.5) * 0.2;
          s.vel[si*3+1] = dir.y * speed + (Math.random() - 0.5) * 0.2;
          s.vel[si*3+2] = dir.z * speed + (Math.random() - 0.5) * 0.2;
        }
      }
      for (var p = 0; p < cfg.count; p++){
        if (s.st[p] <= 0) continue;
        s.life[p] -= dt;
        if (s.life[p] <= 0){ s.st[p] = 0; s.pos[p*3+1] = 999; continue; }
        s.vel[p*3+1] += dt * (cfg.gravity || 0.6);
        s.pos[p*3]   += s.vel[p*3] * dt;
        s.pos[p*3+1] += s.vel[p*3+1] * dt;
        s.pos[p*3+2] += s.vel[p*3+2] * dt;
      }
      s.pts.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* posizione di un nodo nel sistema del MESH, percorrendo la catena dei parent
     (quaternioni + traslazioni dei nodi GLB). NON usa matrixWorld/worldToLocal:
     quelle API in three r128 restituiscono coordinate incoerenti (~/100) quando
     la matrice non è sincronizzata — da qui lo spray che usciva dal centro. */
  function nodePosInMesh(l, mesh){
    var v = l.position.clone();
    var p = l.parent;
    while (p && p !== mesh){
      v.applyQuaternion(p.quaternion);
      v.add(p.position);
      p = p.parent;
    }
    return v;
  }
  /* direzione (normale +Z del piano) nel sistema del MESH: rotazioni sole */
  function nodeDirInMesh(l, mesh){
    var d = new THREE.Vector3(0, 0, 1);
    d.applyQuaternion(l.quaternion);
    var p = l.parent;
    while (p && p !== mesh){
      d.applyQuaternion(p.quaternion);
      p = p.parent;
    }
    return d.normalize();
  }

  /* origini fallback ai DUE LATI del blocco provette (usato quando i piani
     spray-source risultano sovrapposti o mancano): due punti ai lati del centro
     del blocco provette, appena sopra. Coordinate nel sistema del MESH. */
  function sprayOriginsFallback(scfg, mesh){
    var target = new THREE.Vector3(); var cnt = 0;
    mesh.traverse(function(o){
      if (/^Provetta_tappo/.test(o.name || '')){
        var w = new THREE.Vector3(); o.getWorldPosition(w);
        target.add(mesh.worldToLocal(w));
        cnt++;
      }
    });
    if (!cnt) return;
    target.divideScalar(cnt);
    var half = 0.15; /* mezzo blocco provette (coordinate mesh normalizzate) */
    scfg.origins = [
      target.clone().add(new THREE.Vector3(-half, 0.05, 0)),
      target.clone().add(new THREE.Vector3(half, 0.05, 0))
    ];
  }

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
      /* scala per l'esploso: dimensione del modello normalizzato (~2.4) */
      var partsScale = box.getSize(new THREE.Vector3()).length() * 0.35 || 1;

      var wrap = new THREE.Object3D();
      wrap.add(mesh);
      group.add(wrap);

      /* animazione opzionale (ventole in hero3D3-bis): la clip parte ferma,
         il bottone Play la avvia dal frame 42 (dopo lo spray). */
      var mixer = null;
      var clip = null;
      if (gltf.animations && gltf.animations.length){
        clip = gltf.animations[0];
        mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(clip).play();
        mixer.timeScale = 0; /* parte fermo; Play lo avvia */
      }

      /* potenzia l'HDR sui materiali: più albedo + riflessioni leggibili.
         Intensità DIMEZZATA rispetto a prima (1.5 -> 0.75): l'HDR era bruciato. */
      mesh.traverse(function(o){
        if (o.isMesh && o.material){
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function(m){
            if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.75;
            if (m && m.metalness === 0) m.metalness = 0.15;
            if (m && m.roughness === 1) m.roughness = 0.85;
          });
        }
      });

      /* ricostruisce i materiali trasparenti come MeshPhysicalMaterial con
         transmission/ior veri (r128 ignora KHR_materials_transmission) */
      applyPhysical(mesh, i);

      /* fasi equidistanti (120°) e velocità IDENTICHE per tutti: il trio resta
         sempre distanziato e ruota tutto in senso ORARIO, mai scontri.
         Alla chiusura del focus si riallinea. */
      var spd = SPEED; /* tutti orari (prima hero3D2 girava al contrario) */
      items[i] = {
        wrap: wrap, mesh: mesh, phase: i * Math.PI * 2 / 3, spd: spd,
        spin: cfg.spin, ready: true,
        /* esploso: posizioni base dei figli (locali a gltf.scene) */
        parts: [], explodeT: 0, exploded: false, partsScale: partsScale,
        /* animazione opzionale (ventole): play/pausa via mixer + stato playing */
        mixer: mixer, clip: clip, playing: false,
        /* scocca animata (cover) per la trasparenza su play */
        cover: null, coverTarget: null,
        /* gruppi di materiale: mesh con la stessa finitura visiva → stessa chiave.
           La maniglia (1 materiale ovunque) è un solo gruppo; gli altri modelli
           hanno gruppi separati per ogni finitura distinta. */
        matGroups: {}
      };
      /* raggruppa le mesh per materiale visivamente identico.
               Skip dei piani finish-*: sono sorgenti di finiture da rubare, non parti
               del modello (non devono creare gruppi né finire nell'esploso). */
            mesh.traverse(function(o){
              if (!o.isMesh || !o.material) return;
              if (/^finish-/.test(o.name || '')) return;
              var m = Array.isArray(o.material) ? o.material[0] : o.material;
        var r = Math.round((m.roughness || 0) * 100);
        var mt = Math.round((m.metalness || 0) * 100);
        var col = m.color ? m.color.getHex() : 'x';
        var key = col + '_' + mt + '_' + r;
        if (!items[i].matGroups[key]){
          items[i].matGroups[key] = {
            meshes: [],
            orig: Array.isArray(o.material)
              ? o.material.map(function(x){ return x.clone(); })
              : o.material.clone()
          };
        }
        items[i].matGroups[key].meshes.push(o);
        o.userData.matKey = key;
      });
      /* raccogli i mesh figli per l'esploso (solo hero3D2). Se esiste una mappa
         direzionata per questo modello (EXPLODE_MAP), usa quelle direzioni (per
         nome nodo); altrimenti direzioni radiali dal centro del modello. */
      var explodeMap = EXPLODE_MAP[i] || null;
      if (explodeMap){
        mesh.traverse(function(o){
          if (!o.isMesh) return;
          var nodeName = o.name || (o.parent && o.parent.name) || '';
          var dir = explodeMap[nodeName] || [0, 0, 0];
          items[i].parts.push({
            obj: o, base: o.position.clone(),
            dir: new THREE.Vector3(dir[0], dir[1], dir[2]),
            nodeName: nodeName,
            distFactor: 1
          });
        });
      } else {
              var worldCtr = new THREE.Vector3();
              var found = 0;
              mesh.traverse(function(o){
                if (!o.isMesh) return;
                if (/^finish-/.test(o.name || '')) return;
                var wp = new THREE.Vector3();
                o.getWorldPosition(wp);
                worldCtr.add(wp);
                found++;
              });
              if (found) worldCtr.divideScalar(found);
              mesh.traverse(function(o){
                if (!o.isMesh) return;
                if (/^finish-/.test(o.name || '')) return;
          var wp = new THREE.Vector3();
          o.getWorldPosition(wp);
          var rel = wp.sub(worldCtr);
          if (rel.lengthSq() < 0.0001) rel.set(0, 1, 0);
          rel.normalize();
          /* converti la direzione world in spazio locale del modello */
          var localDir = rel.clone();
          mesh.worldToLocal(localDir);
          if (localDir.lengthSq() < 0.0001) localDir.set(0, 1, 0);
          localDir.normalize();
          items[i].parts.push({obj: o, base: o.position.clone(), dir: localDir});
        });
      }

      /* spray (solo hero3D3-bis): origini dai locatori spray-source-1/2 presenti
         nel GLB (nuova versione export), altrimenti fallback calcolato dal blocco
         provette. aim = verso il centro delle provette (nodi "Provetta_tappo*"). */
      var scfg = MODELS[i].spray;
      if (scfg){
        /* 1) origini: nodi nominati nel GLB. Se il nodo è un MESH (micro-geometria
              esportata dall'utente: piano 2D o cono), la sua NORMALE diventa la
              direzione dello spray — l'utente la orienta in Blender verso le provette
              e sopravvive alla conversione Z-up→Y-up dell'export glTF.
              Se è un Empty: si usa solo la posizione. */
        var locs = [];
        mesh.traverse(function(o){
          if (/^spray-source-\d+$/.test(o.name || '')) locs.push(o);
        });
        var aimFromNormal = null;
        if (locs.length >= 1){
          /* Calcolo FINALE (verificato con worldProbe): la matrixWorld del mesh è
             coerente col rendering, quindi worldToLocal dà coordinate valide per
             le particelle (che vivono NEL MESH e seguono la sua rotazione).
             Forzare l'aggiornamento delle matrici prima della lettura. */
          mesh.updateWorldMatrix(true, true);
          scene.updateMatrixWorld(true);
          scfg.origins = locs.map(function(l){
            var w = new THREE.Vector3(); l.getWorldPosition(w);
            return mesh.worldToLocal(w.clone());
          });
          if (locs[0].isMesh && locs[0].geometry){
            var q = new THREE.Quaternion();
            locs[0].getWorldQuaternion(q);
            var n = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
            /* direzione dal MONDO allo spazio locale del mesh (come le origini) */
            var wp = new THREE.Vector3();
            mesh.getWorldPosition(wp);
            var nl = n.clone().add(wp);
            mesh.worldToLocal(nl);
            nl.normalize();
            aimFromNormal = nl;
          }
          /* i piani sono sorgenti: nascosti + layer 1 (niente raycast/esploso) */
          locs.forEach(function(l){
            l.visible = false;
            if (l.layers) l.layers.set(1);
          });
        }
        /* ROBUSTEZZA: se i piani risultano SOVRAPPOSTI (stessa posizione, export
           da sistemare) le origini vengono calcolate ai DUE LATI del blocco
           provette; se la normale è verticale pura (piano non orientato verso
           le provette) l'aim viene ricalcolato verso il centro del blocco. */
        if (scfg.origins && scfg.origins.length > 1 &&
            scfg.origins[0].distanceToSquared(scfg.origins[1]) < 0.001){
          sprayOriginsFallback(scfg, mesh);
          aimFromNormal = null;
        }
        if (aimFromNormal && Math.abs(aimFromNormal.y) > 0.98){
          aimFromNormal = null; /* normale verticale: usa l'aim verso le provette */
        }
        var sys = createSpray(scfg);
        if (aimFromNormal){
          /* direzione dalla normale del piano: precisa come l'utente l'ha orientata */
          sys.aim.copy(aimFromNormal);
        } else {
          /* 2) aim: dal primo locatore verso il centro dei tappi provetta */
          var target = new THREE.Vector3(); var cnt = 0;
          mesh.traverse(function(o){
            if (/^Provetta_tappo/.test(o.name || '')){
              var w = new THREE.Vector3(); o.getWorldPosition(w);
              target.add(mesh.worldToLocal(w));
              cnt++;
            }
          });
          if (cnt){
            target.divideScalar(cnt);
            sys.aim.copy(target.sub(sys.origins[0]).normalize());
          }
        }
              /* aggiorna la base ortonormale del cono con l'aim reale */
              {
                var up = Math.abs(sys.aim.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
                sys.t1 = new THREE.Vector3().crossVectors(up, sys.aim).normalize();
                sys.t2 = new THREE.Vector3().crossVectors(sys.aim, sys.t1).normalize();
              }
              /* FIX: le particelle vivono nel sistema del MESH (non del wrap): così le
           coordinate worldToLocal (unità GLB) sono valide DIRETTAMENTE e lo spray
           segue la rotazione del modello quando l'utente lo ruota col drag. */
        mesh.add(sys.pts);
                items[i].spraySys = sys;
                items[i].sprayFansT = (scfg.fans || 42) / (scfg.fps || 24);
                window.__spray = window.__spray || [];
                window.__spray[i] = sys;

                /* DEBUG LOCATORI: con ?locs nell'URL mostra dei marker colorati dove il
                   codice legge le origini dello spray (rosso = source-1, arancio = source-2):
                   se i marker NON sono dove li hai messi in Blender, il GLB è da riesportare. */
                if (/[?&]locs/.test(window.location.search)){
                  scfg.origins.forEach(function(o, oi){
                    var m = new THREE.Mesh(
                      new THREE.SphereGeometry(0.04, 10, 10),
                      new THREE.MeshBasicMaterial({color: oi === 0 ? 0xff4040 : 0xffaa00}));
                    m.position.copy(o);
                    m.frustumCulled = false;
                    mesh.add(m);
                    items[i].locsMarkers = items[i].locsMarkers || [];
                    items[i].locsMarkers.push(m);
                  });
                }
      }

      /* scocca hero3D3-bis: aggancia il materiale cover per l'animazione al play.
                     Solo il modello 2 ha 'cover' in PHYS_MAP (i GLB caricano in ordine async). */
                  if (i === 2 && coverMat && !items[i].cover){
                    items[i].cover = coverMat;
                    items[i].coverTarget = {opacity: 1, transmission: 0}; /* default OPACO */
                  }

                  /* FINITURE DINAMICHE (solo maniglia): rileva i piani "finish-*" nel GLB,
                     ruba il materiale di ognuno come finitura del menu e li nasconde
                     (visibile=false + layer 1 così raycast ed esploso li ignorano). */
                  if (i === 0){
                    mesh.traverse(function(o){
                      if (!o.isMesh || !o.material) return;
                      if (!/^finish-/.test(o.name || '')) return;
                      var m = Array.isArray(o.material) ? o.material[0] : o.material;
                      var label = (m.name && m.name !== '') ? m.name : o.name.replace(/^finish-/, '');
                      FINISHES.push({
                        url: null,
                        name: label,
                        swatch: (m.color && m.color.getHexString) ? '#' + m.color.getHexString() : '#999999',
                        mat: m.clone()
                      });
                      o.visible = false;
                      if (o.layers) o.layers.set(1);
                    });
                    rebuildFinishMenu();
                  }

                  pending--;
    });
  });

  /* traiettoria ELLITTICA: gli oggetti orbitano attorno al testo centrale su
     un'ellisse (RX orizzontale, RY verticale), fasi equidistanti 120°. */
  var RX = 4.2, RY = 2.4, SPEED = 0.14; /* velocità orbitale lenta, oraria */

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

  /* posizioni target: idle = ellisse attorno al testo; detail = uno a dx grande,
     altri a sx fissi. rot: null = rotazione gestita altrove (spin/drag). */
  function targetPos(it, i, t){
    if (DETAIL === null){
      var a = it.phase;
      var x = Math.sin(a) * RX;
      var y = Math.cos(a) * RY;
      /* scala leggermente più grande in alto, più piccola in basso (profondità) */
      var s = 0.7 + (y / RY) * 0.3;
      return {x: x, y: y, z: 0.2, s: s, rot: null};
    }
    if (i === DETAIL){
      /* grande a destra del testo, rotazione controllata dall'utente */
      return {x: 3.1, y: 0.1, z: 1.0, s: 1.6, rot: null};
    }
    /* a sinistra, posizioni FISSE ben distanziate: mai sovrapposti */
    var others = [0, 1, 2].filter(function(k){ return k !== DETAIL; });
    var slot = others.indexOf(i); /* 0 o 1 */
    if (slot === 0) return {x: -2.6, y: 0.5, z: 0.5, s: 0.78, rot: null};
    return {x: -4.8, y: -0.4, z: 1.0, s: 0.72, rot: null};
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
    /* sospendi il render quando il hero è fuori schermo (CPU/batteria) */
    var _r = canvas.getBoundingClientRect(); var _vh = window.innerHeight || 800;
    if (_r.bottom < -_vh * 0.5 || _r.top > _vh * 1.5) return;
    var dt = clock.getDelta() || 0.016;
    var t = (performance.now() - t0) / 1000;

    /* integra le fasi (idle): velocità costante, niente salti */
    if (DETAIL === null){
      items.forEach(function(it){
        if (!it || !it.ready) return;
        it.phase += it.spd * dt;
      });
    }

    /* aggiorna le animazioni (ventole del modello in focus): play singolo,
       ferma a fine clip, la scocca segue lo stato playing */
    if (DETAIL !== null){
      var mit = items[DETAIL];
      if (mit && mit.mixer && mit.clip){
        mit.mixer.update(dt);
        var act = mit.mixer.clipAction(mit.clip);
        if (mit.playing && act.time >= act.getClip().duration - 0.02){
          /* fine clip: ferma, loop singolo (per ripartire si riclicca Play) */
          act.paused = true;
          mit.playing = false;
          playBtn.textContent = '▶ Play';
        }
      }
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
        /* idle: wrap stabile (niente rotazione di fase), solo il mesh ruota su
           se stesso con lo spin — niente doppia rotazione "impazzita" */
        it.wrap.rotation.y = 0;
        it.mesh.rotation.y += dt * it.spin;
      } else if (i === DETAIL){
        /* in dettaglio: rotazione solo via drag (nessuno spin automatico) */
      } else {
        /* oggetti a sinistra in focus: wrap stabile, spin ridotto */
        it.wrap.rotation.y = 0;
        it.mesh.rotation.y += dt * it.spin * 0.6;
      }
      /* esploso (solo hero3D2): sposta le parti lungo la direzione mappata.
               explodeAbs = distanza ASSOLUTA in unità normalizzate (0.02 = distacco
               minimo); altrimenti proporzionale alla dimensione del modello. */
            if (i === DETAIL && it.parts.length && MODELS[i].canExplode){
              var target = it.exploded ? 1 : 0;
              it.explodeT += (target - it.explodeT) * 0.08;
              var dist = it.explodeT * MODELS[i].explodeDist *
                (MODELS[i].explodeAbs ? 1 : it.partsScale);
              it.parts.forEach(function(p){
                p.obj.position.copy(p.base).addScaledVector(p.dir, dist * (p.distFactor || 1));
              });
            }
      /* scocca trasparente (hero3D3-bis): lerp verso il target del play/close */
      if (it.cover && it.coverTarget){
        it.cover.transmission += (it.coverTarget.transmission - it.cover.transmission) * 0.08;
        it.cover.opacity += (it.coverTarget.opacity - it.cover.opacity) * 0.08;
      }
      it.mesh.visible = true;
    });

    updateSpray(dt);
    renderer.render(scene, camera);
    updateCloseX();
    updateExplodeBtn();
    updatePlayBtn();
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
    /* 2) riallinea le fasi equidistanti (120°) rispetto all'ex-detail.
       FIX: prima il delta era (j<idx ? -1 : +1)*120°: quando idx era 0 o 2 i DUE
       altri ricevevano lo STESSO segno -> sovrapposti. Ora assegno sempre
       -120° a uno e +120° all'altro: equidistanza garantita. */
    if (it){
      var basePhase = it.phase;
      var picked = 0;
      items.forEach(function(other, j){
        if (!other || !other.ready || j === idx) return;
        other.phase = basePhase + (picked === 0 ? -1 : 1) * Math.PI * 2 / 3;
        picked++;
      });
    }
    /* 3) stop animazione/play: azzera mixer e spray */
    if (it){
      it.playing = false;
      if (it.mixer && it.clip){
        var act = it.mixer.clipAction(it.clip);
        act.paused = true; act.time = 0;
        it.mixer.timeScale = 0;
      }
      if (it.spraySys){ it.spraySys.active = false; it.spraySys.pts.visible = false; }
      if (window.__sprayTimers && window.__sprayTimers[idx]){ clearTimeout(window.__sprayTimers[idx]); }
    }
    /* 4) scocca: torna opaca */
    if (it && it.cover){ it.coverTarget = {opacity: 1, transmission: 0}; }
    /* 5) chiudi callout materiali ed esplodi/play */
    hideMaterialCallout();
    explodeBtn.style.display = 'none';
    playBtn.style.display = 'none';
    playBtn.textContent = '▶ Play';
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

  /* il bottone Esplodi segue l'oggetto in focus (sotto di esso).
     Visibile solo per i modelli con canExplode (hero3D2). */
  function updateExplodeBtn(){
    if (DETAIL === null || !MODELS[DETAIL] || !MODELS[DETAIL].canExplode){
      explodeBtn.style.display = 'none';
      return;
    }
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

  /* --- bottone Esplodi (solo in focus, hero3D2): toggle posizioni parti --- */
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

  /* --- bottone Play (solo hero3D3-bis): avvia l'animazione UNA volta.
     Sequenza: spray conico dai locatori (0 -> frame 42), poi ventole dal
     frame 42 a fine clip (4.067s), poi stop. Riclick = restart da zero.
     La scocca diventa trasparente (alpha .3, transmission 1) durante il play. --- */
  var playBtn = document.createElement('button');
  playBtn.setAttribute('aria-label', 'Avvia l\u2019animazione');
  playBtn.style.cssText = 'position:fixed;z-index:70;padding:10px 22px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(221,241,96,.9);color:#111;font-size:15px;font-weight:600;letter-spacing:.04em;cursor:pointer;display:none;backdrop-filter:blur(4px);box-shadow:0 6px 24px rgba(0,0,0,.35)';
  playBtn.textContent = '▶ Play';
  playBtn.addEventListener('click', togglePlay);
  document.body.appendChild(playBtn);

  function updatePlayBtn(){
    if (DETAIL === null || !MODELS[DETAIL] || !MODELS[DETAIL].canPlay){
      playBtn.style.display = 'none';
      return;
    }
    var it = items[DETAIL]; if (!it || !it.ready){ return; }
    var rect = canvas.getBoundingClientRect();
    var p = new THREE.Vector3();
    it.wrap.getWorldPosition(p);
    p.project(camera);
    var x = (p.x * 0.5 + 0.5) * rect.width + rect.left;
    var y = (-p.y * 0.5 + 0.5) * rect.height + rect.top;
    playBtn.style.display = 'block';
    playBtn.style.left = (x - 52) + 'px';
    playBtn.style.top = (y + 120) + 'px';
  }

  function togglePlay(){
    var it = items[DETAIL]; if (!it || !it.mixer || !it.clip) return;
    var act = it.mixer.clipAction(it.clip);
    /* avvia (o riavvia) la sequenza da zero */
    it.playing = true;
    act.paused = true;   /* ferma la clip durante lo spray */
    act.time = 0;
    it.mixer.timeScale = 1;
    /* spray: corre per i primi fanT secondi (42 frame), poi parte la clip */
    if (it.spraySys){
      var sys = it.spraySys;
      sys.active = true; sys.t = 0; sys.dur = it.sprayFansT;
      sys.pts.visible = true;
      if (window.__sprayTimers) clearTimeout(window.__sprayTimers[DETAIL]);
      window.__sprayTimers = window.__sprayTimers || {};
      window.__sprayTimers[DETAIL] = setTimeout(function(){
        if (it.playing && it.mixer){
          act.paused = false;   /* ventole dal frame 42 */
          it.mixer.timeScale = 1;
        }
      }, Math.max(120, sys.dur * 1000));
    } else {
      act.paused = false;
    }
    /* scocca: trasparente per mostrare l'interno (alpha .3, transmission 1) */
    if (it.cover){ it.coverTarget = {opacity: 0.3, transmission: 1}; }
    playBtn.textContent = '↺ Replay';
  }

  /* --- callout materiali (tracking sul punto cliccato) ---
       Il menu è RICOSTRUIBILE: quando arrivano le finiture dinamiche dal GLB
       della maniglia (piani finish-*) si aggiungono automaticamente. */
    var matMenu = document.createElement('div');
    matMenu.style.cssText = 'position:fixed;z-index:80;display:none;flex-direction:column;gap:6px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,12,12,.85);backdrop-filter:blur(10px);box-shadow:0 12px 40px rgba(0,0,0,.5)';
    var matTitle = document.createElement('div');
    matTitle.style.cssText = 'font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#999;padding:2px 6px 6px';
    matTitle.textContent = 'Finitura';
    matMenu.appendChild(matTitle);

    function finishButton(f, k){
      var b = document.createElement('button');
      b.style.cssText = 'display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-size:13px;cursor:pointer;text-align:left';
      b.innerHTML = '<span style="width:18px;height:18px;border-radius:50%;background:'+f.swatch+';border:1px solid rgba(255,255,255,.3);flex-shrink:0"></span>' + f.name;
      b.addEventListener('click', function(){ applyFinish(DETAIL, k); hideMaterialCallout(); });
      return b;
    }
    function rebuildFinishMenu(){
          /* ricostruisce le voci dopo la voce Standard (mantiene il titolo).
             Guard: se il menu non è ancora stato creato (GLB caricato prima della
             UI), al primo rebuild utile lo farà il boot. */
          if (!matMenu) return;
          while (matMenu.children.length > 1) matMenu.removeChild(matMenu.lastChild);
      var std = finishButton({name: 'Standard', swatch: 'linear-gradient(135deg,#999,#444)'}, -1);
      std.innerHTML = '<span style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#999,#444);border:1px solid rgba(255,255,255,.3);flex-shrink:0"></span>Standard';
      matMenu.appendChild(std);
      FINISHES.forEach(function(f, k){
        matMenu.appendChild(finishButton(f, k));
      });
    }
    rebuildFinishMenu();
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

  /* applica la finitura k (o -1 = Standard) al GRUPPO MATERIALE della mesh
       cliccata: tutte le mesh con la stessa finitura visiva cambiano insieme.
       k>=0: se la finitura ha già il materiale rubato (fin.mat, dal GLB della
       maniglia) lo applica direttamente; altrimenti ruba dal mini-GLB esterno. */
    function applyFinish(idx, k){
      var it = items[idx]; if (!it) return;
      /* mesh target: quella cliccata, o la prima del modello se non c'è hit.
               Skip dei piani finish-* (sorgenti di finiture, invisibili: il loro
               matKey è undefined e non devono diventare il target). */
            var target = (matTarget && matTarget.mesh) ? matTarget.mesh : null;
            if (!target){
              it.mesh.traverse(function(o){
                if (!target && o.isMesh && !/^finish-/.test(o.name || '')) target = o;
              });
            }
      if (!target) return;
      /* gruppo materiale della mesh cliccata (tutte le mesh con la stessa finitura) */
      var group = it.matGroups[target.userData.matKey] || null;
      var meshes = group ? group.meshes : [target];

      if (k === -1){
        /* Standard: ripristina il materiale originale del gruppo */
        var orig = group ? group.orig : null;
        if (orig){
          meshes.forEach(function(m){
            m.material = Array.isArray(orig)
              ? orig.map(function(x){ return x.clone(); })
              : orig.clone();
          });
        }
        return;
      }

      var fin = FINISHES[k];
      if (!fin) return;
      if (fin.mat){
              /* finitura dinamica rubata dal GLB della maniglia: applica direttamente */
              meshes.forEach(function(m){ applyMaterialToMesh(m, fin.mat); });
              return;
            }

            if (finishCache[fin.url]){
      meshes.forEach(function(m){ applyMaterialToMesh(m, finishCache[fin.url]); });
      return;
    }
    /* fallback immediato (poi, se il GLB arriva, sostituisce) */
    var fb = fin.fallback;
    var fallbackMat = new THREE.MeshStandardMaterial({
      color: fb.color, metalness: fb.metalness, roughness: fb.roughness,
      envMapIntensity: 0.75
    });
    meshes.forEach(function(m){ applyMaterialToMesh(m, fallbackMat); });
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
        finishCache[fin.url].envMapIntensity = 0.75;
        meshes.forEach(function(m){ applyMaterialToMesh(m, finishCache[fin.url]); });
      }
    }, undefined, function(){
      /* file non presente: resta il fallback procedurale */
    });
  }

  function applyMaterialToMesh(mesh, mat){
    if (!mesh) return;
    if (Array.isArray(mesh.material)){
      mesh.material = mesh.material.map(function(){ return mat.clone(); });
    } else {
      mesh.material = mat.clone();
    }
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
         Solo per i modelli con canFinish (hero3D2/bis: niente cambio materiale). */
      if (!MODELS[i] || !MODELS[i].canFinish) return;
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
    hitTest: function(x, y){ return meshAt(x, y); },
    partsInfo: function(i){
      var it = items[i]; if (!it || !it.ready) return 'loading';
      return it.parts.map(function(p){
        var n = p.nodeName || (p.obj.name || (p.obj.parent && p.obj.parent.name) || '?');
        return n + ': dir=' + p.dir.x.toFixed(2) + ',' + p.dir.y.toFixed(2) + ',' + p.dir.z.toFixed(2);
      }).join(' | ');
    },
    sprayInfo: function(i){
      var it = items[i]; if (!it || !it.spraySys) return 'no spray';
      var s = it.spraySys;
      return 'origins=' + s.origins.map(function(o){ return o.x.toFixed(2)+','+o.y.toFixed(2)+','+o.z.toFixed(2); }).join(' | ')
        + ' aim=' + s.aim.x.toFixed(2)+','+s.aim.y.toFixed(2)+','+s.aim.z.toFixed(2)
        + ' active=' + s.active + ' dur=' + s.dur.toFixed(2);
    },
    play: function(i){ DETAIL = i; if (items[i] && items[i].ready){ togglePlay(); } },
    coverState: function(){
          var it = items[2]; if (!it) return 'no item2';
          if (!it.cover) return 'no cover';
          return 'opacity=' + it.cover.opacity.toFixed(3) + ' transmission=' + it.cover.transmission.toFixed(3) +
            ' target=' + JSON.stringify(it.coverTarget) + ' playing=' + it.playing +
            ' clipTime=' + (it.mixer && it.clip ? it.mixer.clipAction(it.clip).time.toFixed(3) : 'none');
        },
        /* proietta le ORIGINI dello spray a schermo (coord pagina) per confrontarle
           con la posizione del bottone Play o col modello: debug visivo dei locatori */
        sprayScreen: function(i){
          var it = items[i]; if (!it || !it.spraySys) return 'no spray';
          var rect = canvas.getBoundingClientRect();
          return it.spraySys.origins.map(function(o){
            var v = new THREE.Vector3(o.x, o.y, o.z);
            v.applyMatrix4(it.mesh.matrixWorld);
            v.project(camera);
            return {
              x: Math.round((v.x * 0.5 + 0.5) * rect.width + rect.left),
              y: Math.round((-v.y * 0.5 + 0.5) * rect.height + rect.top)
            };
          });
        },
        locatorWorld: function(i){
          var it = items[i]; if (!it || !it.spraySys) return 'no spray';
          return it.spraySys.origins.map(function(o){
            var v = new THREE.Vector3(o.x, o.y, o.z);
            v.applyMatrix4(it.mesh.matrixWorld);
            return {x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3)};
          });
        },
        sprayDebug: function(i){
          var it = items[i]; if (!it || !it.ready) return 'no item';
          var out = [];
          it.mesh.traverse(function(o){
            if (!/^spray-source-/.test(o.name || '')) return;
            var wp = new THREE.Vector3();
            o.getWorldPosition(wp);
            var lp = o.position.clone();
            out.push({
              name: o.name,
              isMesh: o.isMesh,
              pos_locale: [lp.x.toFixed(3), lp.y.toFixed(3), lp.z.toFixed(3)],
              pos_world: [wp.x.toFixed(3), wp.y.toFixed(3), wp.z.toFixed(3)],
              worldToLocal: [it.mesh.worldToLocal(wp.clone()).x.toFixed(3), it.mesh.worldToLocal(wp.clone()).y.toFixed(3), it.mesh.worldToLocal(wp.clone()).z.toFixed(3)]
            });
          });
          out.push({
            mesh_scale: [it.mesh.scale.x.toFixed(4), it.mesh.scale.y.toFixed(4), it.mesh.scale.z.toFixed(4)],
            mesh_pos: [it.mesh.position.x.toFixed(3), it.mesh.position.y.toFixed(3), it.mesh.position.z.toFixed(3)],
            mesh_rotY: it.mesh.rotation.y.toFixed(3)
          });
          return JSON.stringify(out);
        },
        worldProbe: function(i){
          var it = items[i]; if (!it || !it.ready) return 'no item';
          it.mesh.updateWorldMatrix(true, true);
          var res = {bbox: null, nodes: []};
          var box = new THREE.Box3().setFromObject(it.mesh);
          res.bbox = {min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
                      max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)]};
          it.mesh.traverse(function(o){
            var nm = o.name || '';
            if (/^(BODY15|Provetta_tappo|spray-source)/.test(nm)){
              var w = new THREE.Vector3();
              o.getWorldPosition(w);
              res.nodes.push({name: nm, world: [w.x.toFixed(2), w.y.toFixed(2), w.z.toFixed(2)], scale: [o.scale.x.toFixed(3), o.scale.y.toFixed(3), o.scale.z.toFixed(3)]});
            }
          });
          return JSON.stringify(res);
        },
                matInfo: function(i){
                  var it = items[i]; if (!it || !it.ready) return 'no item';
                  var out = [];
                          it.mesh.traverse(function(o){
                            if (!o.isMesh || /^finish-/.test(o.name || '')) return;
                            var m = Array.isArray(o.material) ? o.material[0] : o.material;
                            out.push((o.name || '?') + '=' + (m.color ? '#' + m.color.getHexString() : 'no-color') +
                              ' m' + (m.metalness !== undefined ? m.metalness.toFixed(2) : '?') +
                              ' r' + (m.roughness !== undefined ? m.roughness.toFixed(2) : '?'));
                          });
                          return out.join(' | ') + ' [finishes=' + FINISHES.length + ']';
                        }
  };
  } /* fine: startHero */
  /* boot differito: parte quando il browser è libero, così non blocca il primo render */
  var _hc = document.getElementById('hero3d');
  if (_hc){
    var _boot = function(){ startHero(); };
    if (window.requestIdleCallback) window.requestIdleCallback(_boot, {timeout: 1500});
    else setTimeout(_boot, 300);
  }
})();
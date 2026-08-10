/* Faccoli · Hero 3D — tre modelli GLB orbitano attorno al testo centrale.
   Orbita ellittica con profondità: oggetti davanti più grandi, dietro più piccoli.
   Nessuna etichetta: solo i modelli, che ruotano su se stessi mentre orbitano. */
(function(){
  var canvas = document.getElementById('hero3d');
  var hero = document.querySelector('.hero');
  if (!canvas || !hero || !window.THREE || !window.THREE.GLTFLoader) return;

  /* renderer trasparente sopra lo sfondo hero */
  var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);

  /* luci: ambient + key + rim + fill per far leggere i materiali PBR */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 9, 7);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x8ab4ff, 0.45);
  rim.position.set(-7, -3, -5);
  scene.add(rim);
  var fill = new THREE.PointLight(0xfff2e0, 0.35, 40);
  fill.position.set(-4, 3, 8);
  scene.add(fill);

  var MODELS = [
    {url: 'assets/models/maniglia-ginkgo.glb', spin: 0.55},
    {url: 'assets/models/maniglia-iki.glb',    spin: -0.42},
    {url: 'assets/models/testiera-alba-moyen.glb', spin: 0.3}
  ];

  var group = new THREE.Group();
  scene.add(group);
  var items = [];
  var pending = MODELS.length;
  var loader = new THREE.GLTFLoader();

  MODELS.forEach(function(cfg, i){
    loader.load(cfg.url, function(gltf){
      var mesh = gltf.scene;

      /* normalizza dimensione: max dim ~ 2.4 unità, ri-centra su origine */
      var box = new THREE.Box3().setFromObject(mesh);
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      var baseScale = 2.4 / maxDim;
      mesh.scale.setScalar(baseScale);
      box.setFromObject(mesh);
      var c = box.getCenter(new THREE.Vector3());
      mesh.position.sub(c);
      mesh.rotation.y = i * 1.1;

      /* wrapper per la scala di profondità separata */
      var wrap = new THREE.Object3D();
      wrap.add(mesh);
      group.add(wrap);
      items[i] = {wrap: wrap, mesh: mesh, angle: i * Math.PI * 2 / 3, spin: cfg.spin, ready: true};
      pending--;
    });
  });

  /* orbita ellittica INCLINATA: il piano ruota attorno all'asse X.
     Davanti (z max) -> il modello scende sotto il testo (impalla poco)
     Dietro  (z min) -> il modello sale sopra il testo (visibile, non coperto)
     Ai lati resta fuori dal blocco di testo. */
  var RX = 5.2, RZ = 2.8, CY = 0.45, RY = 2.0, SPEED = 0.32;

  function resize(){
    var w = hero.clientWidth, h = hero.clientHeight;
    if (w < 768){ renderer.setSize(w, h, false); return; }
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

    items.forEach(function(it){
      if (!it || !it.ready) return;
      var a = it.angle + t * SPEED;
      var x = Math.sin(a) * RX;
      var z = Math.cos(a) * RZ;
      var y = CY - Math.cos(a) * RY;    // davanti(cos=1)=basso, dietro(cos=-1)=alto
      var depth = (z + RZ) / (2 * RZ);  // 0 = dietro, 1 = davanti
      var s = 0.66 + depth * 0.60;      // piccolo dietro, grande davanti
      it.wrap.position.set(x, y, z);
      it.wrap.scale.setScalar(s);
      it.wrap.rotation.y = a;           // il modello segue l'orbita
      it.mesh.rotation.y += dt * it.spin; // plus rotazione propria
      it.mesh.visible = true;
    });

    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  /* hook debug: espone le posizioni correnti dei tre modelli (utile per messa a punto) */
  window.__hero3d = {
    dump: function(){
      return items.map(function(it){
        if (!it || !it.ready) return 'loading';
        var p = it.wrap.position, s = it.wrap.scale.x;
        return 'x='+p.x.toFixed(2)+' y='+p.y.toFixed(2)+' z='+p.z.toFixed(2)+' scale='+s.toFixed(2);
      });
    }
  };
})();
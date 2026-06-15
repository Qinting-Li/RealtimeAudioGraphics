function initCubeVisualizer(mic) {
    const microphone = mic;
    let running = false;
    let disposed = false;
    let animationId;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 18, 55);
    camera.lookAt(scene.position);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('visualizerContainer').appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x7df9ff, 1.5, 120);
    pointLight.position.set(10, 30, 20);
    scene.add(pointLight);

    const group = new THREE.Group();
    scene.add(group);

    const cubes = [];
    const gridSize = 12;
    const spacing = 3.2;

    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL((x + z) / (gridSize * 2), 0.8, 0.55),
                emissive: 0x050014,
                metalness: 0.25,
                roughness: 0.35,
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (x - gridSize / 2) * spacing,
                0,
                (z - gridSize / 2) * spacing
            );
            cube.userData.baseY = cube.position.y;
            cube.userData.phase = (x + z) * 0.35;
            group.add(cube);
            cubes.push(cube);
        }
    }

    const gui = new dat.GUI({ autoPlace: false });
    document.getElementById('guiContainer').appendChild(gui.domElement);

    const settings = {
        sensitivity: 18,
        rotationSpeed: 0.004,
        waveSpread: 0.35,
    };

    gui.add(settings, 'sensitivity', 2, 40, 0.5);
    gui.add(settings, 'rotationSpeed', -0.02, 0.02, 0.001);
    gui.add(settings, 'waveSpread', 0.05, 1, 0.01);

    window.addEventListener('resize', onResize);
    start();

    function start() {
        if (running || disposed) {
            return;
        }
        running = true;
        animationId = requestAnimationFrame(animate);
    }

    function stop() {
        if (!running) {
            return;
        }
        running = false;
        cancelAnimationFrame(animationId);
    }

    function dispose() {
        if (disposed) {
            return;
        }
        stop();
        disposed = true;
        window.removeEventListener('resize', onResize);
        controls.dispose();
        gui.destroy();
        disposeObject3D(scene);
        renderer.dispose();
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer && renderer.domElement && visualizerContainer.contains(renderer.domElement)) {
            visualizerContainer.removeChild(renderer.domElement);
        }
    }

    function animate(time) {
        if (microphone.initialized) {
            const bands = microphone.getFrequencyBands();
            const volume = microphone.getVolume();
            const bass = bands.bass / 255;
            const mid = bands.mid / 255;
            const high = bands.high / 255;

            cubes.forEach((cube, index) => {
                const wave = Math.sin(time * 0.002 + index * settings.waveSpread + cube.userData.phase);
                const scaleY = 1 + volume * settings.sensitivity + bass * 8 + wave * mid * 2;
                cube.scale.y = Math.max(0.2, scaleY);
                cube.position.y = cube.userData.baseY + cube.scale.y * 0.75;
                cube.rotation.x += 0.004 + high * 0.02;
                cube.rotation.z += 0.003 + mid * 0.01;
                cube.material.emissive.setHSL(0.65 + high * 0.25, 0.9, 0.08 + bass * 0.25);
            });

            group.rotation.y += settings.rotationSpeed + bass * 0.004;
        }

        controls.update();
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return {
        start,
        stop: function () {
            console.log("Stopping Cubes visualizer");
            dispose();
        },
        dispose,
    };
}

function disposeObject3D(root) {
    root.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
                Object.keys(material).forEach((key) => {
                    const value = material[key];
                    if (value && typeof value.dispose === 'function') {
                        value.dispose();
                    }
                });
                material.dispose();
            });
        }
    });
}

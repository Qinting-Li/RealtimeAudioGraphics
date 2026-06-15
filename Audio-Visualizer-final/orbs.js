let orbsScene;
let orbsCamera;
let orbsRenderer;
let orbsOrbitControls;
let orbsAnimationId;
let orbsShapeAnimationId;
let microphone;

const noise = new SimplexNoise();

function initOrbsVisualizer(mic) {
    microphone = mic;
    let running = false;
    let disposed = false;

    orbsScene = new THREE.Scene();
    const group = new THREE.Group();

    orbsCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    orbsCamera.position.set(0, 0, 100);
    orbsCamera.lookAt(orbsScene.position);
    orbsScene.add(orbsCamera);

    orbsRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    orbsRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualizerContainer').appendChild(orbsRenderer.domElement);

    orbsOrbitControls = new THREE.OrbitControls(orbsCamera, orbsRenderer.domElement);
    orbsOrbitControls.target.set(0, 0, 0);
    orbsOrbitControls.enablePan = false;

    const geometries = createGeometry(group);
    createLights();
    orbsScene.add(group);

    window.addEventListener('resize', onResize, false);
    start();

    function start() {
        if (running || disposed) {
            return;
        }
        running = true;
        animateOrbs(group, geometries);
        animateExtraShapes(geometries);
    }

    function stop() {
        if (!running) {
            return;
        }
        running = false;
        window.cancelAnimationFrame(orbsAnimationId);
        window.cancelAnimationFrame(orbsShapeAnimationId);
    }

    function dispose() {
        if (disposed) {
            return;
        }
        stop();
        disposed = true;
        window.removeEventListener('resize', onResize);
        orbsOrbitControls.dispose();
        disposeObject3D(orbsScene);
        orbsRenderer.dispose();

        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer && orbsRenderer.domElement && visualizerContainer.contains(orbsRenderer.domElement)) {
            visualizerContainer.removeChild(orbsRenderer.domElement);
        }
    }

    function onResize() {
        orbsCamera.aspect = window.innerWidth / window.innerHeight;
        orbsCamera.updateProjectionMatrix();
        orbsRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    return {
        start,
        stop: function () {
            console.log("Stopping Orbs visualizer");
            dispose();
        },
        dispose,
    };
}

function createGeometry(group) {
    const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);

    const plane2 = new THREE.Mesh(planeGeometry.clone(), planeMaterial.clone());
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    const ball = new THREE.Mesh(
        new THREE.IcosahedronGeometry(20, 4),
        new THREE.MeshLambertMaterial({ color: 0xff00ee, wireframe: true })
    );
    group.add(ball);

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(13, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x7F00FF, wireframe: true })
    );
    group.add(sphere);

    const cone = new THREE.Mesh(
        new THREE.ConeGeometry(10, 20, 32),
        new THREE.MeshBasicMaterial({ color: 0x00FFFF, wireframe: true })
    );
    cone.position.set(50, 0, 0);
    group.add(cone);

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshPhongMaterial({
            color: 0xFF00FF,
            emissive: 0xFF00FF,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.7,
        })
    );
    box.position.set(-50, 0, 0);
    group.add(box);

    return { ball, plane, plane2, cone, sphere, box };
}

function createLights() {
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    orbsScene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.castShadow = true;
    orbsScene.add(spotLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    orbsScene.add(directionalLight);
}

function animateOrbs(group, geometries) {
    if (microphone.initialized) {
        updateGeometry(geometries.ball, geometries.plane, geometries.plane2);
        group.rotation.y += 0.005;
        orbsOrbitControls.update();
        orbsRenderer.render(orbsScene, orbsCamera);
    }
    orbsAnimationId = requestAnimationFrame(() => animateOrbs(group, geometries));
}

function animateExtraShapes(geometries) {
    geometries.sphere.rotation.x += 0.01;
    geometries.sphere.rotation.y += 0.02;
    geometries.cone.rotation.z += 0.01;
    geometries.box.rotation.x += 0.02;
    orbsShapeAnimationId = requestAnimationFrame(() => animateExtraShapes(geometries));
}

function updateGeometry(ball, plane, plane2) {
    const volume = microphone.getVolume();
    const upperAvgFr = 0.6 + volume * 5;
    const lowerMaxFr = -0.6 + volume * 5;

    makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
    makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
    makeRoughBall(ball, lowerMaxFr, upperAvgFr);
}

function makeRoughBall(mesh, bassFr, treFr) {
    const positionAttribute = mesh.geometry.getAttribute('position');
    const count = positionAttribute.count;
    const offset = mesh.geometry.parameters.radius;
    const amp = 7;
    const time = window.performance.now();
    const rf = 0.00001;

    for (let i = 0; i < count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        const vertex = new THREE.Vector3(x, y, z).normalize();
        const distance = (offset + bassFr * 5) + noise.noise3D(
            vertex.x + time * rf * 7,
            vertex.y + time * rf * 8,
            vertex.z + time * rf * 9
        ) * amp * treFr * 0.5;

        vertex.multiplyScalar(distance);
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);

        if (distance > 10) mesh.material.color.setHex(0xff000f);
        else if (distance > 9) mesh.material.color.setHex(0xf0f00f);
        else if (distance > 8) mesh.material.color.setHex(0xf0000f);
        else if (distance > 7) mesh.material.color.setHex(0xf00f0f);
        else if (distance > 6) mesh.material.color.setHex(0xf0100f);
        else if (distance > 5) mesh.material.color.setHex(0xf000af);
    }

    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function makeRoughGround(mesh, distortionFr) {
    const positionAttribute = mesh.geometry.getAttribute('position');
    const count = positionAttribute.count;

    for (let i = 0; i < count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const distance = noise.noise2D(x + Date.now() * 0.0003, y + Date.now() * 0.0001) * distortionFr * 3;
        positionAttribute.setXYZ(i, x, y, distance);
    }
    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    const fr = fractionate(val, minVal, maxVal);
    const delta = outMax - outMin;
    return outMin + (fr * delta);
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

// Main Application Controller - Three.js Romantic Cinematic Experience
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webgl-canvas');
    const promptHint = document.getElementById('prompt-hint');
    const messageContainer = document.getElementById('message-container');
    const replayBtn = document.getElementById('replay-btn');
    const touchRipple = document.getElementById('touch-ripple');

    // 1. Three.js Renderer Setup
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();

    // Perspective Camera: dynamically adapts between mobile portrait and desktop
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    let initialCamZ = 13.2;
    let initialCamY = 1.05;

    function updateCameraFraming() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const aspect = w / h;
        camera.aspect = aspect;

        if (aspect < 1) {
            // Mobile Portrait: Wider FOV & camera distance so full tree canopy is captured
            camera.fov = 54;
            initialCamZ = 16.5;
            initialCamY = 1.2;
            camera.position.set(0, initialCamY, initialCamZ);
            camera.lookAt(0, 1.15, 0);
        } else {
            // Desktop / Landscape: Cinematic 45 FOV
            camera.fov = 45;
            initialCamZ = 13.2;
            initialCamY = 1.05;
            camera.position.set(0, initialCamY, initialCamZ);
            camera.lookAt(0, 1.05, 0);
        }
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
    updateCameraFraming();
    window.addEventListener('resize', updateCameraFraming);

    // 2. Cinematic Romantic Lighting
    const ambientLight = new THREE.AmbientLight(0x4d2858, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffd6e0, 2.0);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffeaa7, 1.8);
    rimLight.position.set(-6, 7, -6);
    scene.add(rimLight);

    const canopyPointLight = new THREE.PointLight(0xff758c, 2.5, 16);
    canopyPointLight.position.set(0, 2.2, 0.6);
    scene.add(canopyPointLight);

    const groundWarmLight = new THREE.PointLight(0xff9ff3, 1.2, 10);
    groundWarmLight.position.set(0, -2.1, 1.8);
    scene.add(groundWarmLight);

    // 3. Ambient 3D Fairy Fireflies
    const isMobile = window.innerWidth <= 768;
    const fireflyCount = isMobile ? 65 : 130;
    const fireflyGeom = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount * 3; i += 3) {
        fireflyPos[i] = (Math.random() - 0.5) * 16;
        fireflyPos[i + 1] = -2.2 + Math.random() * 8.5;
        fireflyPos[i + 2] = (Math.random() - 0.5) * 14;
    }
    fireflyGeom.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));

    const fireflyCanvas = document.createElement('canvas');
    fireflyCanvas.width = 32;
    fireflyCanvas.height = 32;
    const fCtx = fireflyCanvas.getContext('2d');
    const fGrad = fCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
    fGrad.addColorStop(0, 'rgba(255, 234, 167, 1)');
    fGrad.addColorStop(0.35, 'rgba(255, 159, 243, 0.7)');
    fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    fCtx.fillStyle = fGrad;
    fCtx.fillRect(0, 0, 32, 32);

    const fireflyTexture = new THREE.CanvasTexture(fireflyCanvas);
    const fireflyMaterial = new THREE.PointsMaterial({
        map: fireflyTexture,
        size: 0.32,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const fireflies = new THREE.Points(fireflyGeom, fireflyMaterial);
    scene.add(fireflies);

    // 4. Instantiate 3D Sakura Tree & Instanced Petal System
    const tree = new window.FloweringTree(scene, isMobile);
    const petalSystem = new window.PetalSystem(scene, isMobile);
    petalSystem.populateOnTree(tree.flowerPositions);

    // 5. Interaction State Machine
    let isInteracting = false;
    let sequenceTimeline = null;

    function handleStartInteraction(event) {
        if (isInteracting) return;
        isInteracting = true;

        // Position touch ripple
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        if (touchRipple) {
            touchRipple.style.left = `${clientX}px`;
            touchRipple.style.top = `${clientY}px`;
            touchRipple.classList.add('active');
            setTimeout(() => touchRipple.classList.remove('active'), 800);
        }

        // Fade out prompt hint
        promptHint.classList.add('hidden');

        // Play crystal touch chime
        if (window.romanticAudio) {
            window.romanticAudio.playTouchChime();
        }

        // Stage 2: Tremble and start detaching
        petalSystem.startStorm();

        // Sequence Progression via GSAP
        sequenceTimeline = gsap.timeline();

        // 0.8s: Climax storm audio & camera subtle push
        sequenceTimeline.to({}, {
            duration: 0.8,
            onComplete: () => {
                if (window.romanticAudio) {
                    window.romanticAudio.playStormWhoosh();
                }
            }
        });

        // 2.2s: Camera gently glides forward slightly for cinematic depth
        sequenceTimeline.to(camera.position, {
            z: initialCamZ - 1.2,
            duration: 1.8,
            ease: "power2.out"
        }, 1.0);

        // 3.2s: Petals transition to parting/revealing mode
        sequenceTimeline.to({}, {
            duration: 0.1,
            onComplete: () => {
                petalSystem.stage = 3;
            }
        }, 3.0);

        // 3.6s: Reveal the heartfelt message with blur-to-focus
        sequenceTimeline.to({}, {
            duration: 0.1,
            onComplete: () => {
                messageContainer.classList.add('visible');
                if (window.romanticAudio) {
                    window.romanticAudio.playMessageReveal();
                }
            }
        }, 3.5);

        // 4.4s: Petal system enters lingering mode (petals drift around message)
        sequenceTimeline.to({}, {
            duration: 0.1,
            onComplete: () => {
                petalSystem.stage = 4;
            }
        }, 4.2);

        // 5.0s: Reveal "Xem lại 🌸" button
        sequenceTimeline.to({}, {
            duration: 0.1,
            onComplete: () => {
                replayBtn.classList.add('visible');
            }
        }, 5.0);
    }

    // Attach click/touch to window
    window.addEventListener('click', (e) => {
        if (e.target.closest('#replay-btn')) return;
        handleStartInteraction(e);
    });

    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#replay-btn')) return;
        handleStartInteraction(e);
    }, { passive: true });

    // Replay Handler
    replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (sequenceTimeline) {
            sequenceTimeline.kill();
        }

        messageContainer.classList.remove('visible');
        replayBtn.classList.remove('visible');

        gsap.to(camera.position, {
            z: initialCamZ,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                petalSystem.reset();
                isInteracting = false;
                promptHint.classList.remove('hidden');
            }
        });
    });

    // 6. Single 60 FPS RequestAnimationFrame Loop with deltaTime
    const clock = new THREE.Clock();
    let isTabVisible = true;

    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
    });

    function renderLoop() {
        requestAnimationFrame(renderLoop);

        if (!isTabVisible) return;

        const dt = Math.min(clock.getDelta(), 0.08);

        // Update tree gentle breeze sway and falling idle petals
        tree.update(dt);

        // Update 3D petal system
        petalSystem.update(dt);

        // Update fireflies gentle upward drift
        const fPos = fireflyGeom.attributes.position.array;
        for (let i = 1; i < fPos.length; i += 3) {
            fPos[i] += dt * 0.25;
            if (fPos[i] > 6.2) fPos[i] = -2.2;
        }
        fireflyGeom.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    renderLoop();
});

// 3D Instanced Petal Engine - High Performance, 60 FPS, Zero-GC Particle System
// Harmonized with authentic Japanese Sakura petal geometry and soft pink-to-white translucency
class PetalSystem {
    constructor(scene, isMobile) {
        this.scene = scene;
        this.isMobile = isMobile;
        this.count = isMobile ? 800 : 1400;

        // Stage: 0 = on tree, 1 = trembling/detaching, 2 = climax storm towards camera, 3 = parting/revealing, 4 = lingering
        this.stage = 0;
        this.stageTime = 0;

        // Reusable Three.js math objects (ZERO allocation in render loop)
        this.dummy = new THREE.Object3D();

        this.initGeometryAndMaterial();
        this.initInstancedMesh();
        this.initParticleData();
    }

    initGeometryAndMaterial() {
        // 1. Procedural 3D Curved Sakura Petal Geometry (Curved with distinctive notched tip)
        const geom = new THREE.PlaneGeometry(0.34, 0.44, 4, 4);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const u = (pos.getX(i) / 0.34) + 0.5; // 0 to 1
            const v = (pos.getY(i) / 0.44) + 0.5; // 0 to 1

            // Petal taper & spoon curve
            const taper = Math.sin(v * Math.PI) * 0.85 + 0.15;
            pos.setX(i, pos.getX(i) * taper);
            const camber = -0.06 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
            pos.setZ(i, camber);
        }
        geom.computeVertexNormals();
        this.petalGeometry = geom;

        // 2. High-Res Sakura Petal Texture with Notch
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const cx = 64, cy = 64;

        // Translucent soft ivory-to-rose petal gradient
        const grad = ctx.createRadialGradient(cx, cy * 0.7, 4, cx, cy, 60);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffccd5');
        grad.addColorStop(0.75, '#ff8da1');
        grad.addColorStop(0.94, '#e84393');
        grad.addColorStop(1, 'rgba(232, 67, 147, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, 16);
        ctx.bezierCurveTo(24, 20, 16, 75, cx * 0.9, 114);
        ctx.lineTo(cx, 104); // subtle notch
        ctx.lineTo(cx * 1.1, 114);
        ctx.bezierCurveTo(112, 75, 104, 20, cx, 16);
        ctx.fill();

        // Subtle petal vein
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 24);
        ctx.quadraticCurveTo(cx - 2, 64, cx, 106);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = true;

        this.petalMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.04,
            side: THREE.DoubleSide,
            roughness: 0.45,
            metalness: 0.03,
            depthWrite: false
        });
    }

    initInstancedMesh() {
        this.mesh = new THREE.InstancedMesh(this.petalGeometry, this.petalMaterial, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // Harmonious Sakura Palette: Soft blush, peach blossom, pure ivory, rose gold
        const palette = [
            new THREE.Color('#ffccd5'),
            new THREE.Color('#ffb7c5'),
            new THREE.Color('#ff8da1'),
            new THREE.Color('#fff5f7'),
            new THREE.Color('#ffeaa7'),
            new THREE.Color('#ff9ff3')
        ];

        for (let i = 0; i < this.count; i++) {
            const c = palette[Math.floor(Math.random() * palette.length)];
            this.mesh.setColorAt(i, c);
        }
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        this.scene.add(this.mesh);
    }

    initParticleData() {
        const count = this.count;
        this.posX = new Float32Array(count);
        this.posY = new Float32Array(count);
        this.posZ = new Float32Array(count);

        this.velX = new Float32Array(count);
        this.velY = new Float32Array(count);
        this.velZ = new Float32Array(count);

        this.rotX = new Float32Array(count);
        this.rotY = new Float32Array(count);
        this.rotZ = new Float32Array(count);

        this.vRotX = new Float32Array(count);
        this.vRotY = new Float32Array(count);
        this.vRotZ = new Float32Array(count);

        this.scale = new Float32Array(count);
        this.baseScale = new Float32Array(count);

        this.anchorX = new Float32Array(count);
        this.anchorY = new Float32Array(count);
        this.anchorZ = new Float32Array(count);

        this.flutterPhase = new Float32Array(count);
        this.flutterSpeed = new Float32Array(count);
        this.delay = new Float32Array(count);
        this.isLingering = new Uint8Array(count);
    }

    // Attach petals directly to the tree's blossom clusters
    populateOnTree(flowerPositions) {
        const count = this.count;
        const totalAnchorPoints = flowerPositions.length;

        for (let i = 0; i < count; i++) {
            const anchor = flowerPositions[i % totalAnchorPoints];
            const r = Math.random() * 0.45;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const ax = anchor.x + r * Math.sin(phi) * Math.cos(theta);
            const ay = anchor.y + r * Math.sin(phi) * Math.sin(theta);
            const az = anchor.z + r * Math.cos(phi);

            this.anchorX[i] = ax;
            this.anchorY[i] = ay;
            this.anchorZ[i] = az;

            this.posX[i] = ax;
            this.posY[i] = ay;
            this.posZ[i] = az;

            this.velX[i] = 0;
            this.velY[i] = 0;
            this.velZ[i] = 0;

            this.rotX[i] = Math.random() * Math.PI * 2;
            this.rotY[i] = Math.random() * Math.PI * 2;
            this.rotZ[i] = Math.random() * Math.PI * 2;

            this.vRotX[i] = (Math.random() - 0.5) * 1.6;
            this.vRotY[i] = (Math.random() - 0.5) * 1.8;
            this.vRotZ[i] = (Math.random() - 0.5) * 1.4;

            this.baseScale[i] = 0.75 + Math.random() * 0.55;
            this.scale[i] = this.baseScale[i];

            this.flutterPhase[i] = Math.random() * Math.PI * 2;
            this.flutterSpeed[i] = 2.5 + Math.random() * 3.5;
            this.delay[i] = Math.random() * 1.5;
            this.isLingering[i] = i < (this.isMobile ? 55 : 95) ? 1 : 0;
        }

        this.updateMeshInstances();
    }

    startStorm() {
        this.stage = 1;
        this.stageTime = 0;

        for (let i = 0; i < this.count; i++) {
            const spreadX = (Math.random() - 0.5) * 7.5;
            const spreadY = (Math.random() - 0.5) * 5.0 + 0.8;
            const targetZ = 13.8 + Math.random() * 0.5;

            const dx = spreadX - this.posX[i];
            const dy = spreadY - this.posY[i];
            const dz = targetZ - this.posZ[i];

            const forwardSpeed = 4.6 + Math.random() * 5.4;
            this.velZ[i] = forwardSpeed;
            this.velX[i] = (dx / dz) * forwardSpeed + (Math.random() - 0.5) * 0.75;
            this.velY[i] = (dy / dz) * forwardSpeed + (Math.random() - 0.5) * 0.75;

            this.vRotX[i] = (Math.random() - 0.5) * 4.8;
            this.vRotY[i] = (Math.random() - 0.5) * 6.2;
            this.vRotZ[i] = (Math.random() - 0.5) * 3.8;
        }
    }

    update(dt) {
        this.stageTime += dt;
        const count = this.count;

        // Stage 0: Gentle idle breathing sway on the tree
        if (this.stage === 0) {
            const t = this.stageTime * 1.4;
            for (let i = 0; i < count; i++) {
                const sway = Math.sin(t + this.flutterPhase[i]) * 0.035;
                this.posX[i] = this.anchorX[i] + sway;
                this.posY[i] = this.anchorY[i] + Math.cos(t * 0.8 + this.flutterPhase[i]) * 0.02;
                this.rotZ[i] += Math.sin(t + this.flutterPhase[i]) * 0.01 * dt;
            }
        }
        // Stage 1 & 2: Detaching, accelerating, and Climax Screen-Blanketing Storm
        else if (this.stage === 1 || this.stage === 2) {
            for (let i = 0; i < count; i++) {
                if (this.stageTime < this.delay[i]) {
                    const trem = Math.sin(this.stageTime * 24 + this.flutterPhase[i]) * 0.035;
                    this.posX[i] = this.anchorX[i] + trem;
                    this.posY[i] = this.anchorY[i] + trem;
                    continue;
                }

                this.flutterPhase[i] += this.flutterSpeed[i] * dt;
                const flutterX = Math.sin(this.flutterPhase[i]) * 0.55;
                const flutterY = Math.cos(this.flutterPhase[i] * 0.8) * 0.38;

                this.posX[i] += (this.velX[i] + flutterX) * dt;
                this.posY[i] += (this.velY[i] + flutterY) * dt;
                this.posZ[i] += this.velZ[i] * dt;

                this.rotX[i] += this.vRotX[i] * dt;
                this.rotY[i] += this.vRotY[i] * dt;
                this.rotZ[i] += this.vRotZ[i] * dt;

                if (this.posZ[i] > 14.5) {
                    if (this.isLingering[i] && this.stage >= 2) {
                        this.posZ[i] = 10.5 + Math.random() * 2.5;
                        this.posX[i] = (Math.random() - 0.5) * 5.0;
                        this.posY[i] = (Math.random() - 0.5) * 3.0 + 0.8;
                        this.velX[i] = (Math.random() - 0.5) * 0.35;
                        this.velY[i] = -0.28 - Math.random() * 0.35;
                        this.velZ[i] = (Math.random() - 0.5) * 0.2;
                    } else {
                        this.scale[i] *= 0.92;
                    }
                }
            }

            if (this.stage === 1 && this.stageTime > 1.8) {
                this.stage = 2;
            }
        }
        // Stage 3 & 4: Revealing message and lingering ambient drift
        else if (this.stage === 3 || this.stage === 4) {
            for (let i = 0; i < count; i++) {
                if (this.isLingering[i]) {
                    this.flutterPhase[i] += this.flutterSpeed[i] * 0.5 * dt;
                    this.posX[i] += (this.velX[i] + Math.sin(this.flutterPhase[i]) * 0.28) * dt;
                    this.posY[i] += this.velY[i] * dt;
                    this.posZ[i] += this.velZ[i] * dt;

                    this.rotX[i] += this.vRotX[i] * 0.3 * dt;
                    this.rotY[i] += this.vRotY[i] * 0.3 * dt;
                    this.rotZ[i] += this.vRotZ[i] * dt * 0.3;

                    if (this.posY[i] < -2.2) {
                        this.posY[i] = 3.6;
                        this.posX[i] = (Math.random() - 0.5) * 5.2;
                    }
                } else {
                    this.posX[i] += this.velX[i] * dt * 0.4;
                    this.posY[i] -= 0.5 * dt;
                    this.scale[i] = Math.max(0, this.scale[i] - 0.35 * dt);
                }
            }
        }

        this.updateMeshInstances();
    }

    updateMeshInstances() {
        const dummy = this.dummy;
        const count = this.count;

        for (let i = 0; i < count; i++) {
            dummy.position.set(this.posX[i], this.posY[i], this.posZ[i]);
            dummy.rotation.set(this.rotX[i], this.rotY[i], this.rotZ[i]);
            dummy.scale.setScalar(this.scale[i]);
            dummy.updateMatrix();

            this.mesh.setMatrixAt(i, dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    reset() {
        this.stage = 0;
        this.stageTime = 0;
        for (let i = 0; i < this.count; i++) {
            this.posX[i] = this.anchorX[i];
            this.posY[i] = this.anchorY[i];
            this.posZ[i] = this.anchorZ[i];
            this.velX[i] = 0;
            this.velY[i] = 0;
            this.velZ[i] = 0;
            this.scale[i] = this.baseScale[i];
        }
        this.updateMeshInstances();
    }
}

window.PetalSystem = PetalSystem;

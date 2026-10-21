// ============================================================================
// Gorgeous 3D Sakura (Japanese Cherry Blossom) Tree
// Features: Smooth continuous tapered branches, authentic 5-petal sakura blossoms,
// delicate buds, organic multi-tiered canopy, subtle breeze sway, and ground petals.
// ============================================================================

class FloweringTree {
    constructor(scene, isMobile) {
        this.scene = scene;
        this.isMobile = isMobile;
        this.group = new THREE.Group();
        this.flowerPositions = [];
        this.idlePetals = [];
        this.time = 0;

        this.initMaterials();
        this.buildOrganicTreeSkeleton();
        this.buildSakuraBlossoms();
        this.buildIdleDriftingPetals();
        this.scene.add(this.group);
    }

    initMaterials() {
        // 1. Cherry Tree Bark: Smooth warm brown-grey with subtle rose tint
        // Generating fine procedural lenticels/bark striations
        const barkCanvas = document.createElement('canvas');
        barkCanvas.width = 256;
        barkCanvas.height = 256;
        const bCtx = barkCanvas.getContext('2d');
        bCtx.fillStyle = '#3a2321';
        bCtx.fillRect(0, 0, 256, 256);

        // Fine horizontal bark rings (Lenticels characteristic of Sakura wood)
        for (let i = 0; i < 90; i++) {
            const y = Math.random() * 256;
            const len = 12 + Math.random() * 45;
            const x = Math.random() * (256 - len);
            bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(35, 18, 16, 0.45)' : 'rgba(75, 52, 48, 0.35)';
            bCtx.fillRect(x, y, len, 1.5 + Math.random() * 1.5);
        }
        const barkTexture = new THREE.CanvasTexture(barkCanvas);
        barkTexture.wrapS = THREE.RepeatWrapping;
        barkTexture.wrapT = THREE.RepeatWrapping;
        barkTexture.repeat.set(1.5, 4);

        this.barkMaterial = new THREE.MeshStandardMaterial({
            map: barkTexture,
            color: 0x4a2d29,
            roughness: 0.82,
            metalness: 0.04
        });

        // 2. High-Res 5-Petal Sakura Blossom Texture
        // Soft ivory base transitioning into blush pink with tiny crimson center eye
        const flowerCanvas = document.createElement('canvas');
        flowerCanvas.width = 256;
        flowerCanvas.height = 256;
        const fCtx = flowerCanvas.getContext('2d');
        const cx = 128, cy = 128;

        // Draw 5 notched sakura petals
        for (let p = 0; p < 5; p++) {
            const angle = (p * Math.PI * 2) / 5 - Math.PI / 2;
            fCtx.save();
            fCtx.translate(cx, cy);
            fCtx.rotate(angle);

            // Petal gradient: Crimson eye -> Soft Pink -> Pure Ivory tip
            const pGrad = fCtx.createRadialGradient(0, -50, 4, 0, -50, 65);
            pGrad.addColorStop(0, '#ffffff');
            pGrad.addColorStop(0.35, '#ffccd5');
            pGrad.addColorStop(0.75, '#ff8da1');
            pGrad.addColorStop(0.92, '#e84393');
            pGrad.addColorStop(1, 'rgba(232, 67, 147, 0)');

            fCtx.fillStyle = pGrad;
            fCtx.beginPath();
            fCtx.moveTo(0, 0);
            fCtx.bezierCurveTo(-26, -25, -34, -75, -12, -96);
            fCtx.lineTo(0, -84); // Distinctive Sakura petal notch (vết khía cánh hoa anh đào)
            fCtx.lineTo(12, -96);
            fCtx.bezierCurveTo(34, -75, 26, -25, 0, 0);
            fCtx.fill();

            // Delicate petal edge highlight
            fCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            fCtx.lineWidth = 1.2;
            fCtx.stroke();

            fCtx.restore();
        }

        // Center Pistils and delicate golden stamens
        fCtx.save();
        fCtx.fillStyle = '#ff3366';
        fCtx.beginPath();
        fCtx.arc(cx, cy, 14, 0, Math.PI * 2);
        fCtx.fill();

        for (let s = 0; s < 18; s++) {
            const a = (s * Math.PI * 2) / 18;
            const r = 16 + Math.random() * 8;
            const sx = cx + Math.cos(a) * r;
            const sy = cy + Math.sin(a) * r;

            fCtx.strokeStyle = 'rgba(255, 245, 200, 0.8)';
            fCtx.lineWidth = 1;
            fCtx.beginPath();
            fCtx.moveTo(cx, cy);
            fCtx.lineTo(sx, sy);
            fCtx.stroke();

            fCtx.fillStyle = '#f1c40f';
            fCtx.beginPath();
            fCtx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            fCtx.fill();
        }
        fCtx.restore();

        const flowerTexture = new THREE.CanvasTexture(flowerCanvas);
        flowerTexture.generateMipmaps = true;

        this.sakuraFlowerMaterial = new THREE.MeshStandardMaterial({
            map: flowerTexture,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
            roughness: 0.42,
            metalness: 0.03,
            depthWrite: false
        });

        // 3. Bud Material
        this.budMaterial = new THREE.MeshStandardMaterial({
            color: 0xff758c,
            roughness: 0.5,
            metalness: 0.05
        });

        // 4. Floating Earth Ground Mound
        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x18121f,
            roughness: 0.9,
            metalness: 0.05
        });
    }

    // Helper: Creates smooth, seamlessly tapering circular branches (No visible polygons or chunky tubes)
    createTaperedBranchMesh(points, startRadius, endRadius, radialSegments = 10, tubularSegments = 16) {
        const curve = new THREE.CatmullRomCurve3(points);
        const geom = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        const frames = curve.computeFrenetFrames(tubularSegments, false);

        for (let i = 0; i <= tubularSegments; i++) {
            const t = i / tubularSegments;
            const p = curve.getPoint(t);
            const r = startRadius * (1 - t) + endRadius * t;
            const N = frames.normals[i];
            const B = frames.binormals[i];

            for (let j = 0; j <= radialSegments; j++) {
                const v = j / radialSegments;
                const theta = v * Math.PI * 2;
                const sinT = Math.sin(theta);
                const cosT = Math.cos(theta);

                const normal = new THREE.Vector3()
                    .addScaledVector(N, cosT)
                    .addScaledVector(B, sinT)
                    .normalize();

                const vertex = new THREE.Vector3()
                    .copy(p)
                    .addScaledVector(normal, r);

                vertices.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(t * 3, v);
            }
        }

        const ringVertexCount = radialSegments + 1;
        for (let i = 0; i < tubularSegments; i++) {
            for (let j = 0; j < radialSegments; j++) {
                const a = i * ringVertexCount + j;
                const b = (i + 1) * ringVertexCount + j;
                const c = (i + 1) * ringVertexCount + (j + 1);
                const d = i * ringVertexCount + (j + 1);

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geom.setIndex(indices);

        return new THREE.Mesh(geom, this.barkMaterial);
    }

    buildOrganicTreeSkeleton() {
        // Ground base mound with soft fallen petals
        const groundGeom = new THREE.CylinderGeometry(2.4, 1.2, 0.45, 24);
        const groundMesh = new THREE.Mesh(groundGeom, this.groundMaterial);
        groundMesh.position.set(0, -2.25, 0);
        groundMesh.scale.set(1.1, 0.7, 0.95);
        this.group.add(groundMesh);

        // 1. Natural Root Flares spreading onto the ground
        const roots = [
            [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(-0.4, -2.1, 0.3), new THREE.Vector3(-1.2, -2.25, 0.7)],
            [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0.5, -2.1, -0.2), new THREE.Vector3(1.3, -2.25, -0.6)],
            [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0.2, -2.1, 0.5), new THREE.Vector3(0.8, -2.25, 1.1)],
            [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(-0.3, -2.1, -0.4), new THREE.Vector3(-0.9, -2.25, -0.9)]
        ];
        roots.forEach(pts => {
            const rootMesh = this.createTaperedBranchMesh(pts, 0.16, 0.04, 8, 8);
            this.group.add(rootMesh);
        });

        // 2. Main Trunk: Graceful, slender Japanese Bonsai S-curve (Thân thon mượt, không bị thô dày)
        const trunkPts = [
            new THREE.Vector3(0, -2.2, 0),
            new THREE.Vector3(0.24, -1.3, 0.12),
            new THREE.Vector3(0.08, -0.3, -0.08),
            new THREE.Vector3(-0.18, 0.7, 0.04),
            new THREE.Vector3(-0.04, 1.6, 0.08),
            new THREE.Vector3(0.08, 2.2, -0.04)
        ];
        // Trunk starts at 0.32 radius and tapers gracefully to 0.15
        const trunkMesh = this.createTaperedBranchMesh(trunkPts, 0.32, 0.15, 12, 20);
        this.group.add(trunkMesh);

        // 3. Multi-level Elegant Sakura Boughs (Tán cành phân tầng thanh nhã)
        const boughs = [
            // Bough 1: Left flowing arch
            {
                pts: [
                    new THREE.Vector3(-0.12, 1.3, 0.06),
                    new THREE.Vector3(-0.9, 1.8, 0.4),
                    new THREE.Vector3(-1.8, 2.2, 0.3),
                    new THREE.Vector3(-2.8, 2.5, 0.1)
                ],
                r1: 0.15, r2: 0.04
            },
            // Bough 2: Right graceful bough
            {
                pts: [
                    new THREE.Vector3(0.04, 1.5, 0.04),
                    new THREE.Vector3(1.0, 1.9, -0.15),
                    new THREE.Vector3(1.9, 2.4, -0.05),
                    new THREE.Vector3(2.9, 2.6, 0.15)
                ],
                r1: 0.14, r2: 0.038
            },
            // Bough 3: High crowning bough
            {
                pts: [
                    new THREE.Vector3(0.08, 2.2, -0.04),
                    new THREE.Vector3(-0.15, 2.9, 0.15),
                    new THREE.Vector3(0.08, 3.7, 0.08),
                    new THREE.Vector3(0.18, 4.3, -0.08)
                ],
                r1: 0.13, r2: 0.03
            },
            // Bough 4: Front romantic drooping branch
            {
                pts: [
                    new THREE.Vector3(-0.04, 1.6, 0.08),
                    new THREE.Vector3(0.25, 2.1, 0.7),
                    new THREE.Vector3(0.15, 2.5, 1.4),
                    new THREE.Vector3(-0.15, 2.6, 1.8)
                ],
                r1: 0.12, r2: 0.032
            },
            // Bough 5: Left-Back depth branch
            {
                pts: [
                    new THREE.Vector3(-0.16, 1.8, -0.04),
                    new THREE.Vector3(-0.95, 2.4, -0.65),
                    new THREE.Vector3(-1.7, 3.0, -1.0)
                ],
                r1: 0.11, r2: 0.03
            },
            // Bough 6: Right-Back depth branch
            {
                pts: [
                    new THREE.Vector3(0.06, 1.9, -0.06),
                    new THREE.Vector3(0.85, 2.6, -0.75),
                    new THREE.Vector3(1.6, 3.2, -0.9)
                ],
                r1: 0.10, r2: 0.028
            }
        ];

        boughs.forEach(b => {
            const boughMesh = this.createTaperedBranchMesh(b.pts, b.r1, b.r2, 8, 14);
            this.group.add(boughMesh);

            // Fine twigs branching off gracefully
            const curve = new THREE.CatmullRomCurve3(b.pts);
            const twigCount = 3;
            for (let i = 1; i <= twigCount; i++) {
                const t = i / (twigCount + 1);
                const pt = curve.getPoint(t);
                const sideAngle = (i % 2 === 0 ? 1 : -1) * 0.85;

                const twigEnd = pt.clone().add(new THREE.Vector3(
                    Math.cos(sideAngle) * 0.85,
                    0.4 + Math.random() * 0.35,
                    Math.sin(sideAngle) * 0.85
                ));

                const twigMesh = this.createTaperedBranchMesh([pt, twigEnd], b.r1 * 0.45, 0.015, 6, 8);
                this.group.add(twigMesh);

                // Register clusters of flowers along and at the tips of twigs
                for (let k = 0; k < 5; k++) {
                    this.flowerPositions.push(twigEnd.clone().add(new THREE.Vector3(
                        (Math.random() - 0.5) * 0.8,
                        (Math.random() - 0.5) * 0.7,
                        (Math.random() - 0.5) * 0.8
                    )));
                }
            }

            // Tip flowers of main bough
            const tip = b.pts[b.pts.length - 1];
            for (let k = 0; k < 8; k++) {
                this.flowerPositions.push(tip.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.9,
                    (Math.random() - 0.5) * 0.8,
                    (Math.random() - 0.5) * 0.9
                )));
            }
        });
    }

    buildSakuraBlossoms() {
        const totalSpots = this.flowerPositions.length;
        const blossomCount = this.isMobile ? 650 : 1250;
        const budCount = this.isMobile ? 80 : 160;

        // 1. Authentic 5-Petal Sakura Blossoms (InstancedMesh with dish curvature & organic rotation)
        const flowerGeom = new THREE.PlaneGeometry(0.36, 0.36);
        this.flowerInstancedMesh = new THREE.InstancedMesh(flowerGeom, this.sakuraFlowerMaterial, blossomCount);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < blossomCount; i++) {
            const spot = this.flowerPositions[i % totalSpots];

            // Soft natural displacement around the cluster nodes
            dummy.position.set(
                spot.x + (Math.random() - 0.5) * 0.7,
                spot.y + (Math.random() - 0.5) * 0.65,
                spot.z + (Math.random() - 0.5) * 0.7
            );

            // Face outwards organically so blossoms look full and 3D from all angles
            dummy.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Natural petal size variation
            dummy.scale.setScalar(0.72 + Math.random() * 0.58);
            dummy.updateMatrix();

            this.flowerInstancedMesh.setMatrixAt(i, dummy.matrix);
        }
        this.flowerInstancedMesh.instanceMatrix.needsUpdate = true;
        this.group.add(this.flowerInstancedMesh);

        // 2. Delicate Cherry Blossom Buds (Nụ hoa anh đào hồng đào e ấp)
        const budGeom = new THREE.SphereGeometry(0.045, 6, 6);
        this.budMesh = new THREE.InstancedMesh(budGeom, this.budMaterial, budCount);

        for (let i = 0; i < budCount; i++) {
            const spot = this.flowerPositions[i % totalSpots];
            dummy.position.set(
                spot.x + (Math.random() - 0.5) * 0.5,
                spot.y + (Math.random() - 0.5) * 0.5 - 0.08,
                spot.z + (Math.random() - 0.5) * 0.5
            );
            dummy.scale.set(0.8, 1.3, 0.8);
            dummy.updateMatrix();
            this.budMesh.setMatrixAt(i, dummy.matrix);
        }
        this.budMesh.instanceMatrix.needsUpdate = true;
        this.group.add(this.budMesh);
    }

    // A few individual sakura petals drifting lazily down before interaction
    buildIdleDriftingPetals() {
        this.idlePetals = [];
        const count = 22;
        const geom = new THREE.PlaneGeometry(0.18, 0.24);

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geom, this.sakuraFlowerMaterial);
            mesh.position.set(
                (Math.random() - 0.5) * 5.0,
                0.5 + Math.random() * 3.5,
                (Math.random() - 0.5) * 4.0
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mesh.scale.setScalar(0.6 + Math.random() * 0.4);
            this.group.add(mesh);

            this.idlePetals.push({
                mesh: mesh,
                vy: 0.15 + Math.random() * 0.25,
                vx: -0.1 + Math.random() * 0.2,
                rotSpeed: 0.4 + Math.random() * 0.6,
                flutterPhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt) {
        this.time += dt;

        // Subtle, gentle wind sway across the canopy (Thơ mộng, không bị cứng hay giật)
        const swayZ = Math.sin(this.time * 1.1) * 0.016;
        const swayX = Math.cos(this.time * 0.85) * 0.012;
        this.group.rotation.z = swayZ;
        this.group.rotation.x = swayX;

        // Drifting idle sakura petals
        for (let i = 0; i < this.idlePetals.length; i++) {
            const p = this.idlePetals[i];
            p.flutterPhase += dt * 2.0;
            p.mesh.position.y -= p.vy * dt;
            p.mesh.position.x += (p.vx + Math.sin(p.flutterPhase) * 0.12) * dt;
            p.mesh.rotation.z += p.rotSpeed * dt;
            p.mesh.rotation.x += p.rotSpeed * 0.7 * dt;

            // Reset smoothly to top
            if (p.mesh.position.y < -2.1) {
                p.mesh.position.y = 4.2;
                p.mesh.position.x = (Math.random() - 0.5) * 5.0;
            }
        }
    }
}

window.FloweringTree = FloweringTree;

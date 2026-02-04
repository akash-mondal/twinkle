import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createTimeline, animate } from 'animejs';

export const ThreeHero = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        // User Theme: Pure White Background
        scene.background = new THREE.Color("#FFFFFF");

        const camera = new THREE.OrthographicCamera();
        camera.position.set(0, 0, 1000);
        camera.lookAt(0, 0, 0);
        camera.near = 1;
        camera.far = 2000;

        const cameraAnchor = new THREE.Group();
        cameraAnchor.name = "cameraAnchor";
        cameraAnchor.add(camera);
        scene.add(cameraAnchor);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // --- GRID / MESH LOGIC ---
        class Grid {
            gridProperties: any;
            cellProperties: any;
            thresholdMaps: any[];
            activeThresholdMapId: string;
            drawn = false;
            shown = false;
            group: THREE.Group | undefined;
            geometry: THREE.BoxGeometry | undefined;
            material: THREE.ShaderMaterial | undefined;
            instance: THREE.InstancedMesh | undefined;
            attributes: any;

            constructor(gridProperties: any) {
                this.gridProperties = gridProperties;
                
                this.thresholdMaps = [
                    {
                        id: "voidAndCluster",
                        name: "Void and Cluster",
                        data: [
                            131, 187, 8, 78, 50, 18, 134, 89, 155, 102, 29, 95, 184, 73,
                            22, 86, 113, 171, 142, 105, 34, 166, 9, 60, 151, 128, 40, 110,
                            168, 137, 45, 28, 64, 188, 82, 54, 124, 189, 80, 13, 156, 56,
                            7, 61, 186, 121, 154, 6, 108, 177, 24, 100, 38, 176, 93, 123,
                            83, 148, 96, 17, 88, 133, 44, 145, 69, 161, 139, 72, 30, 181,
                            115, 27, 163, 47, 178, 65, 164, 14, 120, 48, 5, 127, 153, 52,
                            190, 58, 126, 81, 116, 21, 106, 77, 173, 92, 191, 63, 99, 12,
                            76, 144, 4, 185, 37, 149, 192, 39, 135, 23, 117, 31, 170, 132,
                            35, 172, 103, 66, 129, 79, 3, 97, 57, 159, 70, 141, 53, 94,
                            114, 20, 49, 158, 19, 146, 169, 122, 183, 11, 104, 180, 2, 165,
                            152, 87, 182, 118, 91, 42, 67, 25, 84, 147, 43, 85, 125, 68,
                            16, 136, 71, 10, 193, 112, 160, 138, 51, 111, 162, 26, 194, 46,
                            174, 107, 41, 143, 33, 74, 1, 101, 195, 15, 75, 140, 109, 90,
                            32, 62, 157, 98, 167, 119, 179, 59, 36, 130, 175, 55, 0, 150
                        ]
                    }
                ];
                
                this.activeThresholdMapId = this.gridProperties.activeThresholdMapId || this.thresholdMaps[0].id;
                this.cellProperties = this.calculateCellProperties(gridProperties);
            }

            calculateCellProperties(gridProperties: any) {
                const rows = gridProperties.rows || 1;
                const columns = gridProperties.columns || 1;
                const cellSize = gridProperties.cellSize || 1;
                const cellThickness = gridProperties.cellThickness || cellSize;
                const spacing = gridProperties.spacing || 1;
                const objectCount = rows * columns;
                const properties = new Array(objectCount);

                const positions = (i: number, rows: number, columns: number) => {
                    const row = Math.floor(i / columns);
                    const column = i % columns;
                    const x = (column - (columns - 1) / 2) * spacing;
                    const y = (-row + (rows - 1) / 2) * spacing;
                    return { x, y, z: 0, row, column };
                };

                for (let i = 0; i < objectCount; i++) {
                    const { x, y, z, row, column } = positions(i, rows, columns);
                    properties[i] = { id: i, x, y, z, row, column, cellSize, cellThickness };
                }
                return properties;
            }

            calculateAttributes() {
                const calculateThreshold = (row: number, column: number, matrixConfig: any) => {
                    const { data } = matrixConfig;
                    const size = Math.sqrt(data.length);
                    const scale = data.length;
                    const matrixRow = row % size;
                    const matrixColumn = column % size;
                    const index = matrixColumn + matrixRow * size;
                    return data[index] / scale;
                };

                const count = this.cellProperties.length;
                const rowArray = new Float32Array(count);
                const columnArray = new Float32Array(count);
                const thresholdArrays: any = {};
                this.thresholdMaps.forEach(config => {
                    thresholdArrays[config.id] = new Float32Array(count);
                });

                for (let i = 0; i < count; i++) {
                    const { row, column } = this.cellProperties[i];
                    rowArray[i] = row;
                    columnArray[i] = column;
                    this.thresholdMaps.forEach(config => {
                        thresholdArrays[config.id][i] = calculateThreshold(row, column, config);
                    });
                }

                const attributes: any = {};
                attributes.aRow = new THREE.InstancedBufferAttribute(rowArray, 1);
                attributes.aColumn = new THREE.InstancedBufferAttribute(columnArray, 1);
                this.thresholdMaps.forEach(config => {
                    attributes[config.id] = new THREE.InstancedBufferAttribute(thresholdArrays[config.id], 1);
                });
                return attributes;
            }

            init() {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const attributes = this.calculateAttributes();

                geometry.setAttribute("aRow", attributes.aRow);
                geometry.setAttribute("aColumn", attributes.aColumn);
                geometry.setAttribute("aThreshold", attributes[this.activeThresholdMapId]);

                const simplexNoise = `
                    // Simplex Noise GLSL
                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec3 permute(vec3 x) { return mod289(((x*34.0)+10.0)*x); }
                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i = floor(v + dot(v, C.yy));
                        vec2 x0 = v - i + dot(i, C.xx);
                        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec4 x12 = x0.xyxy + C.xxzz;
                        x12.xy -= i1;
                        i = mod289(i);
                        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                        m = m*m; m = m*m;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                        vec3 g;
                        g.x = a0.x * x0.x + h.x * x0.y;
                        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                        return 130.0 * dot(m, g);
                    }
                `;

                const vertexShader = `
                    uniform float uRowSize;
                    uniform float uColumnSize;
                    uniform float uDitherProgress;
                    uniform float uGridOffsetStart;
                    uniform float uGridOffsetEnd;
                    uniform sampler2D uTexture;

                    attribute float aRow;
                    attribute float aColumn;
                    attribute float aThreshold;

                    varying vec3 vColor;
                    varying vec3 vNormal;
                    
                    ${simplexNoise}

                    void main() {
                        vec2 st = vec2(aColumn, uRowSize - 1.0 - aRow) / vec2(uColumnSize - 1.0, uRowSize - 1.0);
                        float bayerThreshold = aThreshold;
                        float rowId = aRow / uRowSize;
                        float columnId = aColumn / uColumnSize;

                        vec4 textureColor = texture2D(uTexture, st);
                        float initialColor = 0.0;
                        float targetColor = textureColor.r; 
                        
                        float borderWidth = 2.0;

                        float cellDelayIndex = snoise(vec2(rowId, columnId) * 80.7);
                        cellDelayIndex = smoothstep(-1.0, 1.0, cellDelayIndex);
                        
                        float animationDuration = 0.15;
                        float animationDelay = cellDelayIndex * (1.0 - animationDuration);
                        float animationEnd = animationDelay + animationDuration;
                        float animationProgress = smoothstep(animationDelay, animationEnd, uDitherProgress);

                        float ditheredColor = step(bayerThreshold, targetColor);
                        float ditherProgress = smoothstep(0.0, 1.0, animationProgress); 
                        float finalColor = mix(initialColor, ditheredColor, ditherProgress);
                        
                        float isBorder = clamp(
                            step(aColumn + 0.1, borderWidth) + 
                            step(uColumnSize - borderWidth, aColumn) + 
                            step(aRow + 0.1, borderWidth) + 
                            step(uRowSize - borderWidth, aRow), 
                        0.0, 1.0);
                        
                        // Borders are background
                        finalColor *= (1.0 - isBorder);
                        
                        float cellOffsetProgress = finalColor;
                        float cellOffset = mix(uGridOffsetStart, uGridOffsetEnd, cellOffsetProgress);
                        
                        // Apply border mask again
                        finalColor *= (1.0 - isBorder);

                        vec4 cellLocalPosition = vec4(position, 1.0);
                        vec4 cellPosition = modelMatrix * instanceMatrix * cellLocalPosition;
                        cellPosition.z += cellOffset;

                        vec4 modelNormal = modelMatrix * instanceMatrix * vec4(normal, 0.0);

                        gl_Position = projectionMatrix * viewMatrix * cellPosition;
                        vColor = vec3(finalColor);
                        vNormal = normalize(modelNormal.xyz);
                    }
                `;

                // -- FIXED FRAGMENT SHADER --
                const fragmentShader = `
                    varying vec3 vColor;
                    varying vec3 vNormal;

                    void main() {
                        float shadow = dot(normalize(vec3(0.0, 1.0, 1.0)), normalize(vNormal));
                        
                        vec3 colorBg = vec3(1.0, 1.0, 1.0); // #FFFFFF Pure White
                        vec3 colorFg = vec3(0.04, 0.04, 0.04); // #0A0A0A Black
                        
                        // Sharpen the transition so blocks turn black quickly as they rise
                        float mixFactor = smoothstep(0.0, 0.2, vColor.r);
                        vec3 baseColor = mix(colorBg, colorFg, mixFactor);
                        
                        vec3 finalColor;
                        if (vColor.r > 0.1) {
                             // Active Block - Apply lighting
                             finalColor = baseColor * (0.9 + 0.4 * shadow);
                        } else {
                             // Background - Flat White
                             finalColor = baseColor;
                        }

                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `;

                const material = new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,
                    uniforms: {
                        uRowSize: { value: this.gridProperties.rows || 1 },
                        uColumnSize: { value: this.gridProperties.columns || 1 },
                        uGridOffsetStart: { value: 0 },
                        uGridOffsetEnd: { value: 0 },
                        uTexture: { value: null },
                        uDitherProgress: { value: 0 }
                    }
                });

                // Load MNEE Logo
                if (this.gridProperties.image) {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(
                        this.gridProperties.image,
                        (texture) => {
                            texture.colorSpace = THREE.SRGBColorSpace;
                            material.uniforms.uTexture.value = texture;
                            material.needsUpdate = true;
                        }
                    );
                }

                const mesh = new THREE.InstancedMesh(geometry, material, this.cellProperties.length);
                const group = new THREE.Group();
                group.add(mesh);

                this.group = group;
                this.material = material;
                this.instance = mesh;
                this.attributes = attributes;

                // Update Cell Position and Size
                const dummy = new THREE.Object3D();
                for (let i = 0; i < this.cellProperties.length; i++) {
                    const { x, y, z, cellSize, cellThickness } = this.cellProperties[i];
                    dummy.position.set(x, y, z);
                    dummy.scale.set(cellSize, cellSize, cellThickness);
                    dummy.updateMatrix();
                    this.instance.setMatrixAt(i, dummy.matrix);
                }
                this.instance.instanceMatrix.needsUpdate = true;
                this.drawn = true;
            }

            showAt(scene: THREE.Scene) {
                if (!this.drawn) this.init();
                if (!this.shown && this.group) {
                    scene.add(this.group);
                    this.shown = true;
                }
            }
        }

        // --- INIT OBJECTS ---
        const imageGrid = new Grid({
            name: "image-grid",
            rows: 400,
            columns: 400,
            cellSize: 1,
            cellThickness: 0.5,
            spacing: 1,
            gridType: 1,
            image: '/logos/mnee.svg',
            activeThresholdMapId: "voidAndCluster"
        });
        imageGrid.showAt(scene);

        // --- ANIMATION TIMELINE ---
        
        // Initial Camera State
        camera.zoom = 70;
        camera.updateProjectionMatrix();
        cameraAnchor.position.set(180, 0, 0);
        cameraAnchor.rotation.order = "ZXY";
        cameraAnchor.rotation.z = Math.PI * 0.25;
        cameraAnchor.rotation.x = Math.PI * 0.35;
        
        if (imageGrid.material) {
            imageGrid.material.uniforms.uDitherProgress.value = 0.04;
            imageGrid.material.uniforms.uGridOffsetStart.value = 0;
            imageGrid.material.uniforms.uGridOffsetEnd.value = 0.35;
        }

        // Anime.js Timeline - Use V4 Syntax 
        const tl = createTimeline({
            loop: true,
            alternate: true,
            duration: 14000,
        });

        // 1. Dither Progress
        if (imageGrid.material) {
            const ditherAnim = animate(imageGrid.material.uniforms.uDitherProgress, {
                value: 1, // To 1
                duration: 10000,
                ease: 'linear'
            });
            tl.sync(ditherAnim, 0);
        }

        // 2. Camera Rotation
        const rotAnim = animate(cameraAnchor.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 14000,
            ease: 'inOutSine'
        });
        tl.sync(rotAnim, 0);

        // 3. Camera Zoom
        const zoomAnim = animate(camera, {
            zoom: 0.9,
            duration: 14000,
            ease: 'inOutSine',
            onUpdate: () => camera.updateProjectionMatrix()
        });
        tl.sync(zoomAnim, 0);

        // 4. Panning (Starts at 9000ms)
        const panAnim = animate(cameraAnchor.position, {
            x: 0,
            duration: 5000,
            ease: 'inOutCubic'
        });
        tl.sync(panAnim, 9000); // Sync at 9000ms


        // --- RENDER LOOP ---
        let frameId: number;
        const animateLoop = () => {
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animateLoop);
        };
        animateLoop();

        // --- RESIZE ---
        const handleResize = () => {
            if (!canvasRef.current) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const boundingBoxSize = 400;
            const aspectRatio = width / height;

            if (aspectRatio < 1) {
                camera.left = -boundingBoxSize / 2;
                camera.right = boundingBoxSize / 2;
                camera.top = boundingBoxSize / 2 / aspectRatio;
                camera.bottom = -boundingBoxSize / 2 / aspectRatio;
            } else {
                camera.left = (-boundingBoxSize / 2) * aspectRatio;
                camera.right = (boundingBoxSize / 2) * aspectRatio;
                camera.top = boundingBoxSize / 2;
                camera.bottom = -boundingBoxSize / 2;
            }
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            renderer.dispose();
            tl.pause();
            tl.revert();
        };

    }, []);

    return <canvas ref={canvasRef} className="webgl" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

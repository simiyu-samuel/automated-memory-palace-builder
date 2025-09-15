import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function PalaceRenderer({ rooms = [], memories = [], onObjectClick = null }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const frameId = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!mountRef.current) return;

        try {
            initThreeJS();
            setIsLoading(false);
        } catch (err) {
            setError('Failed to initialize 3D renderer: ' + err.message);
            setIsLoading(false);
        }

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (sceneRef.current && rooms.length > 0) {
            renderRooms();
        }
    }, [rooms]);

    useEffect(() => {
        if (sceneRef.current && memories.length > 0) {
            renderMemories();
        }
    }, [memories]);

    const initThreeJS = () => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 8, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        addLighting();

        // Controls
        addControls();

        // Default scene content
        createDefaultScene();

        // Start render loop
        animate();

        // Handle resize
        window.addEventListener('resize', handleResize);
    };

    const addLighting = () => {
        const scene = sceneRef.current;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        // Main directional light (like sunlight)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        scene.add(mainLight);

        // Magical palace lights
        const palaceLight1 = new THREE.PointLight(0x7c3aed, 0.8, 20);
        palaceLight1.position.set(-5, 5, 5);
        scene.add(palaceLight1);

        const palaceLight2 = new THREE.PointLight(0xfbbf24, 0.8, 20);
        palaceLight2.position.set(5, 5, -5);
        scene.add(palaceLight2);

        // Add light helpers (debug mode)
        if (import.meta.env.DEV) {
            const helper = new THREE.DirectionalLightHelper(mainLight, 5);
            scene.add(helper);
        }
    };

    const addControls = () => {
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onMouseDown = (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseMove = (event) => {
            if (!isDragging) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            // Rotate camera around the scene
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            
            spherical.theta -= deltaMove.x * 0.01;
            spherical.phi += deltaMove.y * 0.01;
            
            // Limit vertical rotation
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onWheel = (event) => {
            event.preventDefault();
            const scale = event.deltaY * 0.001;
            camera.position.multiplyScalar(1 + scale);
            
            // Limit zoom
            const distance = camera.position.length();
            if (distance < 5) {
                camera.position.normalize().multiplyScalar(5);
            } else if (distance > 50) {
                camera.position.normalize().multiplyScalar(50);
            }
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // Touch controls for mobile
        let lastTouchDistance = 0;
        
        const onTouchStart = (event) => {
            if (event.touches.length === 1) {
                previousMousePosition = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            } else if (event.touches.length === 2) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                const deltaMove = {
                    x: event.touches[0].clientX - previousMousePosition.x,
                    y: event.touches[0].clientY - previousMousePosition.y
                };

                const spherical = new THREE.Spherical();
                spherical.setFromVector3(camera.position);
                
                spherical.theta -= deltaMove.x * 0.01;
                spherical.phi += deltaMove.y * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

                camera.position.setFromSpherical(spherical);
                camera.lookAt(0, 0, 0);

                previousMousePosition = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            } else if (event.touches.length === 2) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const scale = (lastTouchDistance - distance) * 0.01;
                camera.position.multiplyScalar(1 + scale);
                
                const cameraDistance = camera.position.length();
                if (cameraDistance < 5) {
                    camera.position.normalize().multiplyScalar(5);
                } else if (cameraDistance > 50) {
                    camera.position.normalize().multiplyScalar(50);
                }
                
                lastTouchDistance = distance;
            }
        };

        renderer.domElement.addEventListener('touchstart', onTouchStart);
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    };

    const createDefaultScene = () => {
        const scene = sceneRef.current;

        // Create a simple ground plane
        const groundGeometry = new THREE.PlaneGeometry(40, 40);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Add some default geometric shapes as placeholder palace elements
        if (rooms.length === 0) {
            createPlaceholderPalace();
        }
    };

    const createPlaceholderPalace = () => {
        const scene = sceneRef.current;

        // Central tower
        const towerGeometry = new THREE.CylinderGeometry(2, 3, 8, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0, 4, 0);
        tower.castShadow = true;
        scene.add(tower);

        // Side buildings
        const buildingGeometry = new THREE.BoxGeometry(4, 6, 4);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
        
        const building1 = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building1.position.set(-8, 3, 0);
        building1.castShadow = true;
        scene.add(building1);

        const building2 = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building2.position.set(8, 3, 0);
        building2.castShadow = true;
        scene.add(building2);

        // Add some magical particles
        createMagicalParticles();
    };

    const createMagicalParticles = () => {
        const scene = sceneRef.current;
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 10 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xfbbf24,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
    };

    const renderRooms = () => {
        // Implementation for rendering rooms from data
        console.log('Rendering rooms:', rooms);
    };

    const renderMemories = () => {
        // Implementation for rendering memory objects
        console.log('Rendering memories:', memories);
    };

    const animate = () => {
        frameId.current = requestAnimationFrame(animate);

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            // Add some animation to particles or other elements
            const time = Date.now() * 0.001;
            
            // Animate palace lights
            sceneRef.current.traverse((child) => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 0.8 + Math.sin(time * 2) * 0.2;
                }
            });

            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };

    const handleResize = () => {
        if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();

        rendererRef.current.setSize(width, height);
    };

    const cleanup = () => {
        if (frameId.current) {
            cancelAnimationFrame(frameId.current);
        }

        if (rendererRef.current && mountRef.current) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }

        if (sceneRef.current) {
            sceneRef.current.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        window.removeEventListener('resize', handleResize);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-400 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <div className="text-xl mb-2">3D Render Error</div>
                    <div className="text-sm opacity-60">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-center">
                        <div className="loading-spinner mx-auto mb-4"></div>
                        <div className="text-white">Loading Palace...</div>
                    </div>
                </div>
            )}
            <div 
                ref={mountRef} 
                className="three-canvas w-full h-full"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
}

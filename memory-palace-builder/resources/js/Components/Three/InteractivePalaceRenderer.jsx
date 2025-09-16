import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function InteractivePalaceRenderer({ rooms = [], memories = [], onObjectClick = null, onRoomChange = null }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const frameId = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredObject, setHoveredObject] = useState(null);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [filteredMemories, setFilteredMemories] = useState(memories);
    const interactiveObjects = useRef([]);
    const roomObjects = useRef([]);

    useEffect(() => {
        if (!mountRef.current) return;
        initThreeJS();
        setIsLoading(false);
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (sceneRef.current && memories.length > 0) {
            filterMemoriesByRoom();
            renderInteractiveMemories();
        }
    }, [memories, currentRoom]);

    const filterMemoriesByRoom = () => {
        if (!currentRoom) {
            setFilteredMemories(memories);
        } else {
            const filtered = memories.filter(memory => {
                const memoryRoomId = memory.palace_room_id || memory.memory?.palace_room_id;
                return memoryRoomId === currentRoom.id;
            });
            setFilteredMemories(filtered);
        }
    };

    const initThreeJS = () => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene with atmospheric effects
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f0f23);
        scene.fog = new THREE.FogExp2(0x0f0f23, 0.02);
        sceneRef.current = scene;

        // Camera with cinematic feel - Adjusted for mobile responsiveness
        const isMobile = width < 768; // Assuming 768px as a common mobile breakpoint
        const fov = isMobile ? 70 : 60; // Slightly wider FOV for mobile
        const initialCameraZ = isMobile ? 15 : 20; // Closer initial position for mobile

        const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
        camera.position.set(0, 10, initialCameraZ); // Adjusted Y position for better view
        camera.lookAt(0, 2, 0); // Look slightly above the ground
        cameraRef.current = camera;

        // Enhanced renderer
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
        renderer.toneMappingExposure = 1.5;
        renderer.outputEncoding = THREE.sRGBEncoding;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Enhanced lighting
        addCinematicLighting();
        
        // Interactive controls
        addInteractiveControls();
        
        // Room interaction
        addRoomInteraction();
        
        // Create palace environment
        createPalaceEnvironment();
        
        // Start render loop
        animate();
        
        window.addEventListener('resize', handleResize);
    };

    const addCinematicLighting = () => {
        const scene = sceneRef.current;

        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
        scene.add(ambientLight);

        // Main directional light (moonlight)
        const moonLight = new THREE.DirectionalLight(0xb8c5ff, 1.2);
        moonLight.position.set(15, 25, 10);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 4096;
        moonLight.shadow.mapSize.height = 4096;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 100;
        moonLight.shadow.camera.left = -30;
        moonLight.shadow.camera.right = 30;
        moonLight.shadow.camera.top = 30;
        moonLight.shadow.camera.bottom = -30;
        moonLight.shadow.bias = -0.0001;
        scene.add(moonLight);

        // Magical palace lights
        const colors = [0x7c3aed, 0xfbbf24, 0x10b981, 0xef4444, 0x3b82f6];
        for (let i = 0; i < 5; i++) {
            const light = new THREE.PointLight(colors[i], 1.5, 25);
            const angle = (i / 5) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 12,
                8 + Math.sin(i) * 2,
                Math.sin(angle) * 12
            );
            light.castShadow = true;
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            scene.add(light);
        }

        // Rim lighting
        const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.8);
        rimLight.position.set(-10, 5, -10);
        scene.add(rimLight);
    };

    const addInteractiveControls = () => {
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onMouseDown = (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseMove = (event) => {
            // Update mouse position for raycasting
            const rect = renderer.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (!isDragging) {
                // Handle hover effects
                handleMouseHover();
                return;
            }

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            // Smooth camera rotation - Adjusted sensitivity for mobile
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            
            const rotationSensitivity = isMobile ? 0.012 : 0.008; // Increased sensitivity for mobile
            spherical.theta -= deltaMove.x * rotationSensitivity;
            spherical.phi += deltaMove.y * rotationSensitivity;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 2, 0);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onClick = (event) => {
            if (isDragging) return;
            handleObjectClick();
        };

        const onWheel = (event) => {
            event.preventDefault();
            const zoomSensitivity = isMobile ? 0.002 : 0.001; // Increased sensitivity for mobile
            const scale = event.deltaY * zoomSensitivity;
            camera.position.multiplyScalar(1 + scale);
            
            const distance = camera.position.length();
            const minDistance = isMobile ? 6 : 8; // Closer min zoom for mobile
            const maxDistance = isMobile ? 40 : 60; // Closer max zoom for mobile

            if (distance < minDistance) {
                camera.position.normalize().multiplyScalar(minDistance);
            } else if (distance > maxDistance) {
                camera.position.normalize().multiplyScalar(maxDistance);
            }
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        renderer.domElement.style.cursor = 'grab';

        // Touch controls for mobile
        let lastTouchDistance = 0;
        
        const onTouchStart = (event) => {
            if (event.touches.length === 1) {
                isDragging = true;
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
                
                const rotationSensitivity = isMobile ? 0.012 : 0.008; // Increased sensitivity for mobile
                spherical.theta -= deltaMove.x * rotationSensitivity;
                spherical.phi += deltaMove.y * rotationSensitivity;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

                camera.position.setFromSpherical(spherical);
                camera.lookAt(0, 2, 0);

                previousMousePosition = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            } else if (event.touches.length === 2) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const zoomSensitivity = isMobile ? 0.015 : 0.01; // Increased sensitivity for mobile
                const scale = (lastTouchDistance - distance) * zoomSensitivity;
                camera.position.multiplyScalar(1 + scale);
                
                const cameraDistance = camera.position.length();
                const minDistance = isMobile ? 6 : 8; // Closer min zoom for mobile
                const maxDistance = isMobile ? 40 : 60; // Closer max zoom for mobile

                if (cameraDistance < minDistance) {
                    camera.position.normalize().multiplyScalar(minDistance);
                } else if (cameraDistance > maxDistance) {
                    camera.position.normalize().multiplyScalar(maxDistance);
                }
                
                lastTouchDistance = distance;
            }
        };

        const onTouchEnd = () => {
            isDragging = false;
        };

        renderer.domElement.addEventListener('touchstart', onTouchStart);
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd);
    };

    const addRoomInteraction = () => {
        // Room interaction is handled in the main click handler
        // Room objects are added to roomObjects.current array
    };

    const handleMouseHover = () => {
        const raycaster = raycasterRef.current;
        const camera = cameraRef.current;
        
        raycaster.setFromCamera(mouseRef.current, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects.current);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (hoveredObject !== object) {
                // Reset previous hovered object
                if (hoveredObject) {
                    hoveredObject.scale.setScalar(1);
                    hoveredObject.material.emissive.setHex(0x000000);
                }
                
                // Highlight new hovered object
                object.scale.setScalar(1.2);
                object.material.emissive.setHex(0x444444);
                setHoveredObject(object);
                rendererRef.current.domElement.style.cursor = 'pointer';
            }
        } else {
            if (hoveredObject) {
                hoveredObject.scale.setScalar(1);
                hoveredObject.material.emissive.setHex(0x000000);
                setHoveredObject(null);
                rendererRef.current.domElement.style.cursor = 'grab';
            }
        }
    };

    const handleObjectClick = () => {
        const raycaster = raycasterRef.current;
        const camera = cameraRef.current;
        
        raycaster.setFromCamera(mouseRef.current, camera);
        
        // Check room objects first
        const roomIntersects = raycaster.intersectObjects(roomObjects.current);
        if (roomIntersects.length > 0) {
            const roomObject = roomIntersects[0].object;
            const roomData = roomObject.userData.room;
            
            if (roomData) {
                setCurrentRoom(roomData);
                if (onRoomChange) {
                    onRoomChange(roomData);
                }
                
                // Animate room selection
                roomObject.scale.setScalar(1.2);
                setTimeout(() => {
                    roomObject.scale.setScalar(1);
                }, 300);
                
                return;
            }
        }
        
        // Check memory objects
        const memoryIntersects = raycaster.intersectObjects(interactiveObjects.current);
        if (memoryIntersects.length > 0) {
            const object = memoryIntersects[0].object;
            const memoryData = object.userData.memory;
            
            if (memoryData) {
                setSelectedMemory(memoryData);
                if (onObjectClick) {
                    onObjectClick(memoryData);
                }
                
                // Animate click effect
                object.scale.setScalar(1.5);
                setTimeout(() => {
                    object.scale.setScalar(1);
                }, 200);
            }
        }
    };

    const createPalaceEnvironment = () => {
        const scene = sceneRef.current;

        // Enhanced ground with texture
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.9
        });
        
        // Add some noise to ground vertices for organic feel
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setZ(i, Math.random() * 0.5);
        }
        positions.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Palace architecture
        createPalaceStructure();
        
        // Atmospheric particles
        createAtmosphericEffects();
        
        // Floating platforms for memories
        createMemoryPlatforms();
    };

    const createPalaceStructure = () => {
        const scene = sceneRef.current;

        // Central spire
        const spireGeometry = new THREE.ConeGeometry(3, 20, 8);
        const spireMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4a5568,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0, 10, 0);
        spire.castShadow = true;
        scene.add(spire);

        // Floating rings around spire
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(8 + i * 2, 0.5, 8, 16);
            const ringMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x7c3aed,
                transparent: true,
                opacity: 0.6,
                emissive: 0x7c3aed,
                emissiveIntensity: 0.2
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(0, 5 + i * 3, 0);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
        }

        // Memory chambers (rooms)
        const roomPositions = [
            { x: -15, z: 0, color: 0x3b82f6, name: 'Work Space' },
            { x: 15, z: 0, color: 0x10b981, name: 'Personal Space' },
            { x: 0, z: -15, color: 0xfbbf24, name: 'Creative Space' },
            { x: 0, z: 15, color: 0xef4444, name: 'Archive Space' }
        ];

        roomPositions.forEach(room => {
            const chamberGeometry = new THREE.CylinderGeometry(4, 5, 8, 6);
            const chamberMaterial = new THREE.MeshPhongMaterial({ 
                color: room.color,
                transparent: true,
                opacity: currentRoom?.name === room.name ? 0.9 : 0.7,
                emissive: room.color,
                emissiveIntensity: currentRoom?.name === room.name ? 0.3 : 0.1
            });
            const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
            chamber.position.set(room.x, 4, room.z);
            chamber.castShadow = true;
            chamber.receiveShadow = true;
            
            // Store room data for interaction
            chamber.userData.room = { name: room.name, id: room.name.toLowerCase().replace(' ', '_') };
            
            scene.add(chamber);
            roomObjects.current.push(chamber);

            // Room label
            createTextLabel(room.name, room.x, 9, room.z);
        });
    };

    const createTextLabel = (text, x, y, z) => {
        // Create a simple text representation using geometry
        const textGeometry = new THREE.PlaneGeometry(4, 1);
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(x, y, z);
        textMesh.lookAt(cameraRef.current.position);
        sceneRef.current.add(textMesh);
    };

    const createAtmosphericEffects = () => {
        const scene = sceneRef.current;
        
        // Floating magical particles
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 20 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.7, 0.6);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
    };

    const createMemoryPlatforms = () => {
        const scene = sceneRef.current;
        
        // Create floating platforms for different memory types
        const platformPositions = [
            { x: -12, y: 2, z: -3, type: 'email' },
            { x: -8, y: 3, z: 3, type: 'email' },
            { x: 12, y: 2, z: -3, type: 'music' },
            { x: 8, y: 3, z: 3, type: 'photo' },
            { x: -3, y: 2, z: -12, type: 'event' },
            { x: 3, y: 3, z: -8, type: 'location' }
        ];

        platformPositions.forEach(platform => {
            const platformGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 8);
            const platformMaterial = new THREE.MeshPhongMaterial({ 
                color: getTypeColor(platform.type),
                transparent: true,
                opacity: 0.8,
                emissive: getTypeColor(platform.type),
                emissiveIntensity: 0.1
            });
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            platformMesh.position.set(platform.x, platform.y, platform.z);
            platformMesh.castShadow = true;
            scene.add(platformMesh);
        });
    };

    const renderInteractiveMemories = () => {
        const scene = sceneRef.current;
        
        // Clear existing interactive objects
        interactiveObjects.current.forEach(obj => {
            scene.remove(obj);
        });
        interactiveObjects.current = [];

        filteredMemories.forEach((memory, index) => {
            const memoryObject = createMemoryVisualization(memory, index);
            if (memoryObject) {
                scene.add(memoryObject);
                interactiveObjects.current.push(memoryObject);
            }
        });
    };

    const createMemoryVisualization = (memory, index) => {
        const type = memory.memory?.type || memory.object_type || 'default';
        
        // Position memories in appropriate room areas
        let basePosition = { x: 0, y: 2, z: 0 };
        if (currentRoom) {
            const roomPositions = {
                'work_space': { x: -15, z: 0 },
                'personal_space': { x: 15, z: 0 },
                'creative_space': { x: 0, z: -15 },
                'archive_space': { x: 0, z: 15 }
            };
            const roomKey = currentRoom.name.toLowerCase().replace(' ', '_');
            basePosition = roomPositions[roomKey] || basePosition;
        }
        
        const position = memory.position || { 
            x: basePosition.x + (Math.random() - 0.5) * 8, 
            y: 2 + Math.random() * 3, 
            z: basePosition.z + (Math.random() - 0.5) * 8 
        };

        let geometry, material;

        switch (type) {
            case 'email':
                geometry = new THREE.BoxGeometry(2, 1.5, 0.2);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x3b82f6,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0x1e40af,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'music':
                geometry = new THREE.SphereGeometry(1, 16, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x10b981,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0x059669,
                    emissiveIntensity: 0.3
                });
                break;
                
            case 'photo':
                geometry = new THREE.PlaneGeometry(2, 1.5);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xfbbf24,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0xd97706,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'event':
                geometry = new THREE.ConeGeometry(1, 2, 6);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xef4444,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0xdc2626,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'location':
                geometry = new THREE.OctahedronGeometry(1.2);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x8b5cf6,
                    transparent: true,
                    opacity: 0.9,
                    emissive: 0x7c3aed,
                    emissiveIntensity: 0.3
                });
                break;
                
            default:
                geometry = new THREE.IcosahedronGeometry(1);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x6b7280,
                    transparent: true,
                    opacity: 0.9
                });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store memory data for interaction
        mesh.userData.memory = memory;
        mesh.userData.type = type;
        
        // Add floating animation
        mesh.userData.originalY = position.y;
        mesh.userData.floatOffset = Math.random() * Math.PI * 2;

        return mesh;
    };

    const getTypeColor = (type) => {
        const colors = {
            email: 0x3b82f6,
            music: 0x10b981,
            photo: 0xfbbf24,
            event: 0xef4444,
            location: 0x8b5cf6,
            default: 0x6b7280
        };
        return colors[type] || colors.default;
    };

    const animate = () => {
        frameId.current = requestAnimationFrame(animate);

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            const time = Date.now() * 0.001;
            
            // Animate floating memory objects
            interactiveObjects.current.forEach(obj => {
                if (obj.userData.originalY !== undefined) {
                    obj.position.y = obj.userData.originalY + Math.sin(time + obj.userData.floatOffset) * 0.3;
                    obj.rotation.y += 0.01;
                }
            });
            
            // Animate palace lights
            sceneRef.current.traverse((child) => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 1.5 + Math.sin(time * 2 + child.position.x) * 0.3;
                }
                if (child.material && child.material.emissive) {
                    const intensity = 0.2 + Math.sin(time * 3) * 0.1;
                    child.material.emissiveIntensity = intensity;
                }
            });

            // Animate particles
            sceneRef.current.traverse((child) => {
                if (child instanceof THREE.Points) {
                    child.rotation.y += 0.002;
                    const positions = child.geometry.attributes.position.array;
                    for (let i = 1; i < positions.length; i += 3) {
                        positions[i] += Math.sin(time + i) * 0.01;
                    }
                    child.geometry.attributes.position.needsUpdate = true;
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
        window.removeEventListener('resize', handleResize);
    };

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                        <div className="text-white text-lg">Building Your Memory Palace...</div>
                    </div>
                </div>
            )}
            
            <div 
                ref={mountRef} 
                className="three-canvas w-full h-80 md:h-full"
            />
            
            {/* Memory Detail Modal */}
            {selectedMemory && (
                <div className="absolute inset-x-4 top-4 sm:top-4 sm:right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm z-20 max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <button 
                        onClick={() => setSelectedMemory(null)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                    <h3 className="font-bold text-lg mb-2">{selectedMemory.title || selectedMemory.memory?.title}</h3>
                    <p className="text-sm text-gray-300 mb-2">
                        Type: {selectedMemory.memory?.type || selectedMemory.object_type}
                    </p>
                    <p className="text-sm">
                        {selectedMemory.description || selectedMemory.memory?.content?.substring(0, 150) + '...'}
                    </p>
                </div>
            )}
            
            {/* Controls Help */}
            <div className="absolute inset-x-4 bottom-4 sm:bottom-4 sm:left-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg text-sm z-20">
                <div className="font-semibold mb-1">🎮 Controls:</div>
                <div>🖱️ Drag to rotate • 🎯 Click objects to view • 🔍 Scroll to zoom</div>
            </div>
        </div>
    );
}

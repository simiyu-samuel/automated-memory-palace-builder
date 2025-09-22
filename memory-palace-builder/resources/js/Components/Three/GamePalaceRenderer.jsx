import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GamePalaceRenderer({ rooms = [], memories = [], onObjectClick = null }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const characterRef = useRef(null);
    const frameId = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const keysRef = useRef({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [currentRoom, setCurrentRoom] = useState('Living Room');
    const [characterPosition, setCharacterPosition] = useState({ x: 0, z: 0 });
    const [cameraMode, setCameraMode] = useState('follow'); // 'follow', 'free', 'top', 'first-person'
    const [hoveredObject, setHoveredObject] = useState(null);
    const interactiveObjects = useRef([]);
    const roomBounds = useRef({});
    const isDragging = useRef(false);
    const previousMouse = useRef({ x: 0, y: 0 });
    const cameraOffset = useRef({ x: 0, y: 15, z: 20 });
    const cameraRotation = useRef({ horizontal: 0, vertical: 0 });

    useEffect(() => {
        if (!mountRef.current) return;
        initGameWorld();
        setIsLoading(false);
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (sceneRef.current && memories.length > 0) {
            renderMemoriesInRooms();
        }
    }, [memories]);

    const initGameWorld = () => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue
        scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        sceneRef.current = scene;

        // Third-person camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 15, 20);
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
        addGameLighting();
        
        // Create apartment/city
        createApartmentWorld();
        
        // Create character
        createCharacter();
        
        // Controls
        addGameControls();
        addMouseControls();
        
        // Start game loop
        animate();
        
        window.addEventListener('resize', handleResize);
    };

    const addGameLighting = () => {
        const scene = sceneRef.current;

        // Ambient light (daylight)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        // Sun light
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(50, 50, 25);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024; // Reduced from 4096
        sunLight.shadow.mapSize.height = 1024; // Reduced from 4096
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        scene.add(sunLight);

        // Room lights (only one casts shadows for performance)
        const roomLights = [
            { pos: [0, 8, 0], color: 0xffffff, intensity: 0.8, castShadow: true },      // Living room
            { pos: [-25, 8, 0], color: 0x4a90e2, intensity: 0.7, castShadow: false },   // Work room
            { pos: [25, 8, 0], color: 0x7ed321, intensity: 0.7, castShadow: false },    // Personal room
            { pos: [0, 8, -25], color: 0xf5a623, intensity: 0.7, castShadow: false },   // Creative room
            { pos: [0, 8, 25], color: 0xd0021b, intensity: 0.7, castShadow: false }     // Archive room
        ];

        roomLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, light.intensity, 30);
            pointLight.position.set(...light.pos);
            if (light.castShadow) {
                pointLight.castShadow = true;
                pointLight.shadow.mapSize.width = 512; // Reduced from default/implied 1024
                pointLight.shadow.mapSize.height = 512; // Reduced from default/implied 1024
            } else {
                pointLight.castShadow = false;
            }
            scene.add(pointLight);
        });
    };

    const createApartmentWorld = () => {
        const scene = sceneRef.current;

        // Ground/Floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Create apartment rooms
        createRoom('Living Room', 0, 0, 0x888888, 15, 15);
        createRoom('Work Space', -25, 0, 0x4a90e2, 12, 12);
        createRoom('Personal Space', 25, 0, 0x7ed321, 12, 12);
        createRoom('Creative Space', 0, -25, 0xf5a623, 12, 12);
        createRoom('Archive Space', 0, 25, 0xd0021b, 12, 12);

        // Connect rooms with hallways
        createHallway(0, 0, -12.5, 0, 3, 12.5); // Living to Creative
        createHallway(0, 0, 12.5, 0, 3, 12.5);  // Living to Archive
        createHallway(-12.5, 0, 0, 0, 12.5, 3); // Living to Work
        createHallway(12.5, 0, 0, 0, 12.5, 3);  // Living to Personal

        // Add furniture and decorations
        addFurniture();
    };

    const createRoom = (name, x, z, color, width, depth) => {
        const scene = sceneRef.current;
        
        // Room bounds for character movement
        roomBounds.current[name] = {
            minX: x - width/2 + 2,
            maxX: x + width/2 - 2,
            minZ: z - depth/2 + 2,
            maxZ: z + depth/2 - 2,
            centerX: x,
            centerZ: z
        };

        // Room floor with better materials
        const roomFloorGeometry = new THREE.PlaneGeometry(width, depth);
        const roomFloorMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.4,
            shininess: 30,
            emissive: color,
            emissiveIntensity: 0.1
        });
        const roomFloor = new THREE.Mesh(roomFloorGeometry, roomFloorMaterial);
        roomFloor.rotation.x = -Math.PI / 2;
        roomFloor.position.set(x, 0.01, z);
        roomFloor.receiveShadow = true;
        scene.add(roomFloor);

        // Room walls with improved materials
        const wallHeight = 8;
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf5f5f5,
            transparent: true,
            opacity: 0.9,
            shininess: 10,
            emissive: 0x222222,
            emissiveIntensity: 0.05
        });

        // Create 4 walls
        const walls = [
            { pos: [x, wallHeight/2, z - depth/2], size: [width, wallHeight, 0.5] }, // Front
            { pos: [x, wallHeight/2, z + depth/2], size: [width, wallHeight, 0.5] }, // Back
            { pos: [x - width/2, wallHeight/2, z], size: [0.5, wallHeight, depth] }, // Left
            { pos: [x + width/2, wallHeight/2, z], size: [0.5, wallHeight, depth] }  // Right
        ];

        walls.forEach(wall => {
            const wallGeometry = new THREE.BoxGeometry(...wall.size);
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(...wall.pos);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);
        });

        // Room label
        createRoomLabel(name, x, wallHeight + 2, z);
    };

    const createHallway = (x1, z1, x2, z2, width, depth) => {
        const scene = sceneRef.current;
        const hallwayGeometry = new THREE.PlaneGeometry(width, depth);
        const hallwayMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xcccccc,
            transparent: true,
            opacity: 0.5
        });
        const hallway = new THREE.Mesh(hallwayGeometry, hallwayMaterial);
        hallway.rotation.x = -Math.PI / 2;
        hallway.position.set((x1 + x2) / 2, 0.005, (z1 + z2) / 2);
        scene.add(hallway);
    };

    const createRoomLabel = (text, x, y, z) => {
        const scene = sceneRef.current;
        
        // Create a simple text representation
        const labelGeometry = new THREE.PlaneGeometry(8, 2);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 256, 64);
        context.fillStyle = '#333333';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(text, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(x, y, z);
        label.lookAt(cameraRef.current.position);
        scene.add(label);
    };

    const addFurniture = () => {
        const scene = sceneRef.current;
        
        // Add some basic furniture to make rooms feel lived-in
        const furnitureItems = [
            // Living room
            { pos: [0, 1, -3], size: [4, 2, 1], color: 0x8B4513 }, // Couch
            { pos: [0, 0.5, 0], size: [2, 1, 1], color: 0x654321 }, // Coffee table
            
            // Work space
            { pos: [-25, 1, -3], size: [3, 2, 1], color: 0x4a90e2 }, // Desk
            { pos: [-25, 2, -3], size: [1, 1, 1], color: 0x333333 }, // Computer
            
            // Personal space
            { pos: [25, 1, 3], size: [2, 2, 2], color: 0x7ed321 }, // Bed
            { pos: [22, 1, 0], size: [1, 2, 1], color: 0x8B4513 }, // Dresser
        ];

        furnitureItems.forEach(item => {
            const geometry = new THREE.BoxGeometry(...item.size);
            const material = new THREE.MeshLambertMaterial({ color: item.color });
            const furniture = new THREE.Mesh(geometry, material);
            furniture.position.set(...item.pos);
            furniture.castShadow = true;
            furniture.receiveShadow = true;
            scene.add(furniture);
        });
    };

    const createCharacter = () => {
        const scene = sceneRef.current;
        
        // Enhanced character with better materials
        const characterGroup = new THREE.Group();
        
        // Body with gradient-like effect
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4a90e2,
            shininess: 50,
            emissive: 0x1a3a5c,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        characterGroup.add(body);
        
        // Head with skin-like material
        const headGeometry = new THREE.SphereGeometry(0.4);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffdbac,
            shininess: 20,
            emissive: 0x332211,
            emissiveIntensity: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.8;
        head.castShadow = true;
        characterGroup.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 2.9, 0.35);
        characterGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 2.9, 0.35);
        characterGroup.add(rightEye);
        
        characterGroup.position.set(0, 0, 0);
        scene.add(characterGroup);
        characterRef.current = characterGroup;
    };

    const addGameControls = () => {
        const handleKeyDown = (event) => {
            keysRef.current[event.code] = true;
        };

        const handleKeyUp = (event) => {
            keysRef.current[event.code] = false;
        };

        const handleMouseMove = (event) => {
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const handleClick = (event) => {
            handleObjectClick();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    };

    const addMouseControls = () => {
        const canvas = rendererRef.current.domElement;
        let dragStarted = false;
        let rotationSpeed = 0.005;
        
        const handleMouseDown = (event) => {
            if (event.button === 0) { // Left mouse button only
                isDragging.current = true;
                dragStarted = false;
                previousMouse.current = { x: event.clientX, y: event.clientY };
                canvas.style.cursor = 'grabbing';
                event.preventDefault();
            }
        };

        const handleMouseMove = (event) => {
            // Update mouse position for raycasting
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDragging.current) {
                const deltaX = event.clientX - previousMouse.current.x;
                const deltaY = event.clientY - previousMouse.current.y;
                
                // Mark as drag started if mouse moved significantly
                if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    dragStarted = true;
                }
                
                // Handle camera rotation based on mode
                // Update rotation values
                cameraRotation.current.horizontal -= deltaX * rotationSpeed;
                cameraRotation.current.vertical += deltaY * rotationSpeed;
                
                // Clamp vertical rotation to prevent flipping
                cameraRotation.current.vertical = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraRotation.current.vertical));
                
                previousMouse.current = { x: event.clientX, y: event.clientY };
            } else {
                // Handle hover effects when not dragging
                handleMouseHover();
            }
        };

        const handleMouseUp = (event) => {
            if (isDragging.current) {
                isDragging.current = false;
                canvas.style.cursor = hoveredObject ? 'pointer' : 'grab';
            }
        };

        const handleClick = (event) => {
            // Only handle click if we didn't drag
            if (!dragStarted) {
                handleObjectClick();
            }
            dragStarted = false;
        };

        const handleWheel = (event) => {
            event.preventDefault();
            // Simple zoom by adjusting camera distance - this will be handled in updateCamera
        };

        const handleMouseLeave = () => {
            isDragging.current = false;
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu
        canvas.style.cursor = 'grab';
    };

    const updateCharacterMovement = () => {
        if (!characterRef.current) return;

        const moveSpeed = 0.3;
        const character = characterRef.current;
        let moved = false;

        // WASD movement
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) {
            character.position.z -= moveSpeed;
            moved = true;
        }
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) {
            character.position.z += moveSpeed;
            moved = true;
        }
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
            character.position.x -= moveSpeed;
            moved = true;
        }
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
            character.position.x += moveSpeed;
            moved = true;
        }

        // Boundary checking and room detection
        if (moved) {
            // Keep character within world bounds
            character.position.x = Math.max(-45, Math.min(45, character.position.x));
            character.position.z = Math.max(-45, Math.min(45, character.position.z));

            // Update character position state
            setCharacterPosition({ x: character.position.x, z: character.position.z });

            // Detect current room
            detectCurrentRoom();

            // Update camera to follow character
            updateCamera();
        }
    };

    const detectCurrentRoom = () => {
        const character = characterRef.current;
        if (!character) return;

        const pos = character.position;
        let newRoom = 'Living Room'; // Default

        // Check which room the character is in
        Object.entries(roomBounds.current).forEach(([roomName, bounds]) => {
            if (pos.x >= bounds.minX && pos.x <= bounds.maxX &&
                pos.z >= bounds.minZ && pos.z <= bounds.maxZ) {
                newRoom = roomName;
            }
        });

        if (newRoom !== currentRoom) {
            setCurrentRoom(newRoom);
        }
    };

    const updateCamera = () => {
        const character = characterRef.current;
        const camera = cameraRef.current;
        if (!character || !camera) return;

        switch (cameraMode) {
            case 'follow':
            case 'free':
                // Calculate camera position using rotation angles
                const distance = 20;
                const x = character.position.x + distance * Math.sin(cameraRotation.current.horizontal) * Math.cos(cameraRotation.current.vertical);
                const y = character.position.y + 8 + distance * Math.sin(cameraRotation.current.vertical);
                const z = character.position.z + distance * Math.cos(cameraRotation.current.horizontal) * Math.cos(cameraRotation.current.vertical);
                
                camera.position.set(x, y, z);
                camera.lookAt(character.position.x, character.position.y + 2, character.position.z);
                break;
                
            case 'top':
                // Top-down view
                camera.position.set(character.position.x, 40, character.position.z + 5);
                camera.lookAt(character.position.x, 0, character.position.z);
                break;
                
            case 'first-person':
                // First-person view
                camera.position.set(character.position.x, character.position.y + 2.5, character.position.z);
                const lookDirection = new THREE.Vector3(0, 0, -1);
                camera.lookAt(character.position.clone().add(lookDirection));
                break;
        }
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
                    hoveredObject.material.emissive.setHex(hoveredObject.userData.originalEmissive || 0x000000);
                }
                
                // Highlight new hovered object
                object.userData.originalEmissive = object.material.emissive.getHex();
                object.scale.setScalar(1.2);
                object.material.emissive.setHex(0x444444);
                setHoveredObject(object);
                rendererRef.current.domElement.style.cursor = 'pointer';
            }
        } else {
            if (hoveredObject) {
                hoveredObject.scale.setScalar(1);
                hoveredObject.material.emissive.setHex(hoveredObject.userData.originalEmissive || 0x000000);
                setHoveredObject(null);
                rendererRef.current.domElement.style.cursor = 'grab';
            }
        }
    };

    const renderMemoriesInRooms = () => {
        const scene = sceneRef.current;
        
        // Clear existing memory objects
        interactiveObjects.current.forEach(obj => {
            scene.remove(obj);
        });
        interactiveObjects.current = [];

        // Group memories by room type
        const memoryRooms = {
            'Work Space': ['email', 'event'],
            'Personal Space': ['music', 'photo', 'location'],
            'Creative Space': ['photo', 'music'],
            'Archive Space': ['email', 'event'],
            'Living Room': [] // Show all types
        };

        memories.forEach((memory, index) => {
            const memoryObject = createMemoryObject(memory, index);
            if (memoryObject) {
                scene.add(memoryObject);
                interactiveObjects.current.push(memoryObject);
            }
        });
    };

    const createMemoryObject = (memory, index) => {
        const type = memory.memory?.type || memory.object_type || 'default';
        
        // Determine which room this memory belongs to
        let roomName = 'Living Room';
        if (['email', 'event'].includes(type)) roomName = 'Work Space';
        if (['music', 'photo', 'location'].includes(type)) roomName = 'Personal Space';
        
        const roomBound = roomBounds.current[roomName];
        if (!roomBound) return null;

        // Position memory object in the appropriate room
        const position = {
            x: roomBound.centerX + (Math.random() - 0.5) * 8,
            y: 1 + Math.random() * 2,
            z: roomBound.centerZ + (Math.random() - 0.5) * 8
        };

        let geometry, material;

        switch (type) {
            case 'email':
                geometry = new THREE.BoxGeometry(1.5, 1, 0.1);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x3b82f6,
                    emissive: 0x1e40af,
                    emissiveIntensity: 0.3,
                    shininess: 100,
                    transparent: true,
                    opacity: 0.9
                });
                break;
                
            case 'music':
                geometry = new THREE.SphereGeometry(0.8, 16, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x10b981,
                    emissive: 0x059669,
                    emissiveIntensity: 0.4,
                    shininess: 80,
                    transparent: true,
                    opacity: 0.95
                });
                break;
                
            case 'photo':
                geometry = new THREE.PlaneGeometry(1.5, 1);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xfbbf24,
                    emissive: 0xd97706,
                    emissiveIntensity: 0.3,
                    shininess: 60,
                    transparent: true,
                    opacity: 0.9
                });
                break;
                
            case 'event':
                geometry = new THREE.ConeGeometry(0.8, 1.5, 6);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xef4444,
                    emissive: 0xdc2626,
                    emissiveIntensity: 0.3,
                    shininess: 70,
                    transparent: true,
                    opacity: 0.9
                });
                break;
                
            case 'location':
                geometry = new THREE.OctahedronGeometry(1);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x8b5cf6,
                    emissive: 0x7c3aed,
                    emissiveIntensity: 0.4,
                    shininess: 90,
                    transparent: true,
                    opacity: 0.95
                });
                break;
                
            default:
                geometry = new THREE.IcosahedronGeometry(0.8);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x6b7280,
                    shininess: 50,
                    transparent: true,
                    opacity: 0.8
                });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store memory data
        mesh.userData.memory = memory;
        mesh.userData.type = type;
        mesh.userData.originalY = position.y;
        mesh.userData.floatOffset = Math.random() * Math.PI * 2;

        return mesh;
    };

    const handleObjectClick = () => {
        const raycaster = raycasterRef.current;
        const camera = cameraRef.current;
        
        raycaster.setFromCamera(mouseRef.current, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects.current);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const memoryData = object.userData.memory;
            
            if (memoryData) {
                setSelectedMemory(memoryData);
                if (onObjectClick) {
                    onObjectClick(memoryData);
                }
                
                // Animate click effect
                object.scale.setScalar(1.3);
                setTimeout(() => {
                    object.scale.setScalar(1);
                }, 300);
            }
        }
    };

    const animate = () => {
        frameId.current = requestAnimationFrame(animate);

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            // Update character movement
            updateCharacterMovement();
            
            const time = Date.now() * 0.001;
            
            // Animate floating memory objects
            interactiveObjects.current.forEach(obj => {
                if (obj.userData.originalY !== undefined) {
                    obj.position.y = obj.userData.originalY + Math.sin(time + obj.userData.floatOffset) * 0.2;
                    obj.rotation.y += 0.01;
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
        window.removeEventListener('keydown', () => {});
        window.removeEventListener('keyup', () => {});
    };

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                        <div className="text-white text-lg">Building Your Memory Apartment...</div>
                    </div>
                </div>
            )}
            
            <div 
                ref={mountRef} 
                className="three-canvas w-full h-full"
                style={{ minHeight: '600px' }}
            />
            
            {/* Game UI */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg z-20">
                <div className="text-lg font-bold mb-2">🏠 {currentRoom}</div>
                <div className="text-sm text-gray-300 mb-3">
                    Position: ({Math.round(characterPosition.x)}, {Math.round(characterPosition.z)})
                </div>
                
                {/* Camera Controls */}
                <div className="border-t border-gray-600 pt-3">
                    <div className="text-sm font-semibold mb-2">📷 Camera View:</div>
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => setCameraMode('follow')}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                                cameraMode === 'follow' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Follow
                        </button>
                        <button
                            onClick={() => setCameraMode('free')}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                                cameraMode === 'free' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Free
                        </button>
                        <button
                            onClick={() => setCameraMode('top')}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                                cameraMode === 'top' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Top
                        </button>
                        <button
                            onClick={() => setCameraMode('first-person')}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                                cameraMode === 'first-person' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            FPS
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Enhanced Controls */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg text-sm z-20 max-w-sm">
                <div className="font-semibold mb-2">🎮 Game Controls:</div>
                <div className="space-y-1 text-xs">
                    <div>🚶 <strong>WASD / Arrow Keys:</strong> Move character</div>
                    <div>🖱️ <strong>Left Click + Drag:</strong> Rotate camera around character</div>
                    <div>🔍 <strong>Mouse Wheel:</strong> Zoom in/out smoothly</div>
                    <div>👆 <strong>Click Objects:</strong> View memory details</div>
                    <div>🏠 <strong>Walk between rooms</strong> to explore memories</div>
                    <div>📷 <strong>Free Mode:</strong> Full 360° spherical rotation</div>
                    <div>📷 <strong>Follow Mode:</strong> Horizontal rotation + vertical tilt</div>
                </div>
            </div>
            
            {/* Memory Detail Modal */}
            {selectedMemory && (
                <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm z-20">
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
        </div>
    );
}

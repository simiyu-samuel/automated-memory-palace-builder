import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

const PalaceViewer = ({ rooms = [], memoryObjects = [], onObjectClick, onRoomChange }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const [currentRoom, setCurrentRoom] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 5, 10);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(ambientLight);
        scene.add(directionalLight);

        // Advanced interactive controls
        let mouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let cameraRadius = 15;
        let cameraTheta = 0;
        let cameraPhi = Math.PI / 3;

        const updateCameraPosition = () => {
            camera.position.x = cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
            camera.position.y = cameraRadius * Math.cos(cameraPhi);
            camera.position.z = cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
            camera.lookAt(0, 2, 0);
        };

        const onMouseDown = (event) => {
            mouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const onMouseUp = () => mouseDown = false;

        const onMouseMove = (event) => {
            if (!mouseDown) return;
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            cameraTheta -= deltaX * 0.01;
            cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaY * 0.01));
            
            updateCameraPosition();
            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const onWheel = (event) => {
            cameraRadius = Math.max(5, Math.min(30, cameraRadius + event.deltaY * 0.01));
            updateCameraPosition();
        };

        updateCameraPosition();

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('wheel', onWheel);
        
        // Add particle system
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = Math.random() * 10;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
            requestAnimationFrame(animate);
            
            const time = Date.now() * 0.001;
            
            // Animate floating memory objects with hover effects
            scene.traverse((child) => {
                if (child.userData.type === 'memory') {
                    const offset = child.userData.animationOffset || 0;
                    child.position.y = child.userData.originalY + Math.sin(time + offset) * 0.15;
                    child.rotation.y += 0.01;
                    
                    // Pulsing glow effect
                    if (child.material) {
                        const pulse = (Math.sin(time * 2 + offset) + 1) * 0.5;
                        child.material.emissive = new THREE.Color().setHSL(pulse * 0.1, 0.5, pulse * 0.1);
                    }
                }
            });
            
            // Animate particles
            if (particleSystem) {
                particleSystem.rotation.y += 0.001;
                const positions = particleSystem.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] += Math.sin(time + i) * 0.001;
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
            }
            
            renderer.render(scene, camera);
        };
        animate();

        setIsLoading(false);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('wheel', onWheel);
            
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    const createRoom = useCallback((room) => {
        const dimensions = room.dimensions || { width: 12, height: 8, depth: 12 };
        const colorScheme = room.color_scheme || { primary: '#4f46e5' };
        
        // Floor with texture-like appearance
        const floorGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.depth);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355,
            transparent: true,
            opacity: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;

        // Walls with room theme colors
        const wallColor = new THREE.Color(colorScheme.primary);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: wallColor,
            transparent: true,
            opacity: 0.3
        });

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.height);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, dimensions.height / 2, -dimensions.depth / 2);
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(dimensions.depth, dimensions.height);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-dimensions.width / 2, dimensions.height / 2, 0);
        
        // Right wall
        const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(dimensions.width / 2, dimensions.height / 2, 0);

        const roomGroup = new THREE.Group();
        roomGroup.add(floor, backWall, leftWall, rightWall);
        roomGroup.userData = { type: 'room', roomId: room.id };

        return roomGroup;
    }, []);

    const createMemoryObject = useCallback((memoryObj) => {
        const obj = memoryObj.objects[0]; // Get first object
        const position = obj.position || { x: 0, y: 1, z: 0 };
        const scale = obj.scale || { x: 1, y: 1, z: 1 };
        const color = new THREE.Color(obj.color || '#00ff00');
        
        let geometry, material;
        
        // Stunning 3D shapes for different memory types
        switch (memoryObj.type) {
            case 'email':
                geometry = new THREE.BoxGeometry(1.2, 0.8, 0.1);
                material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    shininess: 100,
                    transparent: true,
                    opacity: 0.9
                });
                break;
            case 'photo':
                geometry = new THREE.PlaneGeometry(1.5, 1.0);
                material = new THREE.MeshLambertMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                break;
            case 'document':
                geometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
                material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    shininess: 50
                });
                break;
            case 'call':
                geometry = new THREE.SphereGeometry(0.6, 20, 20);
                material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    shininess: 200,
                    transparent: true,
                    opacity: 0.9
                });
                break;
            case 'event':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
                material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    shininess: 80
                });
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: color });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.scale.set(scale.x, scale.y, scale.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add floating animation
        mesh.userData = { 
            type: 'memory', 
            memoryId: memoryObj.memory_id,
            memoryData: memoryObj,
            originalY: position.y,
            animationOffset: Math.random() * Math.PI * 2
        };

        return mesh;
    }, []);

    useEffect(() => {
        if (!sceneRef.current || isLoading) return;
        
        console.log('Rendering scene with:', { rooms: rooms.length, memoryObjects: memoryObjects.length, currentRoom });

        const objectsToRemove = [];
        sceneRef.current.traverse((child) => {
            if (child.userData.type === 'room' || child.userData.type === 'memory') {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => sceneRef.current.remove(obj));

        if (rooms[currentRoom]) {
            console.log('Creating room:', rooms[currentRoom].name);
            const roomMesh = createRoom(rooms[currentRoom]);
            sceneRef.current.add(roomMesh);
        }

        const roomObjects = memoryObjects.filter(obj => 
            !rooms[currentRoom] || obj.room_id === rooms[currentRoom].id
        );
        
        console.log('Filtered objects for room:', roomObjects.length);
        
        roomObjects.forEach(obj => {
            console.log('Creating memory object:', obj.title, obj.objects?.[0]);
            const objectMesh = createMemoryObject(obj);
            sceneRef.current.add(objectMesh);
        });

    }, [rooms, memoryObjects, currentRoom, createRoom, createMemoryObject, isLoading]);

    useEffect(() => {
        if (!rendererRef.current) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredObject = null;

        const onMouseClick = (event) => {
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                if (clickedObject.userData.type === 'memory' && onObjectClick) {
                    // Click effect
                    clickedObject.scale.setScalar(1.2);
                    setTimeout(() => clickedObject.scale.setScalar(1), 200);
                    onObjectClick(clickedObject.userData.memoryData);
                }
            }
        };

        const onMouseHover = (event) => {
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

            // Reset previous hover
            if (hoveredObject && hoveredObject.userData.type === 'memory') {
                hoveredObject.scale.setScalar(1);
                rendererRef.current.domElement.style.cursor = 'grab';
            }

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.type === 'memory') {
                    hoveredObject = object;
                    object.scale.setScalar(1.1);
                    rendererRef.current.domElement.style.cursor = 'pointer';
                } else {
                    hoveredObject = null;
                    rendererRef.current.domElement.style.cursor = 'grab';
                }
            } else {
                hoveredObject = null;
                rendererRef.current.domElement.style.cursor = 'grab';
            }
        };

        rendererRef.current.domElement.addEventListener('click', onMouseClick);
        rendererRef.current.domElement.addEventListener('mousemove', onMouseHover);
        rendererRef.current.domElement.style.cursor = 'grab';

        return () => {
            if (rendererRef.current?.domElement) {
                rendererRef.current.domElement.removeEventListener('click', onMouseClick);
                rendererRef.current.domElement.removeEventListener('mousemove', onMouseHover);
            }
        };
    }, [onObjectClick]);

    const nextRoom = () => {
        if (currentRoom < rooms.length - 1) {
            const newRoom = currentRoom + 1;
            setCurrentRoom(newRoom);
            onRoomChange?.(rooms[newRoom]);
        }
    };

    const prevRoom = () => {
        if (currentRoom > 0) {
            const newRoom = currentRoom - 1;
            setCurrentRoom(newRoom);
            onRoomChange?.(rooms[newRoom]);
        }
    };

    console.log('PalaceViewer render:', { isLoading, roomsCount: rooms.length, objectsCount: memoryObjects.length });
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-white">Loading 3D Palace...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            
            {rooms.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
                    <button
                        onClick={prevRoom}
                        disabled={currentRoom === 0}
                        className="text-white hover:text-blue-400 disabled:text-gray-500"
                    >
                        ← Previous
                    </button>
                    <span className="text-white">
                        {rooms[currentRoom]?.name || `Room ${currentRoom + 1}`} 
                        ({currentRoom + 1}/{rooms.length})
                    </span>
                    <button
                        onClick={nextRoom}
                        disabled={currentRoom === rooms.length - 1}
                        className="text-white hover:text-blue-400 disabled:text-gray-500"
                    >
                        Next →
                    </button>
                </div>
            )}

            {rooms[currentRoom] && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3 text-white max-w-xs">
                    <h3 className="font-semibold">{rooms[currentRoom].name}</h3>
                    <p className="text-sm text-gray-300">{rooms[currentRoom].description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {rooms[currentRoom].memory_count} memories
                    </p>
                </div>
            )}
        </div>
    );
};

export default PalaceViewer;
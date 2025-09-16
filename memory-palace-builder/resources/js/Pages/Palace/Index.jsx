import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import GamePalaceRenderer from '@/Components/Three/GamePalaceRenderer';
import MemoryModal from '@/Components/Palace/MemoryModal';
import Dashboard from '@/Components/Palace/Dashboard';
import axios from 'axios';

// Configure axios to include CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

export default function Index({ auth, rooms: initialRooms = [], memories: initialMemories = [], stats: initialStats = {} }) {
    const [view, setView] = useState('dashboard'); // 'dashboard' | '3d'
    const [rooms, setRooms] = useState(initialRooms);
    const [memoryObjects, setMemoryObjects] = useState([]);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);

    // Load 3D data when switching to 3D view
    useEffect(() => {
        if (view === '3d') {
            load3DData();
        }
    }, [view]);

    const load3DData = async () => {
        setLoading(true);
        try {
            console.log('Loading 3D data...');
            const [roomsResponse, objectsResponse] = await Promise.all([
                axios.get('/api/v1/palace/rooms'),
                axios.get('/api/v1/palace/memory-objects')
            ]);
            
            console.log('Rooms response:', roomsResponse.data);
            console.log('Objects response:', objectsResponse.data);
            
            setRooms(roomsResponse.data.rooms || []);
            setMemoryObjects(objectsResponse.data.memory_objects || []);
            
            console.log('Set rooms:', roomsResponse.data.rooms || []);
            console.log('Set memory objects:', objectsResponse.data.memory_objects || []);
        } catch (error) {
            console.error('Failed to load 3D data:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    };

    const handleObjectClick = (memoryData) => {
        setSelectedMemory(memoryData);
        setIsModalOpen(true);
    };

    const handleRoomChange = (room) => {
        setCurrentRoom(room);
        // Reload 3D data when room changes to filter memories
        if (view === '3d') {
            load3DData();
        }
    };

    const handleNavigate = (destination) => {
        switch (destination) {
            case 'palace':
                setView('3d');
                break;
            case 'dashboard':
                setView('dashboard');
                break;
            case 'search':
                window.location.href = '/palace/search';
                break;
            case 'insights':
                window.location.href = '/palace/insights';
                break;
            case 'settings':
                window.location.href = '/settings';
                break;
            case 'memories':
                window.location.href = '/memories';
                break;
        }
    };
    
    const loginAsTestUser = async () => {
        try {
            await axios.post('/login', {
                email: 'simiyusamuel869@gmail.com',
                password: 'password'
            });
            window.location.reload();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Memory Palace {currentRoom && `- ${currentRoom.name}`}
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`px-4 py-2 rounded-lg ${
                                view === 'dashboard' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('3d')}
                            className={`px-4 py-2 rounded-lg ${
                                view === '3d' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            3D Palace
                        </button>

                    </div>
                </div>
            }
        >
            <Head title="Memory Palace" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {view === 'dashboard' ? (
                        <Dashboard 
                            stats={stats} 
                            onNavigate={handleNavigate}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="h-[600px] relative">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-gray-600">Loading 3D Palace...</div>
                                    </div>
                                ) : (
                                    <GamePalaceRenderer
                                        rooms={rooms}
                                        memories={memoryObjects}
                                        onObjectClick={handleObjectClick}
                                    />
                                )}
                            </div>
                            
                            {/* Room Navigation & Controls */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
                                {/* Room Navigation */}
                                <div className="mb-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-2">🏰 Palace Rooms:</div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleRoomChange(null)}
                                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                !currentRoom 
                                                    ? 'bg-purple-600 text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                        >
                                            🌟 All Rooms
                                        </button>
                                        <button
                                            onClick={() => handleRoomChange({ name: 'Work Space', id: 'work_space' })}
                                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                currentRoom?.name === 'Work Space' 
                                                    ? 'bg-blue-600 text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                        >
                                            💼 Work Space
                                        </button>
                                        <button
                                            onClick={() => handleRoomChange({ name: 'Personal Space', id: 'personal_space' })}
                                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                currentRoom?.name === 'Personal Space' 
                                                    ? 'bg-green-600 text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                        >
                                            🏠 Personal Space
                                        </button>
                                        <button
                                            onClick={() => handleRoomChange({ name: 'Creative Space', id: 'creative_space' })}
                                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                currentRoom?.name === 'Creative Space' 
                                                    ? 'bg-yellow-600 text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                        >
                                            🎨 Creative Space
                                        </button>
                                        <button
                                            onClick={() => handleRoomChange({ name: 'Archive Space', id: 'archive_space' })}
                                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                currentRoom?.name === 'Archive Space' 
                                                    ? 'bg-red-600 text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                        >
                                            📚 Archive Space
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Interactive Controls */}
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        🖱️ <strong>Drag:</strong> Orbit • 🔍 <strong>Scroll:</strong> Zoom • 🏰 <strong>Click Rooms:</strong> Navigate • ✨ <strong>Click Objects:</strong> View Details
                                    </div>
                                    <div className="space-x-2">
                                        {!auth.user && (
                                            <button
                                                onClick={loginAsTestUser}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                            >
                                                🔑 Login as Test User
                                            </button>
                                        )}
                                        <button
                                            onClick={load3DData}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                        >
                                            🔄 Refresh Palace
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Memory Detail Modal */}
            <MemoryModal
                memory={selectedMemory}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedMemory(null);
                }}
            />
        </AuthenticatedLayout>
    );
}

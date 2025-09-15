import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ auth }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadMemories();
    }, [filter]);

    const loadMemories = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter === 'favorites') params.is_favorite = true;
            if (filter === 'recent') params.recent = 7;
            
            const response = await axios.get('/api/v1/memories', { params });
            setMemories(response.data.data || []);
        } catch (error) {
            console.error('Failed to load memories:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-100';
            case 'negative': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            email: '📧',
            photo: '📸',
            music: '🎵',
            calendar: '📅',
            location: '📍'
        };
        return icons[type] || '📄';
    };

    const MemoryCard = ({ memory }) => (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(memory.type)}</span>
                    <h3 className="font-semibold text-gray-900 truncate">{memory.title}</h3>
                </div>
                {memory.is_favorite && (
                    <span className="text-yellow-500">⭐</span>
                )}
            </div>
            
            <p className="text-gray-600 mb-3 line-clamp-3">
                {memory.description || memory.content?.substring(0, 150) + '...'}
            </p>
            
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(memory.sentiment)}`}>
                        {memory.sentiment}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {memory.type}
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    {new Date(memory.memory_date).toLocaleDateString()}
                </span>
            </div>
            
            {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {memory.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                            {tag}
                        </span>
                    ))}
                    {memory.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{memory.tags.length - 3} more</span>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Memories</h2>
                    <div className="flex items-center space-x-4">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="all">All Memories</option>
                            <option value="recent">Recent (7 days)</option>
                            <option value="favorites">Favorites</option>
                        </select>
                        <div className="flex rounded-lg border border-gray-300">
                            <button
                                onClick={() => setView('grid')}
                                className={`px-3 py-2 text-sm ${
                                    view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                                }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`px-3 py-2 text-sm ${
                                    view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Memories" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-600">Loading memories...</div>
                        </div>
                    ) : memories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {memories.map((memory) => (
                                <MemoryCard key={memory.id} memory={memory} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                No memories found.
                            </div>
                            <p className="text-gray-600 mb-4">
                                Connect your data sources to start building your memory palace.
                            </p>
                            <button 
                                onClick={() => window.location.href = '/settings'}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Connect Data Sources
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

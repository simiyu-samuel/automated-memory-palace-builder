import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ auth }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMemories();
    }, [filter]);

    const loadMemories = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter === 'favorites') params.is_favorite = true;
            if (filter === 'recent') params.recent = 7;
            if (searchTerm) params.q = searchTerm;
            
            const response = await axios.get('/api/v1/memories', { params });
            setMemories(response.data.data || []);
        } catch (error) {
            console.error('Failed to load memories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadMemories();
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-100 border-green-200';
            case 'negative': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const MemoryCard = React.memo(({ memory }) => ( // Wrapped in React.memo
        <Link href={`/memories/${memory.id}`}>
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getTypeIcon(memory.type)}</span>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                                {memory.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {formatDate(memory.memory_date)}
                            </p>
                        </div>
                    </div>
                    {memory.is_favorite && (
                        <span className="text-yellow-500 text-xl">⭐</span>
                    )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {memory.description || memory.content?.substring(0, 120) + '...'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSentimentColor(memory.sentiment)}`}>
                            {memory.sentiment}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                            {memory.type}
                        </span>
                    </div>
                </div>
                
                {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {memory.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                                #{tag}
                            </span>
                        ))}
                        {memory.tags.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                                +{memory.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    ));

    const memoizedFilteredMemories = useMemo(() => { // Memoized filteredMemories
        return memories.filter(memory => 
            searchTerm === '' || 
            memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memory.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memory.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [memories, searchTerm]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-2xl text-gray-900">📚 Memory Collection</h2>
                        <p className="text-gray-600 text-sm mt-1">Browse and explore your digital memories</p>
                    </div>
                    <Link
                        href={route('palace.index')}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                        ← Back to Palace
                    </Link>
                </div>
            }
        >
            <Head title="Memories" />

            <div className="py-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search memories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Memories</option>
                                    <option value="recent">Recent (7 days)</option>
                                    <option value="favorites">⭐ Favorites</option>
                                </select>
                                
                                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                    <button
                                        onClick={() => setView('grid')}
                                        className={`px-4 py-3 text-sm font-medium transition-colors ${
                                            view === 'grid' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setView('list')}
                                        className={`px-4 py-3 text-sm font-medium transition-colors ${
                                            view === 'list' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Summary */}
                    {!loading && (
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Found <span className="font-semibold text-gray-900">{memoizedFilteredMemories.length}</span> memories
                                {searchTerm && ` matching "${searchTerm}"`}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <div className="text-gray-600">Loading memories...</div>
                            </div>
                        </div>
                    ) : memoizedFilteredMemories.length > 0 ? (
                        <div className={`grid gap-6 ${
                            view === 'grid' 
                                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                                : 'grid-cols-1'
                        }`}>
                            {memoizedFilteredMemories.map((memory) => (
                                <MemoryCard key={memory.id} memory={memory} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-gray-400 mb-6">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No memories found</h3>
                            </div>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {searchTerm 
                                    ? `No memories match your search for "${searchTerm}". Try different keywords.`
                                    : "Connect your data sources to start building your memory palace."
                                }
                            </p>
                            <div className="flex justify-center space-x-4">
                                {searchTerm && (
                                    <button 
                                        onClick={() => {setSearchTerm(''); loadMemories();}}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Clear Search
                                    </button>
                                )}
                                <Link
                                    href="/settings"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                                >
                                    Connect Data Sources
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

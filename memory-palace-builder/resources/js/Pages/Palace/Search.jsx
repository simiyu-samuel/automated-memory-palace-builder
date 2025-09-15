import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Search({ auth, query: initialQuery = '', filters: initialFilters = {}, rooms = [] }) {
    const [query, setQuery] = useState(initialQuery);
    const [filters, setFilters] = useState(initialFilters);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        if (initialQuery || Object.keys(initialFilters).length > 0) {
            performSearch();
        }
    }, []);

    const performSearch = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page };
            if (query) params.search = query;
            if (filters.type) params.type = filters.type;
            if (filters.sentiment) params.sentiment = filters.sentiment;
            if (filters.room_id) params.room_id = filters.room_id;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            
            const response = await axios.get('/api/v1/memories', { params });
            
            const memories = response.data.data || response.data || [];
            setMemories(memories);
            setPagination({
                current_page: 1,
                last_page: 1,
                total: memories.length
            });
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        performSearch();
    };

    const clearFilters = () => {
        setQuery('');
        setFilters({});
        setMemories([]);
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-100';
            case 'negative': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Search Memories</h2>}
        >
            <Head title="Search Memories" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search Form */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Main Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Query
                                </label>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search memories, content, titles..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Memory Type
                                    </label>
                                    <select
                                        value={filters.type || ''}
                                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Types</option>
                                        <option value="email">Email</option>
                                        <option value="photo">Photo</option>
                                        <option value="document">Document</option>
                                        <option value="call">Call</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sentiment
                                    </label>
                                    <select
                                        value={filters.sentiment || ''}
                                        onChange={(e) => setFilters({...filters, sentiment: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Sentiments</option>
                                        <option value="positive">Positive</option>
                                        <option value="neutral">Neutral</option>
                                        <option value="negative">Negative</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Room
                                    </label>
                                    <select
                                        value={filters.room_id || ''}
                                        onChange={(e) => setFilters({...filters, room_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Rooms</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name}
                                            </option>
                                        ))}\n                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date From
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Clear Filters
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results */}
                    {memories.length > 0 && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Search Results ({pagination.total || 0} found)
                                </h3>
                            </div>
                            
                            <div className="divide-y divide-gray-200">
                                {memories.map((memory) => (
                                    <div key={memory.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                    {memory.title}
                                                </h4>
                                                <p className="text-gray-600 mb-3">
                                                    {memory.description || memory.content?.substring(0, 200) + '...'}
                                                </p>
                                                
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(memory.sentiment)}`}>
                                                        {memory.sentiment}
                                                    </span>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                        {memory.type}
                                                    </span>
                                                    {(memory.palace_room || memory.room) && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                                            {memory.palace_room?.name || memory.room?.name}
                                                        </span>
                                                    )}
                                                </div>

                                                {memory.tags && memory.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {memory.tags.slice(0, 5).map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {memory.tags.length > 5 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{memory.tags.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 mb-2">
                                                    {formatDate(memory.memory_date)}
                                                </div>
                                                {memory.sentiment_score !== undefined && memory.sentiment_score !== null && (
                                                    <div className="text-xs text-gray-400">
                                                        Score: {Number(memory.sentiment_score).toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="p-6 border-t">
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={() => performSearch(pagination.current_page - 1)}
                                            disabled={pagination.current_page <= 1}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page {pagination.current_page} of {pagination.last_page}
                                        </span>
                                        <button
                                            onClick={() => performSearch(pagination.current_page + 1)}
                                            disabled={pagination.current_page >= pagination.last_page}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && memories.length === 0 && (query || Object.keys(filters).length > 0) && (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                No memories found matching your search criteria.
                            </div>
                            <button
                                onClick={clearFilters}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Clear filters and try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
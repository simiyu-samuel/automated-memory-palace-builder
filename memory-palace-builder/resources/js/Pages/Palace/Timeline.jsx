import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Timeline({ auth }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
    const [groupBy, setGroupBy] = useState('day'); // day, week, month

    useEffect(() => {
        loadTimelineData();
    }, [timeRange]);

    const loadTimelineData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/memories', {
                params: {
                    timeline: true,
                    range: timeRange,
                    group_by: groupBy,
                    per_page: 100
                }
            });
            
            const groupedMemories = groupMemoriesByDate(response.data.data || []);
            setMemories(groupedMemories);
        } catch (error) {
            console.error('Failed to load timeline data:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupMemoriesByDate = (memoriesArray) => {
        const grouped = {};
        
        memoriesArray.forEach(memory => {
            const date = new Date(memory.memory_date);
            let key;
            
            switch (groupBy) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(memory);
        });

        return Object.entries(grouped)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, memories]) => ({ date, memories }));
    };

    const formatDateGroup = (dateString) => {
        const date = new Date(dateString);
        
        switch (groupBy) {
            case 'day':
                return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'week':
                const weekEnd = new Date(date);
                weekEnd.setDate(date.getDate() + 6);
                return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            case 'month':
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            default:
                return dateString;
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <span className="text-2xl">{getTypeIcon(memory.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                            {memory.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                            {new Date(memory.memory_date).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {memory.description || memory.content?.substring(0, 100) + '...'}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(memory.sentiment)}`}>
                            {memory.sentiment}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {memory.type}
                        </span>
                        {memory.palace_room && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {memory.palace_room.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Memory Timeline</h2>}
        >
            <Head title="Memory Timeline" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Controls */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Time Range
                                    </label>
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="week">Last Week</option>
                                        <option value="month">Last Month</option>
                                        <option value="year">Last Year</option>
                                        <option value="all">All Time</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Group By
                                    </label>
                                    <select
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="day">Day</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button
                                onClick={loadTimelineData}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-600">Loading timeline...</div>
                        </div>
                    ) : memories.length > 0 ? (
                        <div className="space-y-8">
                            {memories.map(({ date, memories: dayMemories }) => (
                                <div key={date} className="relative">
                                    {/* Date Header */}
                                    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {formatDateGroup(date)}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {dayMemories.length} {dayMemories.length === 1 ? 'memory' : 'memories'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline Line */}
                                    <div className="relative">
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                                        
                                        {/* Memories */}
                                        <div className="space-y-4">
                                            {dayMemories.map((memory, index) => (
                                                <div key={memory.id} className="relative flex items-start">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow"></div>
                                                    
                                                    {/* Memory Content */}
                                                    <div className="ml-16 flex-1">
                                                        <MemoryCard memory={memory} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                No memories found for the selected time range.
                            </div>
                            <p className="text-gray-600">
                                Try adjusting your time range or connect more data sources to see your memory timeline.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
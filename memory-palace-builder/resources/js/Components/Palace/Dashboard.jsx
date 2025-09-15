import React from 'react';

const Dashboard = ({ stats, onNavigate }) => {
    const StatCard = ({ title, value, subtitle, color = 'blue', onClick }) => (
        <div 
            className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${onClick ? 'hover:bg-gray-50' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-2xl font-semibold text-${color}-600`}>{value}</p>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    const SentimentChart = ({ breakdown }) => {
        const total = breakdown.positive + breakdown.neutral + breakdown.negative;
        if (total === 0) return <div className="text-gray-500">No data</div>;

        const positivePercent = (breakdown.positive / total) * 100;
        const neutralPercent = (breakdown.neutral / total) * 100;
        const negativePercent = (breakdown.negative / total) * 100;

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Positive</span>
                    <span className="text-sm font-medium text-green-600">{breakdown.positive}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${positivePercent}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Neutral</span>
                    <span className="text-sm font-medium text-gray-600">{breakdown.neutral}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-gray-400 h-2 rounded-full" 
                        style={{ width: `${neutralPercent}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Negative</span>
                    <span className="text-sm font-medium text-red-600">{breakdown.negative}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${negativePercent}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Memories"
                    value={stats.totalMemories || 0}
                    subtitle="Across all rooms"
                    color="blue"
                    onClick={() => onNavigate?.('memories')}
                />
                <StatCard
                    title="Palace Rooms"
                    value={stats.totalRooms || 0}
                    subtitle="Active rooms"
                    color="purple"
                    onClick={() => onNavigate?.('palace')}
                />
                <StatCard
                    title="Recent Memories"
                    value={stats.recentCount || 0}
                    subtitle="Last 7 days"
                    color="green"
                />
                <StatCard
                    title="API Connections"
                    value={stats.apiConnections || 0}
                    subtitle="Active connections"
                    color="orange"
                    onClick={() => onNavigate?.('settings')}
                />
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Processing Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Processed Memories</span>
                            <span className="text-sm font-medium">{stats.processedCount || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                    width: `${stats.totalMemories > 0 ? (stats.processedCount / stats.totalMemories) * 100 : 0}%` 
                                }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {stats.totalMemories > 0 ? 
                                `${Math.round((stats.processedCount / stats.totalMemories) * 100)}% complete` : 
                                'No memories to process'
                            }
                        </div>
                    </div>
                </div>

                {/* Sentiment Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Overview</h3>
                    <SentimentChart breakdown={stats.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 }} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => onNavigate?.('palace')}
                        className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Enter Palace
                    </button>
                    
                    <button 
                        onClick={() => onNavigate?.('search')}
                        className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Memories
                    </button>
                    
                    <button 
                        onClick={() => onNavigate?.('insights')}
                        className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Insights
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
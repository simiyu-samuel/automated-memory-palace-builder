import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Insights({ 
    auth, 
    insights: initialInsights = [], 
    trends: initialTrends = [], 
    categories: initialCategories = [], 
    patterns: initialPatterns = [] 
}) {
    const [activeTab, setActiveTab] = useState('overview');

    const TrendChart = ({ trends }) => {
        if (!trends || trends.length === 0) {
            return <div className="text-gray-500 text-center py-8">No trend data available</div>;
        }

        const maxCount = Math.max(...trends.map(t => t.count));
        
        return (
            <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Memory Creation Trends (Last 30 Days)</h4>
                <div className="flex items-end space-x-2 h-40">
                    {trends.map((trend, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                                className="bg-blue-500 w-full rounded-t"
                                style={{ 
                                    height: `${(trend.count / maxCount) * 120}px`,
                                    minHeight: trend.count > 0 ? '4px' : '0px'
                                }}
                                title={`${trend.date}: ${trend.count} memories`}
                            ></div>
                            <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                                {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CategoryChart = ({ categories }) => {
        if (!categories || categories.length === 0) {
            return <div className="text-gray-500 text-center py-8">No category data available</div>;
        }

        return (
            <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Top Memory Categories</h4>
                <div className="space-y-3">
                    {categories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${category.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">
                                    {category.count}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ActivityPattern = ({ patterns }) => {
        if (!patterns || patterns.length === 0) {
            return <div className="text-gray-500 text-center py-8">No activity pattern data available</div>;
        }

        const maxCount = Math.max(...patterns.map(p => p.count));

        return (
            <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Daily Activity Patterns</h4>
                <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                        const pattern = patterns.find(p => p.hour === hour) || { hour, count: 0 };
                        const intensity = maxCount > 0 ? (pattern.count / maxCount) : 0;
                        
                        return (
                            <div key={hour} className="text-center">
                                <div 
                                    className="w-full h-8 bg-blue-500 rounded mb-1"
                                    style={{ 
                                        opacity: intensity,
                                        minHeight: '4px'
                                    }}
                                    title={`${pattern.label || `${hour}:00`}: ${pattern.count} memories`}
                                ></div>
                                <div className="text-xs text-gray-500">
                                    {hour}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const InsightCard = ({ insight }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                </span>
            </div>
            <p className="text-gray-700 mb-4">{insight.description}</p>
            
            {insight.data && (
                <div className="bg-gray-50 rounded p-3">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        {typeof insight.data === 'string' ? insight.data : JSON.stringify(insight.data, null, 2)}
                    </pre>
                </div>
            )}
            
            {insight.confidence_score && (
                <div className="mt-3 flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${insight.confidence_score * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                        {Math.round(insight.confidence_score * 100)}%
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Memory Insights</h2>}
        >
            <Head title="Memory Insights" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {[
                                    { id: 'overview', name: 'Overview' },
                                    { id: 'trends', name: 'Trends' },
                                    { id: 'categories', name: 'Categories' },
                                    { id: 'patterns', name: 'Patterns' },
                                    { id: 'insights', name: 'AI Insights' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <TrendChart trends={initialTrends} />
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <CategoryChart categories={initialCategories} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'trends' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <TrendChart trends={initialTrends} />
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-medium text-gray-900 mb-3">Trend Analysis</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {initialTrends.reduce((sum, t) => sum + t.count, 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Memories</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {initialTrends.length > 0 ? 
                                                    Math.round(initialTrends.reduce((sum, t) => sum + t.count, 0) / initialTrends.length) : 0
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">Daily Average</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {initialTrends.length > 0 ? 
                                                    (initialTrends.reduce((sum, t) => sum + (t.sentiment || 0), 0) / initialTrends.length).toFixed(1) : '0.0'
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">Avg Sentiment</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <CategoryChart categories={initialCategories} />
                            </div>
                        )}

                        {activeTab === 'patterns' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <ActivityPattern patterns={initialPatterns} />
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="space-y-6">
                                {initialInsights.length > 0 ? (
                                    initialInsights.map((insight) => (
                                        <InsightCard key={insight.id} insight={insight} />
                                    ))
                                ) : (
                                    <div className="bg-white rounded-lg shadow p-12 text-center">
                                        <div className="text-gray-500 mb-4">
                                            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            No AI insights generated yet.
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            AI insights will appear here as your memory palace grows and patterns are discovered.
                                        </p>
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            Generate Insights
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
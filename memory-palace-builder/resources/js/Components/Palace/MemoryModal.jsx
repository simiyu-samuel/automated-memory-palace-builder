import React from 'react';

const MemoryModal = ({ memory, isOpen, onClose }) => {
    if (!isOpen || !memory) return null;

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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {memory.title}
                            </h2>
                            <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(memory.sentiment)}`}>
                                    {memory.sentiment}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    {memory.type}
                                </span>
                                {(memory.memory_date || memory.created_at) && (
                                    <span className="text-sm text-gray-500">
                                        {formatDate(memory.memory_date || memory.created_at)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {memory.description && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-700">{memory.description}</p>
                            </div>
                        )}

                        {/* Full Content */}
                        {memory.content && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    {memory.type === 'email' ? 'Email Content' : 'Content'}
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                                    <div className="text-gray-700 text-sm leading-relaxed">
                                        {memory.content.split('\n').map((line, index) => (
                                            <p key={index} className="mb-2 last:mb-0">
                                                {line.trim() || '\u00A0'}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {memory.tags && memory.tags.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {memory.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* People */}
                        {memory.people && memory.people.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">People</h3>
                                <div className="flex flex-wrap gap-2">
                                    {memory.people.map((person, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                                        >
                                            {person}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        {memory.location && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                                <p className="text-gray-700">{memory.location}</p>
                            </div>
                        )}

                        {/* 3D Objects */}
                        {memory.objects && memory.objects.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3D Objects</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {memory.objects.map((obj, index) => (
                                        <div key={index} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{obj.type || 'Memory Object'}</span>
                                                <div 
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: obj.color || '#6b7280' }}
                                                ></div>
                                            </div>
                                            {obj.position && (
                                                <div className="text-xs text-gray-500">
                                                    Position: ({obj.position.x?.toFixed(1) || 0}, {obj.position.y?.toFixed(1) || 0}, {obj.position.z?.toFixed(1) || 0})
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Memory Date */}
                        {memory.memory_date && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Memory Date</h3>
                                <p className="text-gray-700">{formatDate(memory.memory_date)}</p>
                            </div>
                        )}

                        {/* Sentiment Score */}
                        {(memory.sentiment_score !== undefined && memory.sentiment_score !== null) && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Sentiment Analysis</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                memory.sentiment_score > 0 ? 'bg-green-500' : 
                                                memory.sentiment_score < 0 ? 'bg-red-500' : 'bg-gray-400'
                                            }`}
                                            style={{ 
                                                width: `${Math.abs(typeof memory.sentiment_score === 'number' ? memory.sentiment_score : 0) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {typeof memory.sentiment_score === 'number' ? memory.sentiment_score.toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                if (memory.id || memory.memory_id) {
                                    window.open(`/memories/${memory.id || memory.memory_id}`, '_blank');
                                } else {
                                    alert('Memory ID not available');
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            View Full Memory
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoryModal;
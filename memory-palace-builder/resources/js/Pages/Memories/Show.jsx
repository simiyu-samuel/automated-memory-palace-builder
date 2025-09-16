import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ memory }) {
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
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Memory Details
                    </h2>
                    <Link
                        href={route('palace.index')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Palace
                    </Link>
                </div>
            }
        >
            <Head title={`Memory: ${memory.title}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
                <div className="mx-auto max-w-4xl">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6">
                            <h1 className="text-3xl font-bold text-white mb-4">
                                {memory.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(memory.sentiment)}`}>
                                    {memory.sentiment}
                                </span>
                                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                                    📧 {memory.type}
                                </span>
                                {memory.memory_date && (
                                    <span className="text-white/90 text-sm">
                                        📅 {formatDate(memory.memory_date)}
                                    </span>
                                )}
                            </div>
                            {memory.palace_room && (
                                <div className="text-white/90 text-sm">
                                    🏰 Located in: <span className="text-white font-medium">{memory.palace_room.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="p-8">
                            <div className="space-y-8">
                                {memory.description && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            📝 Description
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{memory.description}</p>
                                    </div>
                                )}

                                {memory.content && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            📄 {memory.type === 'email' ? 'Email Content' : 'Full Content'}
                                        </h3>
                                        <div className="bg-gray-50 border-l-4 border-blue-500 p-6 rounded-lg max-h-96 overflow-y-auto">
                                            <div className="text-gray-800 leading-relaxed">
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
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            🏷️ Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {memory.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
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
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            👥 People
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {memory.people.map((person, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
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
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            📍 Location
                                        </h3>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{memory.location}</p>
                                    </div>
                                )}

                                {/* Sentiment Analysis */}
                                {(memory.sentiment_score !== undefined && memory.sentiment_score !== null && typeof memory.sentiment_score === 'number') && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            📊 Sentiment Analysis
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 bg-gray-200 rounded-full h-4">
                                                    <div 
                                                        className={`h-4 rounded-full transition-all duration-300 ${
                                                            memory.sentiment_score > 0.5 ? 'bg-green-500' : 
                                                            memory.sentiment_score < 0.5 ? 'bg-red-500' : 'bg-gray-400'
                                                        }`}
                                                        style={{ 
                                                            width: `${Math.abs(typeof memory.sentiment_score === 'number' ? memory.sentiment_score : 0) * 100}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-gray-900 font-medium text-lg">
                                                    {typeof memory.sentiment_score === 'number' ? memory.sentiment_score.toFixed(2) : '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* External Link */}
                                {memory.external_url && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                                            🔗 External Link
                                        </h3>
                                        <a 
                                            href={memory.external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline bg-blue-50 p-4 rounded-lg block"
                                        >
                                            View Original Source →
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                                <Link
                                    href={route('palace.index')}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    ← Back to Palace
                                </Link>
                                
                                <div className="flex items-center space-x-3">
                                    {memory.is_favorite && (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                            ⭐ Favorite
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                        ID: {memory.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
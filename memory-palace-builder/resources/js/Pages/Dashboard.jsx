import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PalaceButton from '@/Components/PalaceButton';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">
                        🏰 Dashboard
                    </h2>
                    <PalaceButton href={route('palace.index')} variant="primary">
                        Enter Palace
                    </PalaceButton>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Welcome Section */}
                    <div className="glass-card p-8 mb-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Welcome to your Memory Palace! 🎆
                            </h1>
                            <p className="text-white/80 text-lg mb-6">
                                Your digital sanctuary is ready. Connect your accounts to start building your immersive 3D memory experience.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <PalaceButton href={route('palace.index')} size="lg">
                                    🏰 Explore Palace
                                </PalaceButton>
                                <PalaceButton href={route('settings.index')} variant="secondary" size="lg">
                                    ⚙️ Settings
                                </PalaceButton>
                            </div>
                        </div>
                    </div>

                    {/* Palace Overview */}
                    <div className="glass-card p-8 mb-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Palace Overview
                            </h2>
                            <p className="text-white/80 text-lg mb-6">
                                [Palace Overview Placeholder]
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="glass-card p-6 text-center">
                            <div className="text-3xl mb-2">📚</div>
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-white/70 text-sm">Memories Collected</div>
                        </div>
                        <div className="glass-card p-6 text-center">
                            <div className="text-3xl mb-2">🏠</div>
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-white/70 text-sm">Palace Rooms</div>
                        </div>
                        <div className="glass-card p-6 text-center">
                            <div className="text-3xl mb-2">🔗</div>
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-white/70 text-sm">Connected APIs</div>
                        </div>
                        <div className="glass-card p-6 text-center">
                            <div className="text-3xl mb-2">✨</div>
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-white/70 text-sm">AI Insights</div>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">📧</div>
                            <h3 className="text-xl font-bold text-white mb-3">Connect Gmail</h3>
                            <p className="text-white/70 mb-4">Import your emails and conversations to create memory objects in your palace.</p>
                            <PalaceButton className="w-full" variant="secondary">
                                Connect Gmail
                            </PalaceButton>
                        </div>

                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">📅</div>
                            <h3 className="text-xl font-bold text-white mb-3">Connect Calendar</h3>
                            <p className="text-white/70 mb-4">Transform your events and meetings into spatial memories.</p>
                            <PalaceButton className="w-full" variant="secondary">
                                Connect Calendar
                            </PalaceButton>
                        </div>

                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">📷</div>
                            <h3 className="text-xl font-bold text-white mb-3">Connect Photos</h3>
                            <p className="text-white/70 mb-4">Turn your photo memories into interactive 3D objects.</p>
                            <PalaceButton className="w-full" variant="secondary">
                                Connect Photos
                            </PalaceButton>
                        </div>

                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">🎵</div>
                            <h3 className="text-xl font-bold text-white mb-3">Connect Spotify</h3>
                            <p className="text-white/70 mb-4">Create musical memories from your listening history.</p>
                            <PalaceButton className="w-full" variant="secondary">
                                Connect Spotify
                            </PalaceButton>
                        </div>

                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-white mb-3">View Insights</h3>
                            <p className="text-white/70 mb-4">Discover patterns and insights from your digital life.</p>
                            <PalaceButton className="w-full" variant="secondary">
                                View Insights
                            </PalaceButton>
                        </div>

                        <div className="glass-card p-6">
                            <div className="text-4xl mb-4">⚙️</div>
                            <h3 className="text-xl font-bold text-white mb-3">Settings</h3>
                            <p className="text-white/70 mb-4">Customize your palace and manage privacy settings.</p>
                            <PalaceButton href={route('settings.index')} className="w-full" variant="secondary">
                                Open Settings
                            </PalaceButton>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

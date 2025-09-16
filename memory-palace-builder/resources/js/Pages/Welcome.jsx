import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, canLogin, canRegister }) {
    return (
        <>
            <Head title="Welcome to Memory Palace" />
            <div className="palace-bg min-h-screen relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="floating absolute top-1/4 left-1/4 w-3 h-3 bg-palace-gold/30 rounded-full"></div>
                    <div className="floating absolute top-1/3 right-1/4 w-4 h-4 bg-memory-purple/40 rounded-full"></div>
                    <div className="floating absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400/30 rounded-full"></div>
                    <div className="floating absolute bottom-1/3 right-1/3 w-3 h-3 bg-palace-gold/20 rounded-full"></div>
                    <div className="floating absolute top-1/2 left-1/6 w-1 h-1 bg-white/40 rounded-full"></div>
                    <div className="floating absolute top-2/3 right-1/6 w-2 h-2 bg-memory-purple/30 rounded-full"></div>
                    <div className="floating absolute top-3/4 left-2/3 w-2 h-2 bg-palace-gold/25 rounded-full"></div>
                    <div className="floating absolute bottom-1/6 left-1/5 w-1.5 h-1.5 bg-blue-400/35 rounded-full"></div>
                </div>

                {/* Header */}
                <header className="relative z-10 px-6 py-8">
                    <nav className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold hero-text">🏰 Memory Palace</h1>
                        </div>
                        
                        {auth.user ? (
                            <Link
                                href={route('palace.index')}
                                className="palace-btn-primary"
                            >
                                Enter Your Palace
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="palace-btn-secondary"
                                    >
                                        Log in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="palace-btn-primary"
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </div>
                        )}
                    </nav>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 px-6 pt-20 pb-32">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <div className="mb-8 animate-bounce">
                                <div className="text-9xl mb-4 drop-shadow-2xl">🏰</div>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-bold hero-text mb-8 drop-shadow-lg">
                                Memory Palace
                            </h1>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-5xl mx-auto border border-white/20">
                                <p className="text-2xl md:text-3xl text-white mb-6 font-medium">
                                    🤖 The world's first <span className="text-palace-gold font-bold">FULLY AUTOMATED</span> memory palace
                                </p>
                                <p className="text-lg text-white/90 leading-relaxed">
                                    Transform your emails, photos, and events into an interactive 3D palace where memories are spatially organized and visually explored. <span className="text-palace-gold font-semibold">No manual setup required</span> - connect your APIs and watch your palace generate automatically!
                                </p>
                            </div>
                            
                            {!auth.user && (
                                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                                    <Link
                                        href={route('register')}
                                        className="palace-btn-primary text-xl px-10 py-5 transform hover:scale-105 transition-all duration-200 shadow-2xl"
                                    >
                                        🚀 Build Your Palace Free
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="palace-btn-secondary text-xl px-10 py-5 transform hover:scale-105 transition-all duration-200"
                                    >
                                        🔑 Sign In
                                    </Link>
                                </div>
                            )}
                            
                            {auth.user && (
                                <div className="text-center">
                                    <Link
                                        href={route('palace.index')}
                                        className="palace-btn-primary text-xl px-12 py-6 transform hover:scale-105 transition-all duration-200 shadow-2xl"
                                    >
                                        🏰 Enter Your Palace
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Features Section */}
                        <div className="mb-20">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">✨ What Makes This Special</h2>
                                <p className="text-xl text-white/80 max-w-3xl mx-auto">
                                    Unlike traditional memory palace builders that require hours of manual setup, this system is <span className="text-palace-gold font-semibold">fully automated</span>
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* AI-Powered Processing */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-palace-gold/20">
                                    <div className="text-5xl mb-6">🤖</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Automatically Generates 3D Objects</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • AI-powered room assignment based on content analysis<br/>
                                        • Dynamic visual styling using sentiment analysis<br/>
                                        • Real-time updates as new memories are collected
                                    </p>
                                </div>

                                {/* Multiple Data Sources */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-memory-purple/20">
                                    <div className="text-5xl mb-6">🔗</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Multi-API Integration</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • Gmail, Calendar, Spotify, Photos<br/>
                                        • Automated workflows via MCP servers<br/>
                                        • Built for Postman Web Dev Challenge
                                    </p>
                                </div>

                                {/* 3D Visualization */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-blue-400/20">
                                    <div className="text-5xl mb-6">🌐</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Interactive 3D Navigation</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • Orbital controls with zoom and hover effects<br/>
                                        • Three.js powered 3D engine<br/>
                                        • Spatially organized memory objects
                                    </p>
                                </div>

                                {/* Real-time Updates */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-green-400/20">
                                    <div className="text-5xl mb-6">⚡</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Zero Manual Setup</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • Palace builds itself from your data<br/>
                                        • Instant results - working palace in seconds<br/>
                                        • No hours of manual configuration needed
                                    </p>
                                </div>

                                {/* Privacy First */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-red-400/20">
                                    <div className="text-5xl mb-6">🛡️</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Smart Search & Analytics</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • Full-text search across all memories<br/>
                                        • Advanced filters by type, sentiment, date<br/>
                                        • Memory statistics and trends
                                    </p>
                                </div>

                                {/* Insights & Patterns */}
                                <div className="glass-card p-8 text-center hover:scale-105 transition-all duration-300 border border-yellow-400/20">
                                    <div className="text-5xl mb-6">💡</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">MCP Server Integration</h3>
                                    <p className="text-white/80 leading-relaxed">
                                        • Custom MCP server with 3 specialized tools<br/>
                                        • Automated data collection from APIs<br/>
                                        • Dynamic 3D object generation
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Section */}
                        {!auth.user && (
                            <div className="text-center glass-card p-12">
                                <h2 className="text-4xl font-bold text-white mb-6">
                                    Ready to build your Memory Palace?
                                </h2>
                                <p className="text-xl text-white/80 mb-8">
                                    Join thousands of users who have transformed their digital lives into immersive 3D experiences.
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <Link
                                        href={route('register')}
                                        className="palace-btn-primary text-lg px-10 py-4"
                                    >
                                        Start Building Free
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="palace-btn-secondary text-lg px-10 py-4"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 px-6 py-8 border-t border-white/10">
                    <div className="max-w-7xl mx-auto text-center">
                        <p className="text-white/50 text-sm">
                            Transform your memories into an immersive 3D experience • Built with ❤️ for the Postman Hackathon
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

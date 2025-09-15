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
                            <div className="mb-8">
                                <h1 className="text-8xl mb-4">🏰</h1>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-bold hero-text mb-6">
                                Memory Palace
                            </h1>
                            <p className="text-2xl md:text-3xl text-white/80 mb-8 max-w-4xl mx-auto">
                                Transform your digital life into an immersive 3D experience
                            </p>
                            <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto">
                                Automatically convert your daily digital activities into a navigable 3D virtual palace where memories are stored as interactive objects.
                            </p>
                            
                            {!auth.user && (
                                <div className="flex justify-center space-x-6">
                                    <Link
                                        href={route('register')}
                                        className="palace-btn-primary text-lg px-8 py-4"
                                    >
                                        Build Your Palace
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="palace-btn-secondary text-lg px-8 py-4"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Features Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                            {/* AI-Powered Processing */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">🤖</div>
                                <h3 className="text-xl font-bold text-white mb-4">AI-Powered Processing</h3>
                                <p className="text-white/70">
                                    Advanced AI automatically processes your digital activities, extracting meaningful patterns and creating immersive 3D representations.
                                </p>
                            </div>

                            {/* Multiple Data Sources */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">🔗</div>
                                <h3 className="text-xl font-bold text-white mb-4">Multiple Data Sources</h3>
                                <p className="text-white/70">
                                    Connect Gmail, Google Calendar, Photos, Spotify, and more. Your palace grows automatically as you live your digital life.
                                </p>
                            </div>

                            {/* 3D Visualization */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">🌐</div>
                                <h3 className="text-xl font-bold text-white mb-4">3D Visualization</h3>
                                <p className="text-white/70">
                                    Navigate through beautifully crafted 3D rooms where your memories are organized spatially and thematically.
                                </p>
                            </div>

                            {/* Real-time Updates */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-bold text-white mb-4">Real-time Updates</h3>
                                <p className="text-white/70">
                                    Your palace evolves in real-time as new memories are created, processed, and automatically placed in themed rooms.
                                </p>
                            </div>

                            {/* Privacy First */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">🛡️</div>
                                <h3 className="text-xl font-bold text-white mb-4">Privacy First</h3>
                                <p className="text-white/70">
                                    Your memories are yours. Advanced encryption and granular privacy controls keep your data secure and private.
                                </p>
                            </div>

                            {/* Insights & Patterns */}
                            <div className="glass-card p-8 text-center">
                                <div className="text-4xl mb-4">💡</div>
                                <h3 className="text-xl font-bold text-white mb-4">Insights & Patterns</h3>
                                <p className="text-white/70">
                                    Discover hidden patterns in your life, get personalized insights, and understand your digital habits like never before.
                                </p>
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

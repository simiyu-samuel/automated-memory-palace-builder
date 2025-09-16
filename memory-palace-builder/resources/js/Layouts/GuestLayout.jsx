import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="auth-bg min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="floating absolute top-1/4 left-1/4 w-2 h-2 bg-palace-gold/30 rounded-full"></div>
                <div className="floating absolute top-1/3 right-1/4 w-3 h-3 bg-memory-purple/40 rounded-full"></div>
                <div className="floating absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-400/30 rounded-full"></div>
                <div className="floating absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-palace-gold/20 rounded-full"></div>
                <div className="floating absolute top-1/2 left-1/6 w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="floating absolute top-2/3 right-1/6 w-2 h-2 bg-memory-purple/30 rounded-full"></div>
            </div>

            {/* Logo and branding */}
            <div className="mb-10 text-center z-10">
                <Link href="/" className="inline-block group">
                    <div className="mb-6">
                        <div className="text-7xl mb-4 group-hover:animate-bounce transition-all duration-300 drop-shadow-2xl">🏰</div>
                        <div className="text-4xl font-bold hero-text mb-3 drop-shadow-lg">Memory Palace</div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20">
                            <p className="text-white/90 text-sm font-medium">Your digital sanctuary for memories</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Auth form container */}
            <div className="w-full sm:max-w-lg px-8 py-10 glass-card relative z-10 border border-white/20 shadow-2xl">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center z-10">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                    <p className="text-white/70 text-sm font-medium mb-2">
                        ✨ Transform your digital life into an immersive 3D experience
                    </p>
                    <p className="text-white/50 text-xs">
                        Built for the Postman Web Dev Challenge Hackathon
                    </p>
                </div>
            </div>
        </div>
    );
}

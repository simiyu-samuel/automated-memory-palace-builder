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
            <div className="mb-8 text-center z-10">
                <Link href="/" className="inline-block">
                    <div className="mb-4">
                        <h1 className="text-6xl mb-2">🏰</h1>
                        <div className="text-3xl font-bold hero-text mb-2">Memory Palace</div>
                        <p className="text-white/70 text-sm">Your digital sanctuary for memories</p>
                    </div>
                </Link>
            </div>

            {/* Auth form container */}
            <div className="w-full sm:max-w-md px-6 py-8 glass-card relative z-10">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-white/50 text-xs z-10">
                <p>Transform your digital life into an immersive 3D experience</p>
            </div>
        </div>
    );
}

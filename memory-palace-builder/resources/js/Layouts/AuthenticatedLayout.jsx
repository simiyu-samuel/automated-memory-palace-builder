import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Modern Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        {/* Logo and Brand */}
                        <div className="flex items-center space-x-8">
                            <Link 
                                href="/palace" 
                                className="flex items-center space-x-2 text-gray-800 font-bold text-xl hover:text-blue-600 transition-all duration-200 group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">🏰</span>
                                <span className="hidden sm:block">Memory Palace</span>
                            </Link>
                            
                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center space-x-1">
                                {[
                                    { href: route('palace.index'), label: '🏠 Palace', current: 'palace.index' },
                                    { href: route('memories.index'), label: '📚 Memories', current: 'memories.index' },
                                    { href: route('palace.search'), label: '🔍 Search', current: 'palace.search' },
                                    { href: route('palace.insights'), label: '📊 Insights', current: 'palace.insights' },
                                    { href: route('settings.index'), label: '⚙️ Settings', current: 'settings.index' }
                                ].map((item) => (
                                    <Link
                                        key={item.current}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            route().current(item.current)
                                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* User Menu - Desktop */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <div className="flex items-center space-x-3 px-3 py-2 bg-white/60 rounded-lg">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-gray-700 text-sm font-medium">{user.name}</span>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await axios.post('/logout');
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('Logout failed:', error);
                                    }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                            >
                                🚪 Logout
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center lg:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path 
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'} 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M4 6h16M4 12h16M4 18h16" 
                                    />
                                    <path 
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'} 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M6 18L18 6M6 6l12 12" 
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200`}>
                    <div className="px-4 py-3 space-y-1">
                        {/* User Info */}
                        <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-gray-900 font-medium">{user.name}</div>
                                <div className="text-gray-500 text-sm">{user.email}</div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        {[
                            { href: route('palace.index'), label: '🏠 Palace', current: 'palace.index' },
                            { href: route('memories.index'), label: '📚 Memories', current: 'memories.index' },
                            { href: route('palace.search'), label: '🔍 Search', current: 'palace.search' },
                            { href: route('palace.insights'), label: '📊 Insights', current: 'palace.insights' },
                            { href: route('settings.index'), label: '⚙️ Settings', current: 'settings.index' }
                        ].map((item) => (
                            <Link
                                key={item.current}
                                href={item.href}
                                className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                                    route().current(item.current)
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                                onClick={() => setShowingNavigationDropdown(false)}
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Logout Button */}
                        <button
                            onClick={async () => {
                                try {
                                    await axios.post('/logout');
                                    window.location.reload();
                                } catch (error) {
                                    console.error('Logout failed:', error);
                                }
                            }}
                            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                        >
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Header Section */}
            {header && (
                <header className="bg-white/60 backdrop-blur-sm shadow-sm border-b border-white/20">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="text-gray-900">
                            {header}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none"></div>
                <div className="relative z-10">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 mt-auto">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <div className="text-gray-600 text-sm">
                            © 2025 Memory Palace Builder - AI-Powered 3D Memory Management
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>🚀 Built for Postman Hackathon</span>
                            <span>•</span>
                            <span>🧠 Powered by MCP</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
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
        <div className="palace-bg min-h-screen flex flex-col">
            <nav className="palace-nav">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center space-x-6">
                            <Link href="/palace" className="text-gray-800 font-bold text-xl hover:text-blue-600 transition-colors">
                                🏰 Memory Palace
                            </Link>
                            <div className="hidden space-x-6 sm:flex">
                                <Link href={route('palace.index')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('palace.index') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Palace
                                </Link>
                                <Link href={route('memories.index')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('memories.index') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Memories
                                </Link>
                                <Link href={route('palace.search')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('palace.search') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Search
                                </Link>
                                <Link href={route('palace.timeline')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('palace.timeline') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Timeline
                                </Link>
                                <Link href={route('palace.insights')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('palace.insights') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Insights
                                </Link>
                                <Link href={route('settings.index')} className={`text-gray-700 hover:text-gray-900 transition-colors ${route().current('settings.index') ? 'text-gray-900 font-semibold' : ''}`}>
                                    Settings
                                </Link>
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center space-x-3">
                            <div className="text-gray-700 text-sm">{user.name}</div>
                            <button
                                onClick={async () => {
                                    try {
                                        await axios.post('/logout');
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('Logout failed:', error);
                                    }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                🚪 Logout
                            </button>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10 focus:outline-none"
                            >
                                <svg className="h-6 w-6 text-gray-700" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    <path className={showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden bg-white border-t'}>
                    <div className="space-y-1 pb-3 pt-2 px-4">
                        <Link href={route('palace.index')} className="block text-gray-700 py-2">Palace</Link>
                        <Link href={route('memories.index')} className="block text-gray-700 py-2">Memories</Link>
                        <Link href={route('palace.search')} className="block text-gray-700 py-2">Search</Link>
                        <Link href={route('palace.timeline')} className="block text-gray-700 py-2">Timeline</Link>
                        <Link href={route('palace.insights')} className="block text-gray-700 py-2">Insights</Link>
                        <Link href={route('settings.index')} className="block text-gray-700 py-2">Settings</Link>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.post('/logout');
                                    window.location.reload();
                                } catch (error) {
                                    console.error('Logout failed:', error);
                                }
                            }}
                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full transition-colors"
                        >
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-gray-900">
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1">{children}</main>
        </div>
    );
}

import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function PalaceLayout({ children, title = 'Memory Palace' }) {
    return (
        <>
            <Head title={title} />
            
            <div className="palace-container">
                <nav className="palace-nav">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <Link 
                                href="/palace" 
                                className="text-white font-bold text-xl hover:text-palace-gold transition-colors"
                            >
                                🏰 Memory Palace
                            </Link>
                            
                            <div className="flex space-x-4">
                                <Link 
                                    href="/palace" 
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    Palace
                                </Link>
                                <Link 
                                    href="/memories" 
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    Memories
                                </Link>
                                <Link 
                                    href="/insights" 
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    Insights
                                </Link>
                                <Link 
                                    href="/settings" 
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    Settings
                                </Link>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-white/60 text-sm">
                                Welcome, Guest
                            </div>
                            <button className="bg-palace-gold text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors">
                                Connect APIs
                            </button>
                        </div>
                    </div>
                </nav>
                
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </>
    );
}

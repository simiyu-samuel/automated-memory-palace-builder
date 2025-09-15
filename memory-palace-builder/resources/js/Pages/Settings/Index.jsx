import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Settings({ auth, apiConnections = [] }) {
    const [activeTab, setActiveTab] = useState('connections');
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [connectionForm, setConnectionForm] = useState({});
    
    const handleConnect = (provider) => {
        setSelectedProvider(provider);
        setConnectionForm(getProviderFields(provider));
        setShowConnectionModal(true);
    };
    
    const handleConfigure = (connection) => {
        setSelectedProvider(connection.provider);
        setConnectionForm({
            id: connection.id,
            provider: connection.provider,
            email: connection.email,
            account_name: connection.metadata?.account_name || connection.provider + ' Account',
            client_id: connection.metadata?.client_id || '',
            client_secret: connection.metadata?.client_secret || '',
            api_key: connection.metadata?.api_key || '',
            webhook_url: connection.metadata?.webhook_url || '',
            scopes: connection.scopes || [],
            sync_frequency: connection.metadata?.sync_frequency || 'hourly'
        });
        setShowConnectionModal(true);
    };
    
    const getProviderFields = (provider) => {
        const baseFields = {
            provider: provider.toLowerCase().replace(' ', '_'),
            email: '',
            account_name: provider + ' Account',
            scopes: getDefaultScopes(provider),
            sync_frequency: 'hourly'
        };
        
        switch (provider) {
            case 'Gmail':
            case 'Google Calendar':
            case 'Google Photos':
                return {
                    ...baseFields,
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                    client_secret: '',
                    redirect_uri: window.location.origin + '/auth/google/callback'
                };
            case 'Spotify':
                return {
                    ...baseFields,
                    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
                    client_secret: '',
                    redirect_uri: window.location.origin + '/auth/spotify/callback'
                };
            case 'Location Services':
                return {
                    ...baseFields,
                    api_key: import.meta.env.VITE_LOCATION_API_KEY || '',
                    webhook_url: ''
                };
            default:
                return baseFields;
        }
    };
    
    const getDefaultScopes = (provider) => {
        const scopeMap = {
            'Gmail': ['https://www.googleapis.com/auth/gmail.readonly'],
            'Google Calendar': ['https://www.googleapis.com/auth/calendar.readonly'],
            'Google Photos': ['https://www.googleapis.com/auth/photoslibrary.readonly'],
            'Spotify': ['user-read-recently-played', 'user-library-read'],
            'Location Services': ['location-read']
        };
        return scopeMap[provider] || [];
    };
    
    const handleSubmitConnection = async (e) => {
        e.preventDefault();
        try {
            const url = connectionForm.id ? `/api/v1/connections/${connectionForm.id}` : '/api/v1/connections';
            const method = connectionForm.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(connectionForm)
            });
            
            if (response.ok) {
                alert(connectionForm.id ? 'Connection updated successfully!' : 'Connection created successfully!');
                setShowConnectionModal(false);
                window.location.reload();
            } else {
                const error = await response.json();
                alert('Operation failed: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            alert('Operation failed: ' + error.message);
        }
    };
    
    const handleSync = async (connectionId) => {
        try {
            const response = await fetch(`/api/v1/connections/${connectionId}/sync`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            if (response.ok) {
                alert('Sync started successfully!');
                window.location.reload();
            }
        } catch (error) {
            alert('Sync failed. Please try again.');
        }
    };
    
    const handleDisconnect = async (connectionId) => {
        if (confirm('Are you sure you want to disconnect this service?')) {
            try {
                const response = await fetch(`/api/v1/connections/${connectionId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                });
                if (response.ok) {
                    alert('Service disconnected successfully!');
                    window.location.reload();
                }
            } catch (error) {
                alert('Disconnect failed. Please try again.');
            }
        }
    };

    const ConnectionCard = ({ connection }) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'active': return 'text-green-600 bg-green-100';
                case 'error': return 'text-red-600 bg-red-100';
                case 'pending': return 'text-yellow-600 bg-yellow-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        };

        const getProviderIcon = (provider) => {
            const icons = {
                gmail: '📧',
                google_calendar: '📅',
                google_photos: '📸',
                spotify: '🎵',
                location: '📍'
            };
            return icons[provider] || '🔗';
        };

        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getProviderIcon(connection.provider)}</span>
                        <div>
                            <h3 className="font-semibold text-gray-900 capitalize">
                                {connection.provider.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-gray-600">{connection.email || connection.metadata?.account_name || 'Connected Account'}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.is_active ? 'active' : 'inactive')}`}>
                        {connection.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="text-gray-900">
                            {connection.last_sync_at ? 
                                new Date(connection.last_sync_at).toLocaleDateString() : 
                                'Never'
                            }
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Memories Collected:</span>
                        <span className="text-gray-900">{connection.total_memories || 0}</span>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleSync(connection.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        Sync Now
                    </button>
                    <button 
                        onClick={() => handleConfigure(connection)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                        Configure
                    </button>
                    <button 
                        onClick={() => handleDisconnect(connection.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    };

    const AddConnectionCard = ({ provider, description, icon }) => (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <div className="text-center">
                <span className="text-4xl mb-3 block">{icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{provider}</h3>
                <p className="text-sm text-gray-600 mb-4">{description}</p>
                <button 
                    onClick={() => handleConnect(provider)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Connect
                </button>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Settings</h2>}
        >
            <Head title="Settings" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {[
                                    { id: 'connections', name: 'API Connections' },
                                    { id: 'privacy', name: 'Privacy & Data' },
                                    { id: 'palace', name: 'Palace Settings' },
                                    { id: 'notifications', name: 'Notifications' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'connections' && (
                            <div>
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connected Services</h3>
                                    <p className="text-gray-600">Manage your API connections to automatically collect memories.</p>
                                </div>

                                {apiConnections.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {apiConnections.map((connection) => (
                                            <ConnectionCard key={connection.id} connection={connection} />
                                        ))}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Connections</h3>
                                    <p className="text-gray-600">Connect new services to expand your memory collection.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AddConnectionCard provider="Gmail" description="Import emails and conversations" icon="📧" />
                                    <AddConnectionCard provider="Google Calendar" description="Sync events and meetings" icon="📅" />
                                    <AddConnectionCard provider="Google Photos" description="Import photos and albums" icon="📸" />
                                    <AddConnectionCard provider="Spotify" description="Track listening history" icon="🎵" />
                                    <AddConnectionCard provider="Location Services" description="Record location data" icon="📍" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Privacy Controls</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Data Retention</h4>
                                            <p className="text-sm text-gray-600">How long to keep your memory data</p>
                                        </div>
                                        <select className="px-3 py-2 border border-gray-300 rounded-md">
                                            <option>Forever</option>
                                            <option>5 years</option>
                                            <option>2 years</option>
                                            <option>1 year</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">AI Processing</h4>
                                            <p className="text-sm text-gray-600">Allow AI analysis of your memories</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-medium text-gray-900 mb-3">Data Export & Deletion</h4>
                                    <div className="flex space-x-3">
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            Export My Data
                                        </button>
                                        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                                            Delete All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'palace' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Palace Settings</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Room Theme</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option>Modern</option>
                                            <option>Classical</option>
                                            <option>Minimalist</option>
                                            <option>Cozy</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Memory Object Density</label>
                                        <input type="range" min="1" max="10" defaultValue="5" className="w-full" />
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Sparse</span>
                                            <span>Dense</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">New Memory Alerts</h4>
                                            <p className="text-sm text-gray-600">Get notified when new memories are processed</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Connection Modal */}
            {showConnectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {connectionForm.id ? 'Configure' : 'Connect'} {selectedProvider}
                            </h3>
                            <button 
                                onClick={() => setShowConnectionModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitConnection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Name
                                </label>
                                <input
                                    type="text"
                                    value={connectionForm.account_name || ''}
                                    onChange={(e) => setConnectionForm({...connectionForm, account_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email/Username
                                </label>
                                <input
                                    type="email"
                                    value={connectionForm.email || ''}
                                    onChange={(e) => setConnectionForm({...connectionForm, email: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Google Services Fields */}
                            {['Gmail', 'Google Calendar', 'Google Photos'].includes(selectedProvider) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Client ID
                                        </label>
                                        <input
                                            type="text"
                                            value={connectionForm.client_id || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, client_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your Google OAuth Client ID"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Client Secret
                                        </label>
                                        <input
                                            type="password"
                                            value={connectionForm.client_secret || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, client_secret: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your Google OAuth Client Secret"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* Spotify Fields */}
                            {selectedProvider === 'Spotify' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Client ID
                                        </label>
                                        <input
                                            type="text"
                                            value={connectionForm.client_id || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, client_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your Spotify App Client ID"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Client Secret
                                        </label>
                                        <input
                                            type="password"
                                            value={connectionForm.client_secret || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, client_secret: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your Spotify App Client Secret"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* Location Services Fields */}
                            {selectedProvider === 'Location Services' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={connectionForm.api_key || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, api_key: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your Location API Key"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Webhook URL (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={connectionForm.webhook_url || ''}
                                            onChange={(e) => setConnectionForm({...connectionForm, webhook_url: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://your-app.com/webhooks/location"
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Permissions (Scopes)
                                </label>
                                <div className="text-xs text-gray-500 mb-2">
                                    {connectionForm.scopes?.join(', ')}
                                </div>
                                <textarea
                                    value={connectionForm.scopes?.join('\n') || ''}
                                    onChange={(e) => setConnectionForm({...connectionForm, scopes: e.target.value.split('\n').filter(s => s.trim())})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="One scope per line"
                                />
                            </div>
                            
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowConnectionModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Connect
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
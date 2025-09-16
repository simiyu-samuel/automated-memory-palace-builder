import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Toast from '@/Components/Toast';

export default function Settings({ auth, apiConnections = [] }) {
    const [activeTab, setActiveTab] = useState('connections');
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [connectionForm, setConnectionForm] = useState({});
    const [toast, setToast] = useState(null);
    const [syncingConnections, setSyncingConnections] = useState(new Set());
    
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

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
        const providerMap = {
            'Gmail': 'gmail',
            'Google Calendar': 'google_calendar', 
            'Google Photos': 'google_photos',
            'Spotify': 'spotify',
            'Location Services': 'location_services'
        };
        
        const baseFields = {
            provider: providerMap[provider] || provider.toLowerCase().replace(' ', '_'),
            email: '',
            account_name: provider + ' Account',
            scopes: getDefaultScopes(provider),
            sync_frequency: 'hourly'
        };
        
        return baseFields;
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
        console.log('Form submission started', { connectionForm, selectedProvider });
        
        try {
            const url = connectionForm.id ? `/api/v1/connections/${connectionForm.id}` : '/api/v1/connections';
            const method = connectionForm.id ? 'PUT' : 'POST';
            
            console.log('Making request to:', url, 'with data:', connectionForm);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            console.log('CSRF Token:', csrfToken);
            
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(connectionForm),
                credentials: 'same-origin'
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                
                if (!connectionForm.id && result.oauth_url) {
                    console.log('OAuth URL found, redirecting to:', result.oauth_url);
                    setShowConnectionModal(false);
                    window.location.href = result.oauth_url;
                } else {
                    showToast(connectionForm.id ? 'Connection updated successfully!' : 'Connection created successfully!', 'success');
                    setShowConnectionModal(false);
                    setTimeout(() => window.location.reload(), 1500);
                }
            } else {
                const error = await response.json();
                console.log('Error response:', error);
                showToast('Operation failed: ' + (error.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Connection creation error:', error);
            showToast('Operation failed: ' + error.message, 'error');
        }
    };
    
    const handleSync = async (connectionId) => {
        setSyncingConnections(prev => new Set([...prev, connectionId]));
        showToast('🔄 Sync in progress via MCP server... Fetching your latest data', 'info');
        
        try {
            const response = await fetch(`/api/v1/connections/${connectionId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast(`✅ ${data.message} - ${data.memories_created || 0} new memories via MCP!`, 'success');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showToast('❌ MCP Sync failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showToast('❌ MCP Sync failed: ' + error.message, 'error');
        } finally {
            setSyncingConnections(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
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
                    showToast('Service disconnected successfully!', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (error) {
                showToast('Disconnect failed. Please try again.', 'error');
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

        const isSync = syncingConnections.has(connection.id);

        return (
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.is_active ? 'active' : 'inactive')}`}>
                        {connection.is_active ? '✅ Active' : '⚠️ Inactive'}
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
                        <span className="text-gray-900 font-semibold">{connection.memories_count || 0}</span>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleSync(connection.id)}
                        disabled={isSync}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                            isSync 
                                ? 'bg-blue-100 text-blue-600 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isSync ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                            </span>
                        ) : (
                            '🔄 Sync Now'
                        )}
                    </button>
                    <button 
                        onClick={() => handleConfigure(connection)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                        ⚙️ Configure
                    </button>
                    <button 
                        onClick={() => handleDisconnect(connection.id)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                        🗑️ Remove
                    </button>
                </div>
            </div>
        );
    };

    const AddConnectionCard = ({ provider, description, icon }) => (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all hover:shadow-xl">
            <div className="text-center">
                <span className="text-4xl mb-3 block">{icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{provider}</h3>
                <p className="text-sm text-gray-600 mb-4">{description}</p>
                <button 
                    onClick={() => handleConnect(provider)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                    Connect
                </button>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">⚙️ Settings</h2>
                </div>
            }
        >
            <Head title="Settings" />

            <div className="py-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {[
                                    { id: 'connections', name: '🔗 API Connections' },
                                    { id: 'privacy', name: '🔒 Privacy & Data' },
                                    { id: 'palace', name: '🏰 Palace Settings' },
                                    { id: 'notifications', name: '🔔 Notifications' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Data Privacy Controls</h3>
                                
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
                                            📥 Export My Data
                                        </button>
                                        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                                            🗑️ Delete All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'palace' && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏰 3D Palace Settings</h3>
                                
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
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notification Preferences</h3>
                                
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
                                    {selectedProvider === 'Spotify' ? 'Spotify Username/Email' : 'Email'}
                                </label>
                                <input
                                    type="text"
                                    value={connectionForm.email || ''}
                                    onChange={(e) => setConnectionForm({...connectionForm, email: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            {selectedProvider === 'Gmail' && (
                                <div className="bg-red-50 p-3 rounded-md text-sm text-red-800">
                                    📧 <strong>Gmail Integration:</strong> Import emails as 3D memory objects. Requires Gmail API access with automatic token refresh.
                                </div>
                            )}
                            {selectedProvider === 'Google Calendar' && (
                                <div className="bg-green-50 p-3 rounded-md text-sm text-green-800">
                                    📅 <strong>Calendar Integration:</strong> Import events and meetings. Requires Calendar API access with automatic token refresh.
                                </div>
                            )}
                            {selectedProvider === 'Spotify' && (
                                <div className="bg-green-50 p-3 rounded-md text-sm text-green-800">
                                    🎵 <strong>Spotify Integration:</strong> Import listening history. Requires Spotify Premium for full access.
                                </div>
                            )}
                            {!['Gmail', 'Google Calendar', 'Spotify'].includes(selectedProvider) && (
                                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                    🔗 You'll be redirected to {selectedProvider} to authorize access after clicking Connect.
                                </div>
                            )}
                            
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
                                    Connect & Authorize
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
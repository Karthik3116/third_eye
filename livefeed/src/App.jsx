import { useEffect, useState } from 'react';
import { Smartphone, Wifi, WifiOff, Clock, Eye, Monitor } from 'lucide-react';

function App() {
  const [devices, setDevices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      setConnectionStatus('connecting');
      const res = await fetch(
        'https://third-eye-txe8.onrender.com/recent_background_api_data'
      );
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      setDevices(data);
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setConnectionStatus('error');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <Wifi className="w-4 h-4 animate-pulse" />;
      case 'error': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getDeviceCount = () => Object.keys(devices).length;
  const getActiveDevices = () => {
    return Object.values(devices).filter(device => {
      if (!device.received_at) return false;
      const deviceTime = new Date(device.received_at);
      const now = new Date();
      return (now - deviceTime) < 30000; // Active if updated within 30 seconds
    }).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Mobile Feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, purple 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, blue 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Live Mobile Dashboard
                </h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">
                  Real-time monitoring of connected devices
                </p>
              </div>
            </div>

            {/* Status Panel */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">
                  {getActiveDevices()}/{getDeviceCount()} Active
                </span>
              </div>

              {lastUpdate && (
                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-xs">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Devices Grid */}
        {getDeviceCount() === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-8 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10 text-center">
              <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Devices Connected</h3>
              <p className="text-gray-400">Waiting for mobile devices to connect...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Object.entries(devices).map(([deviceName, deviceData]) => {
              const { data, received_at } = deviceData;
              const isActive = received_at && (new Date() - new Date(received_at)) < 30000;
              const deviceTime = received_at ? new Date(received_at) : null;

              return (
                <div
                  key={deviceName}
                  className="group relative bg-black/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'} shadow-lg`}></div>
                  </div>

                  {/* Device Header */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">
                          {deviceName}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-300">
                          <Eye className="w-3 h-3" />
                          <span>Live Feed</span>
                        </div>
                      </div>
                    </div>
                    
                    {deviceTime && (
                      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {deviceTime.toLocaleDateString()} at {deviceTime.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Screenshot Display */}
                  <div className="aspect-[9/16] bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    {data?.screenshot_png_b64 ? (
                      <>
                        <img
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={`data:image/png;base64,${data.screenshot_png_b64}`}
                          alt={`${deviceName} Screenshot`}
                          loading="lazy"
                        />
                        {/* Overlay gradient for better readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <Monitor className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm text-center px-4">
                          No screenshot available
                        </p>
                        <p className="text-xs text-center px-4 mt-1 opacity-75">
                          Waiting for device data...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Device Footer */}
                  <div className="p-3 bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1 font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        {isActive ? 'Online' : 'Offline'}
                      </span>
                      {deviceTime && (
                        <span className="text-gray-400">
                          {Math.round((new Date() - deviceTime) / 1000)}s ago
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Stats */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-sm">
              <span className="text-gray-400">Total Devices:</span>
              <span className="text-white font-bold ml-1">{getDeviceCount()}</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="text-sm">
              <span className="text-gray-400">Active:</span>
              <span className="text-green-400 font-bold ml-1">{getActiveDevices()}</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="text-sm">
              <span className="text-gray-400">Auto-refresh:</span>
              <span className="text-blue-400 font-bold ml-1">5s</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
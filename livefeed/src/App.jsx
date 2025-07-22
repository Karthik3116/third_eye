
// // src/App.jsx
// import { useEffect, useState } from 'react';
// import {
//   Smartphone, Wifi, WifiOff, Clock,
//   Eye, Monitor, Battery, Volume2
// } from 'lucide-react';
// import './App.css';

// const BASE_URL = 'https://third-eye-txe8.onrender.com';

// export default function App() {
//   const [accessKey,   setAccessKey]   = useState(null);
//   const [keyInput,    setKeyInput]    = useState('');
//   const [isPosting,   setIsPosting]   = useState(false);
//   const [devicesMap,  setDevicesMap]  = useState({});
//   const [loading,     setLoading]     = useState(false);
//   const [status,      setStatus]      = useState('disconnected');
//   const [lastUpdate,  setLastUpdate]  = useState(null);

//   // 1) Fetch device data every 5s
//   useEffect(() => {
//     if (!accessKey) return;

//     async function fetchData() {
//       try {
//         setStatus('connecting');
//         const res = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
//         if (!res.ok) throw new Error();
//         const json = await res.json();

//         // normalize into { uid: { data, received_at } }
//         let map = {};
//         if (accessKey === 'professor') {
//           // admin sees everything
//           map = json;
//         } else if (json[accessKey]) {
//           // shape: { "<uid>": {...} }
//           map = json;
//         } else if (json.data && json.received_at) {
//           // shape: { data, received_at }
//           map = { [accessKey]: json };
//         } else {
//           // unexpected, keep empty
//           map = {};
//         }

//         setDevicesMap(map);
//         setStatus('connected');
//         setLastUpdate(new Date());
//       } catch {
//         setStatus('error');
//       } finally {
//         setLoading(false);
//       }
//     }

//     setLoading(true);
//     fetchData();
//     const iv = setInterval(fetchData, 5000);
//     return () => clearInterval(iv);
//   }, [accessKey]);

//   // 2) Toggle Start/Stop Posting
//   const togglePosting = async () => {
//     const enable = !isPosting;
//     try {
//       const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ capture_enabled: enable })
//       });
//       if (res.ok) {
//         setIsPosting(enable);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   // 3) Login screen
//   if (!accessKey) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900">
//         <form
//           onSubmit={e => { e.preventDefault(); setAccessKey(keyInput.trim()); }}
//           className="bg-gray-800 p-8 rounded-xl shadow-lg"
//         >
//           <h2 className="text-white text-2xl mb-4">Enter Access Key</h2>
//           <input
//             type="text"
//             value={keyInput}
//             onChange={e => setKeyInput(e.target.value)}
//             placeholder="Your code"
//             className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white"
//           />
//           <button
//             type="submit"
//             className="w-full bg-purple-600 text-white py-2 rounded"
//           >
//             Submit
//           </button>
//         </form>
//       </div>
//     );
//   }

//   // 4) Loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900">
//         <div className="text-white text-lg">Loading…</div>
//       </div>
//     );
//   }

//   // 5) Build a flat list of devices
//   const allDevices = Object.entries(devicesMap).map(([uid, entry]) => ({
//     uid,
//     ...entry.data,
//     received_at: entry.received_at
//   }));

//   const activeCount = allDevices.filter(d =>
//     Date.now() - new Date(d.received_at) < 30_000
//   ).length;

//   // 6) Dashboard
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
//       <header className="p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
//             <Monitor className="w-8 h-8 text-white"/>
//           </div>
//           <div>
//             <h1 className="text-4xl font-black">Live Dashboard</h1>
//             <p className="text-gray-400">{`Device: ${accessKey}`}</p>
//           </div>
//         </div>

//         <button
//           onClick={togglePosting}
//           className={`px-4 py-2 rounded-full font-medium ${
//             isPosting ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
//           }`}
//         >
//           {isPosting ? 'Stop Posting' : 'Start Posting'}
//         </button>

//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/10">
//             {status === 'connecting'
//               ? <Wifi className="w-4 h-4 animate-pulse"/>
//               : status === 'error'
//               ? <WifiOff className="w-4 h-4"/>
//               : <Wifi className="w-4 h-4"/>}
//             <span className={`text-sm font-medium ${
//               status==='connected'  ? 'text-green-400' :
//               status==='connecting' ? 'text-yellow-400' :
//                                      'text-red-400'
//             }`}>
//               {status[0].toUpperCase() + status.slice(1)}
//             </span>
//           </div>
//           <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/10">
//             <Smartphone className="w-4 h-4 text-blue-400"/>
//             <span className="text-white text-sm font-medium">
//               {activeCount}/{allDevices.length} Active
//             </span>
//           </div>
//           {lastUpdate && (
//             <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/10">
//               <Clock className="w-4 h-4 text-gray-400"/>
//               <span className="text-gray-300 text-xs">
//                 {lastUpdate.toLocaleTimeString()}
//               </span>
//             </div>
//           )}
//         </div>
//       </header>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 mt-4">
//         {allDevices.map(d => {
//           const isActive = Date.now() - new Date(d.received_at) < 30_000;
//           const ts = new Date(d.received_at);
//           return (
//             <div
//               key={d.uid}
//               className="bg-black/40 rounded-2xl overflow-hidden"
//             >
//               <div className="p-3 flex justify-between bg-gradient-to-r from-purple-500/20 to-blue-500/20">
//                 <span className="font-bold truncate">{d.device_name}</span>
//                 <span className={`h-3 w-3 rounded-full ${
//                   isActive ? 'bg-green-400' : 'bg-red-400'
//                 }`} />
//               </div>

//               <div className="aspect-[9/16] bg-gray-900 flex items-center justify-center">
//                 {d.screenshot_png_b64
//                   ? <img
//                       src={`data:image/webp;base64,${d.screenshot_png_b64}`}
//                       alt="screenshot"
//                       className="w-full h-full object-contain"
//                       loading="lazy"
//                     />
//                   : <div className="text-gray-500 text-center px-4">
//                       No screenshot
//                     </div>}
//               </div>

//               <div className="p-3 bg-black/30 flex justify-between text-xs">
//                 <span className={isActive ? 'text-green-400' : 'text-red-400'}>
//                   {isActive ? 'Online' : 'Offline'}
//                 </span>
//                 <span className="text-gray-400">
//                   {Math.round((Date.now() - ts.getTime())/1000)}s ago
//                 </span>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Clock,
  Monitor,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Power,
  Download,
  X,
  Activity,
  Battery,
  Signal,
  Globe,
  Maximize2,
  Minimize2,
  RotateCcw,
  Share,
  Info
} from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function App() {
  // State management
  const [accessKey, setAccessKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [refreshRate, setRefreshRate] = useState(3000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  
  const intervalRef = useRef(null);

  // Enhanced polling with single device focus
  useEffect(() => {
    if (!accessKey || !isPosting || !autoRefresh) return;
    setLoading(true);

    const fetchData = async () => {
      setStatus('connecting');
      try {
        const res = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        let device = null;
        
        // Handle different response structures
        if (accessKey === 'professor') {
          // Get the first/latest device from professor response
          const devices = Object.values(json);
          if (devices.length > 0) {
            device = devices[0];
          }
        } else if (json[accessKey]) {
          device = json[accessKey];
        } else if (json.data && json.received_at) {
          device = json;
        }

        if (device) {
          const processedDevice = {
            uid: device.uid || accessKey,
            ...device.data || device,
            received_at: device.received_at || new Date().toISOString(),
            isActive: true,
            lastSeen: 0
          };
          
          setDeviceData(processedDevice);
          setStatus('connected');
          setLastUpdate(new Date());
          
          // Auto-detect orientation based on screenshot dimensions
          if (processedDevice.screenshot_png_b64) {
            const img = new Image();
            img.onload = () => {
              setOrientation(img.width > img.height ? 'landscape' : 'portrait');
            };
            img.src = `data:image/webp;base64,${processedDevice.screenshot_png_b64}`;
          }
        } else {
          setStatus('no_device');
          addNotification('No device data received', 'info');
        }
      } catch (error) {
        setStatus('error');
        addNotification('Connection failed', 'error');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    intervalRef.current = setInterval(fetchData, refreshRate);
    return () => clearInterval(intervalRef.current);
  }, [accessKey, isPosting, refreshRate, autoRefresh]);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    if (!accessKey) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let device = null;
      
      if (accessKey === 'professor') {
        const devices = Object.values(json);
        if (devices.length > 0) {
          device = devices[0];
        }
      } else if (json[accessKey]) {
        device = json[accessKey];
      } else if (json.data && json.received_at) {
        device = json;
      }

      if (device) {
        const processedDevice = {
          uid: device.uid || accessKey,
          ...device.data || device,
          received_at: device.received_at || new Date().toISOString(),
          isActive: true,
          lastSeen: 0
        };
        
        setDeviceData(processedDevice);
        setStatus('connected');
        setLastUpdate(new Date());
        addNotification('Data refreshed successfully', 'success');
      }
    } catch (error) {
      setStatus('error');
      addNotification('Refresh failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessKey]);

  // Notification system
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Toggle posting - Enhanced with server communication from commented code
  const togglePosting = async () => {
    const enable = !isPosting;
    setLoading(true);
    
    try {
      const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_enabled: enable })
      });
      
      if (res.ok) {
        setIsPosting(enable);
        if (enable) {
          addNotification('Device capture started', 'success');
        } else {
          addNotification('Device capture stopped', 'info');
          setDeviceData(null);
          setStatus('disconnected');
        }
      } else {
        throw new Error(`Server responded with ${res.status}`);
      }
    } catch (error) {
      addNotification(
        `Failed to ${enable ? 'start' : 'stop'} device capture`, 
        'error'
      );
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download screenshot
  const downloadScreenshot = () => {
    if (!deviceData?.screenshot_png_b64) return;
    
    const link = document.createElement('a');
    link.href = `data:image/webp;base64,${deviceData.screenshot_png_b64}`;
    link.download = `${deviceData.device_name || deviceData.uid}_${new Date().toISOString().slice(0, 19)}.webp`;
    link.click();
    addNotification('Screenshot downloaded', 'success');
  };

  // Share screenshot
  const shareScreenshot = async () => {
    if (!deviceData?.screenshot_png_b64) return;
    
    try {
      const response = await fetch(`data:image/webp;base64,${deviceData.screenshot_png_b64}`);
      const blob = await response.blob();
      const file = new File([blob], `${deviceData.device_name || deviceData.uid}_screenshot.webp`, {
        type: 'image/webp'
      });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Device Screenshot',
          text: `Screenshot from ${deviceData.device_name || deviceData.uid}`
        });
        addNotification('Screenshot shared', 'success');
      } else {
        downloadScreenshot();
      }
    } catch (error) {
      console.error('Share failed:', error);
      downloadScreenshot();
    }
  };

  // Handle login
  const handleLogin = () => {
    if (keyInput.trim()) {
      setAccessKey(keyInput.trim());
    }
  };

  // Login screen
  if (!accessKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
          <div className="text-center mb-6">
            <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Device Monitor</h1>
            <p className="text-slate-400 text-sm">Connect to your device</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Access Key
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                placeholder="Enter access key"
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={!keyInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl text-white font-semibold transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all transform translate-x-0 max-w-xs ${
              notification.type === 'success' 
                ? 'bg-green-900/90 border-green-700 text-green-100' 
                : notification.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-100'
                : 'bg-blue-900/90 border-blue-700 text-blue-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white">
                {deviceData?.device_name || 'Device Monitor'}
              </h1>
              <p className="text-slate-400 text-xs">{accessKey}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-400' : 
              status === 'connecting' ? 'bg-yellow-400' : 
              'bg-red-400'
            }`} />
            
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Refresh Rate
                </label>
                <select
                  value={refreshRate}
                  onChange={e => setRefreshRate(Number(e.target.value))}
                  className="w-full p-2 text-sm rounded bg-slate-600 border border-slate-500 text-white"
                >
                  <option value={1000}>1 second</option>
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Auto Refresh
                </label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-full p-2 text-sm rounded transition-colors ${
                    autoRefresh ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                  }`}
                >
                  {autoRefresh ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Status Bar */}
      <div className="bg-slate-800/30 border-b border-slate-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {status === 'connected' ? (
                <Wifi className="text-green-400 w-4 h-4" />
              ) : status === 'connecting' ? (
                <Wifi className="text-yellow-400 w-4 h-4" />
              ) : (
                <WifiOff className="text-red-400 w-4 h-4" />
              )}
              <span className="text-slate-300 text-sm capitalize">{
                status === 'connected' ? 'Online' :
                status === 'connecting' ? 'Connecting' :
                status === 'no_device' ? 'No Device' : 'Offline'
              }</span>
            </div>

            {lastUpdate && (
              <div className="flex items-center gap-2">
                <Clock className="text-slate-400 w-4 h-4" />
                <span className="text-slate-300 text-sm">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <button
            onClick={togglePosting}
            disabled={loading}
            className={`px-4 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              isPosting
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            } disabled:opacity-50`}
          >
            <Power className="w-3 h-3" />
            {isPosting ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {loading && !deviceData ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Connecting to device...</p>
            </div>
          </div>
        ) : !deviceData ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No device connected</p>
              <p className="text-slate-500 text-sm">Start capture to monitor your device</p>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Device Frame */}
            <div className={`bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700 ${
              isFullscreen ? 'fixed inset-4 max-w-none z-40' : ''
            }`}>
              {/* Device Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    deviceData.isActive ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white text-sm font-medium">
                    {deviceData.device_name || deviceData.uid}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Screenshot Display */}
              <div className={`relative bg-black rounded-2xl overflow-hidden ${
                orientation === 'landscape' ? 'aspect-video' : 'aspect-[9/16]'
              }`}>
                {deviceData.screenshot_png_b64 ? (
                  <img
                    src={`data:image/webp;base64,${deviceData.screenshot_png_b64}`}
                    alt="Device screen"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <Monitor className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No screen capture</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Device Info Panel */}
              {showDeviceInfo && (
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Device ID:</span>
                      <p className="text-white font-mono text-xs truncate">{deviceData.uid}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <p className={`font-medium ${deviceData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {deviceData.isActive ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Last Update:</span>
                      <p className="text-white">{new Date(deviceData.received_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {deviceData.screenshot_png_b64 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={downloadScreenshot}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  
                  <button
                    onClick={shareScreenshot}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Share className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen overlay close */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 left-4 z-50 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
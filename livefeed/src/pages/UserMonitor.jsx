
// import { useEffect, useState, useCallback, useRef } from 'react';
// import {
//   Smartphone,
//   Wifi,
//   WifiOff,
//   Clock,
//   Monitor,
//   Settings,
//   RefreshCw,
//   AlertCircle,
//   CheckCircle,
//   Power,
//   Download,
//   X,
//   Activity,
//   Battery,
//   Signal,
//   Globe,
//   Maximize2,
//   Minimize2,
//   RotateCcw,
//   Share,
//   Info,
//   EyeOff,
//   Eye
// } from 'lucide-react';

// const BASE_URL = 'https://third-eye-txe8.onrender.com';

// export default function UserMonitor() {
//   // State management
//   const [accessKey, setAccessKey] = useState(null);
//   const [keyInput, setKeyInput] = useState('');
//   const [isPosting, setIsPosting] = useState(false);
//   const [deviceData, setDeviceData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState('disconnected');
//   const [lastUpdate, setLastUpdate] = useState(null);
  
//   // UI state
//   const [showSettings, setShowSettings] = useState(false);
//   const [refreshRate, setRefreshRate] = useState(3000);
//   const [autoRefresh, setAutoRefresh] = useState(true);
//   const [notifications, setNotifications] = useState([]);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [showDeviceInfo, setShowDeviceInfo] = useState(false);
//   const [orientation, setOrientation] = useState('portrait');
  
//   // Page visibility state
//   const [isPageVisible, setIsPageVisible] = useState(true);
//   const [inactiveTimer, setInactiveTimer] = useState(0);
//   const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  
//   const intervalRef = useRef(null);
//   const inactiveTimerRef = useRef(null);
//   const inactiveCountRef = useRef(0);

//   // Initialize state from server on component mount
//   useEffect(() => {
//     if (accessKey) {
//       loadPreviousState();
//     }
//   }, [accessKey]);

//   // Load previous state from server
//   const loadPreviousState = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/control/${accessKey}`);
//       if (res.ok) {
//         const data = await res.json();
//         setIsPosting(data.capture_enabled || false);
//       }
//     } catch (error) {
//       console.error('Failed to load previous state:', error);
//     }
//   };

//   // Auto-stop on app close
//   const autoStopOnClose = useCallback(async () => {
//     if (isPosting && accessKey) {
//       try {
//         // Use sendBeacon for reliable delivery during page unload
//         const data = JSON.stringify({ capture_enabled: false });
//         const blob = new Blob([data], { type: 'application/json' });
        
//         const success = navigator.sendBeacon(`${BASE_URL}/control/${accessKey}`, blob);
        
//         if (!success) {
//           // Fallback to synchronous fetch if sendBeacon fails
//           await fetch(`${BASE_URL}/control/${accessKey}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: data,
//             keepalive: true
//           });
//         }
//       } catch (error) {
//         console.error('Failed to auto-stop on close:', error);
//       }
//     }
//   }, [isPosting, accessKey]);

//   // Page visibility detection and app close handling
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       const isVisible = !document.hidden;
//       setIsPageVisible(isVisible);
      
//       if (isVisible) {
//         // Reset inactive timer when page becomes visible
//         clearInterval(inactiveTimerRef.current);
//         inactiveCountRef.current = 0;
//         setInactiveTimer(0);
//         setShowInactiveWarning(false);
//         addNotification('Page is now active', 'success');
//       } else {
//         // Start inactive timer when page becomes hidden
//         if (isPosting) {
//           startInactiveTimer();
//           addNotification('Page is now inactive - monitoring...', 'info');
//         }
//       }
//     };

//     const handleBeforeUnload = (event) => {
//       if (isPosting) {
//         // Auto-stop capture when user closes the app
//         autoStopCapture();
//         autoStopOnClose();
        
//         // Show confirmation dialog (optional)
//         const message = 'Capture is active. Closing will stop the capture.';
//         event.returnValue = message;
//         return message;
//       }
//     };

//     const handleUnload = () => {
//       // Final attempt to stop capture on unload
//       autoStopOnClose();
//     };

//     // Add event listeners
//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     window.addEventListener('beforeunload', handleBeforeUnload);
//     window.addEventListener('unload', handleUnload);
    
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       window.removeEventListener('unload', handleUnload);
//       clearInterval(inactiveTimerRef.current);
//     };
//   }, [isPosting, autoStopOnClose]);

//   // Start inactive timer
//   const startInactiveTimer = () => {
//     setShowInactiveWarning(true);
//     inactiveCountRef.current = 0;
    
//     inactiveTimerRef.current = setInterval(() => {
//       inactiveCountRef.current += 1;
//       setInactiveTimer(inactiveCountRef.current);
      
//       if (inactiveCountRef.current >= 60) {
//         // Auto-stop after 1 minute of inactivity
//         clearInterval(inactiveTimerRef.current);
//         autoStopCapture();
//       }
//     }, 1000);
//   };

//   // Auto-stop capture due to inactivity
//   const autoStopCapture = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ capture_enabled: false })
//       });
      
//       if (res.ok) {
//         setIsPosting(false);
//         setDeviceData(null);
//         setStatus('disconnected');
//         setShowInactiveWarning(false);
//         addNotification('Capture stopped due to inactivity (1 min)', 'info');
//       }
//     } catch (error) {
//       console.error('Auto-stop failed:', error);
//       addNotification('Failed to auto-stop capture', 'error');
//     }
//   };

//   // Enhanced polling with single device focus
//   useEffect(() => {
//     if (!accessKey || !isPosting || !autoRefresh) return;
//     setLoading(true);

//     const fetchData = async () => {
//       setStatus('connecting');
//       try {
//         const res = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = await res.json();

//         let device = null;
        
//         // Handle different response structures
//         if (accessKey === 'professor') {
//           // Get the first/latest device from professor response
//           const devices = Object.values(json);
//           if (devices.length > 0) {
//             device = devices[0];
//           }
//         } else if (json[accessKey]) {
//           device = json[accessKey];
//         } else if (json.data && json.received_at) {
//           device = json;
//         }

//         if (device) {
//           const processedDevice = {
//             uid: device.uid || accessKey,
//             ...device.data || device,
//             received_at: device.received_at || new Date().toISOString(),
//             isActive: true,
//             lastSeen: 0
//           };
          
//           setDeviceData(processedDevice);
//           setStatus('connected');
//           setLastUpdate(new Date());
          
//           // Auto-detect orientation based on screenshot dimensions
//           if (processedDevice.screenshot_png_b64) {
//             const img = new Image();
//             img.onload = () => {
//               setOrientation(img.width > img.height ? 'landscape' : 'portrait');
//             };
//             img.src = `data:image/webp;base64,${processedDevice.screenshot_png_b64}`;
//           }
//         } else {
//           setStatus('no_device');
//           addNotification('No device data received', 'info');
//         }
//       } catch (error) {
//         setStatus('error');
//         addNotification('Connection failed', 'error');
//         console.error('Fetch error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//     intervalRef.current = setInterval(fetchData, refreshRate);
//     return () => clearInterval(intervalRef.current);
//   }, [accessKey, isPosting, refreshRate, autoRefresh]);

//   // Manual refresh
//   const handleManualRefresh = useCallback(async () => {
//     if (!accessKey) return;
//     setLoading(true);
    
//     try {
//       const res = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const json = await res.json();

//       let device = null;
      
//       if (accessKey === 'professor') {
//         const devices = Object.values(json);
//         if (devices.length > 0) {
//           device = devices[0];
//         }
//       } else if (json[accessKey]) {
//         device = json[accessKey];
//       } else if (json.data && json.received_at) {
//         device = json;
//       }

//       if (device) {
//         const processedDevice = {
//           uid: device.uid || accessKey,
//           ...device.data || device,
//           received_at: device.received_at || new Date().toISOString(),
//           isActive: true,
//           lastSeen: 0
//         };
        
//         setDeviceData(processedDevice);
//         setStatus('connected');
//         setLastUpdate(new Date());
//         addNotification('Data refreshed successfully', 'success');
//       }
//     } catch (error) {
//       setStatus('error');
//       addNotification('Refresh failed', 'error');
//     } finally {
//       setLoading(false);
//     }
//   }, [accessKey]);

//   // Notification system
//   const addNotification = (message, type = 'info') => {
//     const id = Date.now();
//     setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }]);
//     setTimeout(() => {
//       setNotifications(prev => prev.filter(n => n.id !== id));
//     }, 4000);
//   };

//   // Toggle posting - Enhanced with server communication and state persistence
//   const togglePosting = async () => {
//     const enable = !isPosting;
//     setLoading(true);
    
//     try {
//       const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ capture_enabled: enable })
//       });
      
//       if (res.ok) {
//         setIsPosting(enable);
        
//         if (enable) {
//           addNotification('Device capture started', 'success');
//           // Reset inactive timer if page is not visible
//           if (!isPageVisible) {
//             startInactiveTimer();
//           }
//         } else {
//           addNotification('Device capture stopped', 'info');
//           setDeviceData(null);
//           setStatus('disconnected');
//           // Clear inactive timer
//           clearInterval(inactiveTimerRef.current);
//           setInactiveTimer(0);
//           setShowInactiveWarning(false);
//         }
//       } else {
//         throw new Error(`Server responded with ${res.status}`);
//       }
//     } catch (error) {
//       addNotification(
//         `Failed to ${enable ? 'start' : 'stop'} device capture`, 
//         'error'
//       );
//       console.error('Toggle error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Download screenshot
//   const downloadScreenshot = () => {
//     if (!deviceData?.screenshot_png_b64) return;
    
//     const link = document.createElement('a');
//     link.href = `data:image/webp;base64,${deviceData.screenshot_png_b64}`;
//     link.download = `${deviceData.device_name || deviceData.uid}_${new Date().toISOString().slice(0, 19)}.webp`;
//     link.click();
//     addNotification('Screenshot downloaded', 'success');
//   };

//   // Share screenshot
//   const shareScreenshot = async () => {
//     if (!deviceData?.screenshot_png_b64) return;
    
//     try {
//       const response = await fetch(`data:image/webp;base64,${deviceData.screenshot_png_b64}`);
//       const blob = await response.blob();
//       const file = new File([blob], `${deviceData.device_name || deviceData.uid}_screenshot.webp`, {
//         type: 'image/webp'
//       });
      
//       if (navigator.share && navigator.canShare({ files: [file] })) {
//         await navigator.share({
//           files: [file],
//           title: 'Device Screenshot',
//           text: `Screenshot from ${deviceData.device_name || deviceData.uid}`
//         });
//         addNotification('Screenshot shared', 'success');
//       } else {
//         downloadScreenshot();
//       }
//     } catch (error) {
//       console.error('Share failed:', error);
//       downloadScreenshot();
//     }
//   };

//   // Handle login
//   const handleLogin = () => {
//     if (keyInput.trim()) {
//       setAccessKey(keyInput.trim());
//     }
//   };

//   // Login screen
//   if (!accessKey) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
//         <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
//           <div className="text-center mb-6">
//             <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
//             <h1 className="text-2xl font-bold text-white mb-2">Device Monitor</h1>
//             <p className="text-slate-400 text-sm">Connect to your device</p>
//           </div>
          
//           <div className="space-y-4">
//             <div>
//               <label className="block text-slate-300 text-sm font-medium mb-2">
//                 Access Key
//               </label>
//               <input
//                 type="text"
//                 value={keyInput}
//                 onChange={e => setKeyInput(e.target.value)}
//                 onKeyPress={e => {
//                   if (e.key === 'Enter') {
//                     handleLogin();
//                   }
//                 }}
//                 placeholder="Enter access key"
//                 className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all"
//               />
//             </div>
            
//             <button
//               onClick={handleLogin}
//               disabled={!keyInput.trim()}
//               className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl text-white font-semibold transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
//             >
//               Connect
//             </button>
            
//             <div className="text-center text-xs text-slate-400 mt-4">
//               <p>⚠️ Capture will auto-stop when you close the app</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       {/* Inactive Warning Banner */}
//       {showInactiveWarning && (
//         <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white p-3 text-center">
//           <div className="flex items-center justify-center gap-2">
//             <EyeOff className="w-5 h-5" />
//             <span>
//               Page inactive for {inactiveTimer}s - Will auto-stop at 60s ({60 - inactiveTimer}s remaining)
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Notifications */}
//       <div className={`fixed right-4 z-50 space-y-2 ${showInactiveWarning ? 'top-20' : 'top-4'}`}>
//         {notifications.map(notification => (
//           <div
//             key={notification.id}
//             className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all transform translate-x-0 max-w-xs ${
//               notification.type === 'success' 
//                 ? 'bg-green-900/90 border-green-700 text-green-100' 
//                 : notification.type === 'error'
//                 ? 'bg-red-900/90 border-red-700 text-red-100'
//                 : 'bg-blue-900/90 border-blue-700 text-blue-100'
//             }`}
//           >
//             <div className="flex items-center gap-2">
//               {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
//               {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
//               <span className="text-sm font-medium">{notification.message}</span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Header */}
//       <header className={`bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4 ${showInactiveWarning ? 'mt-16' : ''}`}>
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Smartphone className="w-6 h-6 text-blue-400" />
//             <div>
//               <h1 className="text-lg font-bold text-white">
//                 {deviceData?.device_name || 'Device Monitor'}
//               </h1>
//               <p className="text-slate-400 text-xs">{accessKey}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {/* Page visibility indicator */}
//             <div className="flex items-center gap-1">
//               {isPageVisible ? (
//                 <Eye className="w-4 h-4 text-green-400" />
//               ) : (
//                 <EyeOff className="w-4 h-4 text-orange-400" />
//               )}
//             </div>

//             <div className={`w-2 h-2 rounded-full ${
//               status === 'connected' ? 'bg-green-400' : 
//               status === 'connecting' ? 'bg-yellow-400' : 
//               'bg-red-400'
//             }`} />
            
//             <button
//               onClick={handleManualRefresh}
//               disabled={loading}
//               className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
//             >
//               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//             </button>
            
//             <button
//               onClick={() => setShowSettings(!showSettings)}
//               className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
//             >
//               <Settings className="w-4 h-4" />
//             </button>
//           </div>
//         </div>

//         {/* Settings Panel */}
//         {showSettings && (
//           <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-medium text-slate-300 mb-2">
//                   Refresh Rate
//                 </label>
//                 <select
//                   value={refreshRate}
//                   onChange={e => setRefreshRate(Number(e.target.value))}
//                   className="w-full p-2 text-sm rounded bg-slate-600 border border-slate-500 text-white"
//                 >
//                   <option value={1000}>1 second</option>
//                   <option value={3000}>3 seconds</option>
//                   <option value={5000}>5 seconds</option>
//                   <option value={10000}>10 seconds</option>
//                 </select>
//               </div>
              
//               <div>
//                 <label className="block text-xs font-medium text-slate-300 mb-2">
//                   Auto Refresh
//                 </label>
//                 <button
//                   onClick={() => setAutoRefresh(!autoRefresh)}
//                   className={`w-full p-2 text-sm rounded transition-colors ${
//                     autoRefresh ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
//                   }`}
//                 >
//                   {autoRefresh ? 'On' : 'Off'}
//                 </button>
//               </div>
//             </div>
            
//             <div className="mt-3 p-2 bg-slate-600/50 rounded text-xs">
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-300">Page Status:</span>
//                 <span className={isPageVisible ? 'text-green-400' : 'text-orange-400'}>
//                   {isPageVisible ? 'Active' : 'Inactive'}
//                 </span>
//               </div>
//               {!isPageVisible && isPosting && (
//                 <div className="flex items-center justify-between mt-1">
//                   <span className="text-slate-300">Auto-stop in:</span>
//                   <span className="text-orange-400">{60 - inactiveTimer}s</span>
//                 </div>
//               )}
//               <div className="flex items-center justify-between mt-1">
//                 <span className="text-slate-300">Auto-stop on close:</span>
//                 <span className="text-green-400">Enabled</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </header>

//       {/* Status Bar */}
//       <div className="bg-slate-800/30 border-b border-slate-700 p-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               {status === 'connected' ? (
//                 <Wifi className="text-green-400 w-4 h-4" />
//               ) : status === 'connecting' ? (
//                 <Wifi className="text-yellow-400 w-4 h-4" />
//               ) : (
//                 <WifiOff className="text-red-400 w-4 h-4" />
//               )}
//               <span className="text-slate-300 text-sm capitalize">{
//                 status === 'connected' ? 'Online' :
//                 status === 'connecting' ? 'Connecting' :
//                 status === 'no_device' ? 'No Device' : 'Offline'
//               }</span>
//             </div>

//             {lastUpdate && (
//               <div className="flex items-center gap-2">
//                 <Clock className="text-slate-400 w-4 h-4" />
//                 <span className="text-slate-300 text-sm">{lastUpdate.toLocaleTimeString()}</span>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={togglePosting}
//             disabled={loading}
//             className={`px-4 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
//               isPosting
//                 ? 'bg-red-600 hover:bg-red-500 text-white'
//                 : 'bg-green-600 hover:bg-green-500 text-white'
//             } disabled:opacity-50`}
//           >
//             <Power className="w-3 h-3" />
//             {isPosting ? 'Stop' : 'Start'}
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <main className="flex-1 p-4">
//         {loading && !deviceData ? (
//           <div className="flex items-center justify-center h-96">
//             <div className="text-center">
//               <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
//               <p className="text-slate-400">Connecting to device...</p>
//             </div>
//           </div>
//         ) : !deviceData ? (
//           <div className="flex items-center justify-center h-96">
//             <div className="text-center">
//               <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
//               <p className="text-slate-400 text-lg mb-2">No device connected</p>
//               <p className="text-slate-500 text-sm">Start capture to monitor your device</p>
//             </div>
//           </div>
//         ) : (
//           <div className="max-w-md mx-auto">
//             {/* Device Frame */}
//             <div className={`bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700 ${
//               isFullscreen ? 'fixed inset-4 max-w-none z-40' : ''
//             }`}>
//               {/* Device Header */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <div className={`w-3 h-3 rounded-full ${
//                     deviceData.isActive ? 'bg-green-400' : 'bg-red-400'
//                   }`} />
//                   <span className="text-white text-sm font-medium">
//                     {deviceData.device_name || deviceData.uid}
//                   </span>
//                 </div>
                
//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={() => setShowDeviceInfo(!showDeviceInfo)}
//                     className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
//                   >
//                     <Info className="w-4 h-4" />
//                   </button>
                  
//                   <button
//                     onClick={() => setIsFullscreen(!isFullscreen)}
//                     className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
//                   >
//                     {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
//                   </button>
//                 </div>
//               </div>

//               {/* Screenshot Display */}
//               <div className={`relative bg-black rounded-2xl overflow-hidden ${
//                 orientation === 'landscape' ? 'aspect-video' : 'aspect-[9/16]'
//               }`}>
//                 {deviceData.screenshot_png_b64 ? (
//                   <img
//                     src={`data:image/webp;base64,${deviceData.screenshot_png_b64}`}
//                     alt="Device screen"
//                     className="w-full h-full object-contain"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-slate-500">
//                     <div className="text-center">
//                       <Monitor className="w-12 h-12 mx-auto mb-2" />
//                       <p className="text-sm">No screen capture</p>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Device Info Panel */}
//               {showDeviceInfo && (
//                 <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <span className="text-slate-400">Device ID:</span>
//                       <p className="text-white font-mono text-xs truncate">{deviceData.uid}</p>
//                     </div>
//                     <div>
//                       <span className="text-slate-400">Status:</span>
//                       <p className={`font-medium ${deviceData.isActive ? 'text-green-400' : 'text-red-400'}`}>
//                         {deviceData.isActive ? 'Online' : 'Offline'}
//                       </p>
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-slate-400">Last Update:</span>
//                       <p className="text-white">{new Date(deviceData.received_at).toLocaleString()}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Action Buttons */}
//               {deviceData.screenshot_png_b64 && (
//                 <div className="flex gap-2 mt-4">
//                   <button
//                     onClick={downloadScreenshot}
//                     className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
//                   >
//                     <Download className="w-4 h-4" />
//                     Download
//                   </button>
                  
//                   <button
//                     onClick={shareScreenshot}
//                     className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
//                   >
//                     <Share className="w-4 h-4" />
//                     Share
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </main>

//       {/* Fullscreen overlay close */}
//       {isFullscreen && (
//         <button
//           onClick={() => setIsFullscreen(false)}
//           className="fixed top-4 left-4 z-50 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
//         >
//           <X className="w-5 h-5" />
//         </button>
//       )}
//     </div>
//   );
// }

// src/pages/UserMonitor.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Maximize2,
  Minimize2,
  Share,
  Info,
  EyeOff,
  Eye
} from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function UserMonitor({ accessKey }) {
  // State management
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

  // Page visibility state
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [inactiveTimer, setInactiveTimer] = useState(0);
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);

  const intervalRef = useRef(null);
  const inactiveTimerRef = useRef(null);
  const inactiveCountRef = useRef(0);

  // === load previous capture_enabled on mount or accessKey change ===
  useEffect(() => {
    if (!accessKey) return;
    (async () => {
      try {
        const res  = await fetch(`${BASE_URL}/control/${accessKey}`);
        const data = await res.json();
        setIsPosting(data.capture_enabled || false);
      } catch (e) {
        console.error('Failed to load previous state:', e);
      }
    })();
  }, [accessKey]);

  // === auto-stop on close/visibility-change ===
  const autoStopOnClose = useCallback(async () => {
    if (!isPosting) return;
    const body = JSON.stringify({ capture_enabled: false });
    navigator.sendBeacon(`${BASE_URL}/control/${accessKey}`, new Blob([body], { type: 'application/json' })) ||
      await fetch(`${BASE_URL}/control/${accessKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
  }, [isPosting, accessKey]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (visible) {
        clearInterval(inactiveTimerRef.current);
        inactiveCountRef.current = 0;
        setInactiveTimer(0);
        setShowInactiveWarning(false);
        addNotification('Page is now active', 'success');
      } else if (isPosting) {
        startInactiveTimer();
        addNotification('Page is now inactive – monitoring…', 'info');
      }
    };

    const handleBeforeUnload = e => {
      if (isPosting) {
        autoStopOnClose();
        const msg = 'Capture is active. Closing will stop the capture.';
        e.returnValue = msg;
        return msg;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', autoStopOnClose);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', autoStopOnClose);
      clearInterval(inactiveTimerRef.current);
    };
  }, [isPosting, autoStopOnClose]);

  // === inactivity timer ===
  const startInactiveTimer = () => {
    setShowInactiveWarning(true);
    inactiveCountRef.current = 0;
    inactiveTimerRef.current = setInterval(() => {
      inactiveCountRef.current += 1;
      setInactiveTimer(inactiveCountRef.current);
      if (inactiveCountRef.current >= 60) {
        clearInterval(inactiveTimerRef.current);
        autoStopCapture();
      }
    }, 1000);
  };

  const autoStopCapture = async () => {
    try {
      const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_enabled: false })
      });
      if (res.ok) {
        setIsPosting(false);
        setDeviceData(null);
        setStatus('disconnected');
        setShowInactiveWarning(false);
        addNotification('Capture stopped due to inactivity (1 min)', 'info');
      }
    } catch (e) {
      console.error('Auto-stop failed:', e);
      addNotification('Failed to auto-stop capture', 'error');
    }
  };

  // === polling for data ===
  useEffect(() => {
    if (!accessKey || !isPosting || !autoRefresh) return;
    setLoading(true);

    const fetchData = async () => {
      setStatus('connecting');
      try {
        const res  = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();

        let entry = null;
        if (accessKey === 'professor') {
          const arr = Object.values(json);
          entry   = arr[0];
        } else if (json[accessKey]) {
          entry = json[accessKey];
        } else if (json.data && json.received_at) {
          entry = json;
        }

        if (entry) {
          const d = {
            uid: entry.uid || accessKey,
            ...(entry.data || entry),
            received_at: entry.received_at,
            isActive: true
          };
          setDeviceData(d);
          setStatus('connected');
          setLastUpdate(new Date());
          if (d.screenshot_png_b64) {
            const img = new Image();
            img.onload = () => setOrientation(img.width > img.height ? 'landscape' : 'portrait');
            img.src    = `data:image/webp;base64,${d.screenshot_png_b64}`;
          }
        } else {
          setStatus('no_device');
          addNotification('No device data received', 'info');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setStatus('error');
        addNotification('Connection failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    intervalRef.current = setInterval(fetchData, refreshRate);
    return () => clearInterval(intervalRef.current);
  }, [accessKey, isPosting, refreshRate, autoRefresh]);

  // === manual refresh ===
  const handleManualRefresh = useCallback(async () => {
    if (!accessKey) return;
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();

      let entry = null;
      if (accessKey === 'professor') {
        const arr = Object.values(json);
        entry   = arr[0];
      } else if (json[accessKey]) {
        entry = json[accessKey];
      } else if (json.data && json.received_at) {
        entry = json;
      }

      if (entry) {
        const d = {
          uid: entry.uid || accessKey,
          ...(entry.data || entry),
          received_at: entry.received_at,
          isActive: true
        };
        setDeviceData(d);
        setStatus('connected');
        setLastUpdate(new Date());
        addNotification('Data refreshed successfully', 'success');
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setStatus('error');
      addNotification('Refresh failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessKey]);

  // === start/stop capture ===
  const togglePosting = async () => {
    const enable = !isPosting;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_enabled: enable })
      });
      if (!res.ok) throw new Error(res.statusText);

      setIsPosting(enable);
      if (enable) {
        addNotification('Device capture started', 'success');
        if (!isPageVisible) startInactiveTimer();
      } else {
        addNotification('Device capture stopped', 'info');
        setDeviceData(null);
        setStatus('disconnected');
        clearInterval(inactiveTimerRef.current);
        setInactiveTimer(0);
        setShowInactiveWarning(false);
      }
    } catch (e) {
      console.error('Toggle error:', e);
      addNotification(`Failed to ${enable ? 'start' : 'stop'} capture`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // === screenshot actions ===
  const downloadScreenshot = () => {
    if (!deviceData?.screenshot_png_b64) return;
    const link = document.createElement('a');
    link.href        = `data:image/webp;base64,${deviceData.screenshot_png_b64}`;
    link.download    = `${deviceData.device_name || deviceData.uid}_${new Date().toISOString().slice(0,19)}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Screenshot downloaded', 'success');
  };

  const shareScreenshot = async () => {
    if (!deviceData?.screenshot_png_b64) return;
    try {
      const blob = await (await fetch(`data:image/webp;base64,${deviceData.screenshot_png_b64}`)).blob();
      const file = new File([blob], `${deviceData.device_name || deviceData.uid}.webp`, { type: 'image/webp' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Device Screenshot' });
        addNotification('Screenshot shared', 'success');
      } else {
        downloadScreenshot();
      }
    } catch (e) {
      console.error('Share failed:', e);
      downloadScreenshot();
    }
  };

  // === notifications ===
  const addNotification = (message, type='info') => {
    const id = Date.now();
    setNotifications(n => [...n, { id, message, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id!==id)), 4000);
  };

  // === render ===
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Inactive Warning */}
      {showInactiveWarning && (
        <div className="fixed top-0 inset-x-0 bg-orange-600 p-3 text-center z-50">
          <div className="flex items-center justify-center gap-2">
            <EyeOff className="w-5 h-5" />
            <span>Page inactive {inactiveTimer}s – auto‑stop at 60s</span>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className={`fixed right-4 ${showInactiveWarning ? 'top-20' : 'top-4'} space-y-2 z-50`}>
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border max-w-xs transform transition ${
              n.type==='success'
                ? 'bg-green-900/90 border-green-700 text-green-100'
                : n.type==='error'
                  ? 'bg-red-900/90 border-red-700 text-red-100'
                  : 'bg-blue-900/90 border-blue-700 text-blue-100'
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              {n.type==='success' && <CheckCircle className="w-4 h-4" />}
              {n.type==='error'   && <AlertCircle  className="w-4 h-4" />}
              <span>{n.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className={`bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4 ${showInactiveWarning?'mt-16':''}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-blue-400"/>
            <div>
              <h1 className="text-lg font-bold">{deviceData?.device_name||'Device Monitor'}</h1>
              <p className="text-xs text-slate-400">{accessKey}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPageVisible ? <Eye className="w-4 h-4 text-green-400"/> : <EyeOff className="w-4 h-4 text-orange-400"/>}
            <div className={`w-2 h-2 rounded-full ${
              status==='connected'? 'bg-green-400' :
              status==='connecting'?'bg-yellow-400':'bg-red-400'
            }`}/>
            <button onClick={handleManualRefresh} disabled={loading} className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
            </button>
            <button onClick={()=>setShowSettings(s=>!s)} className="p-2 bg-slate-700 rounded hover:bg-slate-600">
              <Settings className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded border border-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300">Refresh Rate</label>
                <select
                  value={refreshRate}
                  onChange={e=>setRefreshRate(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-600 text-white rounded"
                >
                  <option value={1000}>1s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300">Auto Refresh</label>
                <button
                  onClick={()=>setAutoRefresh(a=>!a)}
                  className={`w-full mt-1 p-2 rounded ${autoRefresh? 'bg-green-600 text-white':'bg-slate-600 text-slate-300'}`}
                >
                  {autoRefresh?'On':'Off'}
                </button>
              </div>
            </div>
            <div className="mt-3 p-2 bg-slate-600/50 rounded text-xs grid grid-cols-2">
              <span>Page Status:</span>
              <span className={isPageVisible?'text-green-400':'text-orange-400'}>
                {isPageVisible?'Active':'Inactive'}
              </span>
              {isPosting && !isPageVisible && (
                <>
                  <span>Auto-stop in:</span>
                  <span className="text-orange-400">{60 - inactiveTimer}s</span>
                </>
              )}
              <span>Auto-stop on close:</span>
              <span className="text-green-400">Enabled</span>
            </div>
          </div>
        )}
      </header>

      {/* Status Bar */}
      <div className="bg-slate-800/30 border-b border-slate-700 p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {status==='connected'? <Wifi className="text-green-400"/> :
               status==='connecting'? <Wifi className="text-yellow-400"/> :
               <WifiOff className="text-red-400"/>}
              <span className="capitalize text-sm text-slate-300">
                {status==='connected'? 'Online':
                 status==='connecting'? 'Connecting':
                 status==='no_device'? 'No Device':'Offline'}
              </span>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-2">
                <Clock className="text-slate-400"/>
                <span className="text-sm text-slate-300">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          <button
            onClick={togglePosting}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-1 rounded font-semibold transition ${
              isPosting? 'bg-red-600 hover:bg-red-500':'bg-green-600 hover:bg-green-500'
            } disabled:opacity-50`}
          >
            <Power className="w-4 h-4"/>
            {isPosting?'Stop':'Start'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 flex-1">
        {loading && !deviceData ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4"/>
              <p className="text-slate-400">Connecting to device…</p>
            </div>
          </div>
        ) : !deviceData ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4"/>
              <p className="text-lg text-slate-400 mb-2">No device connected</p>
              <p className="text-sm text-slate-500">Start capture to monitor your device</p>
            </div>
          </div>
        ) : (
          <div className={`max-w-md mx-auto ${isFullscreen?'fixed inset-4 z-40':''}`}>
            <div className="bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700">
              {/* Device header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    deviceData.isActive? 'bg-green-400':'bg-red-400'
                  }`} />
                  <span className="font-medium">{deviceData.device_name || deviceData.uid}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setShowDeviceInfo(si=>!si)} className="p-2 rounded hover:bg-slate-700">
                    <Info className="w-5 h-5"/>
                  </button>
                  <button onClick={()=>setIsFullscreen(f=>!f)} className="p-2 rounded hover:bg-slate-700">
                    {isFullscreen? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
                  </button>
                </div>
              </div>

              {/* Screenshot frame */}
              <div className={`relative bg-black rounded-2xl overflow-hidden ${
                orientation==='landscape'? 'aspect-video':'aspect-[9/16]'
              }`}>
                {deviceData.screenshot_png_b64 ? (
                  <img
                    src={`data:image/webp;base64,${deviceData.screenshot_png_b64}`}
                    alt="Device screenshot"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <Monitor className="w-12 h-12 mb-2"/>
                    <p className="text-sm">No screen capture</p>
                  </div>
                )}
              </div>

              {/* Device info */}
              {showDeviceInfo && (
                <div className="mt-4 p-3 bg-slate-700/30 rounded border border-slate-600 text-sm grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Device ID:</span>
                    <p className="font-mono truncate">{deviceData.uid}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <p className={deviceData.isActive? 'text-green-400':'text-red-400'}>
                      {deviceData.isActive? 'Online':'Offline'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Last Update:</span>
                    <p>{new Date(deviceData.received_at).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {deviceData.screenshot_png_b64 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={downloadScreenshot}
                    className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5"/> Download
                  </button>
                  <button
                    onClick={shareScreenshot}
                    className="flex-1 py-2 rounded bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
                  >
                    <Share className="w-5 h-5"/> Share
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen close */}
      {isFullscreen && (
        <button
          onClick={()=>setIsFullscreen(false)}
          className="fixed top-4 left-4 p-2 rounded bg-black/50 hover:bg-black/70 z-50"
        >
          <X className="w-5 h-5"/>
        </button>
      )}
    </div>
  );
}

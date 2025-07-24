// // src/App.jsx
// import { useState } from 'react';
// import { Routes, Route, Link, Navigate } from 'react-router-dom';
// import UserMonitor from './pages/UserMonitor';
// import AdminPage   from './pages/AdminPage';
// import { Smartphone } from 'lucide-react';

// export default function App() {
//   const [accessKey, setAccessKey] = useState(null);
//   const [keyInput, setKeyInput] = useState('');

//   const handleLogin = () => {
//     const key = keyInput.trim();
//     if (key) setAccessKey(key);
//   };

//   // 1) Login screen
//   if (!accessKey) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
//         <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
//           <div className="text-center mb-6">
//             <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
//             <h1 className="text-2xl font-bold text-white mb-2">Device Monitor</h1>
//             <p className="text-slate-400 text-sm">Enter your access key</p>
//           </div>
//           <input
//             value={keyInput}
//             onChange={e => setKeyInput(e.target.value)}
//             onKeyPress={e => e.key === 'Enter' && handleLogin()}
//             placeholder="Enter access key ('admin' for admin)"
//             className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
//           />
//           <button
//             onClick={handleLogin}
//             disabled={!keyInput.trim()}
//             className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50"
//           >
//             Connect
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // 2) After login, always render nav+routes
//   return (
//     <>
//       <nav className="p-4 bg-slate-800 text-white flex items-center">
//         <Link to="/" className="mr-4 hover:underline">Monitor</Link>
//         {accessKey === 'admin' && (
//           <Link to="/admin" className="hover:underline">Admin</Link>
//         )}
//       </nav>

//       <Routes>
//         {/* Home: auto-redirect to /admin if admin, else /monitor */}
//         <Route
//           index
//           element={
//             accessKey === 'admin'
//               ? <Navigate to="/admin" replace />
//               : <Navigate to="/monitor" replace />
//           }
//         />

//         {/* Monitor page */}
//         <Route
//           path="/monitor"
//           element={<UserMonitor accessKey={accessKey} />}
//         />

//         {/* Admin page, protect with accessKey check */}
//         <Route
//           path="/admin"
//           element={
//             accessKey === 'admin'
//               ? <AdminPage />
//               : <Navigate to="/monitor" replace />
//           }
//         />

//         {/* Catch‑all → go back to home */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </>
//   );
// }


// src/App.jsx
import { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import UserMonitor from './pages/UserMonitor';
import AdminPage from './pages/AdminPage';
import { Smartphone, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function App() {
  const [accessKey, setAccessKey] = useState(null); // This will be the validated deviceId
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [viewCodeInput, setViewCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState('enter_device'); // 'enter_device', 'enter_code', 'set_code'

  const handleDeviceCheck = async () => {
    const key = deviceIdInput.trim();
    if (!key) return;
    setIsLoading(true);
    setError('');

    if (key === '9063492573') {
      setAccessKey('9063492573');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/status/${key}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Device not authorized');
      }
      const data = await res.json();
      setLoginStep(data.isMapped ? 'enter_code' : 'set_code');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const deviceId = deviceIdInput.trim();
    const viewCode = viewCodeInput.trim();
    if (!deviceId || !viewCode) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, viewCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }
      setAccessKey(deviceId); // On success, set the validated deviceId as accessKey
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetLogin = () => {
    setLoginStep('enter_device');
    setDeviceIdInput('');
    setViewCodeInput('');
    setError('');
  };


  // 1) Login screen
  if (!accessKey) {
    const isCheckingDevice = loginStep === 'enter_device';

    const title = isCheckingDevice ? 'Device Monitor'
                : loginStep === 'enter_code' ? 'Enter View Code'
                : 'Set View Code';

    const description = isCheckingDevice ? "Enter your device's ID to connect"
                      : loginStep === 'enter_code' ? `For device: ${deviceIdInput}`
                      : `Create a secure view code for ${deviceIdInput}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 text-blue-400 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
              {isCheckingDevice ? <Smartphone size={32} /> : <Lock size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>

          {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

          {/* Step 1: Enter Device ID */}
          {loginStep === 'enter_device' && (
            <>
              <input
                value={deviceIdInput}
                onChange={e => setDeviceIdInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleDeviceCheck()}
                placeholder="Enter device ID "
                className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
              />
              <button
                onClick={handleDeviceCheck}
                disabled={!deviceIdInput.trim() || isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? 'Checking...' : 'Continue'}
                {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
              </button>
            </>
          )}

          {/* Step 2: Enter or Set View Code */}
          {(loginStep === 'enter_code' || loginStep === 'set_code') && (
            <>
              <input
                type="password"
                value={viewCodeInput}
                onChange={e => setViewCodeInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
                placeholder={loginStep === 'enter_code' ? 'Enter view code' : 'Set a new view code'}
                className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
              />
              <button
                onClick={handleLogin}
                disabled={!viewCodeInput.trim() || isLoading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? 'Connecting...' : 'Connect Securely'}
                 {!isLoading && <ShieldCheck className="w-5 h-5 ml-2" />}
              </button>
              <button onClick={resetLogin} className="w-full text-center text-slate-400 text-xs mt-4 hover:underline">
                Use a different device ID
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 2) After login, always render nav+routes
  return (
    <>
      <nav className="p-4 bg-slate-800 text-white flex items-center">
        <Link to="/" className="mr-4 hover:underline">Monitor</Link>
        {accessKey === '9063492573' && (
          <Link to="/admin" className="hover:underline">Admin</Link>
        )}
      </nav>

      <Routes>
        {/* Home: auto-redirect to /admin if admin, else /monitor */}
        <Route
          index
          element={
            accessKey === '9063492573'
              ? <Navigate to="/admin" replace />
              : <Navigate to="/monitor" replace />
          }
        />

        {/* Monitor page */}
        <Route
          path="/monitor"
          element={<UserMonitor accessKey={accessKey} />}
        />

        {/* Admin page, protect with accessKey check */}
        <Route
          path="/admin"
          element={
            accessKey === 'admin'
              ? <AdminPage />
              : <Navigate to="/monitor" replace />
          }
        />

        {/* Catch‑all → go back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
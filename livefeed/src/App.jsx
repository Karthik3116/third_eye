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
import AdminPage   from './pages/AdminPage';
import { Smartphone } from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function App() {
  const [step, setStep]               = useState('enterDevice'); // 'enterDevice' | 'setViewCode' | 'enterViewCode'
  const [deviceId, setDeviceId]       = useState('');
  const [viewCodeInput, setViewCodeInput] = useState('');
  const [accessKey, setAccessKey]     = useState(null);
  const [viewCode, setViewCode]       = useState(null);

  const checkDevice = async () => {
    const res = await fetch(`${BASE_URL}/viewcode/${deviceId}`);
    const { exists } = await res.json();
    setStep(exists ? 'enterViewCode' : 'setViewCode');
  };

  // create = true for setting a new code, false for validating
  const submitViewCode = async (create) => {
    const res = await fetch(`${BASE_URL}/viewcode/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewCode: viewCodeInput, create })
    });
    if (!res.ok) {
      console.error('View code error', await res.json());
      return;
    }
    setViewCode(viewCodeInput);
    setAccessKey(deviceId);
  };

  // Admin login
  const handleAdminLogin = () => {
    setAccessKey(deviceId.trim());
    setViewCode(null);
  };

  // Root login handler
  const handleLogin = async () => {
    const key = deviceId.trim();
    if (key === 'admin') {
      handleAdminLogin();
    } else {
      await checkDevice();
    }
  };

  // If fully authorized, render nav+routes
  if (accessKey && (accessKey === 'admin' || viewCode)) {
    return (
      <>
        <nav className="p-4 bg-slate-800 text-white flex items-center">
          <Link to="/" className="mr-4 hover:underline">Monitor</Link>
          {accessKey === 'admin' && (
            <Link to="/admin" className="hover:underline">Admin</Link>
          )}
        </nav>
        <Routes>
          <Route
            index
            element={
              <Navigate
                to={accessKey === 'admin' ? '/admin' : '/monitor'}
                replace
              />
            }
          />
          <Route
            path="/monitor"
            element={<UserMonitor deviceId={accessKey} viewCode={viewCode} />}
          />
          <Route
            path="/admin"
            element={
              accessKey === 'admin'
                ? <AdminPage />
                : <Navigate to="/monitor" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Else show login / set‑code / enter‑code
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
        <div className="text-center mb-6">
          <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Device Monitor</h1>
        </div>

        {step === 'enterDevice' && (
          <>
            <input
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter Device ID or 'admin'"
              className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
            />
            <button
              onClick={handleLogin}
              disabled={!deviceId.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </>
        )}

        {step === 'setViewCode' && (
          <>
            <p className="text-slate-400 text-sm mb-2">
              No view-code found for <code>{deviceId}</code>. Create one:
            </p>
            <input
              value={viewCodeInput}
              onChange={e => setViewCodeInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && submitViewCode(true)}
              placeholder="Set a new view code"
              className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
            />
            <button
              onClick={() => submitViewCode(true)}
              disabled={!viewCodeInput.trim()}
              className="w-full py-3 bg-green-600 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              Create & Continue
            </button>
          </>
        )}

        {step === 'enterViewCode' && (
          <>
            <p className="text-slate-400 text-sm mb-2">
              Enter your view-code for <code>{deviceId}</code>:
            </p>
            <input
              value={viewCodeInput}
              onChange={e => setViewCodeInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && submitViewCode(false)}
              placeholder="Your view code"
              className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
            />
            <button
              onClick={() => submitViewCode(false)}
              disabled={!viewCodeInput.trim()}
              className="w-full py-3 bg-blue-600 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

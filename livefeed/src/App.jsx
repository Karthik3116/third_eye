// src/App.jsx
import { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import UserMonitor from './pages/UserMonitor';
import AdminPage   from './pages/AdminPage';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [accessKey, setAccessKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');

  const handleLogin = () => {
    const key = keyInput.trim();
    if (key) setAccessKey(key);
  };

  // 1) Login screen
  if (!accessKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
          <div className="text-center mb-6">
            <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Device Monitor</h1>
            <p className="text-slate-400 text-sm">Enter your access key</p>
          </div>
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter access key ('admin' for admin)"
            className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white"
          />
          <button
            onClick={handleLogin}
            disabled={!keyInput.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50"
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  // 2) After login, always render nav+routes
  return (
    <>
      <nav className="p-4 bg-slate-800 text-white flex items-center">
        <Link to="/" className="mr-4 hover:underline">Monitor</Link>
        {accessKey === 'admin' && (
          <Link to="/admin" className="hover:underline">Admin</Link>
        )}
      </nav>

      <Routes>
        {/* Home: auto-redirect to /admin if admin, else /monitor */}
        <Route
          index
          element={
            accessKey === 'admin'
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



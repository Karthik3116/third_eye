import { useState, useEffect } from 'react';
const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function Login({ onSuccess }) {
  const [deviceId, setDeviceId] = useState('');
  const [viewCode, setViewCode] = useState('');
  const [mode, setMode]         = useState('verify'); // or 'init'
  const [error, setError]       = useState('');

  // Decide whether to initialize or verify:
  useEffect(() => {
    if (!deviceId) return;
    fetch(`${BASE_URL}/verify/${deviceId}?view_code=NONE`)
      .then(res => res.json())
      .then(js => {
        setMode(js.valid ? 'verify' : 'init');
      })
      .catch(() => setMode('init'));
  }, [deviceId]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'init') {
        const res = await fetch(
          `${BASE_URL}/init_view_code/${deviceId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ view_code: viewCode })
          }
        );
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(
          `${BASE_URL}/verify/${deviceId}?view_code=${encodeURIComponent(viewCode)}`
        );
        const js = await res.json();
        if (!js.valid) throw new Error('Invalid code');
      }
      onSuccess(deviceId, viewCode);
    } catch {
      setError(`Could not ${mode === 'init' ? 'initialize' : 'verify'} view code`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-white">
          {mode === 'init' ? 'Initialize View Code' : 'Enter View Code'}
        </h1>
        <input
          placeholder="Device ID"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          required
          className="w-full p-3 bg-slate-700 text-white rounded"
        />
        <input
          placeholder="4+ character View Code"
          value={viewCode}
          onChange={e => setViewCode(e.target.value)}
          required
          className="w-full p-3 bg-slate-700 text-white rounded"
        />
        {error && <p className="text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold"
        >
          {mode === 'init' ? 'Initialize' : 'Verify & Connect'}
        </button>
      </form>
    </div>
  );
}

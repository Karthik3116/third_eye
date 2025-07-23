import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function AdminPage() {
  const [devices, setDevices] = useState([]);

  const fetchPending = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/admin/devices`);
      const json = await res.json();
      setDevices(json.pending || []);
    } catch (e) {
      console.error('Failed to fetch pending devices', e);
    }
  };

  const toggleAuth = async (device, authorize) => {
    try {
      await fetch(`${BASE_URL}/admin/authorize/${device}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorize })
      });
      fetchPending();
    } catch (e) {
      console.error('Failed to update authorization', e);
    }
  };

  useEffect(() => {
    fetchPending();
    const id = setInterval(fetchPending, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">Pending Devices</h2>
      {devices.length === 0 ? (
        <p className="text-slate-400">No devices pending approval.</p>
      ) : (
        <ul className="space-y-3">
          {devices.map(d => (
            <li key={d.device} className="flex items-center justify-between bg-slate-800 p-4 rounded-lg">
              <div>
                <p className="font-mono">{d.device}</p>
                {d.last_seen && (
                  <p className="text-slate-400 text-sm">
                    Last seen: {new Date(d.last_seen).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAuth(d.device, true)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-500 p-2 rounded"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => toggleAuth(d.device, false)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-500 p-2 rounded"
                >
                  <XCircle className="w-4 h-4" /> Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

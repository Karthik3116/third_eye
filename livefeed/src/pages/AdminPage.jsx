
// // src/pages/AdminPage.jsx
// import { useEffect, useState } from 'react';
// import { CheckCircle, XCircle } from 'lucide-react';

// const BASE_URL = 'https://third-eye-txe8.onrender.com';

// export default function AdminPage() {
//   const [devices, setDevices] = useState([]);

//   const fetchDevices = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/admin/devices`);
//       const json = await res.json();
//       const allDevices = json.devices || [];

//       setDevices(allDevices);
//     } catch (e) {
//       console.error('Failed to fetch devices', e);
//     }
//   };

//   const toggleAuth = async (deviceId, authorize) => {
//     try {
//       await fetch(`${BASE_URL}/admin/authorize/${deviceId}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ authorize }),
//       });
//       fetchDevices();
//     } catch (e) {
//       console.error('Failed to update authorization', e);
//     }
//   };

//   useEffect(() => {
//     fetchDevices();
//     const id = setInterval(fetchDevices, 500000);
//     return () => clearInterval(id);
//   }, []);

//   return (
//     <div className="p-6 bg-slate-900 min-h-screen text-white">
//       <h2 className="text-2xl font-bold mb-4">All Devices</h2>
//       {devices.length === 0 ? (
//         <p className="text-slate-400">No devices found.</p>
//       ) : (
//         <ul className="space-y-3">
//           {devices.map((d) => (
//             <li
//               key={d.device}
//               className="flex items-center justify-between bg-slate-800 p-4 rounded-lg"
//             >
//               <div>
//                 <p className="font-mono text-lg">{d.device}</p>
//                 {d.last_seen && (
//                   <p className="text-slate-400 text-sm">
//                     Last seen: {new Date(d.last_seen).toLocaleString()}
//                   </p>
//                 )}
//                 <p
//                   className={`mt-1 text-sm font-semibold ${
//                     d.authorized ? 'text-green-400' : 'text-red-400'
//                   }`}
//                 >
//                   {d.authorized ? 'Authorized' : 'Not Authorized'}
//                 </p>
//               </div>

//               <button
//                 onClick={() => toggleAuth(d.device, !d.authorized)}
//                 className={`flex items-center gap-1 p-2 rounded ${
//                   d.authorized
//                     ? 'bg-red-600 hover:bg-red-500'
//                     : 'bg-green-600 hover:bg-green-500'
//                 }`}
//               >
//                 {d.authorized ? (
//                   <>
//                     <XCircle className="w-4 h-4" /> Revoke
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle className="w-4 h-4" /> Grant
//                   </>
//                 )}
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }


// import { useEffect, useState } from 'react';
// import { CheckCircle, XCircle } from 'lucide-react';

// const BASE_URL = 'https://third-eye-txe8.onrender.com';

// export default function AdminPage() {
//   const [devices, setDevices] = useState([]);

//   const fetchDevices = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/admin/devices`);
//       const json = await res.json();
//       setDevices(json.devices || []);
//     } catch (e) {
//       console.error('Failed to fetch devices', e);
//     }
//   };

//   // Now accepts optional hours/minutes
//   const toggleAuth = async (deviceId, authorize, hours = 0, minutes = 0) => {
//     try {
//       await fetch(`${BASE_URL}/admin/authorize/${deviceId}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ authorize, hours, minutes }),
//       });
//       fetchDevices();
//     } catch (e) {
//       console.error('Failed to update authorization', e);
//     }
//   };

//   // On “Grant”, ask for duration
//   const handleGrant = (deviceId) => {
//     const input = prompt(
//       'Enter subscription duration in hours and minutes (HH:MM)',
//       '1:00'
//     );
//     if (!input) return;
//     const [h, m] = input.split(':').map((n) => parseInt(n, 10));
//     if (isNaN(h) || isNaN(m)) {
//       alert('Invalid format. Use HH:MM');
//       return;
//     }
//     toggleAuth(deviceId, true, h, m);
//   };

//   // On “Revoke”, no prompt
//   const handleRevoke = (deviceId) => {
//     toggleAuth(deviceId, false);
//   };

//   useEffect(() => {
//     fetchDevices();
//     const id = setInterval(fetchDevices, 5 * 60 * 1000); // every 5m
//     return () => clearInterval(id);
//   }, []);

//   return (
//     <div className="p-6 bg-slate-900 min-h-screen text-white">
//       <h2 className="text-2xl font-bold mb-4">All Devices</h2>
//       {devices.length === 0 ? (
//         <p className="text-slate-400">No devices found.</p>
//       ) : (
//         <ul className="space-y-3">
//           {devices.map((d) => (
//             <li
//               key={d.device}
//               className="flex items-center justify-between bg-slate-800 p-4 rounded-lg"
//             >
//               <div>
//                 <p className="font-mono text-lg">{d.device}</p>
//                 {d.last_seen && (
//                   <p className="text-slate-400 text-sm">
//                     Last seen: {new Date(d.last_seen).toLocaleString()}
//                   </p>
//                 )}
//                 {d.subscription_expires && (
//                   <p className="text-yellow-300 text-sm">
//                     Expires at:{' '}
//                     {new Date(d.subscription_expires).toLocaleString()}
//                   </p>
//                 )}
//                 <p
//                   className={`mt-1 text-sm font-semibold ${
//                     d.authorized ? 'text-green-400' : 'text-red-400'
//                   }`}
//                 >
//                   {d.authorized ? 'Authorized' : 'Not Authorized'}
//                 </p>
//               </div>

//               <button
//                 onClick={() =>
//                   d.authorized
//                     ? handleRevoke(d.device)
//                     : handleGrant(d.device)
//                 }
//                 className={`flex items-center gap-1 p-2 rounded ${
//                   d.authorized
//                     ? 'bg-red-600 hover:bg-red-500'
//                     : 'bg-green-600 hover:bg-green-500'
//                 }`}
//               >
//                 {d.authorized ? (
//                   <>
//                     <XCircle className="w-4 h-4" /> Revoke
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle className="w-4 h-4" /> Grant
//                   </>
//                 )}
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }


// src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function AdminPage() {
  const [devices, setDevices] = useState([]);
  const [modal, setModal] = useState({ open: false, deviceId: null });
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/devices`);
      const json = await res.json();
      setDevices(json.devices || []);
    } catch (e) {
      console.error('Failed to fetch devices', e);
    }
  };

  const toggleAuth = async (deviceId, authorize, h = 0, m = 0) => {
    try {
      await fetch(`${BASE_URL}/admin/authorize/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorize, hours: h, minutes: m }),
      });
      setModal({ open: false, deviceId: null });
      fetchDevices();
    } catch (e) {
      console.error('Failed to update authorization', e);
    }
  };

  const openGrantModal = (deviceId) => {
    setHours(1);
    setMinutes(0);
    setModal({ open: true, deviceId });
  };

  const handleRevoke = (deviceId) => {
    toggleAuth(deviceId, false);
  };

  useEffect(() => {
    fetchDevices();
    const id = setInterval(fetchDevices, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">All Devices</h2>

      {devices.length === 0 ? (
        <p className="text-slate-400">No devices found.</p>
      ) : (
        <ul className="space-y-3">
          {devices.map((d) => (
            <li
              key={d.device}
              className="flex items-center justify-between bg-slate-800 p-4 rounded-lg"
            >
              <div>
                <p className="font-mono text-lg">{d.device}</p>
                {d.last_seen && (
                  <p className="text-slate-400 text-sm">
                    Last seen: {new Date(d.last_seen).toLocaleString()}
                  </p>
                )}
                {d.subscription_expires && (
                  <p className="text-yellow-300 text-sm">
                    Expires at:{' '}
                    {new Date(d.subscription_expires).toLocaleString()}
                  </p>
                )}
                <p
                  className={`mt-1 text-sm font-semibold ${
                    d.authorized ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {d.authorized ? 'Authorized' : 'Not Authorized'}
                </p>
              </div>

              <button
                onClick={() =>
                  d.authorized
                    ? handleRevoke(d.device)
                    : openGrantModal(d.device)
                }
                className={`flex items-center gap-1 p-2 rounded ${
                  d.authorized
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {d.authorized ? (
                  <>
                    <XCircle className="w-4 h-4" /> Revoke
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Grant
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-80">
            <h3 className="text-xl font-semibold text-white mb-4">
              Grant Access
            </h3>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-300 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 rounded bg-slate-700 text-white"
                  value={hours}
                  onChange={(e) => setHours(+e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-300 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  className="w-full p-2 rounded bg-slate-700 text-white"
                  value={minutes}
                  onChange={(e) => setMinutes(+e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal({ open: false, deviceId: null })}
                className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  toggleAuth(modal.deviceId, true, hours, minutes)
                }
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-white"
              >
                Grant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

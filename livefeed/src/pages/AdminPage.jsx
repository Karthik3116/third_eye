
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
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const BASE_URL = 'https://third-eye-txe8.onrender.com';

export default function AdminPage({ deviceId, viewCode }) {
  const [devices, setDevices] = useState([]);

  const fetchDevices = async () => {
    try {
      const res  = await fetch(
        `${BASE_URL}/admin/devices?view_code=${encodeURIComponent(viewCode)}`
      );
      const json = await res.json();
      setDevices(json.devices || []);
    } catch (e) {
      console.error('Failed to fetch devices', e);
    }
  };

  const toggleAuth = async (device, authorize) => {
    try {
      await fetch(
        `${BASE_URL}/admin/authorize/${device}?view_code=${encodeURIComponent(viewCode)}`,
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ authorize })
        }
      );
      fetchDevices();
    } catch (e) {
      console.error('Failed to update authorization', e);
    }
  };

  useEffect(() => {
    fetchDevices();
    const id = setInterval(fetchDevices, 5000);
    return () => clearInterval(id);
  }, [viewCode]);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">All Devices</h2>
      {devices.length === 0 ? (
        <p className="text-slate-400">No devices found.</p>
      ) : (
        <ul className="space-y-3">
          {devices.map(d => (
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
                <p className={`mt-1 text-sm font-semibold ${
                  d.authorized ? 'text-green-400' : 'text-red-400'
                }`}>
                  {d.authorized ? 'Authorized' : 'Not Authorized'}
                </p>
              </div>
              <button
                onClick={() => toggleAuth(d.device, !d.authorized)}
                className={`flex items-center gap-1 p-2 rounded ${
                  d.authorized
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {d.authorized ? (
                  <><XCircle className="w-4 h-4"/> Revoke</>
                ) : (
                  <><CheckCircle className="w-4 h-4"/> Grant</>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

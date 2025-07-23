import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Notifications({ list }) {
  return (
    <div className={`fixed right-4 top-4 space-y-2 z-50`}>
      {list.map(n => (
        <div
          key={n.id}
          className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border max-w-xs transform transition ${
            n.type === 'success'
              ? 'bg-green-900/90 border-green-700 text-green-100'
              : n.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-100'
                : 'bg-blue-900/90 border-blue-700 text-blue-100'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {n.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {n.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>{n.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

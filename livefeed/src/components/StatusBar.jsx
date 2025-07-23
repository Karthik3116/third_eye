import React from 'react';
import { Wifi, WifiOff, Clock,Power  } from 'lucide-react';

export default function StatusBar({ status, lastUpdate, onToggle, isPosting, loading }) {
  const statusIcon = status === 'connected'
    ? <Wifi className="text-green-400"/>
    : status === 'connecting'
      ? <Wifi className="text-yellow-400"/>
      : <WifiOff className="text-red-400"/>;

  const statusText = status === 'connected'
    ? 'Online'
    : status === 'connecting'
      ? 'Connecting'
      : status === 'no_device'
        ? 'No Device'
        : 'Offline';

  return (
    <div className="bg-slate-800/30 border-b border-slate-700 p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="capitalize text-sm text-slate-300">{statusText}</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400"/>
              <span className="text-sm text-slate-300">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-1 rounded font-semibold ${
            isPosting ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
          } disabled:opacity-50`}
        >
          <Power className="w-4 h-4" />
          {isPosting ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}

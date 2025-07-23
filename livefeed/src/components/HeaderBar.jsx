import React from 'react';
import { Smartphone, RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';

export default function HeaderBar({
  deviceName,
  accessKey,
  isPageVisible,
  loading,
  onRefresh,
  showSettings,
  setShowSettings
}) {
  return (
    <header className={`bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold">{deviceName}</h1>
            <p className="text-xs text-slate-400">{accessKey}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPageVisible
            ? <Eye className="w-4 h-4 text-green-400"/>
            : <EyeOff className="w-4 h-4 text-orange-400"/>}
          <button onClick={onRefresh} disabled={loading} className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={()=>setShowSettings(s=>!s)} className="p-2 bg-slate-700 rounded hover:bg-slate-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

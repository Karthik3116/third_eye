import React from 'react';
import { Smartphone, Monitor, RefreshCw,Info ,Maximize2 ,Download ,Share ,Minimize2  } from 'lucide-react';

export default function MainContent({
  loading, deviceData, orientation,
  downloadScreenshot, shareScreenshot,
  isFullscreen, setIsFullscreen, showDeviceInfo, setShowDeviceInfo
}) {
  if (loading && !deviceData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4"/>
          <p className="text-slate-400">Connecting to device…</p>
        </div>
      </div>
    );
  }

  if (!deviceData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4"/>
          <p className="text-lg text-slate-400 mb-2">No device connected</p>
          <p className="text-sm text-slate-500">Start capture to monitor your device</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${isFullscreen ? 'fixed inset-4 z-40' : ''}`}>
      <div className="bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700">
        {/* header controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              deviceData.isActive ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="font-medium">{deviceData.device_name || deviceData.uid}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowDeviceInfo(si=>!si)} className="p-2 rounded hover:bg-slate-700">
              <Info className="w-5 h-5"/>
            </button>
            <button onClick={()=>setIsFullscreen(f=>!f)} className="p-2 rounded hover:bg-slate-700">
              {isFullscreen
                ? <Minimize2 className="w-5 h-5"/>
                : <Maximize2 className="w-5 h-5"/>}
            </button>
          </div>
        </div>

        {/* screenshot */}
        <div className={`relative bg-black rounded-2xl overflow-hidden ${
          orientation==='landscape' ? 'aspect-video' : 'aspect-[9/16]'
        }`}>
          {deviceData.screenshot_png_b64
            ? <img
                src={`data:image/webp;base64,${deviceData.screenshot_png_b64}`}
                alt="Device screenshot"
                className="w-full h-full object-contain"
              />
            : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Monitor className="w-12 h-12 mb-2"/>
                <p className="text-sm">No screen capture</p>
              </div>
            )
          }
        </div>

        {/* optional info panel */}
        {showDeviceInfo && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded border border-slate-600 text-sm grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400">Device ID:</span>
              <p className="font-mono truncate">{deviceData.uid}</p>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <p className={deviceData.isActive ? 'text-green-400' : 'text-red-400'}>
                {deviceData.isActive ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Last Update:</span>
              <p>{new Date(deviceData.received_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* download/share */}
        {deviceData.screenshot_png_b64 && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={downloadScreenshot}
              className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5"/> Download
            </button>
            <button
              onClick={shareScreenshot}
              className="flex-1 py-2 rounded bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
            >
              <Share className="w-5 h-5"/> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

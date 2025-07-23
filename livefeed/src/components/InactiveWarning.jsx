import React from 'react';
import { EyeOff } from 'lucide-react';

export default function InactiveWarning({ seconds }) {
  return (
    <div className="fixed top-0 inset-x-0 bg-orange-600 p-3 text-center z-50">
      <div className="flex items-center justify-center gap-2">
        <EyeOff className="w-5 h-5" />
        <span>Page inactive {seconds}s – auto‑stop at 60s</span>
      </div>
    </div>
  );
}

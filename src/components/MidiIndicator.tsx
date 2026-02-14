
import { useEffect, useState } from 'react';
import { midiHandler } from '../lib/midi';

export function MidiIndicator() {
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to connection changes
    const cleanup = midiHandler.addConnectionListener((connectedDevices) => {
        setDevices(connectedDevices);
    });
    return cleanup;
  }, []);

  const isConnected = devices.length > 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-300 ${
        isConnected 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-slate-50 text-slate-500 border-slate-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
      <span>{isConnected ? devices[0] : 'No MIDI Device'}</span>
      {devices.length > 1 && (
          <span className="bg-emerald-100 px-1.5 rounded text-[10px]">{`+${devices.length - 1}`}</span>
      )}
    </div>
  );
}

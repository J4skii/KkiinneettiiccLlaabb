
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { SimulationConfig, GlobalSettings } from '../types';
import Canvas from './Canvas';
import { Maximize2, RefreshCw, BarChart2, Zap } from 'lucide-react';

interface SimulationCardProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  onFocus?: () => void;
  isFocused?: boolean;
}

const SimulationCard: React.FC<SimulationCardProps> = ({ config, globalSettings, onFocus, isFocused }) => {
  const [resetKey, setResetKey] = useState(0);
  const [telemetry, setTelemetry] = useState({ ke: 0, collisions: 0 });
  const [keHistory, setKeHistory] = useState<number[]>([]);
  const sparklineRef = useRef<HTMLCanvasElement>(null);

  const handleStats = (ke: number, col: number) => {
    setTelemetry({ ke, collisions: col });
    setKeHistory(prev => {
      const next = [...prev, ke];
      return next.slice(-100);
    });
  };

  useEffect(() => {
    if (sparklineRef.current && keHistory.length > 1) {
      const ctx = sparklineRef.current.getContext('2d');
      if (!ctx) return;
      const w = sparklineRef.current.width;
      const h = sparklineRef.current.height;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      const maxKe = Math.max(...keHistory, 50);
      keHistory.forEach((val, i) => {
        const x = (i / 99) * w;
        const y = h - (val / maxKe) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [keHistory]);

  return (
    <div className={`bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border transition-all duration-700 flex flex-col relative group w-full ${isFocused ? 'h-full border-transparent' : 'max-w-xs border-white/5 hover:border-red-600/40 hover:scale-[1.02]'}`}>
      
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="bg-black/90 backdrop-blur-xl rounded-xl px-3 py-1.5 border border-white/10 shadow-lg">
               <h3 className="text-white font-black text-[11px] uppercase tracking-[0.2em] italic flex items-center gap-2">
                 <Zap size={10} className="text-red-500 fill-red-500"/> {config.name}
               </h3>
          </div>
          <div className="flex gap-1.5">
             <div className="bg-red-600/10 backdrop-blur-md rounded-lg px-2 py-1 border border-red-500/30 flex items-center gap-2">
                <BarChart2 size={10} className="text-red-500" />
                <span className="text-red-400 font-mono text-[9px] font-black uppercase tracking-tighter">{telemetry.ke.toFixed(1)} <span className="opacity-50">KE</span></span>
             </div>
             {isFocused && (
               <div className="bg-black/80 backdrop-blur-md rounded-lg px-2 py-1 border border-white/10 flex items-center">
                  <canvas ref={sparklineRef} width={120} height={18} className="opacity-80" />
               </div>
             )}
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setResetKey(k => k + 1)} className="bg-black/80 backdrop-blur-xl p-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-red-600 transition-all shadow-xl">
              <RefreshCw size={16} />
          </button>
          {!isFocused && (
            <button onClick={onFocus} className="bg-black/80 backdrop-blur-xl p-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-red-600 transition-all shadow-xl">
                <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Trapping Chamber */}
      <div className={`flex-grow relative bg-black ${isFocused ? 'h-full' : 'aspect-square'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.08)_0%,transparent_75%)] pointer-events-none"></div>
        <Canvas key={resetKey} config={config} globalSettings={globalSettings} onStatsUpdate={handleStats} />
      </div>

      {/* Evil Panel */}
      {!isFocused && (
        <div className="bg-neutral-950 p-5 border-t border-white/5">
          <p className="text-[10px] text-neutral-500 font-medium italic opacity-70 mb-4 line-clamp-2 leading-relaxed">"{config.nuanceDescription}"</p>
          <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="text-[9px] font-black px-2 py-1 rounded bg-neutral-900 text-neutral-500 border border-white/5 uppercase">V{config.vertexCount}</span>
                <span className="text-[9px] font-black px-2 py-1 rounded bg-neutral-900 text-neutral-500 border border-white/5 uppercase">M{config.ballSize}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/10 rounded-full border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">TRAPPING_CHAMBER_ACTIVE</span>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationCard;

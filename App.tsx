
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { presets } from './utils/presets';
import SimulationCard from './components/SimulationCard';
import { GlobalSettings, SimulationConfig } from './types';
import { Activity, Play, Pause, Zap, Wind, X, Volume2, VolumeX, Globe, Compass, Thermometer } from 'lucide-react';

const App: React.FC = () => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    timeScale: 1.0,
    gravityMultiplier: 1.0,
    gravityAngle: 90, // Default downward
    viscosity: 0.001,
    rotationMultiplier: 1.0,
    bouncinessMultiplier: 1.0,
    showVectors: false,
    showTrails: true,
    precision: 4,
    useHeatmap: true,
    enableAudio: false,
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [focusedSim, setFocusedSim] = useState<SimulationConfig | null>(null);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const setEnvironment = (gravity: number) => {
    setGlobalSettings(p => ({ ...p, gravityMultiplier: gravity }));
  };

  const currentSpeed = isPlaying ? globalSettings.timeScale : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white">
      
      {/* Advanced Research Header */}
      <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4 min-w-max">
              <div className="p-2 bg-red-600/20 rounded-xl border border-red-500/30">
                <Activity className="text-red-500" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                  Kinetic<span className="text-red-600">Lab</span>
                </h1>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">Research Module 2.5</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
              
              {/* Speed & Time */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[9px] font-black uppercase text-neutral-500">
                    <span>Temporal</span>
                    <span className="text-red-500">{isPlaying ? globalSettings.timeScale.toFixed(2) : 'FROZEN'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={togglePlay} className={`p-1.5 rounded-md ${isPlaying ? 'bg-neutral-800 text-red-500' : 'bg-red-600 text-white'}`}>
                        {isPlaying ? <Pause size={14}/> : <Play size={14}/>}
                     </button>
                     <input type="range" min="0.1" max="2.5" step="0.1" value={globalSettings.timeScale} onChange={(e) => setGlobalSettings(p => ({...p, timeScale: parseFloat(e.target.value)}))} className="w-full h-1 bg-neutral-800 rounded-full appearance-none accent-red-600 cursor-pointer"/>
                 </div>
              </div>

              {/* Gravity Vector */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[9px] font-black uppercase text-neutral-500">
                    <span className="flex items-center gap-1"><Compass size={10}/> Vector Angle</span>
                    <span className="text-red-500">{globalSettings.gravityAngle}°</span>
                 </div>
                 <input type="range" min="0" max="360" step="1" value={globalSettings.gravityAngle} onChange={(e) => setGlobalSettings(p => ({...p, gravityAngle: parseInt(e.target.value)}))} className="w-full h-1 bg-neutral-800 rounded-full appearance-none accent-red-600 cursor-pointer"/>
              </div>

              {/* Viscosity / Drag */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[9px] font-black uppercase text-neutral-500">
                    <span className="flex items-center gap-1"><Wind size={10}/> Viscosity</span>
                    <span className="text-red-500">{(globalSettings.viscosity * 100).toFixed(1)}%</span>
                 </div>
                 <input type="range" min="0" max="0.1" step="0.001" value={globalSettings.viscosity} onChange={(e) => setGlobalSettings(p => ({...p, viscosity: parseFloat(e.target.value)}))} className="w-full h-1 bg-neutral-800 rounded-full appearance-none accent-red-600 cursor-pointer"/>
              </div>

              {/* Environment Quick Presets */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-neutral-500 flex items-center gap-1"><Globe size={10}/> Environment</span>
                <div className="flex gap-1 bg-neutral-800 rounded-md p-0.5">
                  {[0, 0.2, 1, 2.5].map((g, idx) => (
                    <button key={idx} onClick={() => setEnvironment(g)} className={`flex-1 py-1 text-[8px] font-bold rounded ${globalSettings.gravityMultiplier === g ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
                      {g === 0 ? 'ZERO' : g === 0.2 ? 'MOON' : g === 1 ? 'EARTH' : 'JUPIT'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viz Toggles */}
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black uppercase text-neutral-500 flex items-center gap-1"><Thermometer size={10}/> Visualization</span>
                 <div className="flex gap-1">
                    <button onClick={() => setGlobalSettings(p => ({...p, useHeatmap: !p.useHeatmap}))} className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${globalSettings.useHeatmap ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-neutral-800 border-transparent text-neutral-500'}`}>HEATMAP</button>
                    <button onClick={() => setGlobalSettings(p => ({...p, enableAudio: !p.enableAudio}))} className={`p-1 flex items-center justify-center rounded border transition-all ${globalSettings.enableAudio ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-neutral-800 border-transparent text-neutral-500'}`}>
                      {globalSettings.enableAudio ? <Volume2 size={12}/> : <VolumeX size={12}/>}
                    </button>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {presets.map(preset => (
            <SimulationCard 
                key={preset.id} 
                config={preset} 
                globalSettings={{...globalSettings, timeScale: currentSpeed}}
                onFocus={() => setFocusedSim(preset)}
            />
          ))}
        </div>
      </main>

      {focusedSim && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-200">
           <div className="relative w-full max-w-6xl aspect-[16/9] bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_150px_rgba(220,38,38,0.2)] flex flex-col md:flex-row">
              <button onClick={() => setFocusedSim(null)} className="absolute top-6 right-6 z-[110] p-2.5 bg-neutral-800/80 hover:bg-red-600 text-white rounded-full transition-all border border-white/10"><X size={24} /></button>
              <div className="flex-1 h-full bg-black relative">
                <SimulationCard config={focusedSim} globalSettings={{...globalSettings, timeScale: currentSpeed}} isFocused />
              </div>
              <div className="w-full md:w-96 p-10 border-l border-white/5 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{focusedSim.name}</h2>
                    <div className="h-1 w-16 bg-red-600 mt-3 rounded-full"></div>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed italic">"{focusedSim.nuanceDescription}"</p>
                  <div className="space-y-3">
                     <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Experimental Data</div>
                     <div className="grid grid-cols-2 gap-3">
                        <DataBit label="Friction" value={focusedSim.friction.toFixed(3)} />
                        <DataBit label="Elasticity" value={focusedSim.restitution.toFixed(2)} />
                        <DataBit label="Particles" value={focusedSim.ballCount.toString()} />
                        <DataBit label="Vertices" value={focusedSim.vertexCount.toString()} />
                     </div>
                  </div>
                </div>
                <div className="p-5 bg-red-600/5 rounded-2xl border border-red-500/10">
                   <div className="text-[10px] font-black text-red-500 uppercase mb-2">Researcher's Log</div>
                   <div className="text-xs text-neutral-300 leading-relaxed opacity-70">Sub-stepping precision at {globalSettings.precision}x ensures accurate trajectory calculation even at high velocity impacts. Heatmap viz enabled.</div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const DataBit = ({ label, value }: { label: string, value: string }) => (
  <div className="p-3 bg-neutral-800/50 rounded-xl border border-white/5">
    <div className="text-[8px] text-neutral-500 font-black uppercase mb-1 tracking-tighter">{label}</div>
    <div className="text-lg font-mono text-red-500 font-bold leading-none">{value}</div>
  </div>
);

export default App;

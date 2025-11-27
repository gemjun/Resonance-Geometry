import React, { useState } from 'react';
import { generateThemeFromVibe } from '../services/geminiService';
import { LevelTheme } from '../types';
import { DEFAULT_THEME } from '../constants';
import { Music, Wand2, Play, Info } from 'lucide-react';

interface LobbyProps {
  onStart: (theme: LevelTheme) => void;
  lastScore: number;
}

export const Lobby: React.FC<LobbyProps> = ({ onStart, lastScore }) => {
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<LevelTheme>(DEFAULT_THEME);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const handleGenerate = async () => {
    if (!vibe) return;
    setIsGenerating(true);
    const theme = await generateThemeFromVibe(vibe);
    setCurrentTheme(theme);
    setIsGenerating(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 p-8">
        
        {/* Left: Branding & Input */}
        <div className="flex-1 space-y-8">
           <div>
             <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-2 brand-font leading-tight">
               RESONANCE<br/>GEOMETRY
             </h1>
             <p className="text-gray-400 text-lg">Architects of Light & Sound</p>
           </div>

           <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur">
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Wand2 className="w-5 h-5 text-purple-400" />
               Procedural Level Gen
             </h3>
             <p className="text-sm text-gray-500 mb-4">
               Enter a vibe, mood, or setting (e.g., "Cyberpunk Rain", "Ancient Gold Temple").
               Gemini will architect the level parameters for you.
             </p>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={vibe}
                 onChange={(e) => setVibe(e.target.value)}
                 placeholder="Enter a vibe..." 
                 className="flex-1 bg-black border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
                 onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
               />
               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating || !vibe}
                 className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded font-bold transition-all"
               >
                 {isGenerating ? 'Dreaming...' : 'Generate'}
               </button>
             </div>
             {!process.env.API_KEY && (
                <p className="text-xs text-red-400 mt-2">
                  * API Key missing. Using fallback themes.
                </p>
             )}
           </div>

           {lastScore > 0 && (
             <div className="text-2xl font-mono text-gray-400">
               Last Run Score: <span className="text-white">{lastScore.toLocaleString()}</span>
             </div>
           )}
        </div>

        {/* Right: Theme Preview & Start */}
        <div className="flex-1 flex flex-col gap-6">
           <div 
             className="flex-1 rounded-2xl p-8 relative overflow-hidden group transition-all duration-500"
             style={{ 
               background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, #000 100%)`,
               borderColor: currentTheme.colors.primary,
               borderWidth: '1px'
             }}
           >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 mb-4 border border-white/20">
                  {currentTheme.name}
                </span>
                <p className="text-sm text-gray-300 mb-6 italic">
                  "{currentTheme.description}"
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm font-mono mb-8">
                  <div>
                    <span className="text-gray-500 block">BPM</span>
                    <span className="text-xl">{currentTheme.bpm}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Structure</span>
                    <span className="capitalize">{currentTheme.buildingShape}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Primary</span>
                    <div className="w-8 h-8 rounded mt-1" style={{ background: currentTheme.colors.primary }}></div>
                  </div>
                   <div>
                    <span className="text-gray-500 block">Accent</span>
                    <div className="w-8 h-8 rounded mt-1" style={{ background: currentTheme.colors.accent }}></div>
                  </div>
                </div>

                <button 
                  onClick={() => onStart(currentTheme)}
                  className="w-full bg-white text-black py-4 rounded-lg font-black text-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  <Play className="fill-current" />
                  INITIATE SEQUENCE
                </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

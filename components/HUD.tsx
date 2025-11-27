import React from 'react';
import { GameState, LevelTheme } from '../types';
import { Sparkles, Trophy, Zap } from 'lucide-react';

interface HUDProps {
  gameState: GameState;
  theme: LevelTheme;
}

export const HUD: React.FC<HUDProps> = ({ gameState, theme }) => {
  const { score, combo, multiplier, health } = gameState;

  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg border-l-4" style={{ borderColor: theme.colors.primary }}>
                <h1 className="text-4xl font-bold text-white tracking-widest brand-font">{score.toLocaleString()}</h1>
                <p className="text-gray-400 text-sm font-mono">SCORE</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
                 <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded border border-gray-700">
                    <span className="text-xs text-gray-400">MULTIPLIER</span>
                    <span className="ml-2 text-xl font-bold" style={{ color: theme.colors.accent }}>x{multiplier}</span>
                 </div>
            </div>
        </div>

        {/* Health / Energy Bar */}
        <div className="w-64">
           <div className="flex justify-between text-xs text-gray-300 mb-1 font-mono">
             <span>RESONANCE INTEGRITY</span>
             <span>{Math.round(health)}%</span>
           </div>
           <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
             <div 
                className="h-full transition-all duration-300 ease-out"
                style={{ 
                    width: `${health}%`,
                    backgroundColor: health > 50 ? theme.colors.primary : '#ef4444',
                    boxShadow: `0 0 20px ${theme.colors.primary}`
                }}
             />
           </div>
        </div>
      </div>

      {/* Combo Center */}
      {combo > 5 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transform scale-110 transition-transform duration-100">
            <div className="text-6xl font-black italic brand-font" style={{ 
                color: theme.colors.secondary,
                textShadow: `0 0 30px ${theme.colors.secondary}`
            }}>
                {combo}
            </div>
            <div className="text-white text-lg tracking-[0.5em] font-light">COMBO</div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="flex justify-center gap-8 text-white/50 text-sm font-mono mb-8">
         <div className="flex flex-col items-center">
            <div className="w-10 h-10 border border-white/30 rounded flex items-center justify-center mb-1">D</div>
            <span>LEFT</span>
         </div>
         <div className="flex flex-col items-center">
            <div className="w-10 h-10 border border-white/30 rounded flex items-center justify-center mb-1">F</div>
            <span>DOWN</span>
         </div>
         <div className="flex flex-col items-center">
            <div className="w-10 h-10 border border-white/30 rounded flex items-center justify-center mb-1">J</div>
            <span>UP</span>
         </div>
         <div className="flex flex-col items-center">
            <div className="w-10 h-10 border border-white/30 rounded flex items-center justify-center mb-1">K</div>
            <span>RIGHT</span>
         </div>
      </div>
    </div>
  );
};

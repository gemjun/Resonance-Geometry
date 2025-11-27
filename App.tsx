import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Lobby } from './components/Lobby';
import { GameState, Note, BuildingBlock, LevelTheme, LaneIndex } from './types';
import { audioEngine } from './services/audioEngine';
import { DEFAULT_THEME, HIT_WINDOW, KEY_MAPPINGS, SPAWN_DISTANCE, NOTE_SPEED, HIT_Y } from './constants';
import * as THREE from 'three';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    health: 100,
    isPlaying: false,
    gameStatus: 'menu'
  });

  const [activeTheme, setActiveTheme] = useState<LevelTheme>(DEFAULT_THEME);
  const [notes, setNotes] = useState<Note[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);
  
  // Refs for loop management to avoid stale closures in event listeners
  const gameStateRef = useRef(gameState);
  const notesRef = useRef(notes);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Audio Engine Callbacks
  useEffect(() => {
    audioEngine.onSpawnNote = (lane, time) => {
        // Calculate the timestamp when the note hits the target (0)
        // Note spawns at `time`. It travels distance `SPAWN_DISTANCE`.
        // Speed = `NOTE_SPEED`. Time to travel = Dist / Speed.
        // So ArrivalTime = time + (SPAWN_DISTANCE / NOTE_SPEED)
        // Wait... AudioEngine calls this when the NOTE SHOULD BE HEARD? 
        // No, AudioEngine schedules sound. We want the visual to match the sound at the hit line.
        // If sound plays at T, the note must arrive at HitLine at T.
        // It takes (SPAWN_DISTANCE / NOTE_SPEED) seconds to travel.
        // So we must spawn it visually at T - travelTime.
        // However, we are in a realtime loop.
        // The AudioEngine is simpler: It tells us "A note exists at time T".
        // We just add it to the state with targetTimestamp = T.
        // The Renderer handles drawing it at the right Z based on (T - currentTime).
        
        const newNote: Note = {
            id: Math.random().toString(36).substr(2, 9),
            lane: lane as LaneIndex,
            timestamp: time,
            hit: false,
            missed: false
        };
        
        setNotes(prev => [...prev, newNote]);
    };

    return () => {
        audioEngine.onSpawnNote = null;
    };
  }, []);

  const handleStartGame = async (theme: LevelTheme) => {
    await audioEngine.init();
    audioEngine.setTheme(theme);
    setActiveTheme(theme);
    setGameState({
      score: 0,
      combo: 0,
      maxCombo: 0,
      multiplier: 1,
      health: 100,
      isPlaying: true,
      gameStatus: 'playing'
    });
    setNotes([]);
    setBlocks([]);
    audioEngine.start();
  };

  const handleInput = useCallback((lane: number) => {
    if (gameStateRef.current.gameStatus !== 'playing') return;

    const currentTime = audioEngine.getCurrentTime();
    const activeNotes = notesRef.current.filter(n => !n.hit && !n.missed && n.lane === lane);

    // Find closest note
    let closestNote: Note | null = null;
    let minDiff = Infinity;

    for (const note of activeNotes) {
        const diff = Math.abs(note.timestamp - currentTime);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }

    if (closestNote && minDiff * 1000 <= HIT_WINDOW.GOOD) {
        // HIT!
        const isPerfect = minDiff * 1000 <= HIT_WINDOW.PERFECT;
        const isGreat = minDiff * 1000 <= HIT_WINDOW.GREAT;
        
        const points = isPerfect ? 300 : isGreat ? 100 : 50;
        const healthBonus = isPerfect ? 5 : 2;

        setGameState(prev => ({
            ...prev,
            score: prev.score + (points * prev.multiplier),
            combo: prev.combo + 1,
            maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
            multiplier: Math.min(8, 1 + Math.floor((prev.combo + 1) / 10)),
            health: Math.min(100, prev.health + healthBonus)
        }));

        // Remove note from active list (mark as hit)
        setNotes(prev => prev.filter(n => n.id !== closestNote!.id));

        // Construct Building Block
        addBuildingBlock(activeTheme, prev => prev.combo);
        
        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(isPerfect ? 20 : 10);
        }

    } else {
        // Miss due to bad timing input? 
        // Usually rhythm games don't penalize empty taps unless strict, 
        // but we can just ignore stray taps for simplicity.
    }
  }, [activeTheme]);

  const addBuildingBlock = (theme: LevelTheme, comboGetter: (s: GameState) => number) => {
      // Procedural placement logic
      // Spiral:
      // x = r * cos(theta)
      // z = r * sin(theta)
      // y = h
      setBlocks(prev => {
          const idx = prev.length;
          const angle = idx * 0.5;
          const radius = theme.buildingShape === 'spiral' ? 3 : theme.buildingShape === 'tower' ? 2 : 5;
          const height = idx * 0.5;
          
          let pos: [number, number, number] = [0, 0, 0];
          
          if (theme.buildingShape === 'spiral') {
              pos = [Math.sin(angle) * radius, height, Math.cos(angle) * radius];
          } else if (theme.buildingShape === 'tower') {
               // Square tower
               const side = idx % 4;
               const offset = 2;
               if (side === 0) pos = [offset, height, offset];
               if (side === 1) pos = [-offset, height, offset];
               if (side === 2) pos = [-offset, height, -offset];
               if (side === 3) pos = [offset, height, -offset];
          } else {
              // Bridge
              pos = [0, 0, -idx * 2];
          }

          return [...prev, {
              id: Math.random().toString(),
              position: pos,
              rotation: [0, angle, 0],
              scale: [1, 1, 1],
              color: Math.random() > 0.5 ? theme.colors.primary : theme.colors.secondary,
              shape: theme.blockShape,
              timestamp: Date.now()
          }];
      });
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.repeat) return;
       
       if (KEY_MAPPINGS.LANE_0.includes(e.code)) handleInput(0);
       if (KEY_MAPPINGS.LANE_1.includes(e.code)) handleInput(1);
       if (KEY_MAPPINGS.LANE_2.includes(e.code)) handleInput(2);
       if (KEY_MAPPINGS.LANE_3.includes(e.code)) handleInput(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // Game Loop for Miss Detection & End Game
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
        if (gameStateRef.current.gameStatus === 'playing') {
            const currentTime = audioEngine.getCurrentTime();
            
            // Check for misses
            setNotes(prevNotes => {
                const missedNotes = prevNotes.filter(n => !n.hit && !n.missed && n.timestamp < currentTime - (HIT_WINDOW.GOOD / 1000));
                
                if (missedNotes.length > 0) {
                     setGameState(prev => {
                         const newHealth = prev.health - (missedNotes.length * 5);
                         if (newHealth <= 0) {
                             audioEngine.stop();
                             return { ...prev, health: 0, gameStatus: 'menu', isPlaying: false }; // Simple reset to menu for now
                         }
                         return {
                             ...prev,
                             health: newHealth,
                             combo: 0,
                             multiplier: 1
                         };
                     });
                     
                     // Mark as missed so we don't count them again, but keep for a moment if we want to show "MISS" UI
                     // For now, just remove them to keep array clean
                     return prevNotes.filter(n => n.timestamp >= currentTime - (HIT_WINDOW.GOOD / 1000));
                }
                return prevNotes;
            });
        }
        animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {gameState.gameStatus === 'menu' && (
        <Lobby onStart={handleStartGame} lastScore={gameState.score} />
      )}
      
      <GameCanvas 
        notes={notes} 
        blocks={blocks} 
        theme={activeTheme} 
        isPlaying={gameState.isPlaying}
        score={gameState.score}
        combo={gameState.combo}
      />
      
      {gameState.gameStatus === 'playing' && (
        <HUD gameState={gameState} theme={activeTheme} />
      )}
    </div>
  );
};

export default App;

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Trail, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Note, BuildingBlock, LevelTheme } from '../types';
import { SPAWN_DISTANCE, NOTE_SPEED } from '../constants';
import { audioEngine } from '../services/audioEngine';

interface GameCanvasProps {
  notes: Note[];
  blocks: BuildingBlock[];
  theme: LevelTheme;
  isPlaying: boolean;
  score: number;
  combo: number;
}

const LaneIndicator: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const x = (index - 1.5) * 1.5; // Centers 4 lanes around 0
  
  // Flash effect on hit could go here
  return (
    <group position={[x, 0, 0]}>
       {/* Lane Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -SPAWN_DISTANCE/2]}>
        <planeGeometry args={[0.1, SPAWN_DISTANCE]} />
        <meshBasicMaterial color={color} opacity={0.3} transparent />
      </mesh>
      {/* Hit Zone */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <ringGeometry args={[0.4, 0.5, 32]} />
         <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
};

const ActiveNote: React.FC<{ note: Note; theme: LevelTheme }> = ({ note, theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const laneX = (note.lane - 1.5) * 1.5;

  useFrame(() => {
    if (meshRef.current) {
      // Calculate position based on time
      // Distance = Speed * (TargetTime - CurrentTime)
      // If TargetTime > CurrentTime, it's approaching (Positive Z)
      // We want it to arrive at Z=0 at note.timestamp
      // So Z = (note.timestamp - currentTime) * SPEED
      const currentTime = audioEngine.getCurrentTime();
      const z = (note.timestamp - currentTime) * NOTE_SPEED;
      
      meshRef.current.position.set(laneX, 0.5, -z);
      
      // Simple pulse
      const scale = 1 + Math.sin(currentTime * 10) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial 
        color={theme.colors.accent} 
        emissive={theme.colors.accent}
        emissiveIntensity={2}
        toneMapped={false}
      />
      <Trail width={0.5} length={4} color={theme.colors.primary} attenuation={(t) => t * t} />
    </mesh>
  );
};

const ConstructedBuilding: React.FC<{ blocks: BuildingBlock[]; theme: LevelTheme; combo: number }> = ({ blocks, theme, combo }) => {
  // Instance mesh would be better for performance, but regular mesh is fine for this scale demo
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
       // Slowly rotate the whole building
       groupRef.current.rotation.y += 0.002;
       
       // Pulse based on audio energy
       const energy = audioEngine.getEnergy();
       const scale = 1 + (energy / 255) * 0.05 + (combo * 0.001);
       groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, scale, 0.1));
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -15]}> 
       {/* Positioned slightly behind and below the hit line to form a backdrop */}
      {blocks.map((block) => (
        <mesh 
          key={block.id} 
          position={new THREE.Vector3(...block.position)} 
          rotation={new THREE.Euler(...block.rotation)}
          scale={new THREE.Vector3(...block.scale)}
        >
          {theme.blockShape === 'box' && <boxGeometry />}
          {theme.blockShape === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 16]} />}
          {theme.blockShape === 'dodecahedron' && <dodecahedronGeometry args={[0.6]} />}
          
          <meshStandardMaterial 
            color={block.color} 
            emissive={block.color}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

const CameraController: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    const { camera } = useThree();
    const vec = new THREE.Vector3();
    
    useFrame((state) => {
        if(isPlaying) {
             const t = state.clock.elapsedTime;
             // Gentle sway
             camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(t * 0.2) * 2, 0.05);
             camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4 + Math.cos(t * 0.3) * 1, 0.05);
             camera.lookAt(0,0,-10);
        }
    });
    return null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ notes, blocks, theme, isPlaying, score, combo }) => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
      <CameraController isPlaying={isPlaying} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 5, -5]} color={theme.colors.secondary} intensity={2} />
      
      {/* Background */}
      <color attach="background" args={[theme.colors.background]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={[theme.colors.background, 10, 80]} />

      {/* Lanes */}
      <group position={[0, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <LaneIndicator key={i} index={i} color={theme.colors.primary} />
        ))}
      </group>

      {/* Notes */}
      {notes.map((note) => (
        <ActiveNote key={note.id} note={note} theme={theme} />
      ))}

      {/* The Building Structure */}
      <ConstructedBuilding blocks={blocks} theme={theme} combo={combo} />

      {/* Floor reflection for neon aesthetics */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#000" roughness={0} metalness={0.8} />
      </mesh>

    </Canvas>
  );
};

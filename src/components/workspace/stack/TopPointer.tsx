import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface TopPointerProps {
  targetPos: [number, number, number];
  isUnderflow?: boolean;
}

export const TopPointer: React.FC<TopPointerProps> = ({ targetPos, isUnderflow = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]));

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Smooth lerp to follow target pointer coordinates
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetPos[0], 0.1);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, targetPos[1], 0.1);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, targetPos[2], 0.1);
    
    groupRef.current.position.copy(currentPos.current);
  });

  return (
    <group ref={groupRef}>
      {/* 3D Arrow Pointer Cone pointing left */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.4, 16]} />
        <meshStandardMaterial 
          color={isUnderflow ? '#ef4444' : '#ec4899'} 
          emissive={isUnderflow ? '#ef4444' : '#ec4899'}
          emissiveIntensity={0.4}
        />
      </mesh>
      
      {/* Pointer stem */}
      <mesh position={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color={isUnderflow ? '#ef4444' : '#ec4899'} />
      </mesh>

      {/* HTML text label next to the arrow */}
      <Html position={[0.65, 0, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className={`select-none font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-xl border ${
          isUnderflow 
            ? 'bg-red-950/90 text-red-400 border-red-800' 
            : 'bg-pink-950/90 text-pink-400 border-pink-800'
        }`}>
          {isUnderflow ? 'top = -1 (UNDERFLOW)' : 'top'}
        </div>
      </Html>
    </group>
  );
};
export default TopPointer;

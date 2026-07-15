import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface StackMeshProps {
  value: string;
  label: string;
  targetPos: [number, number, number];
  color: string;
  isNew?: boolean;
  isExiting?: boolean;
  isPeek?: boolean;
  isOverflow?: boolean;
  address?: string;
  onExited?: () => void;
}

export const StackMesh: React.FC<StackMeshProps> = ({
  value,
  label,
  targetPos,
  color,
  isNew = false,
  isExiting = false,
  isPeek = false,
  isOverflow = false,
  address,
  onExited
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Local animated state references
  const currentPos = useRef<THREE.Vector3>(
    new THREE.Vector3(targetPos[0], isNew ? 5.0 : targetPos[1], targetPos[2])
  );
  const currentScale = useRef<number>(1.0);
  const currentOpacity = useRef<number>(1.0);
  const shakeTimer = useRef<number>(0);

  useEffect(() => {
    if (isExiting) {
      currentOpacity.current = 1.0;
    }
  }, [isExiting]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 1. Handle Y position lerp (spawning/exiting slides)
    let targetY = targetPos[1];
    if (isExiting) {
      targetY = 5.0; // flies upward
    }

    // 2. Handle X position lerp (includes shake offset for Overflow)
    let targetX = targetPos[0];
    if (isOverflow) {
      shakeTimer.current += delta * 60;
      targetX += Math.sin(shakeTimer.current) * 0.12; // shake shake shake
    }

    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetX, 0.1);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, targetY, 0.1);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, targetPos[2], 0.1);
    
    meshRef.current.position.copy(currentPos.current);

    // 3. Handle Opacity transitions
    if (isExiting) {
      currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 0, 0.12);
      if (currentOpacity.current < 0.05 && onExited) {
        onExited();
      }
    } else {
      currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 1.0, 0.1);
    }

    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current;
      materialRef.current.transparent = currentOpacity.current < 1.0 || isExiting;
    }

    // 4. Handle Scale (pulse scale on Peek)
    let targetS = 1.0;
    if (isPeek) {
      const time = state.clock.getElapsedTime();
      targetS = 1.0 + Math.abs(Math.sin(time * 8)) * 0.22;
    }
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetS, 0.15);
    meshRef.current.scale.set(currentScale.current, currentScale.current, currentScale.current);
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.8, 1.2]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={color}
        roughness={0.15}
        metalness={0.8}
        emissive={isOverflow ? '#ef4444' : isPeek ? '#10b981' : '#000000'}
        emissiveIntensity={isOverflow ? 0.6 : isPeek ? 0.35 : 0}
      />

      {/* Cube Value Label overlay */}
      <Html position={[0, 0.58, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="select-none text-center font-mono whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-extrabold text-white bg-zinc-950/90 border border-zinc-800 shadow-xl">
          {value}
        </div>
      </Html>

      {/* Index Label */}
      <Html position={[0, -0.6, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="select-none text-center font-mono whitespace-nowrap text-[8.5px] text-zinc-400 font-bold bg-zinc-950/30">
          {label}
        </div>
      </Html>

      {/* Memory Address Label */}
      {address && (
        <Html position={[0, -0.85, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="select-none text-center font-mono text-[7px] text-zinc-500 font-semibold">
            {address}
          </div>
        </Html>
      )}
    </mesh>
  );
};
export default StackMesh;

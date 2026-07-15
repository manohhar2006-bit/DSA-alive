import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useExecutionStore } from '../../../hooks/useExecution';

interface VisualNode3DProps {
  id: string;
  value: string;
  label: string;
  targetPos: [number, number, number];
  color: string;
  highlighted?: boolean;
  address?: string;
  isNew?: boolean;
  isExiting?: boolean;
  isPeek?: boolean;
  isOverflow?: boolean;
  onExited?: () => void;
  onNodeClick?: (address: string, position: [number, number, number]) => void;
}

export const VisualNode3D: React.FC<VisualNode3DProps> = ({
  id,
  value,
  label,
  targetPos,
  color,
  highlighted = false,
  address,
  isNew = false,
  isExiting = false,
  isPeek = false,
  isOverflow = false,
  onExited,
  onNodeClick
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // Retrieve play status and trace data for interactive hovers and animations
  const trace = useExecutionStore((s) => s.executionTrace);
  const currentStepIndex = useExecutionStore((s) => s.currentStep);
  const currentStep = trace ? trace.steps[currentStepIndex] || null : null;
  const isPlaying = useExecutionStore((s) => s.playing);

  // Spring animation refs
  const posYRef = useRef<number>(isNew ? targetPos[1] + 3.0 : targetPos[1]);
  const velYRef = useRef<number>(0);

  const posXRef = useRef<number>(targetPos[0]);
  const velXRef = useRef<number>(0);

  const scaleRef = useRef<number>(isNew ? 0.01 : 1.0);
  const velScaleRef = useRef<number>(0);

  // Jump detection
  const lastStepIdxRef = useRef<number>(currentStepIndex);

  useEffect(() => {
    const diff = Math.abs(currentStepIndex - lastStepIdxRef.current);
    if (diff > 1) {
      // Rebuild instantly
      posYRef.current = targetPos[1];
      posXRef.current = targetPos[0];
      scaleRef.current = 1.0;
      velYRef.current = 0;
      velXRef.current = 0;
      velScaleRef.current = 0;
    }
    lastStepIdxRef.current = currentStepIndex;
  }, [currentStepIndex, targetPos]);

  // Compute references pointing to this node dynamically
  const currentRefs = useMemo(() => {
    if (!currentStep || !address) return 'None';
    return Object.values(currentStep.variables)
      .filter((v) => v.isPointer && v.pointerTo === address)
      .map((v) => v.name)
      .join(', ') || 'None';
  }, [currentStep, address]);

  // Find step in which this node was created
  const createdStep = useMemo(() => {
    if (!trace || !address) return 1;
    for (let idx = 0; idx < trace.steps.length; idx++) {
      if (trace.steps[idx].heap[address]) {
        return trace.steps[idx].step;
      }
    }
    return 1;
  }, [trace, address]);

  const shakeTimer = useRef<number>(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Freeze animations during paused playback unless it's exiting
    const dt = isPlaying || isExiting ? Math.min(delta, 0.03) : 0.03; 

    // Spring constants (Tension and Damping)
    const stiffness = 160;
    const damping = 14;

    // Y position spring solver
    let targetY = targetPos[1];
    if (isExiting) {
      targetY = targetPos[1] + 3.0; // exit by floating up
    }
    const forceY = -stiffness * (posYRef.current - targetY) - damping * velYRef.current;
    velYRef.current += forceY * dt;
    posYRef.current += velYRef.current * dt;

    // X position spring solver
    let targetX = targetPos[0];
    if (isExiting) {
      targetX = targetPos[0] - 2.0; // exit by sliding left
    }
    if (isOverflow) {
      shakeTimer.current += dt * 60;
      targetX += Math.sin(shakeTimer.current) * 0.12;
    }
    const forceX = -stiffness * (posXRef.current - targetX) - damping * velXRef.current;
    velXRef.current += forceX * dt;
    posXRef.current += velXRef.current * dt;

    // Scale spring solver
    let targetS = 1.0;
    if (isExiting) {
      targetS = 0.01;
    } else if (isPeek) {
      const time = state.clock.getElapsedTime();
      targetS = 1.0 + Math.abs(Math.sin(time * 8)) * 0.18;
    }
    const forceS = -200 * (scaleRef.current - targetS) - 16 * velScaleRef.current;
    velScaleRef.current += forceS * dt;
    scaleRef.current += velScaleRef.current * dt;

    meshRef.current.position.set(posXRef.current, posYRef.current, targetPos[2]);
    meshRef.current.scale.set(scaleRef.current, scaleRef.current, scaleRef.current);

    // Fade opacity out on exit
    if (materialRef.current) {
      let targetOpacity = isExiting ? 0 : 1;
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.15);
      materialRef.current.transparent = materialRef.current.opacity < 1.0;

      if (isExiting && materialRef.current.opacity < 0.08 && onExited) {
        onExited();
      }
    }
  });

  return (
    <group>
      <RoundedBox
        ref={meshRef as any}
        args={[1.2, 0.8, 1.2]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onNodeClick && address) {
            onNodeClick(address, targetPos);
          }
        }}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          roughness={0.15}
          metalness={0.8}
          emissive={highlighted ? color : '#000000'}
          emissiveIntensity={highlighted ? 0.65 : 0}
        />

        {/* Node value label */}
        <Html position={[0, 0.58, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="select-none text-center font-mono whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-extrabold text-white bg-zinc-950/90 border border-zinc-800 shadow-xl">
            {value}
          </div>
        </Html>

        {/* Node label */}
        <Html position={[0, -0.6, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="select-none text-center font-mono whitespace-nowrap text-[8.5px] text-zinc-400 font-bold bg-zinc-950/30">
            {label}
          </div>
        </Html>

        {/* Memory Address */}
        {address && (
          <Html position={[0, -0.85, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="select-none text-center font-mono text-[7.5px] text-zinc-500 font-semibold">
              {address}
            </div>
          </Html>
        )}

        {/* Premium interactive hover tooltip */}
        {hovered && (
          <Html position={[0, 1.3, 0]} center distanceFactor={10} style={{ pointerEvents: 'none', zIndex: 100 }}>
            <div className="select-none text-left font-mono text-[9px] p-3 bg-zinc-950/95 border border-zinc-800 text-zinc-300 rounded-lg shadow-2xl flex flex-col gap-1.5 min-w-[150px] backdrop-blur-md">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Object ID:</span>
                <span className="text-cyan-400 font-semibold">{id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Address:</span>
                <span className="text-purple-400 font-semibold">{address || '0x3000'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Value:</span>
                <span className="text-green-400 font-semibold">{value}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Created:</span>
                <span className="text-amber-400 font-semibold">Step {createdStep}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">References:</span>
                <span className="text-white font-semibold truncate max-w-[80px]" title={currentRefs}>
                  {currentRefs}
                </span>
              </div>
            </div>
          </Html>
        )}
      </RoundedBox>
    </group>
  );
};

export default VisualNode3D;

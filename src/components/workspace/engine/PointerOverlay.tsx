import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ExecutionStep } from '../../../types/trace';

interface PointerOverlayProps {
  step: ExecutionStep;
  nodes: { id: string; label: string; value: string; position: [number, number, number]; address?: string }[];
}

interface PointerIndicator {
  name: string;
  targetPos: [number, number, number];
  color: string;
  direction: 'up' | 'down' | 'left' | 'right';
}

export const PointerOverlay: React.FC<PointerOverlayProps> = ({ step, nodes }) => {
  // Scans variables for pointer addresses or array index offsets
  const pointers = useMemo<PointerIndicator[]>(() => {
    const list: PointerIndicator[] = [];

    Object.entries(step.variables).forEach(([name, v]) => {
      const isPointer = v.isPointer || name === 'top' || name === 'front' || name === 'rear' || name === 'i' || name === 'current' || name === 'head' || name === 'temp';
      if (!isPointer) return;

      const val = v.value;
      if (!val || val === 'NULL' || val === '-1') return;

      // Match pointer value to node label index or memory address
      const targetNode = nodes.find((n) => {
        if (n.address && n.address.toLowerCase() === val.toLowerCase()) return true;
        const indexMatch = n.label.match(/\[(\d+)\]/);
        if (indexMatch && indexMatch[1] === val) return true;
        return false;
      });

      if (!targetNode) return;

      let color = '#ec4899'; // default pointer color: Pink
      let direction: 'up' | 'down' | 'left' | 'right' = 'down';

      if (name === 'top') {
        color = '#ec4899'; // pink
        direction = 'left';
      } else if (name === 'front') {
        color = '#06b6d4'; // cyan
        direction = 'down';
      } else if (name === 'rear') {
        color = '#a855f7'; // purple
        direction = 'up';
      } else if (name === 'i') {
        color = '#eab308'; // yellow
        direction = 'down';
      } else if (name === 'temp' || name === 'current') {
        color = '#10b981'; // emerald
        direction = 'up';
      } else if (name === 'head') {
        color = '#f43f5e'; // rose
        direction = 'down';
      }

      // Calculate directional offset
      let offset: [number, number, number] = [0, 0, 0];
      if (direction === 'down') {
        offset = [0, 1.4, 0];
      } else if (direction === 'up') {
        offset = [0, -1.4, 0];
      } else if (direction === 'left') {
        offset = [2.0, 0, 0];
      } else if (direction === 'right') {
        offset = [-2.0, 0, 0];
      }

      const targetPos: [number, number, number] = [
        targetNode.position[0] + offset[0],
        targetNode.position[1] + offset[1],
        targetNode.position[2] + offset[2]
      ];

      list.push({
        name,
        targetPos,
        color,
        direction
      });
    });

    return list;
  }, [step, nodes]);

  return (
    <group>
      {pointers.map((p) => (
        <PointerArrow key={p.name} pointer={p} />
      ))}
    </group>
  );
};

// Dynamic Lerped Pointer Mesh arrow
const PointerArrow: React.FC<{ pointer: PointerIndicator }> = ({ pointer }) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(...pointer.targetPos));

  useFrame(() => {
    if (!groupRef.current) return;
    currentPos.current.lerp(new THREE.Vector3(...pointer.targetPos), 0.1);
    groupRef.current.position.copy(currentPos.current);
  });

  const rotation: [number, number, number] = useMemo(() => {
    if (pointer.direction === 'up') return [0, 0, Math.PI]; // Pointing up
    if (pointer.direction === 'left') return [0, 0, Math.PI / 2]; // Pointing left
    if (pointer.direction === 'right') return [0, 0, -Math.PI / 2]; // Pointing right
    return [0, 0, 0]; // Pointing down
  }, [pointer.direction]);

  const labelOffset: [number, number, number] = useMemo(() => {
    if (pointer.direction === 'up') return [0, -0.65, 0];
    if (pointer.direction === 'left') return [0.65, 0, 0];
    if (pointer.direction === 'right') return [-0.65, 0, 0];
    return [0, 0.65, 0];
  }, [pointer.direction]);

  return (
    <group ref={groupRef}>
      {/* 3D Arrow Cone */}
      <mesh rotation={rotation} castShadow>
        <coneGeometry args={[0.15, 0.4, 16]} />
        <meshStandardMaterial 
          color={pointer.color} 
          emissive={pointer.color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* 3D Arrow Cylinder stem */}
      <mesh 
        rotation={pointer.direction === 'left' || pointer.direction === 'right' ? [0, 0, Math.PI / 2] : [0, 0, 0]}
        position={
          pointer.direction === 'up' ? [0, -0.2, 0] :
          pointer.direction === 'left' ? [0.2, 0, 0] :
          pointer.direction === 'right' ? [-0.2, 0, 0] :
          [0, 0.2, 0]
        }
        castShadow
      >
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
        <meshStandardMaterial color={pointer.color} />
      </mesh>

      {/* Floating Pointer Label */}
      <Html position={labelOffset} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div 
          className="select-none font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-xl border"
          style={{ 
            backgroundColor: `${pointer.color}25`,
            borderColor: pointer.color,
            color: pointer.color
          }}
        >
          {pointer.name}
        </div>
      </Html>
    </group>
  );
};
export default PointerOverlay;

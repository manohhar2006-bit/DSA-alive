import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface VisualLink3DProps {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  dashed?: boolean;
  label?: string;
  isNew?: boolean;
  isExiting?: boolean;
  onExited?: () => void;
}

export const VisualLink3D: React.FC<VisualLink3DProps> = ({
  id: _id,
  from,
  to,
  color,
  dashed: _dashed = false,
  label,
  isNew = false,
  isExiting = false,
  onExited
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const cylinderRef = useRef<THREE.Mesh>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const labelGroupRef = useRef<THREE.Group>(null);

  const currentFrom = useRef<THREE.Vector3>(new THREE.Vector3(...from));
  const currentTo = useRef<THREE.Vector3>(new THREE.Vector3(...to));
  const currentOpacity = useRef<number>(1.0);
  const currentGrowth = useRef<number>(isNew ? 0.01 : 1.0);

  useFrame(() => {
    if (!cylinderRef.current || !coneRef.current || !groupRef.current) return;

    // 1. Smoothly lerp endpoints
    currentFrom.current.lerp(new THREE.Vector3(...from), 0.1);
    currentTo.current.lerp(new THREE.Vector3(...to), 0.1);

    // 2. Growth and fade animations
    let targetGrowth = 1.0;
    if (isExiting) {
      targetGrowth = 0.01;
      currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 0, 0.15);
      if (currentOpacity.current < 0.05 && onExited) {
        onExited();
      }
    } else {
      currentGrowth.current = THREE.MathUtils.lerp(currentGrowth.current, targetGrowth, 0.1);
      currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 1.0, 0.1);
    }

    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current;
      materialRef.current.transparent = currentOpacity.current < 1.0 || isExiting;
    }

    // 3. Compute vector differences
    const vFrom = currentFrom.current;
    const vTo = currentTo.current.clone().sub(vFrom).multiplyScalar(currentGrowth.current).add(vFrom);

    const direction = new THREE.Vector3().subVectors(vTo, vFrom);
    const length = direction.length();

    if (length < 0.01) {
      cylinderRef.current.visible = false;
      coneRef.current.visible = false;
      return;
    }

    cylinderRef.current.visible = true;
    coneRef.current.visible = true;

    // 4. Update cylinder position and scale
    cylinderRef.current.scale.set(1, length, 1);
    const midpoint = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    cylinderRef.current.position.copy(midpoint);

    // 5. Update cone (arrowhead) position at the target endpoint
    coneRef.current.position.copy(vTo);

    // 6. Update rotation quaternions
    direction.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    
    cylinderRef.current.setRotationFromQuaternion(quaternion);
    coneRef.current.setRotationFromQuaternion(quaternion);

    // 7. Update pointer label coordinates
    if (labelGroupRef.current) {
      labelGroupRef.current.position.copy(midpoint);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stem Cylinder */}
      <mesh ref={cylinderRef} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial 
          ref={materialRef} 
          color={color}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Directional Arrowhead Cone */}
      <mesh ref={coneRef} castShadow>
        <coneGeometry args={[0.08, 0.2, 12]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2}
          metalness={0.5}
          transparent={isExiting}
          opacity={isExiting ? 0 : 1}
        />
      </mesh>

      {/* Pointer Label follow group */}
      <group ref={labelGroupRef}>
        {label && currentOpacity.current > 0.25 && (
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="select-none text-center font-mono text-[7px] px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-850 text-pink-400 font-extrabold shadow-lg transform -translate-y-1">
              {label}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

export default VisualLink3D;

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { StackAnimator } from './StackAnimator';
import type { StackLayout } from '../../../adapters/StackAdapter';

interface StackRendererProps {
  layout: StackLayout;
  cameraResetKey?: number;
}

export const StackRenderer: React.FC<StackRendererProps> = ({ layout, cameraResetKey }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 6.5], fov: 50 }}
      className="w-full h-full"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Lights Setup */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
      <directionalLight 
        position={[-5, 5, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024} 
      />

      {/* Grid Floor */}
      <gridHelper args={[20, 20, '#27272a', '#18181b']} position={[0, -2.5, 0]} />

      {/* Stack Animator Layer */}
      <StackAnimator layout={layout} />

      {/* Interactive Orbit Camera Controls */}
      <OrbitControls 
        key={cameraResetKey}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 + 0.1}
        minDistance={3}
        maxDistance={12}
      />
    </Canvas>
  );
};
export default StackRenderer;

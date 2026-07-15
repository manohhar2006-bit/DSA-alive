import React, { useState, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { VisualNode3D } from './VisualNode3D';
import { VisualLink3D } from './VisualLink3D';
import { PointerOverlay } from './PointerOverlay';
import type { ExecutionStep } from '../../../types/trace';

interface UnifiedVisualizerProps {
  category: string;
  step?: ExecutionStep | null;
  nodes: any[];
  connections: any[];
  cameraResetKey?: number;
}

interface NodeState {
  id: string;
  label: string;
  value: string;
  position: [number, number, number];
  color: string;
  address?: string;
  highlighted: boolean;
  isNew: boolean;
  isExiting: boolean;
  isPeek: boolean;
  isOverflow: boolean;
}

interface LinkState {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  dashed?: boolean;
  label?: string;
  isNew: boolean;
  isExiting: boolean;
}

// Custom native UnrealBloomPass post-processing composer
const BloomEffects: React.FC = () => {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));

    // parameters: (resolution, strength, radius, threshold)
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.65, // strength
      0.35, // radius
      0.85  // threshold
    );
    comp.addPass(bloom);
    return comp;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame(() => {
    gl.autoClear = false;
    composer.render();
  }, 1);

  return null;
};

// Camera controller that smoothly pans to the clicked node or bounding center
const CameraRefitter: React.FC<{ nodes: any[]; focusedPos: [number, number, number] | null }> = ({
  nodes,
  focusedPos
}) => {
  const { controls } = useThree();

  const targetLookAt = useMemo(() => {
    if (focusedPos) {
      return new THREE.Vector3(...focusedPos);
    }
    // Check if there is a highlighted traversal node to bias towards
    const traversedNode = nodes.find((n) => n.highlighted);
    if (traversedNode) {
      const traversedPos = new THREE.Vector3(...traversedNode.position);
      // Bounding box center
      const box = new THREE.Box3();
      nodes.forEach((n) => box.expandByPoint(new THREE.Vector3(...n.position)));
      const c = new THREE.Vector3();
      box.getCenter(c);
      // Bias slightly to traversed node
      return new THREE.Vector3().addVectors(traversedPos.multiplyScalar(0.7), c.multiplyScalar(0.3));
    }
    if (nodes.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    // Default bounding center
    const box = new THREE.Box3();
    nodes.forEach((n) => box.expandByPoint(new THREE.Vector3(...n.position)));
    const c = new THREE.Vector3();
    box.getCenter(c);
    return c;
  }, [nodes, focusedPos]);

  useFrame(() => {
    if (controls) {
      const ctrl = controls as any;
      ctrl.target.lerp(targetLookAt, 0.08);
      ctrl.update();
    }
  });

  return null;
};

export const UnifiedVisualizer: React.FC<UnifiedVisualizerProps> = ({
  category: _category,
  step,
  nodes,
  connections,
  cameraResetKey
}) => {
  const [elements, setElements] = useState<Record<string, NodeState>>({});
  const [links, setLinks] = useState<Record<string, LinkState>>({});
  const [focusedNodePos, setFocusedNodePos] = useState<[number, number, number] | null>(null);

  // Reset focus when user triggers manual viewangle reset
  useEffect(() => {
    setFocusedNodePos(null);
  }, [cameraResetKey]);

  const onNodeClick = (address: string, position: [number, number, number]) => {
    setFocusedNodePos(position);
    window.dispatchEvent(new CustomEvent('node-clicked', { detail: { address } }));
  };

  // 1. Reconcile Nodes list
  useEffect(() => {
    setElements((prev) => {
      const next: Record<string, NodeState> = {};

      nodes.forEach((node) => {
        const isPrev = !!prev[node.id];
        const isNew = !isPrev;
        const isPeek = !!(step && step.animationType === 'peek' && node.highlighted);
        const isOverflow = !!(step && step.animationType === 'overflow');

        next[node.id] = {
          id: node.id,
          label: node.label,
          value: node.value,
          position: node.position,
          color: node.color,
          address: node.address,
          highlighted: !!node.highlighted,
          isNew,
          isExiting: false,
          isPeek,
          isOverflow
        };
      });

      Object.entries(prev).forEach(([id, elem]) => {
        const isMissing = !nodes.some((n) => n.id === id);
        if (isMissing && !elem.isExiting) {
          next[id] = {
            ...elem,
            isExiting: true,
            isNew: false
          };
        }
      });

      return next;
    });
  }, [nodes, step?.animationType]);

  // 2. Reconcile Connections list
  useEffect(() => {
    setLinks((prev) => {
      const next: Record<string, LinkState> = {};

      connections.forEach((conn) => {
        const isPrev = !!prev[conn.id];

        // Parse connection pointer label
        let label = '';
        if (conn.id === 'head_ptr_connection') {
          label = 'head';
        } else if (conn.id.startsWith('link_')) {
          const parts = conn.id.split('_');
          const fromAddr = parts[1];
          const toAddr = parts[3];
          const ptr = step?.memory?.pointers?.find(
            (p) => p.fromAddress === fromAddr && p.toAddress === toAddr
          );
          if (ptr) {
            label = ptr.name;
          } else {
            label = 'next';
          }
        }

        next[conn.id] = {
          id: conn.id,
          from: conn.from,
          to: conn.to,
          color: conn.color,
          dashed: conn.dashed,
          label,
          isNew: !isPrev,
          isExiting: false
        };
      });

      Object.entries(prev).forEach(([id, conn]) => {
        const isMissing = !connections.some((c) => c.id === id);
        if (isMissing && !conn.isExiting) {
          next[id] = {
            ...conn,
            isExiting: true,
            isNew: false
          };
        }
      });

      return next;
    });
  }, [connections, step?.memory?.pointers]);

  const handleNodeExited = (id: string) => {
    setElements((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleLinkExited = (id: string) => {
    setLinks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const activeNodesList = useMemo(() => {
    return Object.values(elements).filter((e) => !e.isExiting);
  }, [elements]);

  return (
    <Canvas
      shadows="soft"
      camera={{ position: [0, 6.0, 9.5], fov: 45 }}
      className="w-full h-full"
      style={{
        background: 'linear-gradient(180deg, #060919 0%, #0b1532 50%, #020204 100%)',
        pointerEvents: 'auto'
      }}
    >
      {/* Subtle Atmosphere Fog */}
      <fog attach="fog" args={['#080f26', 15, 50]} />

      {/* Lighting System */}
      <ambientLight intensity={0.4} color="#101b35" />
      <hemisphereLight args={['#ffffff', '#080818', 0.65]} position={[0, 20, 0]} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 50]} />
      </directionalLight>

      {/* Infinite Perspective Grid */}
      <Grid
        position={[0, -2.2, 0]}
        cellSize={1.0}
        cellThickness={1.0}
        cellColor="#102554"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#2b66ff"
        fadeDistance={45}
        fadeStrength={1.2}
        infiniteGrid
        followCamera
      />

      {/* Ground base plane to receive shadows */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.205, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          color="#0c0d12"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Glowing Horizon Line Cylinder */}
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[120, 120, 30, 64, 1, true]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              // Subtle blue-purple gradient
              vec3 color = mix(vec3(0.4, 0.1, 0.9), vec3(0.0, 0.5, 1.0), vUv.y);
              // Thin horizontal band
              float glow = pow(sin(vUv.y * 3.14159265), 24.0);
              gl_FragColor = vec4(color, glow * 0.18);
            }
          `}
        />
      </mesh>

      {/* Contact Shadows beneath floating elements */}
      <ContactShadows
        position={[0, -2.18, 0]}
        opacity={0.65}
        scale={20}
        blur={2.4}
        far={4.0}
      />

      {/* 3D Nodes */}
      {Object.values(elements).map((node) => (
        <VisualNode3D
          key={node.id}
          id={node.id}
          value={node.value}
          label={node.label}
          targetPos={node.position}
          color={node.color}
          highlighted={node.highlighted}
          address={node.address}
          isNew={node.isNew}
          isExiting={node.isExiting}
          isPeek={node.isPeek}
          isOverflow={node.isOverflow}
          onExited={() => handleNodeExited(node.id)}
          onNodeClick={onNodeClick}
        />
      ))}

      {/* 3D Links */}
      {Object.values(links).map((link) => (
        <VisualLink3D
          key={link.id}
          id={link.id}
          from={link.from}
          to={link.to}
          color={link.color}
          dashed={link.dashed}
          label={link.label}
          isNew={link.isNew}
          isExiting={link.isExiting}
          onExited={() => handleLinkExited(link.id)}
        />
      ))}

      {/* Traversal pointer indicators */}
      {step && <PointerOverlay step={step} nodes={activeNodesList} />}

      {/* Camera auto-fit refitter */}
      <CameraRefitter nodes={activeNodesList} focusedPos={focusedNodePos} />

      {/* Unreal Bloom Postprocess Pass */}
      <BloomEffects />

      <OrbitControls
        key={cameraResetKey}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 + 0.15}
        minDistance={3.5}
        maxDistance={18}
      />
    </Canvas>
  );
};

export default UnifiedVisualizer;

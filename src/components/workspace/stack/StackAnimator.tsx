import React, { useState, useEffect } from 'react';
import { StackMesh } from './StackMesh';
import { TopPointer } from './TopPointer';
import type { StackLayout } from '../../../adapters/StackAdapter';

interface StackAnimatorProps {
  layout: StackLayout;
}

interface AnimatedElement {
  id: string;
  label: string;
  value: string;
  position: [number, number, number];
  color: string;
  address?: string;
  isNew: boolean;
  isExiting: boolean;
  isPeek: boolean;
  isOverflow: boolean;
}

export const StackAnimator: React.FC<StackAnimatorProps> = ({ layout }) => {
  const [elements, setElements] = useState<Record<string, AnimatedElement>>({});

  useEffect(() => {
    setElements((prev) => {
      const next: Record<string, AnimatedElement> = {};

      // 1. Map active layout nodes, detecting new elements
      layout.nodes.forEach((node) => {
        const isPrev = !!prev[node.id];
        const isNew = !isPrev;
        const isPeek = layout.animationType === 'peek' && node.id === `stack_node_${layout.topIndex}`;
        const isOverflow = layout.isOverflow;

        next[node.id] = {
          id: node.id,
          label: node.label,
          value: node.value,
          position: node.position,
          color: node.color,
          address: node.address,
          isNew,
          isExiting: false,
          isPeek,
          isOverflow
        };
      });

      // 2. Retain and mark popped elements as exiting so they can animate out
      Object.entries(prev).forEach(([id, elem]) => {
        const isMissing = !layout.nodes.some((n) => n.id === id);
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
  }, [layout]);

  // Callback from StackMesh when exit slide/fade finishes
  const handleExited = (id: string) => {
    setElements((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <group>
      {/* Renders active stack cubes */}
      {Object.values(elements).map((elem) => (
        <StackMesh
          key={elem.id}
          value={elem.value}
          label={elem.label}
          targetPos={elem.position}
          color={elem.color}
          isNew={elem.isNew}
          isExiting={elem.isExiting}
          isPeek={elem.isPeek}
          isOverflow={elem.isOverflow}
          address={elem.address}
          onExited={() => handleExited(elem.id)}
        />
      ))}

      {/* Renders index pointer arrow */}
      <TopPointer 
        targetPos={layout.topPointerPos} 
        isUnderflow={layout.isUnderflow} 
      />
    </group>
  );
};
export default StackAnimator;

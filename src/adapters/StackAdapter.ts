import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout, VisualNode3D, VisualConnection3D } from './VisualizationAdapter';

export interface StackLayout extends VisualizationLayout {
  topIndex: number;
  animationType: string;
  isOverflow: boolean;
  isUnderflow: boolean;
  isEmpty: boolean;
  isFull: boolean;
  topPointerPos: [number, number, number];
}

class StackAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('StackAdapter initialized');
  }

  playStep(step: ExecutionStep): StackLayout {
    const nodes: VisualNode3D[] = [];
    const connections: VisualConnection3D[] = [];

    const stackVar = step.variables['stack'];
    const topVar = step.variables['top'];
    const topIndex = topVar ? parseInt(topVar.value) : -1;

    // Check execution status flags
    const isOverflow = step.animationType === 'overflow';
    const isUnderflow = step.animationType === 'underflow';
    const isEmpty = topIndex === -1;
    const isFull = topIndex === 4;

    // Parse array values
    const stackValues = [0, 0, 0, 0, 0];
    if (stackVar) {
      const match = stackVar.value.match(/\[(.*)\]/);
      if (match) {
        match[1].split(',').forEach((s, idx) => {
          stackValues[idx] = parseInt(s.trim());
        });
      }
    }

    // Build stack element nodes
    for (let idx = 0; idx < 5; idx++) {
      // If we popped or are uninitialized, do not render this element
      if (idx > topIndex) continue;

      const val = stackValues[idx];
      const yPos = -2.0 + idx * 1.1; // stack grows upwards from bottom (y=-2.0)
      const isTop = idx === topIndex;

      let color = '#3b82f6'; // Default stack element: Sleek Blue
      if (isTop) color = '#a855f7'; // Top element: Royal Purple
      if (step.animationType === 'peek' && isTop) color = '#10b981'; // Peek: Glowing Green
      if (isOverflow) color = '#ef4444'; // Overflow: Alert Red

      nodes.push({
        id: `stack_node_${idx}`,
        label: `stack[${idx}]`,
        value: String(val),
        position: [0, yPos, 0],
        color,
        highlighted: isTop || step.animationType === 'peek',
        address: `0x3000 + ${idx * 4}`
      });
    }

    // Calculate pointer location
    // Spans from index 0 up to 4
    const pointerY = topIndex === -1 ? -3.1 : -2.0 + topIndex * 1.1;
    const topPointerPos: [number, number, number] = [2.0, pointerY, 0];

    return {
      nodes,
      connections,
      topIndex,
      animationType: step.animationType,
      isOverflow,
      isUnderflow,
      isEmpty,
      isFull,
      topPointerPos
    };
  }

  reset() {}
  jumpTo() {}
  dispose() {}
}

export const StackAdapter = new StackAdapterClass();

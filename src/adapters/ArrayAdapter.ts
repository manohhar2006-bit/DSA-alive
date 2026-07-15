import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout } from './VisualizationAdapter';

class ArrayAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('ArrayAdapter initialized');
  }

  playStep(step: ExecutionStep): VisualizationLayout {
    const nodes: any[] = [];
    const connections: any[] = [];

    const arrVar = step.variables['arr'];
    if (!arrVar) return { nodes, connections };

    const match = arrVar.value.match(/\[(.*)\]/);
    if (!match) return { nodes, connections };

    const elements = match[1].split(',').map((s) => s.trim());
    const sizeVar = step.variables['size'];
    const activeSize = sizeVar ? parseInt(sizeVar.value) : elements.length;

    elements.forEach((val, idx) => {
      const xPos = -2.5 + idx * 1.3;
      const isActive = idx < activeSize;
      
      // Determine if this element is currently highlighted (e.g. by loop variable i)
      const iVar = step.variables['i'];
      const isHighlighted = iVar ? parseInt(iVar.value) === idx : false;

      nodes.push({
        id: `arr_node_${idx}`,
        label: `arr[${idx}]`,
        value: val,
        position: [xPos, 0, 0],
        color: isHighlighted ? '#a855f7' : isActive ? '#3b82f6' : '#27272a',
        highlighted: isHighlighted,
        address: `${arrVar.address} + ${idx * 4}`
      });
    });

    return { nodes, connections };
  }

  reset() {}
  jumpTo() {}
  dispose() {}
}

export const ArrayAdapter = new ArrayAdapterClass();

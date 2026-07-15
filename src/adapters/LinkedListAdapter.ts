import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout } from './VisualizationAdapter';

class LinkedListAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('LinkedListAdapter initialized');
  }

  playStep(step: ExecutionStep): VisualizationLayout {
    const nodes: any[] = [];
    const connections: any[] = [];

    const heap = step.heap;
    const headVar = step.variables['head'];

    if (!headVar || !headVar.value || headVar.value === 'NULL' || Object.keys(heap).length === 0) {
      return { nodes, connections };
    }

    let currentAddress = headVar.value;
    let index = 0;
    const visited = new Set<string>();

    while (currentAddress && currentAddress !== 'NULL' && !visited.has(currentAddress)) {
      visited.add(currentAddress);
      const nodeData = heap[currentAddress];

      if (!nodeData) {
        break;
      }

      const xPos = -3.5 + index * 2.6;
      const nodePos: [number, number, number] = [xPos, 0, 0];

      nodes.push({
        id: nodeData.id,
        label: `Node (${nodeData.address})`,
        value: String(nodeData.value || nodeData.label),
        position: nodePos,
        color: nodeData.highlighted ? '#a855f7' : '#3b82f6',
        highlighted: !!nodeData.highlighted,
        address: nodeData.address
      });

      const nextAddr = nodeData.nextAddress;
      if (nextAddr && nextAddr !== 'NULL') {
        const nextXPos = -3.5 + (index + 1) * 2.6;
        connections.push({
          id: `link_${nodeData.address}_to_${nextAddr}`,
          from: [xPos + 0.8, 0, 0],
          to: [nextXPos - 0.8, 0, 0],
          color: '#06b6d4'
        });
      }

      currentAddress = nextAddr || 'NULL';
      index++;
    }

    if (headVar.value !== 'NULL') {
      connections.push({
        id: 'head_ptr_connection',
        from: [-5, 1.8, 0],
        to: [-3.5, 0.6, 0],
        color: '#ec4899',
        dashed: true
      });
    }

    return { nodes, connections };
  }

  reset() {}
  jumpTo() {}
  dispose() {}
}

export const LinkedListAdapter = new LinkedListAdapterClass();

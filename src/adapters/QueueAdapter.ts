import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout } from './VisualizationAdapter';

class QueueAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('QueueAdapter initialized');
  }

  playStep(step: ExecutionStep): VisualizationLayout {
    const nodes: any[] = [];
    const connections: any[] = [];

    const queueVar = step.variables['queue'];
    const frontVar = step.variables['front'];
    const rearVar = step.variables['rear'];

    if (!queueVar) return { nodes, connections };

    const match = queueVar.value.match(/\[(.*)\]/);
    if (!match) return { nodes, connections };

    const elements = match[1].split(',').map((s) => s.trim());
    const frontIdx = frontVar ? parseInt(frontVar.value) : -1;
    const rearIdx = rearVar ? parseInt(rearVar.value) : -1;

    elements.forEach((val, idx) => {
      if ((frontIdx === -1 || rearIdx === -1) && val === '0') return;
      if ((idx < frontIdx || idx > rearIdx) && val === '0') return;

      const xPos = -2.5 + idx * 1.3;
      const isFront = idx === frontIdx;
      const isRear = idx === rearIdx;

      let color = '#27272a';
      if (idx >= frontIdx && idx <= rearIdx) {
        color = '#3b82f6';
      }
      if (isFront) color = '#06b6d4';
      if (isRear) color = '#a855f7';
      if (isFront && isRear) color = '#ec4899';

      nodes.push({
        id: `queue_node_${idx}`,
        label: `queue[${idx}]`,
        value: val,
        position: [xPos, 0, 0],
        color,
        highlighted: isFront || isRear,
        address: `${queueVar.address} + ${idx * 4}`
      });

      if (isFront) {
        connections.push({
          id: `front_ptr_conn`,
          from: [xPos, 1.8, 0],
          to: [xPos, 0.6, 0],
          color: '#06b6d4',
          dashed: true
        });
      }
      if (isRear) {
        connections.push({
          id: `rear_ptr_conn`,
          from: [xPos, -1.8, 0],
          to: [xPos, -0.6, 0],
          color: '#a855f7',
          dashed: true
        });
      }
    });

    return { nodes, connections };
  }

  reset() {}
  jumpTo() {}
  dispose() {}
}

export const QueueAdapter = new QueueAdapterClass();

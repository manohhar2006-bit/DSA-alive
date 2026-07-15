import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout } from './VisualizationAdapter';

class GraphAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('GraphAdapter initialized');
  }

  playStep(_step: ExecutionStep): VisualizationLayout {
    const nodes: any[] = [];
    const connections: any[] = [];

    const graphNodes = [
      { id: 'g_0', val: 'A', pos: [0, 2, 0], color: '#3b82f6' },
      { id: 'g_1', val: 'B', pos: [1.8, 0.7, 0], color: '#06b6d4' },
      { id: 'g_2', val: 'C', pos: [1.1, -1.3, 0], color: '#06b6d4' },
      { id: 'g_3', val: 'D', pos: [-1.1, -1.3, 0], color: '#06b6d4' },
      { id: 'g_4', val: 'E', pos: [-1.8, 0.7, 0], color: '#06b6d4' }
    ];

    graphNodes.forEach((node) => {
      nodes.push({
        id: node.id,
        label: `Vertex ${node.val}`,
        value: node.val,
        position: node.pos as [number, number, number],
        color: node.color,
        highlighted: node.id === 'g_0'
      });
    });

    const edges = [
      { from: 'g_0', to: 'g_1' },
      { from: 'g_0', to: 'g_4' },
      { from: 'g_1', to: 'g_2' },
      { from: 'g_2', to: 'g_3' },
      { from: 'g_3', to: 'g_4' },
      { from: 'g_1', to: 'g_3' }
    ];

    edges.forEach((edge, idx) => {
      const u = graphNodes.find((n) => n.id === edge.from);
      const v = graphNodes.find((n) => n.id === edge.to);
      if (u && v) {
        connections.push({
          id: `graph_edge_${idx}`,
          from: u.pos as [number, number, number],
          to: v.pos as [number, number, number],
          color: '#4b5563'
        });
      }
    });

    return { nodes, connections };
  }

  reset() {}
  jumpTo() {}
  dispose() {}
}

export const GraphAdapter = new GraphAdapterClass();

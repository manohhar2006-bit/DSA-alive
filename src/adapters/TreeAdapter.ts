import type { ExecutionStep } from '../types/trace';
import type { VisualizationAdapter, VisualizationLayout } from './VisualizationAdapter';

class TreeAdapterClass implements VisualizationAdapter {
  initialize() {
    console.log('TreeAdapter initialized');
  }

  playStep(_step: ExecutionStep): VisualizationLayout {
    const nodes: any[] = [];
    const connections: any[] = [];

    const treeNodes = [
      { id: 't_root', val: '42', pos: [0, 2, 0], color: '#3b82f6', label: 'Root (0x1000)' },
      { id: 't_left', val: '23', pos: [-2, 0.5, 0], color: '#06b6d4', label: 'Left (0x1020)' },
      { id: 't_right', val: '67', pos: [2, 0.5, 0], color: '#06b6d4', label: 'Right (0x1040)' },
      { id: 't_left_left', val: '12', pos: [-3, -1, 0], color: '#10b981', label: 'L-Left (0x1060)' },
      { id: 't_left_right', val: '35', pos: [-1, -1, 0], color: '#10b981', label: 'L-Right (0x1080)' }
    ];

    treeNodes.forEach((node) => {
      nodes.push({
        id: node.id,
        label: node.label,
        value: node.val,
        position: node.pos as [number, number, number],
        color: node.color,
        highlighted: node.id === 't_root'
      });
    });

    const links = [
      { from: 't_root', to: 't_left' },
      { from: 't_root', to: 't_right' },
      { from: 't_left', to: 't_left_left' },
      { from: 't_left', to: 't_left_right' }
    ];

    links.forEach((link, idx) => {
      const parent = treeNodes.find((n) => n.id === link.from);
      const child = treeNodes.find((n) => n.id === link.to);
      if (parent && child) {
        connections.push({
          id: `tree_link_${idx}`,
          from: parent.pos as [number, number, number],
          to: child.pos as [number, number, number],
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

export const TreeAdapter = new TreeAdapterClass();

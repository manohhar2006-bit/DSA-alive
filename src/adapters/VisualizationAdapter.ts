import type { ExecutionStep } from '../types/trace';

export interface VisualNode3D {
  id: string;
  label: string;
  value: string;
  position: [number, number, number];
  color: string;
  highlighted: boolean;
  address?: string;
}

export interface VisualConnection3D {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  dashed?: boolean;
}

export interface VisualizationLayout {
  nodes: VisualNode3D[];
  connections: VisualConnection3D[];
}

export interface VisualizationAdapter {
  initialize(): void;
  playStep(step: ExecutionStep): VisualizationLayout;
  reset(): void;
  jumpTo(stepIndex: number): void;
  dispose(): void;
}

export type ElementType = 'rect' | 'text' | 'image' | 'circle' | 'star' | 'triangle' | 'freehand' | 'eraser';

export interface GradientStop {
  color: string;
  offset: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  color: string;
  gradient?: Gradient;
  text?: string;
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  textDecoration?: string;
  imageUrl?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  locked?: boolean;
  groupId?: string;
  scaleX?: number;
  scaleY?: number;
  // Freehand drawing points
  points?: number[];
}

export interface TimelineEvent {
  id: string;
  version: string;
  description: string;
  timestamp: string;
  type: 'creation' | 'ai' | 'edit' | 'mint' | 'upload';
}

export type ElementType = 'rect' | 'text' | 'image' | 'circle' | 'star' | 'triangle';

export interface GradientStop {
  color: string;
  offset: number; // 0 to 1
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number; // For linear gradients (0-360)
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
  gradient?: Gradient; // New gradient support
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
  isGenerating?: boolean; // For AI generation styling
  scaleX?: number; // For flipping horizontal
  scaleY?: number; // For flipping vertical
}

export interface TimelineEvent {
  id: string;
  version: string;
  description: string;
  timestamp: string;
  type: 'creation' | 'ai' | 'commit';
}

// Shared State Structure for mockup Real-Time 
export interface RoomState {
  elements: CanvasElement[];
  timeline: TimelineEvent[];
}

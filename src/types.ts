export type ElementType = 'rect' | 'text' | 'image' | 'circle' | 'star' | 'triangle';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  color: string;
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

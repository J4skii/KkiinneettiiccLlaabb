
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  radius: number;
  color: string;
  trail: Vector2[];
}

export interface SimulationConfig {
  id: number;
  name: string;
  shapeType: 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'octagon' | 'star';
  vertexCount: number;
  gravity: number;
  friction: number;
  restitution: number;
  rotationSpeed: number;
  ballCount: number;
  ballSize: number;
  initialSpeed: number;
  nuanceDescription: string;
}

export interface GlobalSettings {
  timeScale: number;
  gravityMultiplier: number;
  gravityAngle: number; // In degrees
  viscosity: number; // Air resistance
  rotationMultiplier: number;
  bouncinessMultiplier: number;
  showVectors: boolean;
  showTrails: boolean;
  precision: number;
  useHeatmap: boolean;
  enableAudio: boolean;
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect } from 'react';
import { SimulationConfig, GlobalSettings, Ball, Vector2 } from '../types';
import { generatePolygon, generateStar, add, mult, dot, sub, normalize, mag } from '../utils/math';

interface CanvasProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  onStatsUpdate?: (avgKe: number, collisions: number) => void;
}

const TRAIL_LENGTH = 12;

// Audio Singleton to prevent context issues
let audioCtx: AudioContext | null = null;
const playCollisionSound = (force: number) => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100 + Math.min(force * 5, 2000), audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(Math.min(force * 0.05, 0.2), audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

const Canvas: React.FC<CanvasProps> = ({ config, globalSettings, onStatsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const collisionCountRef = useRef(0);
  const totalKeRef = useRef(0);
  const statsTickRef = useRef(0);
  
  const stateRef = useRef<{
    balls: Ball[];
    rotation: number;
    mousePos: Vector2 | null;
  }>({
    balls: [],
    rotation: 0,
    mousePos: null,
  });

  useEffect(() => {
    const balls: Ball[] = [];
    for (let i = 0; i < config.ballCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20;
      const speed = config.initialSpeed * (0.8 + Math.random() * 0.4);
      const velAngle = Math.random() * Math.PI * 2;

      balls.push({
        id: `${config.id}-${i}`,
        pos: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist },
        vel: { x: Math.cos(velAngle) * speed, y: Math.sin(velAngle) * speed },
        acc: { x: 0, y: 0 },
        radius: config.ballSize,
        color: '#FFFFFF',
        trail: []
      });
    }
    stateRef.current.balls = balls;
    stateRef.current.rotation = 0;
  }, [config.id, config.ballCount, config.initialSpeed, config.ballSize]);

  const runPhysicsStep = (dt: number, shapeRadius: number, localVertices: Vector2[]) => {
    const state = stateRef.current;
    const { gravityMultiplier, gravityAngle, viscosity, bouncinessMultiplier, enableAudio } = globalSettings;
    const effectiveRestitution = config.restitution * bouncinessMultiplier;

    // Calculate Gravity Vector
    const rad = (gravityAngle * Math.PI) / 180;
    const gx = Math.cos(rad) * config.gravity * gravityMultiplier;
    const gy = Math.sin(rad) * config.gravity * gravityMultiplier;

    state.balls.forEach(ball => {
      // 1. Environmental Forces
      ball.vel.x += gx * dt;
      ball.vel.y += gy * dt;
      
      // Air Resistance (Viscosity)
      const airDrag = 1 - (viscosity + config.friction);
      ball.vel = mult(ball.vel, Math.pow(airDrag, dt));
      
      // Mouse Interaction
      if (state.mousePos) {
        const toMouse = sub(state.mousePos, ball.pos);
        const mouseDist = mag(toMouse);
        if (mouseDist < 120) {
          const force = mult(normalize(toMouse), 400 / (mouseDist + 20));
          ball.vel = add(ball.vel, mult(force, dt));
        }
      }

      ball.pos = add(ball.pos, mult(ball.vel, dt));

      // 2. Bound Collisions
      for (let i = 0; i < localVertices.length; i++) {
        const p1 = localVertices[i];
        const p2 = localVertices[(i + 1) % localVertices.length];
        const edge = sub(p2, p1);
        const edgeNormal = normalize({ x: -edge.y, y: edge.x });
        if (dot(edgeNormal, p1) > 0) { edgeNormal.x *= -1; edgeNormal.y *= -1; }

        const relPos = sub(ball.pos, p1);
        const dist = dot(relPos, edgeNormal);

        if (dist < ball.radius) {
          ball.pos = add(ball.pos, mult(edgeNormal, ball.radius - dist));
          const velDotNormal = dot(ball.vel, edgeNormal);
          if (velDotNormal < 0) {
            const force = Math.abs(velDotNormal);
            ball.vel = sub(ball.vel, mult(edgeNormal, (1 + effectiveRestitution) * velDotNormal));
            collisionCountRef.current++;
            if (enableAudio && force > 1) playCollisionSound(force);
          }
        }
      }
    });

    // 3. Inter-Particle Collisions
    for (let i = 0; i < state.balls.length; i++) {
      for (let j = i + 1; j < state.balls.length; j++) {
        const a = state.balls[i];
        const b = state.balls[j];
        const diff = sub(b.pos, a.pos);
        const d = mag(diff);
        const minDist = a.radius + b.radius;
        if (d < minDist) {
          const normal = normalize(diff);
          const overlap = minDist - d;
          a.pos = sub(a.pos, mult(normal, overlap / 2));
          b.pos = add(b.pos, mult(normal, overlap / 2));
          const relVel = sub(b.vel, a.vel);
          const sepVel = dot(relVel, normal);
          if (sepVel < 0) {
            const force = Math.abs(sepVel);
            const impulse = mult(normal, sepVel * (1 + effectiveRestitution) / 2);
            a.vel = add(a.vel, impulse);
            b.vel = sub(b.vel, impulse);
            collisionCountRef.current++;
            if (enableAudio && force > 1) playCollisionSound(force);
          }
        }
      }
    }
  };

  const getHeatmapColor = (speed: number) => {
    const maxSpeed = 15;
    const ratio = Math.min(speed / maxSpeed, 1);
    const r = Math.floor(100 + 155 * ratio);
    const g = Math.floor(40 * (1 - ratio));
    const b = Math.floor(40 * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const tick = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.offsetParent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    const { timeScale, rotationMultiplier, precision, showVectors, showTrails, useHeatmap } = globalSettings;
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const shapeRadius = Math.min(canvas.width, canvas.height) * 0.44;

    if (timeScale > 0) {
      const subDt = timeScale / precision;
      for (let s = 0; s < precision; s++) {
        stateRef.current.rotation += config.rotationSpeed * rotationMultiplier * subDt;
        const localVertices = config.shapeType === 'star' 
          ? generateStar(config.vertexCount, shapeRadius, shapeRadius * 0.4, {x:0, y:0}, stateRef.current.rotation)
          : generatePolygon(config.vertexCount, shapeRadius, {x:0, y:0}, stateRef.current.rotation);
        runPhysicsStep(subDt, shapeRadius, localVertices);
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // UI Helpers: Gravity Arrow (Small indicator in corner)
    const gRad = (globalSettings.gravityAngle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(30 + Math.cos(gRad) * 15, 30 + Math.sin(gRad) * 15);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Shape
    const worldVertices = config.shapeType === 'star'
      ? generateStar(config.vertexCount, shapeRadius, shapeRadius * 0.4, center, stateRef.current.rotation)
      : generatePolygon(config.vertexCount, shapeRadius, center, stateRef.current.rotation);

    ctx.beginPath();
    ctx.moveTo(worldVertices[0].x, worldVertices[0].y);
    worldVertices.forEach(v => ctx.lineTo(v.x, v.y));
    ctx.closePath();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    ctx.fill();

    // Draw Particles
    let frameKe = 0;
    stateRef.current.balls.forEach(ball => {
      const sx = center.x + ball.pos.x;
      const sy = center.y + ball.pos.y;
      const speed = mag(ball.vel);
      frameKe += 0.5 * speed * speed;

      if (showTrails && timeScale > 0) {
        ball.trail.push({ x: sx, y: sy });
        if (ball.trail.length > TRAIL_LENGTH) ball.trail.shift();
      } else if (!showTrails) ball.trail = [];

      if (ball.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        ctx.strokeStyle = `rgba(239, 68, 68, ${useHeatmap ? 0.4 : 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = useHeatmap ? getHeatmapColor(speed) : '#FFFFFF';
      ctx.fill();
      
      if (showVectors) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + ball.vel.x * 3, sy + ball.vel.y * 3);
        ctx.strokeStyle = '#EF4444';
        ctx.stroke();
      }
    });

    totalKeRef.current += frameKe;
    statsTickRef.current++;
    if (statsTickRef.current >= 20) {
      onStatsUpdate?.(totalKeRef.current / (20 * stateRef.current.balls.length), collisionCountRef.current);
      totalKeRef.current = 0; collisionCountRef.current = 0; statsTickRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [globalSettings]);

  return (
    <canvas 
      ref={canvasRef} 
      onMouseMove={(e) => {
        const r = canvasRef.current?.getBoundingClientRect();
        if (r) stateRef.current.mousePos = { x: e.clientX - r.left - canvasRef.current!.width / 2, y: e.clientY - r.top - canvasRef.current!.height / 2 };
      }}
      onMouseLeave={() => stateRef.current.mousePos = null}
      className="w-full h-full block cursor-crosshair" 
    />
  );
};

export default Canvas;

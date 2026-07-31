export interface Star {
  x: number;
  y: number;
  startX: number;
  startY: number;
  symX: number;
  symY: number;
  scorpioX?: number;
  scorpioY?: number;
  targetX?: number;
  targetY?: number;
  z: number; // 0 (distant) to 1 (close/bright)
  baseSize: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleAlpha?: number;
  twinkleScale?: number;
  color: string;
  hasSpikes: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
  twinkleAmount: number;
  distFromMilkyWay: number;
  isConstellationNode?: boolean;
  constellationHighlight?: number;
  isCenterStar?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
}

export interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
}

export interface ConstellationNode {
  id: string;
  x: number;
  y: number;
  name?: string;
}

export interface ConstellationLine {
  from: string;
  to: string;
}

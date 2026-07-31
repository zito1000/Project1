import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { Volume2, VolumeX } from 'lucide-react';
import { noise } from '../utils/noise';
import { soundscape } from '../utils/audio';
import { Star, Particle, TrailParticle } from '../types';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Spectrum color palette for realistic stellar classification
 */
const STAR_SPECTRAL_COLORS = [
  '#FFFFFF', // Pure white (A-type)
  '#E3F2FD', // Pale blue-white (B-type)
  '#E1F5FE', // Ice blue (O-type)
  '#FFF8E1', // Warm yellow-white (F/G-type)
  '#FFE0B2', // Soft golden orange (K-type)
  '#FFCDD2', // Faint reddish orange (M-type)
];

/**
 * Letter Node Definitions for spelling "TASNEEM" across the cosmos
 * rx, ry are normalized screen coordinates (0.0 to 1.0)
 * 36 precise star nodes forming 7 distinct, un-connected letters
 */
interface LetterNodeDef {
  id: string;
  letter: string;
  rx: number;
  ry: number;
}

const TASNEEM_LETTER_NODES: LetterNodeDef[] = [
  // Letter T (4 nodes: 0..3)
  { id: 'T0', letter: 'T', rx: 0.10, ry: 0.38 }, // top left
  { id: 'T1', letter: 'T', rx: 0.15, ry: 0.38 }, // top center
  { id: 'T2', letter: 'T', rx: 0.20, ry: 0.38 }, // top right
  { id: 'T3', letter: 'T', rx: 0.15, ry: 0.62 }, // stem bottom

  // Letter A (5 nodes: 4..8)
  { id: 'A0', letter: 'A', rx: 0.26, ry: 0.38 }, // apex
  { id: 'A1', letter: 'A', rx: 0.22, ry: 0.62 }, // bottom left
  { id: 'A2', letter: 'A', rx: 0.30, ry: 0.62 }, // bottom right
  { id: 'A3', letter: 'A', rx: 0.24, ry: 0.50 }, // mid left
  { id: 'A4', letter: 'A', rx: 0.28, ry: 0.50 }, // mid right

  // Letter S (6 nodes: 9..14)
  { id: 'S0', letter: 'S', rx: 0.39, ry: 0.38 }, // top right
  { id: 'S1', letter: 'S', rx: 0.33, ry: 0.38 }, // top left
  { id: 'S2', letter: 'S', rx: 0.33, ry: 0.50 }, // mid left
  { id: 'S3', letter: 'S', rx: 0.39, ry: 0.50 }, // mid right
  { id: 'S4', letter: 'S', rx: 0.39, ry: 0.62 }, // bottom right
  { id: 'S5', letter: 'S', rx: 0.33, ry: 0.62 }, // bottom left

  // Letter N (4 nodes: 15..18)
  { id: 'N0', letter: 'N', rx: 0.42, ry: 0.62 }, // bottom left
  { id: 'N1', letter: 'N', rx: 0.42, ry: 0.38 }, // top left
  { id: 'N2', letter: 'N', rx: 0.49, ry: 0.62 }, // bottom right
  { id: 'N3', letter: 'N', rx: 0.49, ry: 0.38 }, // top right

  // Letter E1 (6 nodes: 19..24)
  { id: 'E1_0', letter: 'E', rx: 0.58, ry: 0.38 }, // top right
  { id: 'E1_1', letter: 'E', rx: 0.53, ry: 0.38 }, // top left
  { id: 'E1_2', letter: 'E', rx: 0.53, ry: 0.50 }, // mid left
  { id: 'E1_3', letter: 'E', rx: 0.57, ry: 0.50 }, // mid right
  { id: 'E1_4', letter: 'E', rx: 0.53, ry: 0.62 }, // bottom left
  { id: 'E1_5', letter: 'E', rx: 0.58, ry: 0.62 }, // bottom right

  // Letter E2 (6 nodes: 25..30)
  { id: 'E2_0', letter: 'E', rx: 0.68, ry: 0.38 }, // top right
  { id: 'E2_1', letter: 'E', rx: 0.63, ry: 0.38 }, // top left
  { id: 'E2_2', letter: 'E', rx: 0.63, ry: 0.50 }, // mid left
  { id: 'E2_3', letter: 'E', rx: 0.67, ry: 0.50 }, // mid right
  { id: 'E2_4', letter: 'E', rx: 0.63, ry: 0.62 }, // bottom left
  { id: 'E2_5', letter: 'E', rx: 0.68, ry: 0.62 }, // bottom right

  // Letter M (5 nodes: 31..35)
  { id: 'M0', letter: 'M', rx: 0.72, ry: 0.62 }, // bottom left
  { id: 'M1', letter: 'M', rx: 0.72, ry: 0.38 }, // top left
  { id: 'M2', letter: 'M', rx: 0.77, ry: 0.52 }, // center V bottom
  { id: 'M3', letter: 'M', rx: 0.82, ry: 0.38 }, // top right
  { id: 'M4', letter: 'M', rx: 0.82, ry: 0.62 }, // bottom right
];

/**
 * Constellation Connections forming individual, standalone letters T-A-S-N-E-E-M.
 * NO lines connecting different letters together!
 */
const TASNEEM_CONNECTIONS: [number, number][] = [
  // Letter T (3 segments)
  [0, 1], // top left bar
  [1, 2], // top right bar
  [1, 3], // vertical stem

  // Letter A (5 segments)
  [4, 7], // apex to mid-left
  [7, 5], // mid-left to bottom-left
  [4, 8], // apex to mid-right
  [8, 6], // mid-right to bottom-right
  [7, 8], // middle crossbar

  // Letter S (5 segments)
  [9, 10],  // top bar (right to left)
  [10, 11], // upper left spine
  [11, 12], // middle bar (left to right)
  [12, 13], // lower right spine
  [13, 14], // bottom bar (right to left)

  // Letter N (3 segments)
  [15, 16], // left vertical stem
  [16, 17], // diagonal (top-left to bottom-right)
  [17, 18], // right vertical stem

  // Letter E1 (5 segments)
  [19, 20], // top bar
  [20, 21], // upper spine
  [21, 23], // lower spine
  [21, 22], // middle bar
  [23, 24], // bottom bar

  // Letter E2 (5 segments)
  [25, 26], // top bar
  [26, 27], // upper spine
  [27, 29], // lower spine
  [27, 28], // middle bar
  [29, 30], // bottom bar

  // Letter M (4 segments)
  [31, 32], // left vertical stem
  [32, 33], // left diagonal down
  [33, 34], // right diagonal up
  [34, 35], // right vertical stem
];

type TransformationPhase = 'scorpio' | 'lone_star' | 'tasneem' | 'complete';

/**
 * Scorpio Zodiac Constellation Definitions (14 key star nodes forming Scorpio)
 * rx, ry are normalized screen coordinates (0.0 to 1.0)
 */
interface ScorpioNodeDef {
  id: string;
  name: string;
  rx: number;
  ry: number;
  isAntares?: boolean;
}

const SCORPIO_NODES: ScorpioNodeDef[] = [
  { id: 'S0', name: 'Antares', rx: 0.50, ry: 0.42, isAntares: true }, // 0: Antares Heart
  { id: 'S1', name: 'Dschubba', rx: 0.42, ry: 0.32 }, // 1: Head center
  { id: 'S2', name: 'Graffias', rx: 0.38, ry: 0.24 }, // 2: Head top claw
  { id: 'S3', name: 'Pi Scorpii', rx: 0.35, ry: 0.38 }, // 3: Head bottom claw
  { id: 'S4', name: 'Tau', rx: 0.56, ry: 0.46 }, // 4: Body upper
  { id: 'S5', name: 'Epsilon', rx: 0.62, ry: 0.52 }, // 5: Body mid
  { id: 'S6', name: 'Mu1', rx: 0.64, ry: 0.60 }, // 6: Body lower
  { id: 'S7', name: 'Zeta2', rx: 0.63, ry: 0.68 }, // 7: Tail curve start
  { id: 'S8', name: 'Eta', rx: 0.58, ry: 0.75 }, // 8: Tail bottom
  { id: 'S9', name: 'Sargas', rx: 0.51, ry: 0.79 }, // 9: Hook bottom
  { id: 'S10', name: 'Iota1', rx: 0.44, ry: 0.77 }, // 10: Hook curve
  { id: 'S11', name: 'Kappa', rx: 0.40, ry: 0.70 }, // 11: Stinger base
  { id: 'S12', name: 'Shaula', rx: 0.37, ry: 0.62 }, // 12: Stinger tip 1
  { id: 'S13', name: 'Lesath', rx: 0.40, ry: 0.58 }, // 13: Stinger tip 2
];

const SCORPIO_CONNECTIONS: [number, number][] = [
  [0, 1], // Antares -> Dschubba
  [1, 2], // Dschubba -> Graffias
  [1, 3], // Dschubba -> Pi Scorpii
  [0, 4], // Antares -> Tau
  [4, 5], // Tau -> Epsilon
  [5, 6], // Epsilon -> Mu1
  [6, 7], // Mu1 -> Zeta2
  [7, 8], // Zeta2 -> Eta
  [8, 9], // Eta -> Sargas
  [9, 10], // Sargas -> Iota1
  [10, 11], // Iota1 -> Kappa
  [11, 12], // Kappa -> Shaula
  [12, 13], // Shaula -> Lesath
];

/**
 * Renders a highly realistic astronomical diffraction star with 8-point flare spikes,
 * white-hot core, and warm amber halo bloom matching real telescope optics.
 */
function drawRealisticDiffractionStar(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  starSize: number,
  alpha: number,
  hVal: number = 0,
  isCenterOrConstellation: boolean = false,
  dpr: number = 1,
  timeSec: number = 0,
  twinklePhase: number = 0
) {
  // Intensity scales with hVal for constellation stars
  const intensity = isCenterOrConstellation
    ? Math.max(0.12, (0.35 + 0.65 * hVal) * Math.min(1.0, alpha))
    : Math.min(1.0, alpha);

  if (intensity <= 0.01) return;

  const pulse = Math.sin(timeSec * 2.2 + twinklePhase);
  const sizeFactor = isCenterOrConstellation
    ? starSize * (0.85 + 0.5 * hVal)
    : starSize;

  // Primary Cross Ray length & width scale down when shape is complete (hVal = 0.2 - 0.3)
  // At peak burst (hVal=1): ray length ~ 16x starSize. When complete & settled (hVal=0.2): ray length ~ 6.8x starSize (no overlap)
  const rayMultiplier = isCenterOrConstellation
    ? 4.5 + 11.5 * hVal + pulse * 1.2
    : 6.5 + pulse * 1.5;

  const primaryLength = sizeFactor * rayMultiplier;
  const primaryWidth = Math.max(1.1 * dpr, sizeFactor * (0.32 + 0.35 * hVal));

  // Secondary Diagonal Ray length & width (8-point diffraction pattern)
  const secondaryLength = primaryLength * 0.42;
  const secondaryWidth = primaryWidth * 0.45;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Helper to draw a needle-sharp tapered diffraction ray polygon
  const drawTaperedRay = (len: number, baseW: number, angleRad: number, coreAlpha: number, outerAlpha: number) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angleRad);

    // Outer warm amber glow polygon for ray body
    const rayGrad = ctx.createLinearGradient(-len, 0, len, 0);
    rayGrad.addColorStop(0, 'rgba(255, 160, 60, 0)');
    rayGrad.addColorStop(0.35, `rgba(255, 205, 110, ${(outerAlpha * intensity).toFixed(3)})`);
    rayGrad.addColorStop(0.5, `rgba(255, 245, 210, ${(coreAlpha * intensity).toFixed(3)})`);
    rayGrad.addColorStop(0.65, `rgba(255, 205, 110, ${(outerAlpha * intensity).toFixed(3)})`);
    rayGrad.addColorStop(1, 'rgba(255, 160, 60, 0)');

    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -baseW * 0.5);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, baseW * 0.5);
    ctx.closePath();
    ctx.fill();

    // High-intensity white needle core streak down the ray center
    const coreGrad = ctx.createLinearGradient(-len * 0.88, 0, len * 0.88, 0);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    coreGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(0.95 * intensity).toFixed(3)})`);
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = Math.max(0.6 * dpr, baseW * 0.22);
    ctx.beginPath();
    ctx.moveTo(-len * 0.88, 0);
    ctx.lineTo(len * 0.88, 0);
    ctx.stroke();

    ctx.restore();
  };

  // Render 4 primary cross rays (Horizontal and Vertical)
  drawTaperedRay(primaryLength, primaryWidth, 0, 0.95, 0.7);
  drawTaperedRay(primaryLength, primaryWidth, Math.PI / 2, 0.95, 0.7);

  // Render 4 secondary diagonal rays (45 deg) - Creates the 8-point diffraction star from the reference image
  drawTaperedRay(secondaryLength, secondaryWidth, Math.PI / 4, 0.72, 0.4);
  drawTaperedRay(secondaryLength, secondaryWidth, (3 * Math.PI) / 4, 0.72, 0.4);

  // Concentric Radial Golden Bloom - scales down when shape is complete so halos do not overlap
  const haloRadius = sizeFactor * (isCenterOrConstellation ? 2.5 + 3.5 * hVal : 4.0);
  const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
  haloGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.98 * intensity).toFixed(2)})`);
  haloGrad.addColorStop(0.2, `rgba(255, 230, 160, ${(0.85 * intensity).toFixed(2)})`);
  haloGrad.addColorStop(0.48, `rgba(245, 180, 80, ${(0.45 * intensity).toFixed(2)})`);
  haloGrad.addColorStop(0.78, `rgba(200, 130, 40, ${(0.15 * intensity).toFixed(2)})`);
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer expansive atmospheric glow ONLY during peak highlight burst (hVal > 0.5)
  if (isCenterOrConstellation && hVal > 0.5) {
    const outerRadius = haloRadius * 2.2;
    const outerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, outerRadius);
    outerGrad.addColorStop(0, `rgba(255, 220, 110, ${(0.45 * intensity).toFixed(2)})`);
    outerGrad.addColorStop(0.5, `rgba(230, 160, 50, ${(0.18 * intensity).toFixed(2)})`);
    outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brilliant White-Hot Central Core
  const coreRadius = Math.max(1.1 * dpr, sizeFactor * (0.55 + 0.25 * hVal));
  ctx.fillStyle = `rgba(255, 255, 255, ${(Math.min(1.0, intensity * 1.15)).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(sx, sy, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const NightSky: React.FC = () => {
  // Layer container & canvas refs
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const trailsCanvasRef = useRef<HTMLCanvasElement>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  // SVG Groups for Scorpio and Tasneem
  const constellationSvgRef = useRef<SVGSVGElement>(null);
  const scorpioGroupRef = useRef<SVGGElement>(null);
  const tasneemGroupRef = useRef<SVGGElement>(null);

  // Typography scene refs
  const scene1TextRef = useRef<HTMLDivElement>(null);
  const scene2TextRef = useRef<HTMLDivElement>(null);
  const finalTextBlockRef = useRef<HTMLDivElement>(null);
  const finalTitleRef = useRef<HTMLHeadingElement>(null);
  const finalMessageRef = useRef<HTMLDivElement>(null);

  // Animation Phase State for UI Badges
  const [currentPhase, setCurrentPhase] = useState<TransformationPhase>('scorpio');
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Smooth parallax tracking
  const parallaxRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const mousePosRef = useRef({ x: -1000, y: -1000 });

  // Tasneem ascension offset ref ("to protrude above or extend beyond")
  const tasneemAscentYRef = useRef(0);

  // Store trigger function ref for replay
  const triggerSequenceRef = useRef<(() => void) | null>(null);

  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundscape.resume();
    const muted = soundscape.toggleMute();
    setIsMuted(muted);
  };

  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current;
    const trailsCanvas = trailsCanvasRef.current;
    const starsCanvas = starsCanvasRef.current;
    const particlesCanvas = particlesCanvasRef.current;
    if (!bgCanvas || !trailsCanvas || !starsCanvas || !particlesCanvas) return;

    // GPU context configuration
    const bgCtx = bgCanvas.getContext('2d', { alpha: false });
    const trailsCtx = trailsCanvas.getContext('2d', { alpha: true });
    const starsCtx = starsCanvas.getContext('2d', { alpha: true });
    const particlesCtx = particlesCanvas.getContext('2d', { alpha: true });

    if (!bgCtx || !trailsCtx || !starsCtx || !particlesCtx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let particles: Particle[] = [];
    let trailParticles: TrailParticle[] = [];
    let tasneemStarNodes: Star[] = [];

    // GSAP Timelines for memory management
    let cameraZoomTween: gsap.core.Tween | null = null;
    let mainSequenceTimeline: gsap.core.Timeline | null = null;

    // SplitType instances for cleanup
    let eyebrowSplitInstance: SplitType | null = null;
    let quoteSplitInstance: SplitType | null = null;
    let subtitleSplitInstance: SplitType | null = null;

    // Responsive dimensions & density scaling
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    // Offscreen buffers for pre-rendered background and cached purple nebula
    const bgOffscreen = document.createElement('canvas');
    const bgOffCtx = bgOffscreen.getContext('2d', { alpha: false });

    const nebulaOffscreen = document.createElement('canvas');
    const nebulaOffCtx = nebulaOffscreen.getContext('2d', { alpha: true });

    /**
     * Resizing Canvases
     */
    const resizeCanvases = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);

      const scaledW = Math.floor(width * dpr);
      const scaledH = Math.floor(height * dpr);

      [bgCanvas, trailsCanvas, starsCanvas, particlesCanvas].forEach((c) => {
        c.width = scaledW;
        c.height = scaledH;
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      });

      bgOffscreen.width = scaledW;
      bgOffscreen.height = scaledH;

      nebulaOffscreen.width = scaledW;
      nebulaOffscreen.height = scaledH;

      [bgCtx, trailsCtx, starsCtx, particlesCtx, bgOffCtx, nebulaOffCtx].forEach((ctx) => {
        if (ctx) ctx.imageSmoothingEnabled = true;
      });

      renderMilkyWayBackground();
      initStarsAndSymmetry();
      initParticles();
      setupSequence();
    };

    /**
     * Renders Deep Space / Milky Way Background & Cached Nebula Pattern
     */
    const renderMilkyWayBackground = () => {
      if (!bgOffCtx) return;

      const w = Math.floor(width * dpr);
      const h = Math.floor(height * dpr);

      // Radial Deep Space Gradient
      const spaceGrad = bgOffCtx.createRadialGradient(
        w * 0.5, h * 0.5, 0,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.75
      );
      spaceGrad.addColorStop(0, '#0a0e1a');
      spaceGrad.addColorStop(0.5, '#040714');
      spaceGrad.addColorStop(1, '#02040a');

      bgOffCtx.fillStyle = spaceGrad;
      bgOffCtx.fillRect(0, 0, w, h);

      // Galactic Plane Diagonal Band
      const angle = -0.42;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const centerX = w * 0.5;
      const centerY = h * 0.5;

      bgOffCtx.save();
      bgOffCtx.translate(centerX, centerY);
      bgOffCtx.rotate(angle);

      const bandWidth = Math.max(w, h) * 1.5;
      const bandHeight = h * 0.38;

      const mwGrad = bgOffCtx.createLinearGradient(0, -bandHeight, 0, bandHeight);
      mwGrad.addColorStop(0, 'rgba(4, 7, 24, 0)');
      mwGrad.addColorStop(0.2, 'rgba(25, 20, 55, 0.12)');
      mwGrad.addColorStop(0.38, 'rgba(65, 38, 105, 0.28)');
      mwGrad.addColorStop(0.5, 'rgba(110, 75, 160, 0.38)');
      mwGrad.addColorStop(0.62, 'rgba(50, 30, 90, 0.26)');
      mwGrad.addColorStop(0.8, 'rgba(15, 18, 48, 0.12)');
      mwGrad.addColorStop(1, 'rgba(2, 4, 15, 0)');

      bgOffCtx.fillStyle = mwGrad;
      bgOffCtx.fillRect(-bandWidth / 2, -bandHeight, bandWidth, bandHeight * 2);

      const coreGrad = bgOffCtx.createRadialGradient(0, 0, 0, 0, 0, bandHeight * 0.95);
      coreGrad.addColorStop(0, 'rgba(195, 170, 235, 0.32)');
      coreGrad.addColorStop(0.25, 'rgba(135, 90, 185, 0.22)');
      coreGrad.addColorStop(0.55, 'rgba(60, 35, 110, 0.14)');
      coreGrad.addColorStop(0.85, 'rgba(20, 22, 60, 0.05)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      bgOffCtx.fillStyle = coreGrad;
      bgOffCtx.beginPath();
      bgOffCtx.ellipse(0, 0, bandHeight * 1.8, bandHeight * 0.85, 0, 0, Math.PI * 2);
      bgOffCtx.fill();

      bgOffCtx.restore();

      // Procedural Nebula Grid Sampling
      const isMobile = width < 768;
      const step = isMobile ? Math.max(12, Math.floor(8 * dpr)) : Math.max(8, Math.floor(6 * dpr));
      const cols = Math.ceil(w / step);
      const rows = Math.ceil(h / step);

      for (let r = 0; r < rows; r++) {
        const y = r * step;
        for (let c = 0; c < cols; c++) {
          const x = c * step;

          const dx = x - centerX;
          const dy = y - centerY;
          const gy = -dx * sinA + dy * cosA;

          const distFromAxis = Math.abs(gy);
          const axisFactor = Math.max(0, 1 - distFromAxis / (h * 0.45));

          if (axisFactor <= 0.02) continue;

          const n1 = noise.fbm2D(x * 0.0012, y * 0.0012, 3, 0.5, 2.0);
          const n2 = noise.fbm2D(x * 0.0035 + 100, y * 0.0035 + 100, 2, 0.45, 2.0);

          if (n1 > 0.12 && axisFactor > 0.1) {
            const cloudAlpha = Math.min(0.22, (n1 - 0.12) * 0.35 * axisFactor);
            const rCol = Math.floor(70 + n2 * 60);
            const gCol = Math.floor(35 + n1 * 40);
            const bCol = Math.floor(130 + n2 * 80);

            bgOffCtx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${cloudAlpha.toFixed(3)})`;
            bgOffCtx.fillRect(x, y, step, step);
          }

          if (n2 < -0.18 && axisFactor > 0.2) {
            const riftAlpha = Math.min(0.4, (-0.18 - n2) * 0.65 * axisFactor);
            bgOffCtx.fillStyle = `rgba(1, 3, 10, ${riftAlpha.toFixed(3)})`;
            bgOffCtx.fillRect(x, y, step, step);
          }
        }
      }

      // Pre-render cached purple nebula radial haze into nebulaOffscreen buffer
      if (nebulaOffCtx) {
        nebulaOffCtx.clearRect(0, 0, w, h);
        const bgMaxDim = Math.max(w, h);
        const purpleNebulaGrad = nebulaOffCtx.createRadialGradient(
          w * 0.5, h * 0.42, bgMaxDim * 0.05,
          w * 0.5, h * 0.42, bgMaxDim * 0.68
        );
        purpleNebulaGrad.addColorStop(0, 'rgba(145, 85, 225, 0.24)');
        purpleNebulaGrad.addColorStop(0.35, 'rgba(85, 45, 155, 0.15)');
        purpleNebulaGrad.addColorStop(0.70, 'rgba(35, 18, 75, 0.06)');
        purpleNebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        nebulaOffCtx.fillStyle = purpleNebulaGrad;
        nebulaOffCtx.fillRect(0, 0, w, h);
      }

      bgCtx.drawImage(bgOffscreen, 0, 0);
    };

    /**
     * Initializes stars, Scorpio Zodiac positions, and Tasneem letter target positions
     */
    const initStarsAndSymmetry = () => {
      stars = [];
      const isMobile = width < 768;
      const totalStars = isMobile
        ? Math.min(1800, Math.floor((width * height) / 380))
        : Math.min(4500, Math.floor((width * height) / 220));

      const centerX = (width * dpr) * 0.5;
      const centerY = (height * dpr) * 0.5;

      tasneemStarNodes = [];

      for (let i = 0; i < totalStars; i++) {
        const startX = Math.random() * width * dpr;
        const startY = Math.random() * height * dpr;

        const zRand = Math.random();
        let baseSize = (0.4 + Math.random() * 0.9) * dpr;
        let baseAlpha = 0.2 + Math.random() * 0.6;
        let hasSpikes = false;

        if (zRand > 0.98) {
          baseSize = (1.8 + Math.random() * 1.2) * dpr;
          baseAlpha = 0.85 + Math.random() * 0.15;
          hasSpikes = true;
        }

        const color = STAR_SPECTRAL_COLORS[Math.floor(Math.random() * STAR_SPECTRAL_COLORS.length)];

        stars.push({
          x: startX,
          y: startY,
          startX,
          startY,
          symX: startX,
          symY: startY,
          z: zRand,
          baseSize,
          size: baseSize,
          baseAlpha,
          alpha: baseAlpha,
          color,
          hasSpikes,
          twinkleSpeed: 0.8 + Math.random() * 2.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleAmount: 0.2 + Math.random() * 0.5,
          distFromMilkyWay: 0.5,
          isConstellationNode: false,
          constellationHighlight: 0,
          isCenterStar: false,
        });
      }

      // Assign Scorpio Zodiac positions to stars 0..13
      SCORPIO_NODES.forEach((sNode, idx) => {
        const star = stars[idx];
        if (star) {
          star.scorpioX = sNode.rx * width * dpr;
          star.scorpioY = sNode.ry * height * dpr;
          star.hasSpikes = true;
          star.color = sNode.isAntares ? '#FFE3A8' : '#FFF5D6';
        }
      });

      // Star 0 is designated as Antares (the bright heart of Scorpio, later the lone center star)
      stars[0].isCenterStar = true;
      stars[0].hasSpikes = true;
      stars[0].color = '#FFE3A8';

      // Assign stars 1 to 36 as the TASNEEM letter constellation nodes
      TASNEEM_LETTER_NODES.forEach((node, idx) => {
        const star = stars[idx + 1];
        if (star) {
          star.isConstellationNode = true;
          star.hasSpikes = true;
          star.targetX = node.rx * width * dpr;
          star.targetY = node.ry * height * dpr;
          star.color = '#FFF5D6';
          tasneemStarNodes.push(star);
        }
      });

      // Kill any previous GSAP star twinkle tweens
      stars.forEach((s) => gsap.killTweensOf(s));

      // Randomized GSAP timelines for multi-layered depth star twinkling
      stars.forEach((star) => {
        star.twinkleAlpha = star.baseAlpha;
        star.twinkleScale = 1.0;

        const isForeground = star.z > 0.75 || star.hasSpikes;
        const isMidground = star.z >= 0.3 && star.z <= 0.75;

        const alphaRange = isForeground ? 0.38 : isMidground ? 0.25 : 0.15;
        const scaleRange = isForeground ? 0.32 : isMidground ? 0.20 : 0.10;
        const baseDuration = isForeground ? 1.0 : isMidground ? 1.8 : 2.8;

        gsap.timeline({
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          delay: Math.random() * 3,
        }).to(star, {
          twinkleAlpha: () => {
            const delta = (Math.random() - 0.5) * 2 * alphaRange * star.baseAlpha;
            return Math.max(0.05, Math.min(1.0, star.baseAlpha + delta));
          },
          twinkleScale: () => {
            const delta = (Math.random() - 0.5) * 2 * scaleRange;
            return Math.max(0.68, Math.min(1.42, 1.0 + delta));
          },
          duration: () => baseDuration + (Math.random() - 0.5) * 1.2,
          ease: isForeground ? (Math.random() > 0.5 ? 'sine.inOut' : 'power1.inOut') : 'sine.inOut',
        });
      });
    };

    /**
     * Initializes floating dust particles
     */
    const initParticles = () => {
      particles = [];
      const isMobile = width < 768;
      const count = isMobile ? 40 : 80;

      for (let i = 0; i < count; i++) {
        const baseAlpha = 0.1 + Math.random() * 0.4;
        particles.push({
          x: Math.random() * width * dpr,
          y: Math.random() * height * dpr,
          z: 0.2 + Math.random() * 0.8,
          radius: (1.2 + Math.random() * 2.0) * dpr,
          vx: (Math.random() - 0.5) * 0.15 * dpr,
          vy: (-0.1 - Math.random() * 0.2) * dpr,
          alpha: baseAlpha,
          baseAlpha,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.5 + Math.random() * 1.2,
          color: Math.random() > 0.3 ? 'rgba(215, 230, 255, ' : 'rgba(235, 205, 255, ',
        });
      }
    };

    /**
     * =========================================================
     * MASTER GSAP SEQUENCER: Multi-Scene Star Narrative
     * =========================================================
     * Scene 1: Scorpio Zodiac Constellation forms & connects
     * Scene 2: Implosion to One Brighter & Bigger Lone Star
     * Scene 3: Tasneem Constellation Expansion & Heartfelt Message
     */
    const setupSequence = () => {
      const scorpioGroup = scorpioGroupRef.current;
      const tasneemGroup = tasneemGroupRef.current;
      if (!scorpioGroup || !tasneemGroup) return;

      scorpioGroup.innerHTML = '';
      tasneemGroup.innerHTML = '';
      if (mainSequenceTimeline) mainSequenceTimeline.kill();
      trailParticles = [];

      const centerX = width * dpr * 0.5;
      const centerY = height * dpr * 0.5;

      // 1. Prepare SVG path elements for Scorpio
      const scorpioPathElements: { glow: SVGPathElement; core: SVGPathElement }[] = [];
      const scorpioPathLengths: number[] = [];

      SCORPIO_CONNECTIONS.forEach(([fromIdx, toIdx]) => {
        const fromNode = SCORPIO_NODES[fromIdx];
        const toNode = SCORPIO_NODES[toIdx];
        if (!fromNode || !toNode) return;

        const x1 = fromNode.rx * width;
        const y1 = fromNode.ry * height;
        const x2 = toNode.rx * width;
        const y2 = toNode.ry * height;
        const dAttr = `M ${x1} ${y1} L ${x2} ${y2}`;

        const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glowPath.setAttribute('d', dAttr);
        glowPath.setAttribute('stroke', '#FFDE75');
        glowPath.setAttribute('stroke-width', '4');
        glowPath.setAttribute('stroke-linecap', 'round');
        glowPath.setAttribute('filter', 'url(#gold-glow)');
        glowPath.setAttribute('fill', 'none');
        glowPath.setAttribute('opacity', '0.85');

        const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        corePath.setAttribute('d', dAttr);
        corePath.setAttribute('stroke', '#FFFFFF');
        corePath.setAttribute('stroke-width', '2');
        corePath.setAttribute('stroke-linecap', 'round');
        corePath.setAttribute('fill', 'none');
        corePath.setAttribute('opacity', '0.95');

        const totalLength = corePath.getTotalLength();
        glowPath.style.strokeDasharray = `${totalLength}`;
        glowPath.style.strokeDashoffset = `${totalLength}`;
        corePath.style.strokeDasharray = `${totalLength}`;
        corePath.style.strokeDashoffset = `${totalLength}`;

        scorpioGroup.appendChild(glowPath);
        scorpioGroup.appendChild(corePath);

        scorpioPathElements.push({ glow: glowPath, core: corePath });
        scorpioPathLengths.push(totalLength);
      });

      // 2. Prepare SVG path elements for TASNEEM
      const tasneemPathElements: { glow: SVGPathElement; core: SVGPathElement }[] = [];
      const tasneemParticleGroups: SVGGElement[] = [];
      const tasneemPathLengths: number[] = [];

      TASNEEM_CONNECTIONS.forEach(([fromIdx, toIdx]) => {
        const fromNode = TASNEEM_LETTER_NODES[fromIdx];
        const toNode = TASNEEM_LETTER_NODES[toIdx];
        if (!fromNode || !toNode) return;

        const x1 = fromNode.rx * width;
        const y1 = fromNode.ry * height;
        const x2 = toNode.rx * width;
        const y2 = toNode.ry * height;
        const dAttr = `M ${x1} ${y1} L ${x2} ${y2}`;

        const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glowPath.setAttribute('d', dAttr);
        glowPath.setAttribute('stroke', '#FFDE75');
        glowPath.setAttribute('stroke-width', '5');
        glowPath.setAttribute('stroke-linecap', 'round');
        glowPath.setAttribute('filter', 'url(#gold-glow)');
        glowPath.setAttribute('fill', 'none');
        glowPath.setAttribute('opacity', '0.85');

        const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        corePath.setAttribute('d', dAttr);
        corePath.setAttribute('stroke', '#FFFFFF');
        corePath.setAttribute('stroke-width', '2.5');
        corePath.setAttribute('stroke-linecap', 'round');
        corePath.setAttribute('fill', 'none');
        corePath.setAttribute('opacity', '1.0');

        const totalLength = corePath.getTotalLength();
        glowPath.style.strokeDasharray = `${totalLength}`;
        glowPath.style.strokeDashoffset = `${totalLength}`;
        corePath.style.strokeDasharray = `${totalLength}`;
        corePath.style.strokeDashoffset = `${totalLength}`;

        const particleG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        particleG.setAttribute('opacity', '0');

        const haloCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        haloCircle.setAttribute('r', '8');
        haloCircle.setAttribute('fill', 'url(#particle-gold-glow)');
        haloCircle.setAttribute('filter', 'url(#gold-glow)');

        const coreCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        coreCircle.setAttribute('r', '3');
        coreCircle.setAttribute('fill', '#FFFFFF');

        particleG.appendChild(haloCircle);
        particleG.appendChild(coreCircle);

        tasneemGroup.appendChild(glowPath);
        tasneemGroup.appendChild(corePath);
        tasneemGroup.appendChild(particleG);

        tasneemPathElements.push({ glow: glowPath, core: corePath });
        tasneemParticleGroups.push(particleG);
        tasneemPathLengths.push(totalLength);
      });

      // Master Timeline
      const masterTL = gsap.timeline({
        delay: 0.3,
        onStart: () => {
          setIsPlayingSequence(true);
        },
        onComplete: () => {
          setCurrentPhase('complete');
          setIsPlayingSequence(false);
        },
      });

      // Reset text states
      if (scene1TextRef.current) gsap.set(scene1TextRef.current, { opacity: 0, y: 15 });
      if (scene2TextRef.current) gsap.set(scene2TextRef.current, { opacity: 0, y: 15 });
      if (finalTextBlockRef.current) gsap.set(finalTextBlockRef.current, { opacity: 0, y: 20 });
      gsap.set(scorpioGroup, { opacity: 1 });

      // ===============================================================
      // SCENE 1: Quiet night sky, camera moves, Scorpio forms
      // ===============================================================
      masterTL.add(() => setCurrentPhase('scorpio'));

      // Fade in Scene 1 text ("Every star deserves light.")
      masterTL.to(scene1TextRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.8,
        ease: 'power2.out',
      });

      // Stars align into Scorpio Zodiac shape
      const scorpioProgress = { val: 0 };
      masterTL.to(scorpioProgress, {
        val: 1,
        duration: 3.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          const v = scorpioProgress.val;
          SCORPIO_NODES.forEach((_, idx) => {
            const s = stars[idx];
            if (s && s.scorpioX !== undefined && s.scorpioY !== undefined) {
              s.x = gsap.utils.interpolate(s.startX, s.scorpioX, v);
              s.y = gsap.utils.interpolate(s.startY, s.scorpioY, v);
              s.constellationHighlight = v * 0.85;
            }
          });
        },
      }, '-=1.0');

      // Connect Scorpio constellation lines
      SCORPIO_CONNECTIONS.forEach((_, index) => {
        const paths = scorpioPathElements[index];
        const length = scorpioPathLengths[index];
        const strokeObj = { progress: 0 };

        masterTL.to(
          strokeObj,
          {
            progress: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onUpdate: () => {
              const currentDist = strokeObj.progress * length;
              const offsetStr = `${length - currentDist}`;
              paths.glow.style.strokeDashoffset = offsetStr;
              paths.core.style.strokeDashoffset = offsetStr;
            },
          },
          index === 0 ? '-=1.5' : '-=0.38'
        );
      });

      // Hold Scene 1
      masterTL.to({}, { duration: 1.8 });

      // Fade out Scene 1 text
      masterTL.to(scene1TextRef.current, {
        opacity: 0,
        y: -15,
        duration: 1.2,
        ease: 'power2.in',
      });

      // ===============================================================
      // SCENE 2: Lone Star & Text 2
      // ===============================================================
      masterTL.add(() => setCurrentPhase('lone_star'));

      // Fade in Scene 2 text ("But not every star becomes part of the constellation you remember.")
      masterTL.to(scene2TextRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.8,
        ease: 'power2.out',
      }, '<+=0.2');

      // Fade out Scorpio lines
      masterTL.to(scorpioGroup, {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out',
      }, '<');

      // All stars fade/implode down to One Lone Central Star (Star 0)
      const disappearProgress = { val: 0 };
      const centerStar = stars[0];

      masterTL.to(disappearProgress, {
        val: 1,
        duration: 2.8,
        ease: 'power3.inOut',
        onUpdate: () => {
          const p = disappearProgress.val;

          // Center star moves to exact center and grows MUCH BIGGER & BRIGHTER!
          const startXPos = centerStar.scorpioX ?? centerStar.startX;
          const startYPos = centerStar.scorpioY ?? centerStar.startY;
          centerStar.x = gsap.utils.interpolate(startXPos, centerX, p);
          centerStar.y = gsap.utils.interpolate(startYPos, centerY, p);

          // Lone star is focal (11.4 * dpr) with gentle brightness
          centerStar.size = gsap.utils.interpolate(centerStar.baseSize, 11.4 * dpr, p);
          centerStar.baseAlpha = 0.95;
          centerStar.alpha = 0.95;
          centerStar.constellationHighlight = 0.95;

          // All other stars shrink, implode toward center, and fade away
          for (let i = 1; i < stars.length; i++) {
            const s = stars[i];
            const sx = s.scorpioX ?? s.startX;
            const sy = s.scorpioY ?? s.startY;
            s.x = gsap.utils.interpolate(sx, centerX, p * 0.7);
            s.y = gsap.utils.interpolate(sy, centerY, p * 0.7);
            s.alpha = (1 - p) * s.baseAlpha;
            s.size = (1 - p) * s.baseSize;
            s.constellationHighlight = (1 - p) * (s.constellationHighlight || 0);
          }

          particles.forEach((pt) => {
            pt.alpha = (1 - p) * pt.baseAlpha;
          });
        },
      }, '<');

      // Hold Lone Star on screen
      masterTL.to({}, { duration: 2.2 });

      // Fade out Scene 2 text
      masterTL.to(scene2TextRef.current, {
        opacity: 0,
        y: -15,
        duration: 1.2,
        ease: 'power2.in',
      });

      // ===============================================================
      // PHASE 3: TASNEEM Constellation & Final Message
      // ===============================================================
      masterTL.add(() => setCurrentPhase('tasneem'));

      const formTasneemProgress = { val: 0 };

      const nodeTrajectories = tasneemStarNodes.map((star, idx) => {
        const tx = star.targetX ?? centerX;
        const ty = star.targetY ?? centerY;
        const dx = tx - centerX;
        const dy = ty - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + (idx % 2 === 0 ? Math.PI / 2.2 : -Math.PI / 2.2);
        const curveMagnitude = Math.min(dist * 0.22, 40 * dpr) * (0.7 + (idx % 3) * 0.3);

        const controlX = (centerX + tx) * 0.5 + Math.cos(perpAngle) * curveMagnitude;
        const controlY = (centerY + ty) * 0.5 + Math.sin(perpAngle) * curveMagnitude;

        const staggerDelay = (tx / (width * dpr)) * 0.32 + (idx % 4) * 0.025;

        return {
          star,
          tx,
          ty,
          controlX,
          controlY,
          staggerDelay,
        };
      });

      masterTL.to(formTasneemProgress, {
        val: 1,
        duration: 3.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          const globalP = formTasneemProgress.val;

          // Center star settles into focal node
          const centerScaleEase = gsap.parseEase('power3.inOut')(Math.min(1, globalP * 1.2));
          centerStar.size = gsap.utils.interpolate(11.4 * dpr, 3.61 * dpr, centerScaleEase);

          nodeTrajectories.forEach(({ star, tx, ty, controlX, controlY, staggerDelay }) => {
            const rawLocalP = (globalP - staggerDelay) / Math.max(0.01, 1 - staggerDelay);
            const clampedP = Math.max(0, Math.min(1, rawLocalP));
            const localP = gsap.parseEase('power3.inOut')(clampedP);

            const invP = 1 - localP;
            star.x = invP * invP * centerX + 2 * invP * localP * controlX + localP * localP * tx;
            star.y = invP * invP * centerY + 2 * invP * localP * controlY + localP * localP * ty;

            const alphaEase = gsap.parseEase('sine.out')(clampedP);
            star.alpha = gsap.utils.interpolate(0, 0.98, alphaEase);

            const scaleBump = clampedP > 0.8 ? 1 + Math.sin((clampedP - 0.8) / 0.2 * Math.PI) * 0.22 : 1;
            star.size = gsap.utils.interpolate(0, 3.6 * dpr, localP) * scaleBump;

            if (clampedP > 0.02 && clampedP < 0.98) {
              const numTrail = Math.random() < 0.85 ? 2 : 1;
              for (let k = 0; k < numTrail; k++) {
                const angleOffset = Math.random() * Math.PI * 2;
                const driftSpeed = (0.12 + Math.random() * 0.3) * dpr;
                trailParticles.push({
                  x: star.x + (Math.random() - 0.5) * 1.5 * dpr,
                  y: star.y + (Math.random() - 0.5) * 1.5 * dpr,
                  vx: Math.cos(angleOffset) * driftSpeed * 0.25,
                  vy: Math.sin(angleOffset) * driftSpeed * 0.25,
                  radius: (1.2 + Math.random() * 2.2) * dpr,
                  alpha: 0.65 + Math.random() * 0.25,
                  decay: 0.016 + Math.random() * 0.014,
                  color: Math.random() > 0.35 ? 'rgba(255, 245, 190, ' : 'rgba(220, 235, 255, ',
                });
              }
            }
          });

          // Ambient stars return gently
          const bgStarP = gsap.parseEase('sine.inOut')(Math.max(0, (globalP - 0.2) / 0.8));
          for (let i = tasneemStarNodes.length + 1; i < stars.length; i++) {
            const s = stars[i];
            s.alpha = bgStarP * s.baseAlpha * 0.35;
            s.size = bgStarP * s.baseSize * 0.8;
          }

          particles.forEach((pt) => {
            pt.alpha = bgStarP * pt.baseAlpha;
          });
        },
      });

      // Reset ascent offset
      tasneemAscentYRef.current = 0;

      // Draw golden stroke paths for TASNEEM
      TASNEEM_CONNECTIONS.forEach((conn, index) => {
        const paths = tasneemPathElements[index];
        const particleG = tasneemParticleGroups[index];
        const length = tasneemPathLengths[index];
        const fromStar = tasneemStarNodes[conn[0]];
        const toStar = tasneemStarNodes[conn[1]];

        const strokeObj = { progress: 0 };

        masterTL.to(
          strokeObj,
          {
            progress: 1,
            duration: 0.65,
            ease: 'power2.inOut',
            onStart: () => {
              if (fromStar) {
                gsap.to(fromStar, { constellationHighlight: 1.0, duration: 0.6, ease: 'sine.out' });
              }
              soundscape.playConstellationConnectSound();
            },
            onUpdate: () => {
              const currentDist = strokeObj.progress * length;
              const offsetStr = `${length - currentDist}`;
              paths.glow.style.strokeDashoffset = offsetStr;
              paths.core.style.strokeDashoffset = offsetStr;

              if (currentDist > 0 && currentDist < length) {
                const pt = paths.core.getPointAtLength(currentDist);
                particleG.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
                particleG.setAttribute('opacity', '1');

                if (Math.random() < 0.35) {
                  particles.push({
                    x: pt.x * dpr,
                    y: pt.y * dpr,
                    z: 0.85,
                    radius: (1.5 + Math.random() * 2.0) * dpr,
                    vx: (Math.random() - 0.5) * 0.3 * dpr,
                    vy: (Math.random() - 0.5) * 0.3 * dpr,
                    alpha: 0.85,
                    baseAlpha: 0.5,
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 2.0,
                    color: 'rgba(255, 220, 130, ',
                  });
                }
              } else {
                particleG.setAttribute('opacity', '0');
              }
            },
            onComplete: () => {
              paths.glow.style.strokeDashoffset = '0';
              paths.core.style.strokeDashoffset = '0';
              if (toStar) {
                gsap.to(toStar, { constellationHighlight: 1.0, duration: 0.6, ease: 'sine.out' });
              }
              particleG.setAttribute('opacity', '0');
            },
          },
          index === 0 ? '-=0.5' : '-=0.45'
        );
      });

      // Soften star brightness & flare length so Tasneem stars remain bright and clear without overlapping
      masterTL.to(
        tasneemStarNodes,
        {
          constellationHighlight: 0.45,
          duration: 1.8,
          ease: 'power2.out',
        },
        '<+=0.1'
      );

      // "Tasneem" celestial ascension: "to protrude above or extend beyond".
      // As the constellation finishes forming, it gracefully extends/ascends upwards so text below is fully visible.
      const ascentObj = { dy: 0 };
      masterTL.to(
        ascentObj,
        {
          dy: -height * dpr * 0.15,
          duration: 2.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            tasneemAscentYRef.current = ascentObj.dy;
            tasneemStarNodes.forEach((star) => {
              if (star.targetY !== undefined) {
                star.y = star.targetY + ascentObj.dy;
              }
            });
          },
        },
        '+=0.1'
      );

      // Reveal Final Message & Tasneem Header
      masterTL.to(
        finalTextBlockRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 2.2,
          ease: 'power2.out',
        },
        '<+=0.4'
      );

      mainSequenceTimeline = masterTL;
    };

    // Store trigger sequence handler for external call
    triggerSequenceRef.current = () => {
      initStarsAndSymmetry();
      setupSequence();
    };

    /**
     * Mouse Parallax & Proximity Event Listener
     */
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / width) - 0.5;
      const normY = (e.clientY / height) - 0.5;

      parallaxRef.current.targetX = normX * 25 * dpr;
      parallaxRef.current.targetY = normY * 25 * dpr;

      mousePosRef.current = { x: e.clientX * dpr, y: e.clientY * dpr };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    /**
     * Periodic Rare Shooting Star Event System
     */
    const shootingStars: Array<{
      x: number;
      y: number;
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      angle: number;
      length: number;
      progress: number;
      alpha: number;
      size: number;
    }> = [];

    let shootingStarTimer: gsap.core.Tween | null = null;

    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;

      const startX = (0.1 + Math.random() * 0.7) * width * dpr;
      const startY = (0.05 + Math.random() * 0.3) * height * dpr;
      const angle = Math.PI * 0.22 + (Math.random() - 0.5) * 0.2;
      const travelDist = (260 + Math.random() * 180) * dpr;
      const targetX = startX + Math.cos(angle) * travelDist;
      const targetY = startY + Math.sin(angle) * travelDist;
      const length = (80 + Math.random() * 70) * dpr;
      const size = (1.2 + Math.random() * 0.8) * dpr;

      const ss = {
        x: startX,
        y: startY,
        startX,
        startY,
        targetX,
        targetY,
        angle,
        length,
        progress: 0,
        alpha: 0,
        size,
      };
      shootingStars.push(ss);

      soundscape.playChime(1150 + Math.random() * 350, 1.4);

      gsap.to(ss, {
        progress: 1,
        duration: 0.9 + Math.random() * 0.4,
        ease: 'power2.in',
        onUpdate: () => {
          ss.x = gsap.utils.interpolate(ss.startX, ss.targetX, ss.progress);
          ss.y = gsap.utils.interpolate(ss.startY, ss.targetY, ss.progress);
          if (ss.progress < 0.2) {
            ss.alpha = ss.progress / 0.2;
          } else if (ss.progress > 0.65) {
            ss.alpha = (1 - ss.progress) / 0.35;
          } else {
            ss.alpha = 1.0;
          }
        },
        onComplete: () => {
          const idx = shootingStars.indexOf(ss);
          if (idx !== -1) shootingStars.splice(idx, 1);
        },
      });

      shootingStarTimer = gsap.delayedCall(16 + Math.random() * 14, spawnShootingStar);
    };

    shootingStarTimer = gsap.delayedCall(7, spawnShootingStar);

    /**
     * ==========================================
     * 60 FPS Render Loop
     * ==========================================
     */
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const timeSec = currentTime * 0.001;

      const px = parallaxRef.current;
      px.x += (px.targetX - px.x) * 0.04;
      px.y += (px.targetY - px.y) * 0.04;

      // 1. Background with subtle, slowly breathing purple nebula atmosphere
      bgCtx.clearRect(0, 0, width * dpr, height * dpr);

      // Organic slow breathing pulse for the galactic space band
      const nebulaBreathe = 0.82 + 0.18 * Math.sin(timeSec * 0.22);
      bgCtx.globalAlpha = nebulaBreathe;
      bgCtx.drawImage(
        bgOffscreen,
        -px.x * 0.3,
        -px.y * 0.3,
        width * dpr + px.x * 0.6,
        height * dpr + px.y * 0.6
      );

      // Single-pass draw of cached purple nebula pattern with breathing global opacity
      const breathePulse = 0.5 + 0.5 * Math.sin(timeSec * 0.28 + 1.2);
      bgCtx.globalAlpha = breathePulse;
      bgCtx.drawImage(
        nebulaOffscreen,
        -px.x * 0.2,
        -px.y * 0.2,
        width * dpr + px.x * 0.4,
        height * dpr + px.y * 0.4
      );
      bgCtx.globalAlpha = 1.0;

      // 2. Trail Canvas Layer (Faint, ephemeral paths fading out over time)
      trailsCtx.clearRect(0, 0, width * dpr, height * dpr);

      const trailShiftX = px.x * 0.75;
      const trailShiftY = px.y * 0.75;

      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.alpha -= tp.decay;

        if (tp.alpha <= 0.001) {
          trailParticles.splice(i, 1);
          continue;
        }

        const tx = tp.x + trailShiftX;
        const ty = tp.y + trailShiftY;

        const grad = trailsCtx.createRadialGradient(tx, ty, 0, tx, ty, tp.radius * 2.4);
        grad.addColorStop(0, `${tp.color}${tp.alpha.toFixed(2)})`);
        grad.addColorStop(0.45, `${tp.color}${(tp.alpha * 0.45).toFixed(3)})`);
        grad.addColorStop(1, `${tp.color}0)`);

        trailsCtx.fillStyle = grad;
        trailsCtx.beginPath();
        trailsCtx.arc(tx, ty, tp.radius * 2.4, 0, Math.PI * 2);
        trailsCtx.fill();
      }

      // 3. Stars
      starsCtx.clearRect(0, 0, width * dpr, height * dpr);

      const starShiftX = px.x * 0.75;
      const starShiftY = px.y * 0.75;

      const shiftX = (starShiftX / dpr).toFixed(2);
      const shiftY = (starShiftY / dpr).toFixed(2);
      if (scorpioGroupRef.current) {
        scorpioGroupRef.current.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0px)`;
      }
      if (tasneemGroupRef.current) {
        const tasneemShiftY = ((starShiftY + tasneemAscentYRef.current) / dpr).toFixed(2);
        tasneemGroupRef.current.style.transform = `translate3d(${shiftX}px, ${tasneemShiftY}px, 0px)`;
      }

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (star.alpha <= 0.001) continue;

        // Use GSAP-animated randomized twinkle values for organic multi-layered depth
        let alpha = star.twinkleAlpha ?? star.alpha;
        const scale = star.twinkleScale ?? 1.0;

        const isHighlighted = (star.constellationHighlight ?? 0) > 0 || star.isCenterStar;
        const hVal = star.constellationHighlight ?? 0;

        if (star.isCenterStar) {
          alpha = 1.0;
        } else if (isHighlighted) {
          alpha = Math.min(1.0, alpha + 0.35 * hVal);
        } else {
          alpha = Math.max(0.01, Math.min(1.0, alpha));
        }

        const sx = star.x + starShiftX * star.z;
        const sy = star.y + starShiftY * star.z;

        // Interactive mouse proximity response: brighten and pulse nearby stars
        let mouseBoostAlpha = 0;
        let mouseBoostScale = 1.0;
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;
        if (mx >= 0) {
          const mdx = sx - mx;
          const mdy = sy - my;
          const distSq = mdx * mdx + mdy * mdy;
          const proxRadius = 140 * dpr;
          if (distSq < proxRadius * proxRadius) {
            const dist = Math.sqrt(distSq);
            const proxFactor = 1 - dist / proxRadius;
            const pulse = 0.85 + 0.35 * Math.sin(timeSec * 4.2 + star.twinklePhase);
            mouseBoostAlpha = proxFactor * 0.45 * pulse;
            mouseBoostScale = 1.0 + proxFactor * 0.38 * pulse;
          }
        }

        alpha = Math.min(1.0, alpha + mouseBoostAlpha);

        starsCtx.fillStyle = isHighlighted ? '#FFF8E1' : star.color;
        starsCtx.globalAlpha = alpha;

        starsCtx.beginPath();
        const drawSize = isHighlighted
          ? star.size * (1 + 0.35 * hVal) * scale * mouseBoostScale
          : star.size * scale * mouseBoostScale;
        starsCtx.arc(sx, sy, Math.max(0.2, drawSize * 0.5), 0, Math.PI * 2);
        starsCtx.fill();

        // Soft halo glow around stars near cursor
        if (mouseBoostAlpha > 0.08) {
          const hoverGlow = starsCtx.createRadialGradient(sx, sy, 0, sx, sy, drawSize * 3.2);
          hoverGlow.addColorStop(0, `rgba(255, 248, 215, ${(mouseBoostAlpha * 0.5).toFixed(3)})`);
          hoverGlow.addColorStop(0.5, `rgba(255, 220, 140, ${(mouseBoostAlpha * 0.22).toFixed(3)})`);
          hoverGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
          starsCtx.fillStyle = hoverGlow;
          starsCtx.beginPath();
          starsCtx.arc(sx, sy, drawSize * 3.2, 0, Math.PI * 2);
          starsCtx.fill();
        }

        if (isHighlighted) {
          drawRealisticDiffractionStar(
            starsCtx,
            sx,
            sy,
            drawSize,
            alpha,
            hVal,
            true,
            dpr,
            timeSec,
            star.twinklePhase
          );
        } else if (star.hasSpikes && alpha > 0.1) {
          drawRealisticDiffractionStar(
            starsCtx,
            sx,
            sy,
            drawSize,
            alpha,
            0,
            false,
            dpr,
            timeSec,
            star.twinklePhase
          );
        }
      }

      // Render active shooting stars across the canvas
      for (let i = 0; i < shootingStars.length; i++) {
        const ss = shootingStars[i];
        if (ss.alpha <= 0.01) continue;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length * Math.min(1, ss.progress * 1.8);
        const tailY = ss.y - Math.sin(ss.angle) * ss.length * Math.min(1, ss.progress * 1.8);

        const grad = starsCtx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 250, 235, ${ss.alpha})`);
        grad.addColorStop(0.35, `rgba(255, 215, 130, ${(ss.alpha * 0.65).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(255, 190, 80, 0)');

        starsCtx.save();
        starsCtx.beginPath();
        starsCtx.moveTo(ss.x, ss.y);
        starsCtx.lineTo(tailX, tailY);
        starsCtx.strokeStyle = grad;
        starsCtx.lineWidth = ss.size;
        starsCtx.lineCap = 'round';
        starsCtx.stroke();

        starsCtx.beginPath();
        starsCtx.arc(ss.x, ss.y, ss.size * 1.4, 0, Math.PI * 2);
        starsCtx.fillStyle = `rgba(255, 255, 255, ${ss.alpha})`;
        starsCtx.fill();
        starsCtx.restore();
      }

      // 3. Particles
      particlesCtx.clearRect(0, 0, width * dpr, height * dpr);

      const partShiftX = px.x * 1.2;
      const partShiftY = px.y * 1.2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.alpha <= 0.001) continue;

        p.x += p.vx + Math.sin(timeSec + p.pulsePhase) * 0.1 * dpr;
        p.y += p.vy;

        const pPulse = Math.sin(timeSec * p.pulseSpeed + p.pulsePhase);
        const pAlpha = Math.max(0.02, p.alpha + pPulse * 0.15 * p.alpha);

        if (p.y < -10) p.y = height * dpr + 10;
        if (p.x < -10) p.x = width * dpr + 10;
        if (p.x > width * dpr + 10) p.x = -10;

        const pxPos = p.x + partShiftX * p.z;
        const pyPos = p.y + partShiftY * p.z;

        const pGrad = particlesCtx.createRadialGradient(pxPos, pyPos, 0, pxPos, pyPos, p.radius * 2);
        pGrad.addColorStop(0, `${p.color}${pAlpha.toFixed(2)})`);
        pGrad.addColorStop(0.5, `${p.color}${(pAlpha * 0.4).toFixed(3)})`);
        pGrad.addColorStop(1, `${p.color}0)`);

        particlesCtx.fillStyle = pGrad;
        particlesCtx.beginPath();
        particlesCtx.arc(pxPos, pyPos, p.radius * 2, 0, Math.PI * 2);
        particlesCtx.fill();
      }
    };

    // Initialize layout & launch loop
    resizeCanvases();
    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener('resize', resizeCanvases);

    // Subtle background camera zoom tween
    if (sceneContainerRef.current) {
      cameraZoomTween = gsap.to(sceneContainerRef.current, {
        scale: 1.04,
        duration: 40,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        force3D: true,
      });
    }

    // Cleanup logic
    return () => {
      window.removeEventListener('resize', resizeCanvases);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);

      if (shootingStarTimer) shootingStarTimer.kill();
      if (cameraZoomTween) cameraZoomTween.kill();
      if (mainSequenceTimeline) mainSequenceTimeline.kill();
      stars.forEach((s) => gsap.killTweensOf(s));

      if (eyebrowSplitInstance) eyebrowSplitInstance.revert();
      if (quoteSplitInstance) quoteSplitInstance.revert();
      if (subtitleSplitInstance) subtitleSplitInstance.revert();

      gsap.killTweensOf(sceneContainerRef.current);
    };
  }, []);

  const handleReplay = () => {
    if (triggerSequenceRef.current) {
      triggerSequenceRef.current();
    }
  };

  return (
    <div
      ref={sceneContainerRef}
      className="relative w-full h-full overflow-hidden bg-[#02040a] gpu-layer select-none cursor-default"
      style={{ transformOrigin: 'center center' }}
    >
      {/* 1. Background Layer */}
      <canvas
        id="background-layer"
        ref={backgroundCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 gpu-layer"
      />

      {/* 2. Star Trails Canvas Layer */}
      <canvas
        id="trails-layer"
        ref={trailsCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[5] gpu-layer"
      />

      {/* 3. Stars Layer */}
      <canvas
        id="stars-layer"
        ref={starsCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 gpu-layer"
      />

      {/* 3. SVG Layer for Scorpio and TASNEEM Constellation Stroke Animations */}
      <svg
        id="constellation-layer"
        ref={constellationSvgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bloom-filter" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="gold-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8D6" stopOpacity="1" />
            <stop offset="50%" stopColor="#F5D061" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E6B830" stopOpacity="0.95" />
          </linearGradient>

          <radialGradient id="particle-gold-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFD700" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#F5D061" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F5D061" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g id="scorpio-group" ref={scorpioGroupRef} className="gpu-layer" />
        <g id="tasneem-group" ref={tasneemGroupRef} className="gpu-layer" />
      </svg>

      {/* 4. Glow Layer & Floating Dust Particles */}
      <div id="glow-layer" className="absolute inset-0 pointer-events-none z-30">
        <canvas
          ref={particlesCanvasRef}
          className="absolute inset-0 w-full h-full gpu-layer"
        />
        <div className="absolute inset-0 ambient-glow pointer-events-none" />
        <div className="absolute inset-0 vignette-overlay pointer-events-none" />
      </div>

      {/* 5. Interactive UI Controls: Ambient Sound Control */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3 pointer-events-auto">
        <button
          onClick={handleToggleSound}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/70 hover:bg-slate-800/80 active:scale-95 transition-all backdrop-blur-md border border-amber-400/30 text-amber-100 text-xs font-sans-cinematic tracking-wider cursor-pointer shadow-xl group"
          title={isMuted ? "Unmute Ambient Soundscape" : "Mute Soundscape"}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 transition-colors" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
          )}
          <span className="hidden sm:inline">{isMuted ? "Sound Off" : "Ambient Sound"}</span>
        </button>
      </div>

      {/* 6. Narrative Scene Overlay Text Layer with Soft Celestial Glow */}
      <div
        id="text-layer"
        className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
      >
        {/* Scene 1 Text */}
        <div
          ref={scene1TextRef}
          className="absolute max-w-2xl px-6 opacity-0 select-none text-center"
        >
          <h2 className="font-serif-cinematic text-2xl sm:text-4xl md:text-5xl text-amber-100 font-normal tracking-wide drop-shadow-[0_0_25px_rgba(255,220,130,0.5)] [text-shadow:_0_0_15px_rgba(255,230,160,0.6),_0_0_35px_rgba(255,190,80,0.35)]">
            "Every star deserves light."
          </h2>
        </div>

        {/* Scene 2 Text */}
        <div
          ref={scene2TextRef}
          className="absolute max-w-2xl sm:max-w-3xl px-6 opacity-0 select-none text-center"
        >
          <h2 className="font-serif-cinematic text-xl sm:text-3xl md:text-4xl text-amber-100/95 font-light tracking-wide italic leading-relaxed drop-shadow-[0_0_25px_rgba(255,220,130,0.5)] [text-shadow:_0_0_15px_rgba(255,230,160,0.6),_0_0_35px_rgba(255,190,80,0.35)]">
            "But not every star becomes part of the constellation you remember."
          </h2>
        </div>

        {/* Final Message & Tasneem Block */}
        <div
          ref={finalTextBlockRef}
          className="absolute inset-x-0 bottom-6 sm:bottom-10 max-w-3xl mx-auto px-6 flex flex-col items-center gap-4 opacity-0 select-none text-center"
        >
          {/* Heartfelt Apology Message with Deep Space Soft Blur Vignette Backdrop */}
          <div
            ref={finalMessageRef}
            className="space-y-3 max-w-2xl mx-auto mb-1 p-6 rounded-3xl bg-slate-950/40 backdrop-blur-md border border-amber-400/10 shadow-[0_0_40px_rgba(10,14,26,0.8)]"
          >
            <p className="font-serif-cinematic text-sm sm:text-base md:text-lg text-slate-100 font-light leading-relaxed tracking-wide [text-shadow:_0_0_12px_rgba(255,255,255,0.3)]">
              I wanted to clarify something because that's the last thing I wanted you to think of me.
            </p>
            <p className="font-serif-cinematic text-sm sm:text-base md:text-lg text-slate-100 font-light leading-relaxed tracking-wide [text-shadow:_0_0_12px_rgba(255,255,255,0.3)]">
              When I said I like helping people, I never meant that you're just an ordinary person to me, or that your presence is like anyone else's. Perhaps my words failed me, but my intentions certainly weren't.
            </p>
            <p className="font-serif-cinematic text-sm sm:text-base md:text-lg text-slate-100 font-light leading-relaxed tracking-wide [text-shadow:_0_0_12px_rgba(255,255,255,0.3)]">
              The truth is, we meet many people in life, but very few leave a positive impression and deserve appreciation and respect. You're one of those people I deeply respect, whose character and hard work I value, and whose success I rejoice in. Therefore, what I did stemmed from my appreciation for you, not from mere habit.
            </p>
            <p className="font-serif-cinematic text-sm sm:text-base md:text-lg text-slate-100 font-light leading-relaxed tracking-wide [text-shadow:_0_0_12px_rgba(255,255,255,0.3)]">
              If you were just anyone to me, I wouldn't have paid attention to the details, nor would I have put in the same effort and taken the same pleasure.
            </p>
            <p className="font-serif-cinematic text-sm sm:text-base md:text-lg text-amber-200 font-normal leading-relaxed tracking-wide italic [text-shadow:_0_0_15px_rgba(255,220,130,0.5)]">
              So, if my words upset you or made you feel that your place in my heart is less than you deserve, I sincerely apologize. Sometimes words can't express what's in the heart, but actions speak louder than words. I ask God to perpetuate respect between us, and to grant you all goodness and success.
            </p>
          </div>

          <div className="w-28 h-[1px] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent my-1" />

          {/* Tasneem Header */}
          <h1
            ref={finalTitleRef}
            className="font-serif-cinematic text-3xl sm:text-5xl md:text-6xl text-amber-100 font-normal tracking-widest drop-shadow-[0_0_35px_rgba(255,225,140,0.6)] [text-shadow:_0_0_20px_rgba(255,230,160,0.7),_0_0_45px_rgba(255,190,80,0.4)]"
          >
            Tasneem
          </h1>
        </div>
      </div>
    </div>
  );
};

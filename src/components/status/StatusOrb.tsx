'use client';

import { useEffect, useRef, useState } from 'react';

interface StatusOrbProps {
  state?: 'idle' | 'active' | 'alert' | 'thinking';
}

// Orion constellation star positions (normalized -1 to 1)
// The Hunter: Betelgeuse, Bellatrix, Belt (Alnitak, Alnilam, Mintaka), Saiph, Rigel
const ORION_STARS = [
  { x: -0.35, y: -0.65, size: 2.8, name: 'Betelgeuse', hue: 15 },   // red supergiant
  { x:  0.30, y: -0.60, size: 2.2, name: 'Bellatrix', hue: 220 },
  { x: -0.12, y: -0.05, size: 2.0, name: 'Alnitak', hue: 220 },     // belt
  { x:  0.00, y: -0.08, size: 2.2, name: 'Alnilam', hue: 220 },     // belt center
  { x:  0.12, y: -0.11, size: 2.0, name: 'Mintaka', hue: 220 },     // belt
  { x: -0.35, y:  0.55, size: 2.0, name: 'Saiph', hue: 220 },
  { x:  0.35, y:  0.60, size: 2.8, name: 'Rigel', hue: 210 },       // blue supergiant
];

// Constellation lines (indices into ORION_STARS)
const ORION_LINES = [
  [0, 1],    // shoulders
  [0, 2],    // left shoulder to belt
  [1, 4],    // right shoulder to belt
  [2, 3],    // belt
  [3, 4],    // belt
  [2, 5],    // belt to left foot
  [4, 6],    // belt to right foot
];

export function StatusOrb({ state = 'idle' }: StatusOrbProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const bgStarsRef = useRef<Array<{ x: number; y: number; size: number; speed: number; phase: number }>>([]);

  useEffect(() => {
    setMounted(true);
    // Generate background star field once
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 2 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    bgStarsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;

    const getConfig = () => {
      switch (state) {
        case 'idle':
          return {
            baseRadius: 34,
            blobAmp: 2.5,
            blobSpeed: 0.3,
            pulseAmp: 2,
            pulseSpeed: 0.6,
            nebulaColor1: [88, 28, 135],   // deep purple
            nebulaColor2: [30, 27, 75],     // dark indigo
            nebulaColor3: [59, 7, 100],     // violet
            glowAlpha: 0.2,
            starBrightness: 0.6,
            constellationAlpha: 0.3,
            particleCount: 0,
          };
        case 'thinking':
          return {
            baseRadius: 44,
            blobAmp: 4,
            blobSpeed: 0.9,
            pulseAmp: 2.5,
            pulseSpeed: 1.2,
            nebulaColor1: [30, 27, 120],    // deep blue
            nebulaColor2: [67, 56, 202],    // indigo
            nebulaColor3: [109, 40, 217],   // violet
            glowAlpha: 0.3,
            starBrightness: 0.8,
            constellationAlpha: 0.5,
            particleCount: 0,
          };
        case 'active':
          return {
            baseRadius: 50,
            blobAmp: 7,
            blobSpeed: 1.6,
            pulseAmp: 4,
            pulseSpeed: 2.0,
            nebulaColor1: [6, 78, 59],      // deep emerald
            nebulaColor2: [13, 148, 136],   // teal
            nebulaColor3: [16, 185, 129],   // emerald bright
            glowAlpha: 0.35,
            starBrightness: 1.0,
            constellationAlpha: 0.7,
            particleCount: 8,
          };
        case 'alert':
          return {
            baseRadius: 48,
            blobAmp: 5,
            blobSpeed: 2.5,
            pulseAmp: 4,
            pulseSpeed: 3.5,
            nebulaColor1: [127, 29, 29],    // deep red
            nebulaColor2: [185, 28, 28],    // red
            nebulaColor3: [234, 88, 12],    // orange
            glowAlpha: 0.45,
            starBrightness: 1.0,
            constellationAlpha: 0.8,
            particleCount: 0,
          };
      }
    };

    let t = 0;
    const draw = () => {
      const cfg = getConfig();
      t += 0.016;
      ctx.clearRect(0, 0, size, size);

      const pulse = Math.sin(t * cfg.pulseSpeed);
      const blobR = cfg.baseRadius + pulse * cfg.pulseAmp;

      // ===== OUTER NEBULA GLOW =====
      const glowPulse = 1 + pulse * 0.12;
      const nebulaGlow = ctx.createRadialGradient(cx, cy, blobR * 0.5, cx, cy, blobR * 2.2 * glowPulse);
      const [r1, g1, b1] = cfg.nebulaColor3;
      nebulaGlow.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${cfg.glowAlpha})`);
      nebulaGlow.addColorStop(0.5, `rgba(${r1}, ${g1}, ${b1}, ${cfg.glowAlpha * 0.3})`);
      nebulaGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGlow;
      ctx.fillRect(0, 0, size, size);

      // ===== ALERT: EXPANDING SHOCKWAVES =====
      if (state === 'alert') {
        for (let w = 0; w < 2; w++) {
          const phase = ((t * 1.2) + w * 1.0) % 2.5;
          if (phase < 2.0) {
            const ringR = blobR + phase * 20;
            const alpha = Math.max(0, 0.35 - phase * 0.18);
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // ===== BLOB BODY (NEBULA) =====
      ctx.save();
      ctx.translate(cx, cy);

      // Alert shake
      if (state === 'alert') {
        const shakeEnv = Math.max(0, Math.sin(t * 3.5));
        ctx.translate(Math.sin(t * 22) * 1.8 * shakeEnv, Math.cos(t * 18) * 0.8 * shakeEnv);
      }

      // Build blob path
      ctx.beginPath();
      const segments = 80;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const n =
          Math.sin(angle * 2 + t * cfg.blobSpeed) * cfg.blobAmp * 0.35 +
          Math.sin(angle * 3 - t * cfg.blobSpeed * 1.4) * cfg.blobAmp * 0.35 +
          Math.sin(angle * 5 + t * cfg.blobSpeed * 0.8) * cfg.blobAmp * 0.2 +
          Math.sin(angle * 7 - t * cfg.blobSpeed * 0.5) * cfg.blobAmp * 0.1;
        const r = blobR + n;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Clip to blob shape for everything inside
      ctx.save();
      ctx.clip();

      // Nebula gradient fill
      const [nr1, ng1, nb1] = cfg.nebulaColor1;
      const [nr2, ng2, nb2] = cfg.nebulaColor2;
      const [nr3, ng3, nb3] = cfg.nebulaColor3;
      const nebGrad = ctx.createRadialGradient(-10, -10, 0, 0, 0, blobR + cfg.blobAmp);
      nebGrad.addColorStop(0, `rgb(${nr3}, ${ng3}, ${nb3})`);
      nebGrad.addColorStop(0.4, `rgb(${nr2}, ${ng2}, ${nb2})`);
      nebGrad.addColorStop(1, `rgb(${nr1}, ${ng1}, ${nb1})`);
      ctx.fillStyle = nebGrad;
      ctx.fill();

      // Nebula swirls — translucent drifting color patches
      for (let s = 0; s < 3; s++) {
        const sAngle = t * 0.15 + s * 2.1;
        const sx = Math.cos(sAngle) * blobR * 0.35;
        const sy = Math.sin(sAngle) * blobR * 0.3;
        const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, blobR * 0.5);
        sGrad.addColorStop(0, `rgba(${nr3 + 30}, ${ng3 + 30}, ${nb3 + 30}, 0.2)`);
        sGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sGrad;
        ctx.fillRect(-blobR - 10, -blobR - 10, (blobR + 10) * 2, (blobR + 10) * 2);
      }

      // ===== BACKGROUND STARS inside blob =====
      const bgStars = bgStarsRef.current;
      for (const star of bgStars) {
        const sx = (star.x - 0.5) * blobR * 2;
        const sy = (star.y - 0.5) * blobR * 2;
        const twinkle = (Math.sin(t * star.speed + star.phase) + 1) / 2;
        const alpha = (0.2 + twinkle * 0.5) * cfg.starBrightness;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      // ===== ORION CONSTELLATION =====
      const conScale = blobR * 0.55;
      const conAlpha = cfg.constellationAlpha;

      // Thinking: slow rotation
      if (state === 'thinking') {
        ctx.rotate(Math.sin(t * 0.3) * 0.08);
      }

      // Draw constellation lines
      ctx.strokeStyle = `rgba(200, 200, 255, ${conAlpha * 0.4})`;
      ctx.lineWidth = 0.8;
      for (const [a, b] of ORION_LINES) {
        const sa = ORION_STARS[a];
        const sb = ORION_STARS[b];
        ctx.beginPath();
        ctx.moveTo(sa.x * conScale, sa.y * conScale);
        ctx.lineTo(sb.x * conScale, sb.y * conScale);
        ctx.stroke();
      }

      // Draw constellation stars
      for (let i = 0; i < ORION_STARS.length; i++) {
        const star = ORION_STARS[i];
        const sx = star.x * conScale;
        const sy = star.y * conScale;
        const twinkle = 0.7 + Math.sin(t * 1.5 + i * 1.1) * 0.3;
        const sz = star.size * twinkle * (state === 'active' ? 1.2 : 1.0);

        // Star glow
        const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 3);
        if (star.hue < 100) {
          // Betelgeuse: reddish
          starGlow.addColorStop(0, `rgba(255, 180, 120, ${conAlpha * 0.6 * twinkle})`);
        } else {
          starGlow.addColorStop(0, `rgba(180, 200, 255, ${conAlpha * 0.5 * twinkle})`);
        }
        starGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, sz * 3, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        if (star.hue < 100) {
          ctx.fillStyle = `rgba(255, 200, 150, ${conAlpha * twinkle})`;
        } else {
          ctx.fillStyle = `rgba(220, 230, 255, ${conAlpha * twinkle})`;
        }
        ctx.fill();
      }

      // ===== ACTIVE: cosmic energy particles drifting outward =====
      if (state === 'active' && cfg.particleCount > 0) {
        for (let i = 0; i < cfg.particleCount; i++) {
          const seed = i * 137.508;
          const pPhase = (t * 0.4 + seed) % (Math.PI * 2);
          const pR = 8 + (pPhase / (Math.PI * 2)) * (blobR - 10);
          const pAngle = seed + t * 0.3;
          const px = Math.cos(pAngle) * pR;
          const py = Math.sin(pAngle) * pR;
          const pAlpha = 0.3 + Math.sin(pPhase) * 0.3;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 243, 208, ${pAlpha})`;
          ctx.fill();
        }
      }

      // Inner highlight (top-left specular)
      const innerHL = ctx.createRadialGradient(-blobR * 0.25, -blobR * 0.35, 0, 0, 0, blobR * 0.7);
      innerHL.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      innerHL.addColorStop(1, 'transparent');
      ctx.fillStyle = innerHL;
      ctx.fillRect(-blobR - 10, -blobR - 10, (blobR + 10) * 2, (blobR + 10) * 2);

      ctx.restore(); // unclip

      // ===== BLOB EDGE — subtle bright rim =====
      // Re-draw path for stroke
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const n =
          Math.sin(angle * 2 + t * cfg.blobSpeed) * cfg.blobAmp * 0.35 +
          Math.sin(angle * 3 - t * cfg.blobSpeed * 1.4) * cfg.blobAmp * 0.35 +
          Math.sin(angle * 5 + t * cfg.blobSpeed * 0.8) * cfg.blobAmp * 0.2 +
          Math.sin(angle * 7 - t * cfg.blobSpeed * 0.5) * cfg.blobAmp * 0.1;
        const r = blobR + n;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${nr3 + 60}, ${ng3 + 60}, ${nb3 + 60}, 0.25)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore(); // untranslate

      // ===== THINKING: orbiting thought particles =====
      if (state === 'thinking') {
        for (let i = 0; i < 5; i++) {
          const orbitR = blobR + 8 + i * 2;
          const orbitAngle = t * (1.0 + i * 0.15) + (i * Math.PI * 2) / 5;
          const px = cx + Math.cos(orbitAngle) * orbitR;
          const py = cy + Math.sin(orbitAngle) * orbitR;
          const pAlpha = 0.5 + Math.sin(t * 2 + i) * 0.3;

          // Particle glow
          const pGlow = ctx.createRadialGradient(px, py, 0, px, py, 4);
          pGlow.addColorStop(0, `rgba(167, 139, 250, ${pAlpha})`);
          pGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = pGlow;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(221, 214, 254, ${pAlpha})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  const label = state === 'active' ? 'working' : state;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          role="status"
          aria-label={`Status: ${label}`}
        />
      </div>
      <span className="text-sm text-text-muted uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

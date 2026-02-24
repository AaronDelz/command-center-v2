'use client';

import { useEffect, useRef, useState } from 'react';

interface StatusOrbProps {
  state?: 'idle' | 'active' | 'alert' | 'thinking';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'flame' | 'ember' | 'spark';
}

const STATE_PALETTES = {
  idle: {
    core: [255, 107, 53],
    mid: [180, 60, 20],
    outer: [80, 25, 8],
    spark: [255, 160, 80],
    label: 'smoldering',
    labelColor: 'rgba(255,107,53,0.5)',
  },
  thinking: {
    core: [255, 170, 50],
    mid: [255, 107, 53],
    outer: [160, 50, 15],
    spark: [255, 200, 100],
    label: 'thinking',
    labelColor: 'rgba(255,170,50,0.8)',
  },
  active: {
    core: [255, 230, 120],
    mid: [255, 160, 40],
    outer: [255, 80, 20],
    spark: [255, 240, 180],
    label: 'working',
    labelColor: 'rgba(255,200,80,0.9)',
  },
  alert: {
    core: [255, 255, 220],
    mid: [255, 60, 30],
    outer: [200, 20, 10],
    spark: [255, 100, 50],
    label: 'alert',
    labelColor: 'rgba(255,80,40,1)',
  },
};

const STATE_CONFIGS = {
  idle: {
    flameHeight: 0.3,
    flameWidth: 0.4,
    particleRate: 0.2,
    sparkRate: 0,
    emberRate: 0.3,
    flickerSpeed: 0.8,
    flickerAmp: 0.08,
    glowAlpha: 0.12,
    baseEmberCount: 3,
    turbulence: 0.3,
  },
  thinking: {
    flameHeight: 0.5,
    flameWidth: 0.45,
    particleRate: 0.6,
    sparkRate: 0.08,
    emberRate: 0.25,
    flickerSpeed: 1.8,
    flickerAmp: 0.12,
    glowAlpha: 0.2,
    baseEmberCount: 4,
    turbulence: 0.6,
  },
  active: {
    flameHeight: 0.7,
    flameWidth: 0.5,
    particleRate: 0.9,
    sparkRate: 0.35,
    emberRate: 0.15,
    flickerSpeed: 2.5,
    flickerAmp: 0.15,
    glowAlpha: 0.3,
    baseEmberCount: 6,
    turbulence: 0.9,
  },
  alert: {
    flameHeight: 0.65,
    flameWidth: 0.55,
    particleRate: 1.0,
    sparkRate: 0.5,
    emberRate: 0.1,
    flickerSpeed: 4.0,
    flickerAmp: 0.2,
    glowAlpha: 0.4,
    baseEmberCount: 5,
    turbulence: 1.2,
  },
};

// Canvas dimensions — compact for sidebar
const W = 120;
const H = 100;
const BASE_Y = H * 0.88; // flame base near bottom
const CX = W / 2;

export function StatusOrb({ state = 'idle' }: StatusOrbProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [mounted, setMounted] = useState(false);
  const currentConfigRef = useRef({ ...STATE_CONFIGS.idle });
  const currentPaletteRef = useRef({
    core: [...STATE_PALETTES.idle.core],
    mid: [...STATE_PALETTES.idle.mid],
    outer: [...STATE_PALETTES.idle.outer],
    spark: [...STATE_PALETTES.idle.spark],
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = W;
    canvas.height = H;
    const particles = particlesRef.current;

    let t = 0;
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    const lerpArr = (a: number[], b: number[], f: number) => a.map((v, i) => lerp(v, b[i], f));

    const draw = () => {
      const targetCfg = STATE_CONFIGS[state];
      const targetPal = STATE_PALETTES[state];
      const cfg = currentConfigRef.current;
      const pal = currentPaletteRef.current;
      const s = 0.04;

      for (const key of Object.keys(targetCfg) as (keyof typeof targetCfg)[]) {
        (cfg as Record<string, number>)[key] = lerp((cfg as Record<string, number>)[key], targetCfg[key], s);
      }
      pal.core = lerpArr(pal.core, targetPal.core, s) as number[];
      pal.mid = lerpArr(pal.mid, targetPal.mid, s) as number[];
      pal.outer = lerpArr(pal.outer, targetPal.outer, s) as number[];
      pal.spark = lerpArr(pal.spark, targetPal.spark, s) as number[];

      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Ambient ground glow
      const glow = ctx.createRadialGradient(CX, BASE_Y, 0, CX, BASE_Y, W * 0.5);
      glow.addColorStop(0, `rgba(${pal.mid[0]}, ${pal.mid[1]}, ${pal.mid[2]}, ${cfg.glowAlpha})`);
      glow.addColorStop(0.6, `rgba(${pal.mid[0]}, ${pal.mid[1]}, ${pal.mid[2]}, ${cfg.glowAlpha * 0.2})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Alert pulse ring
      if (state === 'alert') {
        const phase = (t * 2.0) % 2.5;
        if (phase < 2.0) {
          const r = 12 + phase * 25;
          const a = Math.max(0, 0.35 - phase * 0.18);
          ctx.beginPath();
          ctx.arc(CX, BASE_Y - 20, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 60, 30, ${a})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Ember bed
      for (let i = 0; i < cfg.baseEmberCount; i++) {
        const angle = (i / cfg.baseEmberCount) * Math.PI;
        const spread = 12 + Math.sin(t * 0.5 + i * 1.7) * 4;
        const ex = CX + Math.cos(angle) * spread - spread / 2;
        const ey = BASE_Y + Math.sin(t * 0.3 + i * 2.1) * 2 - 1;
        const pulse = 0.5 + Math.sin(t * cfg.flickerSpeed * 0.5 + i * 1.3) * 0.3;
        const eSize = 2 + pulse * 2;
        const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, eSize);
        eg.addColorStop(0, `rgba(${pal.core[0]}, ${pal.core[1]}, ${pal.core[2]}, ${0.6 * pulse})`);
        eg.addColorStop(0.5, `rgba(${pal.mid[0]}, ${pal.mid[1]}, ${pal.mid[2]}, ${0.3 * pulse})`);
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(ex, ey, eSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flame body
      const flameH = H * cfg.flameHeight;
      const flameW = W * cfg.flameWidth * 0.35;
      const layers = [
        { wMul: 1.3, aMul: 0.3, col: pal.outer, yo: 3 },
        { wMul: 1.0, aMul: 0.5, col: pal.mid, yo: 0 },
        { wMul: 0.55, aMul: 0.8, col: pal.core, yo: -3 },
      ];

      for (const l of layers) {
        ctx.save();
        ctx.translate(CX, BASE_Y + l.yo);
        ctx.beginPath();
        const seg = 36;
        const lw = flameW * l.wMul;
        for (let i = 0; i <= seg; i++) {
          const p = i / seg;
          let x: number, y: number;
          if (p <= 0.5) {
            const up = p * 2;
            const w = lw * (1 - up * 0.75);
            const h = flameH * up;
            const turb =
              Math.sin(t * cfg.flickerSpeed + up * 4) * cfg.flickerAmp * w +
              Math.sin(t * cfg.flickerSpeed * 1.7 + up * 6) * cfg.flickerAmp * 0.5 * w +
              Math.sin(t * cfg.flickerSpeed * 0.4 + up * 2) * cfg.turbulence * 2;
            x = -w + turb;
            y = -h;
          } else {
            const up = (1 - p) * 2;
            const w = lw * (1 - up * 0.75);
            const h = flameH * up;
            const turb =
              Math.sin(t * cfg.flickerSpeed + up * 4 + 2) * cfg.flickerAmp * w +
              Math.sin(t * cfg.flickerSpeed * 1.7 + up * 6 + 2) * cfg.flickerAmp * 0.5 * w +
              Math.sin(t * cfg.flickerSpeed * 0.4 + up * 2 + 1) * cfg.turbulence * 2;
            x = w + turb;
            y = -h;
          }
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const fg = ctx.createLinearGradient(0, 0, 0, -flameH);
        fg.addColorStop(0, `rgba(${l.col[0]}, ${l.col[1]}, ${l.col[2]}, ${l.aMul})`);
        fg.addColorStop(0.4, `rgba(${l.col[0]}, ${l.col[1]}, ${l.col[2]}, ${l.aMul * 0.7})`);
        fg.addColorStop(0.85, `rgba(${l.col[0]}, ${l.col[1]}, ${l.col[2]}, ${l.aMul * 0.2})`);
        fg.addColorStop(1, `rgba(${l.col[0]}, ${l.col[1]}, ${l.col[2]}, 0)`);
        ctx.fillStyle = fg;
        ctx.fill();
        ctx.restore();
      }

      // Hot core glow
      const cg = ctx.createRadialGradient(CX, BASE_Y - flameH * 0.12, 0, CX, BASE_Y - flameH * 0.12, flameW * 0.5);
      const cp = 0.25 + Math.sin(t * cfg.flickerSpeed * 0.8) * 0.12;
      cg.addColorStop(0, `rgba(${pal.core[0]}, ${pal.core[1]}, ${pal.core[2]}, ${cp})`);
      cg.addColorStop(0.6, `rgba(${pal.core[0]}, ${pal.core[1]}, ${pal.core[2]}, ${cp * 0.2})`);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);

      // Particles
      if (Math.random() < cfg.particleRate) {
        particles.push({
          x: CX + (Math.random() - 0.5) * flameW,
          y: BASE_Y - Math.random() * flameH * 0.4,
          vx: (Math.random() - 0.5) * cfg.turbulence,
          vy: -(0.8 + Math.random() * 1.5),
          life: 1, maxLife: 0.4 + Math.random() * 0.6,
          size: 0.8 + Math.random() * 1.5, type: 'flame',
        });
      }
      if (Math.random() < cfg.sparkRate) {
        particles.push({
          x: CX + (Math.random() - 0.5) * flameW * 0.6,
          y: BASE_Y - flameH * (0.2 + Math.random() * 0.4),
          vx: (Math.random() - 0.5) * 2.5,
          vy: -(1.5 + Math.random() * 2.5),
          life: 1, maxLife: 0.3 + Math.random() * 0.4,
          size: 0.4 + Math.random() * 1, type: 'spark',
        });
      }
      if (Math.random() < cfg.emberRate) {
        particles.push({
          x: CX + (Math.random() - 0.5) * 20,
          y: BASE_Y - Math.random() * 6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.2 + Math.random() * 0.6),
          life: 1, maxLife: 0.8 + Math.random() * 1.2,
          size: 0.8 + Math.random() * 1.5, type: 'ember',
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.016 / p.maxLife;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.vx += (Math.random() - 0.5) * 0.15 * cfg.turbulence;
        p.x += p.vx;
        p.y += p.vy;
        const alpha = p.life * (p.type === 'spark' ? 1 : 0.6);
        const sz = p.size * (p.type === 'spark' ? (0.5 + p.life * 0.5) : 1);

        if (p.type === 'spark') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pal.spark[0]}, ${pal.spark[1]}, ${pal.spark[2]}, ${alpha})`;
          ctx.fill();
        } else if (p.type === 'ember') {
          const eg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 1.5);
          eg.addColorStop(0, `rgba(${pal.core[0]}, ${pal.core[1]}, ${pal.core[2]}, ${alpha * 0.7})`);
          eg.addColorStop(1, 'transparent');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pal.mid[0]}, ${pal.mid[1]}, ${pal.mid[2]}, ${alpha * 0.4})`;
          ctx.fill();
        }
      }
      if (particles.length > 80) particles.splice(0, particles.length - 80);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  const palette = STATE_PALETTES[state];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px', height: '110px', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: `${W}px`,
          height: `${H}px`,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.7s',
          pointerEvents: 'none',
        }}
        role="status"
        aria-label={`Status: ${palette.label}`}
      />
      <span
        style={{
          fontSize: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontWeight: 600,
          color: palette.labelColor,
          transition: 'color 0.5s',
          marginTop: '-4px',
          textShadow: state !== 'idle' ? `0 0 10px ${palette.labelColor}` : 'none',
        }}
      >
        {palette.label}
      </span>
    </div>
  );
}

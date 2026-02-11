'use client';

import { useState, useEffect, useRef } from 'react';

export interface SubAgent {
  id: string;
  task: string;
  status: 'running' | 'complete' | 'error';
  startedAt: string;
}

interface SubAgentOrbsProps {
  agents: SubAgent[];
}

function MiniOrb({ agent, index }: { agent: SubAgent; index: number }): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const prevStatus = useRef(agent.status);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    if (agent.status !== 'running' && prevStatus.current === 'running') {
      setFading(true);
    }
    prevStatus.current = agent.status;
  }, [agent.status]);

  // Mini cosmic blob for running agents
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || agent.status !== 'running') return;
    const ctx = canvas.getContext('2d')!;
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    let t = index * 2.5;

    // Mini star field
    const stars = Array.from({ length: 8 }, () => ({
      x: (Math.random() - 0.5) * 12,
      y: (Math.random() - 0.5) * 12,
      size: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      t += 0.02;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(cx, cy);

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
      glow.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(-16, -16, 32, 32);

      // Mini blob
      ctx.beginPath();
      const segs = 40;
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const n = Math.sin(angle * 3 + t * 1.8) * 1.0 + Math.sin(angle * 5 - t * 1.3) * 0.6;
        const r = 6 + n + Math.sin(t * 1.2) * 0.5;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.save();
      ctx.clip();

      // Nebula fill
      const nebGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 8);
      nebGrad.addColorStop(0, 'rgb(109, 40, 217)');
      nebGrad.addColorStop(0.6, 'rgb(67, 56, 202)');
      nebGrad.addColorStop(1, 'rgb(30, 27, 75)');
      ctx.fillStyle = nebGrad;
      ctx.fill();

      // Stars inside
      for (const star of stars) {
        const twinkle = (Math.sin(t * 1.5 + star.phase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.5})`;
        ctx.fill();
      }

      // Bright core star
      const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
      coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.4 + Math.sin(t * 2) * 0.15})`);
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // unclip
      ctx.restore(); // untranslate

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [agent.status, index]);

  const staticColor = agent.status === 'error'
    ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
    : 'bg-violet-400 shadow-[0_0_8px_#a78bfa]';

  return (
    <div className="relative group">
      <div
        className={`
          transition-all duration-500 ease-out
          ${fading ? 'opacity-0 scale-0' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
        `}
      >
        {agent.status === 'running' ? (
          <canvas ref={canvasRef} className="w-5 h-5" />
        ) : (
          <div className={`w-3 h-3 rounded-full ${staticColor}`} />
        )}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-raised/95 backdrop-blur-sm border border-border rounded text-[10px] text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {agent.task}
      </div>
    </div>
  );
}

export function SubAgentOrbs({ agents }: SubAgentOrbsProps): React.ReactElement | null {
  if (agents.length === 0) return null;

  const runningCount = agents.filter((a) => a.status === 'running').length;

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {agents.map((agent, i) => (
          <MiniOrb key={agent.id} agent={agent} index={i} />
        ))}
      </div>
      {runningCount > 0 && (
        <p className="text-[10px] text-text-muted">
          {runningCount} agent{runningCount !== 1 ? 's' : ''} working
        </p>
      )}
    </div>
  );
}

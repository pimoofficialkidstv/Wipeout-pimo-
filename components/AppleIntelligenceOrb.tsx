import React, { useEffect, useRef } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AppleIntelligenceOrbProps {
  state?: OrbState;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const AppleIntelligenceOrb: React.FC<AppleIntelligenceOrbProps> = ({
  state = 'idle',
  size = 180,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      timeRef.current += state === 'listening' ? 0.08 : state === 'thinking' ? 0.09 : state === 'speaking' ? 0.07 : 0.035;
      const t = timeRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const radius = (size / 2) * 0.94;

      // 1. Draw Outer Dark Orb Base with subtle radial vignette
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      bgGrad.addColorStop(0, '#262422');
      bgGrad.addColorStop(0.65, '#191817');
      bgGrad.addColorStop(1, '#0e0d0d');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Ambient inner glow based on state
      const ambientGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 0.85);
      if (state === 'listening') {
        ambientGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        ambientGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)');
      } else if (state === 'thinking') {
        ambientGrad.addColorStop(0, 'rgba(234, 179, 8, 0.3)');
        ambientGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
      } else if (state === 'speaking') {
        ambientGrad.addColorStop(0, 'rgba(244, 63, 94, 0.3)');
        ambientGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
      } else {
        ambientGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
        ambientGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)');
      }
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fill();

      // State intensity multipliers
      const ampMult = state === 'listening' ? 1.6 : state === 'speaking' ? 1.4 : state === 'thinking' ? 1.2 : 0.85;
      const pulse = 1 + Math.sin(t * 1.5) * (state === 'speaking' ? 0.12 : 0.05);

      // Additive / Screen blending for luminous Apple Intelligence Siri waves
      ctx.globalCompositeOperation = 'screen';

      // Layer 1: Top Radiant Yellow/Gold Wave Ribbon
      ctx.save();
      ctx.beginPath();
      const waveWidth = radius * 1.85;
      const leftX = cx - waveWidth / 2;
      const rightX = cx + waveWidth / 2;

      ctx.moveTo(leftX, cy);
      for (let x = leftX; x <= rightX; x += 3) {
        const progress = (x - leftX) / waveWidth; // 0 to 1
        const envelope = Math.sin(progress * Math.PI); // Window function (0 at ends, 1 in middle)
        const offset = Math.sin(progress * 5 + t * 2.2) * 16 * ampMult * envelope +
                       Math.sin(progress * 8 - t * 1.5) * 8 * ampMult * envelope -
                       (22 * envelope * pulse);
        ctx.lineTo(x, cy + offset);
      }
      for (let x = rightX; x >= leftX; x -= 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.cos(progress * 4 + t * 1.8) * 8 * ampMult * envelope -
                       (6 * envelope * pulse);
        ctx.lineTo(x, cy + offset);
      }
      ctx.closePath();

      const yellowGrad = ctx.createLinearGradient(leftX, cy - 30, rightX, cy + 20);
      yellowGrad.addColorStop(0, 'rgba(255, 170, 0, 0)');
      yellowGrad.addColorStop(0.25, 'rgba(255, 204, 0, 0.85)');
      yellowGrad.addColorStop(0.5, 'rgba(255, 238, 88, 0.95)');
      yellowGrad.addColorStop(0.75, 'rgba(255, 170, 0, 0.85)');
      yellowGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
      ctx.fillStyle = yellowGrad;
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();

      // Layer 2: Bottom / Left Magenta & Coral Wave Ribbon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftX, cy);
      for (let x = leftX; x <= rightX; x += 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.sin(progress * 6 - t * 2.5) * 18 * ampMult * envelope +
                       Math.cos(progress * 9 + t * 1.2) * 7 * ampMult * envelope +
                       (18 * envelope * pulse);
        ctx.lineTo(x, cy + offset);
      }
      for (let x = rightX; x >= leftX; x -= 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.sin(progress * 3 + t * 1.4) * 6 * ampMult * envelope +
                       (4 * envelope * pulse);
        ctx.lineTo(x, cy + offset);
      }
      ctx.closePath();

      const magentaGrad = ctx.createLinearGradient(leftX, cy - 10, rightX, cy + 30);
      magentaGrad.addColorStop(0, 'rgba(236, 72, 153, 0)');
      magentaGrad.addColorStop(0.25, 'rgba(244, 63, 94, 0.9)');
      magentaGrad.addColorStop(0.55, 'rgba(239, 68, 68, 0.95)');
      magentaGrad.addColorStop(0.8, 'rgba(217, 70, 239, 0.85)');
      magentaGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = magentaGrad;
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();

      // Layer 3: Cyan & Sky Blue Wave Ribbon (Left & Center-Right)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftX, cy);
      for (let x = leftX; x <= rightX; x += 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.cos(progress * 7 + t * 2.0) * 14 * ampMult * envelope +
                       Math.sin(progress * 4 - t * 1.7) * 9 * ampMult * envelope -
                       (4 * envelope);
        ctx.lineTo(x, cy + offset);
      }
      for (let x = rightX; x >= leftX; x -= 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.sin(progress * 5 - t * 2.1) * 7 * ampMult * envelope +
                       (8 * envelope);
        ctx.lineTo(x, cy + offset);
      }
      ctx.closePath();

      const cyanGrad = ctx.createLinearGradient(leftX, cy, rightX, cy);
      cyanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      cyanGrad.addColorStop(0.15, 'rgba(14, 165, 233, 0.85)');
      cyanGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.9)');
      cyanGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.7)');
      cyanGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = cyanGrad;
      ctx.filter = 'blur(5px)';
      ctx.fill();
      ctx.restore();

      // Layer 4: Emerald & Lime Green Wave Ribbon (Bottom-Right)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftX, cy);
      for (let x = leftX; x <= rightX; x += 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.sin(progress * 6.5 + t * 2.3 + 1.2) * 15 * ampMult * envelope +
                       (14 * envelope * pulse);
        ctx.lineTo(x, cy + offset);
      }
      for (let x = rightX; x >= leftX; x -= 3) {
        const progress = (x - leftX) / waveWidth;
        const envelope = Math.sin(progress * Math.PI);
        const offset = Math.cos(progress * 4.5 - t * 1.6) * 6 * ampMult * envelope;
        ctx.lineTo(x, cy + offset);
      }
      ctx.closePath();

      const greenGrad = ctx.createLinearGradient(cx - 20, cy, rightX, cy + 25);
      greenGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      greenGrad.addColorStop(0.35, 'rgba(34, 197, 94, 0.85)');
      greenGrad.addColorStop(0.75, 'rgba(132, 204, 22, 0.9)');
      greenGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = greenGrad;
      ctx.filter = 'blur(5px)';
      ctx.fill();
      ctx.restore();

      // Layer 5: Intense Glowing Pure White Center Flare
      ctx.save();
      const coreX = cx + Math.sin(t * 1.7) * 4 * ampMult;
      const coreY = cy + Math.cos(t * 1.9) * 3 * ampMult;
      const coreWidth = (radius * 0.65) * pulse;
      const coreHeight = (radius * 0.28) * pulse * (state === 'speaking' ? 1.3 : 1);

      const coreGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreWidth);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.45, 'rgba(255, 245, 220, 0.7)');
      coreGrad.addColorStop(0.7, 'rgba(255, 220, 180, 0.25)');
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.filter = 'blur(3px)';
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.ellipse(coreX, coreY, coreWidth, coreHeight, Math.sin(t * 1.2) * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      // Inner rim highlight / glossy glass edge
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const rimGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Restore outer clip

      // Outer glow around the orb
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.15);
      if (state === 'listening') {
        outerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (state === 'thinking') {
        outerGlow.addColorStop(0, 'rgba(234, 179, 8, 0.4)');
        outerGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else if (state === 'speaking') {
        outerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
        outerGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
      } else {
        outerGlow.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
        outerGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      }
      ctx.fillStyle = outerGlow;
      ctx.fill();
      ctx.restore();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, size]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
};

export default AppleIntelligenceOrb;

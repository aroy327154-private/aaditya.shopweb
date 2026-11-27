import React, { useEffect, useRef } from 'react';

interface LiveAmbientBackdropProps {
  variant?: 'ambient' | 'hero';
  className?: string;
}

/**
 * High-craft 60fps fluid light-wave & aurora motion canvas.
 * Delivers a smooth live-video-style kinetic backdrop with zero network latency
 * or broken media links, automatically pausing when the tab is hidden or when
 * the user prefers reduced motion.
 */
export const LiveAmbientBackdrop: React.FC<LiveAmbientBackdropProps> = ({
  variant = 'ambient',
  className = 'absolute inset-0 w-full h-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let paused = document.hidden;

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && canvas.parentElement
        ? new ResizeObserver(() => resize())
        : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', resize, { passive: true });

    const drawHero = (t: number) => {
      // Deep obsidian-emerald cinema base
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#041410');
      baseGrad.addColorStop(0.52, '#07221b');
      baseGrad.addColorStop(1, '#091822');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Luminous liquid bokeh orbs (slow video-like drift)
      const orbs = [
        {
          x: width * (0.18 + 0.14 * Math.sin(t * 0.42)),
          y: height * (0.28 + 0.18 * Math.cos(t * 0.34)),
          r: Math.max(width, height) * 0.52,
          c0: 'rgba(16, 185, 129, 0.36)',
          c1: 'rgba(16, 185, 129, 0)',
        },
        {
          x: width * (0.82 + 0.12 * Math.cos(t * 0.38)),
          y: height * (0.22 + 0.2 * Math.sin(t * 0.31)),
          r: Math.max(width, height) * 0.48,
          c0: 'rgba(20, 184, 166, 0.32)',
          c1: 'rgba(20, 184, 166, 0)',
        },
        {
          x: width * (0.54 + 0.2 * Math.sin(t * 0.26 + 1.4)),
          y: height * (0.86 + 0.12 * Math.cos(t * 0.29)),
          r: Math.max(width, height) * 0.56,
          c0: 'rgba(6, 182, 212, 0.22)',
          c1: 'rgba(6, 182, 212, 0)',
        },
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const orb of orbs) {
        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        g.addColorStop(0, orb.c0);
        g.addColorStop(1, orb.c1);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      // Flowing silky aurora wave ribbons
      const ribbonCount = 4;
      for (let i = 0; i < ribbonCount; i++) {
        ctx.beginPath();
        const yBase = height * (0.22 + i * 0.2);
        const amp = Math.max(18, height * (0.08 + i * 0.018));
        const freq = 0.0045 + i * 0.0012;
        const speed = t * (0.62 + i * 0.15) + i * 1.3;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width + 24; x += 24) {
          const y =
            yBase +
            Math.sin(x * freq + speed) * amp +
            Math.cos(x * freq * 0.55 - speed * 0.7) * (amp * 0.45);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, yBase - amp, width, yBase + amp * 1.4);
        if (i % 2 === 0) {
          waveGrad.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
          waveGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.16)');
          waveGrad.addColorStop(1, 'rgba(45, 212, 191, 0.04)');
        } else {
          waveGrad.addColorStop(0, 'rgba(34, 211, 238, 0.05)');
          waveGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.13)');
          waveGrad.addColorStop(1, 'rgba(110, 231, 183, 0.05)');
        }
        ctx.fillStyle = waveGrad;
        ctx.fill();

        // Crisp luminous crest hairline
        ctx.beginPath();
        for (let x = 0; x <= width + 24; x += 24) {
          const y =
            yBase +
            Math.sin(x * freq + speed) * amp +
            Math.cos(x * freq * 0.55 - speed * 0.7) * (amp * 0.45);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          i % 2 === 0 ? 'rgba(167, 243, 208, 0.22)' : 'rgba(153, 246, 228, 0.16)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      // Soft floating shimmer particles
      for (let p = 0; p < 14; p++) {
        const seed = p * 73.13;
        const px = ((seed * 19.7 + t * (10 + (p % 4) * 4)) % (width + 40)) - 20;
        const py =
          height * (0.14 + ((p * 0.17) % 0.76)) + Math.sin(t * 0.8 + seed) * 14;
        const pr = 1.2 + (p % 3) * 0.7;
        const alpha = 0.16 + 0.16 * Math.sin(t * 1.4 + seed);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(209, 250, 229, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      ctx.restore();

      // Subtle diagonal glass specular reflection sweep
      const sweepPos = ((t * 0.11) % 1.8) - 0.4;
      const sx = width * sweepPos;
      const sheen = ctx.createLinearGradient(sx - 120, 0, sx + 160, height);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.055)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, width, height);
    };

    const drawAmbient = (t: number) => {
      // Clean pearl-mint alabaster base so frosted glass cards pop with high contrast
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#f4fbf8');
      baseGrad.addColorStop(0.5, '#f7faf9');
      baseGrad.addColorStop(1, '#eff7f6');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      const maxDim = Math.max(width, height);
      const blobs = [
        {
          x: width * (0.14 + 0.16 * Math.sin(t * 0.28)),
          y: height * (0.14 + 0.12 * Math.cos(t * 0.24)),
          r: maxDim * 0.48,
          c0: 'rgba(16, 185, 129, 0.22)',
          c1: 'rgba(16, 185, 129, 0)',
        },
        {
          x: width * (0.86 + 0.12 * Math.cos(t * 0.25)),
          y: height * (0.22 + 0.15 * Math.sin(t * 0.21)),
          r: maxDim * 0.46,
          c0: 'rgba(20, 184, 166, 0.2)',
          c1: 'rgba(20, 184, 166, 0)',
        },
        {
          x: width * (0.52 + 0.2 * Math.sin(t * 0.2 + 2.1)),
          y: height * (0.82 + 0.12 * Math.cos(t * 0.18)),
          r: maxDim * 0.52,
          c0: 'rgba(56, 189, 248, 0.16)',
          c1: 'rgba(56, 189, 248, 0)',
        },
        {
          x: width * (0.24 + 0.16 * Math.cos(t * 0.22 + 0.7)),
          y: height * (0.68 + 0.14 * Math.sin(t * 0.25)),
          r: maxDim * 0.38,
          c0: 'rgba(52, 211, 153, 0.18)',
          c1: 'rgba(52, 211, 153, 0)',
        },
      ];

      for (const blob of blobs) {
        const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        g.addColorStop(0, blob.c0);
        g.addColorStop(1, blob.c1);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      // Subtle translucent silk contour wave across upper half
      ctx.beginPath();
      const yMid = height * 0.36;
      const amp = Math.min(48, height * 0.06);
      ctx.moveTo(0, 0);
      for (let x = 0; x <= width + 32; x += 32) {
        const y =
          yMid +
          Math.sin(x * 0.003 + t * 0.35) * amp +
          Math.cos(x * 0.0018 - t * 0.25) * (amp * 0.5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, 0);
      ctx.closePath();
      const silkGrad = ctx.createLinearGradient(0, 0, width, yMid + amp);
      silkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      silkGrad.addColorStop(0.5, 'rgba(209, 250, 229, 0.22)');
      silkGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
      ctx.fillStyle = silkGrad;
      ctx.fill();
    };

    const renderFrame = (timeMs: number) => {
      const t = timeMs * 0.001;
      if (variant === 'hero') {
        drawHero(t);
      } else {
        drawAmbient(t);
      }
    };

    if (reducedMotion) {
      renderFrame(2400);
      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener('resize', resize);
      };
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      if (!paused) {
        renderFrame(now - startTime);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none block ${className}`}
    />
  );
};

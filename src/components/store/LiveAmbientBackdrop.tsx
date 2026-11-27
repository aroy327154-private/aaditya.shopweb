import React, { useEffect, useRef } from 'react';

interface LiveAmbientBackdropProps {
  variant?: 'ambient' | 'hero';
  className?: string;
}

/**
 * Smooth liquid-glass ambient backdrop:
 * - "ambient": Pure GPU-composited CSS mesh (zero JS per-frame cost, eliminates mobile lag).
 * - "hero": Throttled (~24fps, dpr=1) live aurora canvas that auto-pauses when offscreen or hidden.
 */
export const LiveAmbientBackdrop: React.FC<LiveAmbientBackdropProps> = ({
  variant = 'ambient',
  className = 'absolute inset-0 w-full h-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (variant !== 'hero') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let paused = document.hidden;
    let inView = true;
    let lastDrawTime = 0;
    const FRAME_INTERVAL_MS = 42; // ~24fps silky cinema motion at 1/3 the GPU cost

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: 300 };
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && canvas.parentElement
        ? new ResizeObserver(() => resize())
        : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0.01 },
          )
        : null;
    intersectionObserver?.observe(canvas);

    const drawHero = (t: number) => {
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#041410');
      baseGrad.addColorStop(0.52, '#07221b');
      baseGrad.addColorStop(1, '#091822');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      const orbs = [
        {
          x: width * (0.18 + 0.14 * Math.sin(t * 0.42)),
          y: height * (0.28 + 0.18 * Math.cos(t * 0.34)),
          r: Math.max(width, height) * 0.52,
          c0: 'rgba(16, 185, 129, 0.34)',
          c1: 'rgba(16, 185, 129, 0)',
        },
        {
          x: width * (0.82 + 0.12 * Math.cos(t * 0.38)),
          y: height * (0.22 + 0.2 * Math.sin(t * 0.31)),
          r: Math.max(width, height) * 0.48,
          c0: 'rgba(20, 184, 166, 0.3)',
          c1: 'rgba(20, 184, 166, 0)',
        },
        {
          x: width * (0.54 + 0.2 * Math.sin(t * 0.26 + 1.4)),
          y: height * (0.86 + 0.12 * Math.cos(t * 0.29)),
          r: Math.max(width, height) * 0.54,
          c0: 'rgba(6, 182, 212, 0.2)',
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

      const ribbonCount = 3;
      for (let i = 0; i < ribbonCount; i++) {
        ctx.beginPath();
        const yBase = height * (0.26 + i * 0.22);
        const amp = Math.max(16, height * (0.08 + i * 0.018));
        const freq = 0.0045 + i * 0.0012;
        const speed = t * (0.58 + i * 0.14) + i * 1.3;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width + 36; x += 36) {
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
          waveGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
          waveGrad.addColorStop(1, 'rgba(45, 212, 191, 0.04)');
        } else {
          waveGrad.addColorStop(0, 'rgba(34, 211, 238, 0.05)');
          waveGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.12)');
          waveGrad.addColorStop(1, 'rgba(110, 231, 183, 0.05)');
        }
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      for (let p = 0; p < 10; p++) {
        const seed = p * 73.13;
        const px = ((seed * 19.7 + t * (10 + (p % 4) * 4)) % (width + 40)) - 20;
        const py = height * (0.14 + ((p * 0.19) % 0.74)) + Math.sin(t * 0.8 + seed) * 12;
        const pr = 1.2 + (p % 3) * 0.6;
        const alpha = 0.16 + 0.14 * Math.sin(t * 1.4 + seed);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(209, 250, 229, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      ctx.restore();
    };

    if (reducedMotion) {
      drawHero(2.4);
      return () => {
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
      };
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      if (!paused && inView && now - lastDrawTime >= FRAME_INTERVAL_MS) {
        lastDrawTime = now;
        drawHero((now - startTime) * 0.001);
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
      intersectionObserver?.disconnect();
    };
  }, [variant]);

  if (variant === 'ambient') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(155deg, #f3fbf7 0%, #f7faf9 50%, #eef7f6 100%)',
        }}
      >
        <div
          className="ambient-orb-1 absolute -top-32 -left-24 w-[46vmax] h-[46vmax] rounded-full opacity-75"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 68%)',
          }}
        />
        <div
          className="ambient-orb-2 absolute top-[12%] -right-28 w-[44vmax] h-[44vmax] rounded-full opacity-75"
          style={{
            background:
              'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, rgba(20, 184, 166, 0) 68%)',
          }}
        />
        <div
          className="ambient-orb-3 absolute -bottom-36 left-[28%] w-[50vmax] h-[50vmax] rounded-full opacity-65"
          style={{
            background:
              'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0) 70%)',
          }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none block ${className}`}
    />
  );
};

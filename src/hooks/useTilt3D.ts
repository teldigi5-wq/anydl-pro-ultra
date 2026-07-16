import { useRef, useCallback } from 'react';

/**
 * Tracks real pointer position over an element and exposes it as CSS custom
 * properties (--mx/--my for a specular highlight position, --rx/--ry for a
 * 3D tilt rotation). Everything updates via transform + CSS vars, which the
 * compositor can animate without triggering layout or paint — same class of
 * technique that keeps the particle background and progress updates cheap.
 */
export function useTilt3D(maxTiltDeg = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    const clientX = e.clientX, clientY = e.clientY;
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;   // 0..1
      const py = (clientY - rect.top) / rect.height;    // 0..1
      const rx = (px - 0.5) * maxTiltDeg * 2;            // rotateY driven by x
      const ry = (0.5 - py) * maxTiltDeg * 2;             // rotateX driven by y
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    });
  }, [maxTiltDeg]);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '30%');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

import { useEffect, useState } from "react";
import { useMotionValue } from "framer-motion";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function useMouseXY() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);
  return { x, y };
}

export function useViewport() {
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth || 1200, h: window.innerHeight || 800 });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

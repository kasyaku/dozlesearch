// hooks/useInfiniteScroll.ts
import { useEffect, useRef } from "react";

export function useInfiniteScroll(callback: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callback();
      },
      { threshold: 1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [callback]);

  return ref;
}
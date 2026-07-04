'use client';

import { useEffect, useRef } from 'react';

export function usePolling(
  fn: () => Promise<void> | void,
  intervalMs: number,
  enabled = true
): void {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;

    fnRef.current();

    const id = setInterval(() => fnRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

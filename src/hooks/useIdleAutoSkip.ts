import { useEffect, useRef, useState } from 'react';

export const IDLE_AUTO_SKIP_MS = 5000;

/**
 * Countdown for auto-passing an idle opponent turn.
 *
 * - Runs only while `active`; resets to the full duration whenever it becomes inactive.
 * - Pausing (e.g. hovering the button) freezes the remaining time; resuming continues from there.
 * - `onDone` is called once, outside any state updater, when the countdown reaches zero.
 *
 * Returns the remaining time in milliseconds.
 */
export const useIdleAutoSkip = (active: boolean, paused: boolean, onDone: () => void): number => {
  const [remaining, setRemaining] = useState(IDLE_AUTO_SKIP_MS);
  const [wasActive, setWasActive] = useState(active);
  const remainingRef = useRef(IDLE_AUTO_SKIP_MS);
  const onDoneRef = useRef(onDone);

  // Reset to the full duration whenever the countdown stops (adjusting state during render)
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) setRemaining(IDLE_AUTO_SKIP_MS);
  }

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!active) {
      remainingRef.current = IDLE_AUTO_SKIP_MS;
      return;
    }
    if (paused) return;

    const startedAt = Date.now();
    const startRemaining = remainingRef.current;
    const id = setInterval(() => {
      const left = Math.max(0, startRemaining - (Date.now() - startedAt));
      remainingRef.current = left;
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onDoneRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [active, paused]);

  return remaining;
};

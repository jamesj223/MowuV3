import React, { useRef } from 'react';

interface HoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClickStep?: () => void;      // called on single click (step ±1)
  onHoldStep?: () => void;       // called repeatedly or on long press (step ±10)
  holdDelay?: number;            // ms before repeat kicks in (default 350)
  repeatInterval?: number;       // ms between repeat steps (default 100)
}

export const HoldButton: React.FC<HoldButtonProps> = ({
  onClickStep,
  onHoldStep,
  holdDelay = 350,
  repeatInterval = 120,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didHoldRef = useRef(false);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return;
    didHoldRef.current = false;
    clearTimers();

    timerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      if (onHoldStep) {
        onHoldStep();
        intervalRef.current = setInterval(() => {
          onHoldStep();
        }, repeatInterval);
      }
    }, holdDelay);
  };

  const handlePointerUp = () => {
    const wasHold = didHoldRef.current;
    clearTimers();
    if (!wasHold && onClickStep && !disabled) {
      onClickStep();
    }
  };

  const handlePointerLeave = () => {
    clearTimers();
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      className={`btn-press select-none cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

import { useState, useEffect } from 'react';

export const useTimer = (initialSeconds, onExpire) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      if (onExpire) onExpire();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onExpire]);

  const start = () => setIsActive(true);
  const pause = () => setIsActive(false);
  const reset = (newSeconds = initialSeconds) => {
    setIsActive(false);
    setSeconds(newSeconds);
  };

  return { seconds, isActive, start, pause, reset };
};

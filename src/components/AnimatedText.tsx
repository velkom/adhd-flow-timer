import {
  useEffect,
  useLayoutEffect,
  useState,
  type AnimationEvent,
} from 'react';
import styles from './AnimatedText.module.css';

const CLEANUP_FALLBACK_MS = 400;

interface AnimatedTextProps {
  value: string;
  className?: string;
}

export function AnimatedText({ value, className = '' }: AnimatedTextProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [outgoingValue, setOutgoingValue] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (value === currentValue) return;

    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setOutgoingValue(reduceMotion ? null : currentValue);
    setCurrentValue(value);
  }, [currentValue, value]);

  useEffect(() => {
    if (outgoingValue === null) return;

    const timeout = window.setTimeout(
      () => setOutgoingValue(null),
      CLEANUP_FALLBACK_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [outgoingValue]);

  const handleIncomingAnimationEnd = (
    event: AnimationEvent<HTMLSpanElement>,
  ) => {
    if (event.target === event.currentTarget) {
      setOutgoingValue(null);
    }
  };

  return (
    <span className={`${styles.animatedText} ${className}`}>
      {outgoingValue !== null && (
        <span className={styles.outgoing} aria-hidden="true">
          {outgoingValue}
        </span>
      )}
      <span
        key={currentValue}
        className={outgoingValue === null ? styles.layer : styles.incoming}
        onAnimationEnd={handleIncomingAnimationEnd}
      >
        {currentValue}
      </span>
    </span>
  );
}

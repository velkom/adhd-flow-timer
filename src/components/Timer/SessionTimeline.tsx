import styles from './Timer.module.css';

interface SessionTimelineProps {
  totalSlots: number;
  completedSessions: number;
  currentActive: boolean;
}

export function SessionTimeline({
  totalSlots,
  completedSessions,
  currentActive,
}: SessionTimelineProps) {
  return (
    <div
      className={styles.sessionTimeline}
      role="group"
      aria-label={`${completedSessions} of ${totalSlots} sessions completed`}
    >
      {Array.from({ length: totalSlots }, (_, i) => {
        const isCompleted = i < completedSessions;
        const isCurrent = i === completedSessions && currentActive;
        return (
          <div
            key={i}
            className={`${styles.timelineDot} ${isCompleted ? styles.timelineDotCompleted : ''} ${isCurrent ? styles.timelineDotCurrent : ''}`}
            aria-label={
              isCompleted
                ? `Session ${i + 1}: completed`
                : isCurrent
                  ? `Session ${i + 1}: in progress`
                  : `Session ${i + 1}: upcoming`
            }
          />
        );
      })}
    </div>
  );
}

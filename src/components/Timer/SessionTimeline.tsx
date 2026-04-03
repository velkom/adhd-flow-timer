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
      className="session-timeline"
      role="group"
      aria-label={`${completedSessions} of ${totalSlots} sessions completed`}
    >
      {Array.from({ length: totalSlots }, (_, i) => {
        const isCompleted = i < completedSessions;
        const isCurrent = i === completedSessions && currentActive;
        return (
          <div
            key={i}
            className={`timeline-dot ${isCompleted ? 'timeline-dot--completed' : ''} ${isCurrent ? 'timeline-dot--current' : ''}`}
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

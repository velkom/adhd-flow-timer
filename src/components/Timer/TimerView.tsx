import { useCallback, useState } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ProgressRing } from './ProgressRing';
import { TimerDisplay } from './TimerDisplay';
import { DurationPresets } from './DurationPresets';
import { SessionTimeline } from './SessionTimeline';
import { ControlButtons } from './ControlButtons';
import { DebugPanel } from './DebugPanel';

export function TimerView() {
  const timer = useTimerStore((s) => s.timer);
  const debugSpeedMultiplier = useTimerStore((s) => s.debugSpeedMultiplier);
  const { start, pause, resume, skip, reset, setPreset, setDebugSpeed, addDebugTime } =
    useTimerStore();
  const settings = useSettingsStore((s) => s.settings);

  const [debugOpen, setDebugOpen] = useState(false);

  const toggleDebug = useCallback(() => {
    setDebugOpen((prev) => {
      if (prev) {
        setDebugSpeed(1);
      }
      return !prev;
    });
  }, [setDebugSpeed]);

  const phaseDuration =
    timer.phase === 'focus'
      ? settings.focusDuration
      : timer.phase === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration;

  const progress =
    timer.status === 'flowState'
      ? 1
      : phaseDuration > 0
        ? timer.elapsedSeconds / phaseDuration
        : 0;

  const isActive = timer.status !== 'idle';

  return (
    <div className="timer-view">
      <DurationPresets
        currentDuration={
          timer.phase === 'focus' ? timer.remainingSeconds + timer.elapsedSeconds : phaseDuration
        }
        onSelect={setPreset}
        disabled={isActive}
      />

      <div className="timer-ring-container">
        <ProgressRing
          progress={progress}
          phase={timer.phase}
          status={timer.status}
        />
        <TimerDisplay
          remainingSeconds={timer.remainingSeconds}
          phase={timer.phase}
          status={timer.status}
          flowSeconds={timer.flowSeconds}
          debugActive={debugOpen}
          onDebugToggle={toggleDebug}
        />
      </div>

      <SessionTimeline
        totalSlots={settings.sessionsBeforeLongBreak}
        completedSessions={
          timer.completedSessions % settings.sessionsBeforeLongBreak
        }
        currentActive={timer.status === 'running' || timer.status === 'flowState'}
      />

      <ControlButtons
        status={timer.status}
        phase={timer.phase}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onSkip={skip}
        onReset={reset}
      />

      {debugOpen && (
        <DebugPanel
          speedMultiplier={debugSpeedMultiplier}
          timerStatus={timer.status}
          onSetSpeed={setDebugSpeed}
          onAddTime={addDebugTime}
          onClose={toggleDebug}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimerSoundEffects } from '@/hooks/useTimerSoundEffects';
import { playSound } from '@/lib/sounds';
import { AnimatedText } from '@/components/AnimatedText';
import { ProgressBar } from './ProgressBar';
import { TimerDisplay } from './TimerDisplay';
import { SessionTimeline } from './SessionTimeline';
import { ControlButtons } from './ControlButtons';
import { DebugPanel } from './DebugPanel';
import { statusLabel } from './timerDisplayLabels';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './Timer.module.css';

export function TimerView() {
  const timer = useTimerStore((s) => s.timer);
  const debugSpeedMultiplier = useTimerStore((s) => s.debugSpeedMultiplier);
  const { start, pause, resume, skip, reset, setPreset, setDebugSpeed, addDebugTime } =
    useTimerStore();
  const settings = useSettingsStore((s) => s.settings);

  const [debugOpen, setDebugOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useTimerSoundEffects(timer.phase, timer.status);

  useEffect(() => {
    if (timer.status === 'idle' && timer.phase === 'focus') {
      setPreset(settings.focusDuration);
    }
  }, [settings.focusDuration, timer.status, timer.phase, setPreset]);

  const toggleDebug = useCallback(() => {
    setDebugOpen((prev) => {
      if (prev) {
        setDebugSpeed(1);
      }
      return !prev;
    });
  }, [setDebugSpeed]);

  const handleStart = useCallback(() => {
    playSound('start');
    start();
  }, [start]);

  const handlePause = useCallback(() => {
    playSound('click');
    pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    playSound('click');
    resume();
  }, [resume]);

  const handleSkip = useCallback(() => {
    playSound('click');
    skip();
  }, [skip]);

  const handleResetRequest = useCallback(() => {
    setResetConfirmOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    setResetConfirmOpen(false);
    playSound('click');
    reset();
  }, [reset]);

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

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
  });

  const cycleIndex =
    (timer.completedSessions % settings.sessionsBeforeLongBreak) + 1;
  const isTimerActive =
    timer.status === 'running' || timer.status === 'flowState';

  return (
    <div className={styles.timerView}>
      <header className={styles.watchHeader}>
        <span className={styles.watchDate}>{todayLabel}</span>
        <span className={styles.watchMeta}>
          <span
            className={styles.metaDot}
            data-open={isTimerActive}
            aria-hidden="true"
          />
          <AnimatedText
            value={`Session ${cycleIndex}/${settings.sessionsBeforeLongBreak}`}
            className={styles.watchMetaText}
          />
        </span>
      </header>

      <div className={styles.watchCard}>
        <TimerDisplay
          remainingSeconds={timer.remainingSeconds}
          elapsedSeconds={timer.elapsedSeconds}
          phase={timer.phase}
          status={timer.status}
          debugActive={debugOpen}
          onDebugToggle={toggleDebug}
        />

        <ProgressBar
          progress={progress}
          phase={timer.phase}
          status={timer.status}
          remainingSeconds={timer.remainingSeconds}
          phaseDuration={phaseDuration}
        />

        <SessionTimeline
          totalSlots={settings.sessionsBeforeLongBreak}
          completedSessions={
            timer.completedSessions % settings.sessionsBeforeLongBreak
          }
          currentActive={isTimerActive}
        />

        <footer className={styles.watchFooter}>
          <span className={styles.watchFooterItem}>
            <span className={styles.watchFooterLabel}>Status</span>
            <AnimatedText
              value={statusLabel(timer.status, timer.phase)}
              className={styles.watchFooterValue}
            />
          </span>
        </footer>
      </div>

      <ControlButtons
        status={timer.status}
        phase={timer.phase}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onSkip={handleSkip}
        onResetRequest={handleResetRequest}
      />

      {resetConfirmOpen && (
        <ConfirmModal
          title="Reset timer?"
          body="The current phase restarts from the beginning. Elapsed time will not be saved."
          confirmLabel="Reset"
          confirmVariant="danger"
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={handleConfirmReset}
        />
      )}

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

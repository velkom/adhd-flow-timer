import { useCallback, useEffect, useState } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimerSoundEffects } from '@/hooks/useTimerSoundEffects';
import { playSound } from '@/lib/sounds';
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
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);

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

  const handleFinishRequest = useCallback(() => {
    setFinishConfirmOpen(true);
  }, []);

  const handleConfirmFinish = useCallback(() => {
    setFinishConfirmOpen(false);
    playSound('click');
    skip();
  }, [skip]);

  const handleReset = useCallback(() => {
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
          {isTimerActive && <span className={styles.metaDot} aria-hidden="true" />}
          Session {cycleIndex}/{settings.sessionsBeforeLongBreak}
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
            <span className={styles.watchFooterValue}>
              {statusLabel(timer.status, timer.phase)}
            </span>
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
        onFinishRequest={handleFinishRequest}
        onReset={handleReset}
      />

      {finishConfirmOpen && (
        <ConfirmModal
          title="Finish session?"
          body="Save this focus block and start your break."
          confirmLabel="Finish focus"
          confirmVariant="primary"
          onCancel={() => setFinishConfirmOpen(false)}
          onConfirm={handleConfirmFinish}
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

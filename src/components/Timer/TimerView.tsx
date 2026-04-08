import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ProgressRing } from './ProgressRing';
import { TimerDisplay } from './TimerDisplay';
import { SessionTimeline } from './SessionTimeline';
import { ControlButtons } from './ControlButtons';
import { DebugPanel } from './DebugPanel';
import { playSound, preloadSounds } from '../../lib/sounds';
import type { TimerPhase, TimerStatus } from '../../lib/types';

export function TimerView() {
  const timer = useTimerStore((s) => s.timer);
  const debugSpeedMultiplier = useTimerStore((s) => s.debugSpeedMultiplier);
  const { start, pause, resume, skip, reset, setPreset, setDebugSpeed, addDebugTime } =
    useTimerStore();
  const settings = useSettingsStore((s) => s.settings);

  const [debugOpen, setDebugOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);

  const prevPhase = useRef<TimerPhase>(timer.phase);
  const prevStatus = useRef<TimerStatus>(timer.status);

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    if (timer.status === 'idle' && timer.phase === 'focus') {
      setPreset(settings.focusDuration);
    }
  }, [settings.focusDuration, timer.status, timer.phase, setPreset]);

  useEffect(() => {
    const oldPhase = prevPhase.current;
    const oldStatus = prevStatus.current;
    prevPhase.current = timer.phase;
    prevStatus.current = timer.status;

    if (oldPhase === timer.phase && oldStatus === timer.status) return;

    // Focus timer expired → entered flow state
    if (oldStatus === 'running' && timer.status === 'flowState') {
      playSound('complete');
      return;
    }

    // Break auto-completed → back to idle focus
    const wasBreakRunning =
      oldStatus === 'running' &&
      (oldPhase === 'shortBreak' || oldPhase === 'longBreak');
    if (wasBreakRunning && timer.status === 'idle' && timer.phase === 'focus') {
      playSound('breakEnd');
      return;
    }

    // Skipped from focus → now idle on a break phase
    if (
      oldPhase === 'focus' &&
      timer.status === 'idle' &&
      (timer.phase === 'shortBreak' || timer.phase === 'longBreak')
    ) {
      playSound('breakStart');
      return;
    }
  }, [timer.phase, timer.status]);

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

  return (
    <div className="timer-view">
      <h2 className="view-title">Focus</h2>

      <div className="timer-view-body">
        <div className="timer-ring-container">
          <ProgressRing
            progress={progress}
            phase={timer.phase}
            status={timer.status}
          />
          <TimerDisplay
            remainingSeconds={timer.remainingSeconds}
            elapsedSeconds={timer.elapsedSeconds}
            phase={timer.phase}
            status={timer.status}
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
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onSkip={handleSkip}
          onFinishRequest={handleFinishRequest}
          onReset={handleReset}
        />
      </div>

      {finishConfirmOpen && (
        <div
          className="modal-overlay"
          onClick={() => setFinishConfirmOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Finish session?</h3>
            <p className="modal-body">
              End this focus block and move on (same as Skip).
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setFinishConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleConfirmFinish}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
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

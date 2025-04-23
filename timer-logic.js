/**
 * timer-logic.js - Core timer functionality for Flow Timer
 * v1.1.2
 */

// Constants
const CIRCUMFERENCE = 2 * Math.PI * 120; // Circumference of the progress ring

// Timer state with default values
const createDefaultTimerState = () => ({
    isRunning: false,
    isPaused: false,
    isBreak: false,
    isLongBreak: false,
    isFlowState: false,
    currentSeconds: 25 * 60, // 25 minutes by default
    focusTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    sessionsBeforeLongBreak: 4,
    completedSessions: 0,
    timerInterval: null,
    startTime: null,
    elapsedBeforePause: 0,
    lastAction: null, // Track the last action for undo functionality
    
    // Settings
    enableVisualCues: true,
    enableSoundNotifications: false,
    visualCueIntensity: 5,
    theme: 'dark',
    accentColor: '#0a84ff'
});

// Initialize with default values
let timerState = createDefaultTimerState();

// Session data with default values
const createDefaultSessionData = () => ({
    sessions: [],
    currentSession: null
});

// Initialize session data
let sessionData = createDefaultSessionData();

/**
 * Calculates elapsed seconds since timer start
 */
function getElapsedSeconds() {
    if (!timerState.startTime) return 0;
    return Math.floor((Date.now() - timerState.startTime) / 1000);
}

/**
 * Updates the timer display
 */
function updateTimerDisplay(timerTimeElement) {
    if (!timerTimeElement) return;
    
    const absSeconds = Math.abs(timerState.currentSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    
    timerTimeElement.textContent = `${timerState.isFlowState ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Updates the progress ring visualization
 */
function updateProgressRing(progressRingCircle, elapsedSeconds) {
    if (!progressRingCircle) return;
    
    const totalTime = timerState.isBreak 
        ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime)
        : timerState.focusTime;
    
    let percentage = Math.min(elapsedSeconds / totalTime, 1);
    
    // For flow state, keep the ring full but change color
    if (timerState.isFlowState) {
        percentage = 1;
    }
    
    const dashoffset = CIRCUMFERENCE * (1 - percentage);
    progressRingCircle.style.strokeDashoffset = dashoffset;
    progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
    
    // Update color based on progress
    if (!timerState.isFlowState && !timerState.isBreak) {
        if (percentage < 0.33) {
            progressRingCircle.style.stroke = 'var(--focus-color)';
        } else if (percentage < 0.66) {
            progressRingCircle.style.stroke = 'var(--warning-color)';
        } else {
            progressRingCircle.style.stroke = 'var(--error-color)';
        }
    }
}

/**
 * Start the timer
 */
function startTimer(elements, callbacks) {
    const { startButton, pauseButton, skipButton, resetButton, timerStatusElement } = elements;
    const { updateTimerCallback, updateFlowStateCallback } = callbacks;
    
    if (timerState.isRunning && !timerState.isPaused) return;
    
    if (!timerState.isRunning) {
        // Starting a new timer
        timerState.isRunning = true;
        timerState.startTime = Date.now() - (timerState.elapsedBeforePause * 1000);
        timerState.elapsedBeforePause = 0;
        
        // Create a new session record if starting a focus session
        if (!timerState.isBreak) {
            sessionData.currentSession = {
                start: new Date(),
                plannedDuration: timerState.focusTime,
                actualDuration: 0,
                isCompleted: false,
                flowStateDuration: 0,
                type: 'focus'
            };
        } else {
            sessionData.currentSession = {
                start: new Date(),
                plannedDuration: timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime,
                actualDuration: 0,
                isCompleted: false,
                type: 'break'
            };
        }
    } else {
        // Resuming from pause
        timerState.isPaused = false;
        timerState.startTime = Date.now() - (timerState.elapsedBeforePause * 1000);
    }
    
    // Update UI
    if (startButton) startButton.disabled = true;
    if (pauseButton) pauseButton.disabled = false;
    if (skipButton) skipButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
    
    timerState.timerInterval = setInterval(() => updateTimerCallback(), 1000);
    if (timerStatusElement) {
        timerStatusElement.textContent = timerState.isBreak ? 'Taking a break' : 'Focusing';
    }
}

/**
 * Pause the timer
 */
function pauseTimer(elements) {
    const { startButton, pauseButton, timerStatusElement } = elements;
    
    if (!timerState.isRunning || timerState.isPaused) return;
    
    clearInterval(timerState.timerInterval);
    timerState.isPaused = true;
    timerState.elapsedBeforePause = getElapsedSeconds();
    
    // Update UI
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (timerStatusElement) timerStatusElement.textContent = 'Paused';
}

/**
 * Update the timer - called by the interval
 */
function updateTimerInternal(elements, callbacks) {
    const { progressRingCircle, timerTimeElement, timerLabelElement, timerStatusElement } = elements;
    const { completeSessionCallback, enterFlowStateCallback, updateFlowStateCallback } = callbacks;
    
    const elapsedSeconds = getElapsedSeconds();
    const timeLeft = timerState.isBreak 
        ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime) - elapsedSeconds
        : timerState.focusTime - elapsedSeconds;
    
    // Check if timer has ended
    if (timeLeft <= 0 && timerState.isBreak) {
        // Break ended, switch to focus mode
        clearInterval(timerState.timerInterval);
        completeSessionCallback('break');
        return;
    }
    
    // Check for flow state (continuing past the planned focus time)
    if (!timerState.isBreak && elapsedSeconds > timerState.focusTime) {
        if (!timerState.isFlowState) {
            enterFlowStateCallback();
        }
        // Update flow state information
        const flowSeconds = elapsedSeconds - timerState.focusTime;
        updateFlowStateCallback(flowSeconds);
    }
    
    // Update timer display
    timerState.currentSeconds = Math.max(0, timerState.isBreak 
        ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime) - elapsedSeconds
        : timerState.isFlowState ? -(elapsedSeconds - timerState.focusTime) : timerState.focusTime - elapsedSeconds);
    
    updateTimerDisplay(timerTimeElement);
    updateProgressRing(progressRingCircle, elapsedSeconds);
}

/**
 * Enter flow state - user has continued past the focus time
 */
function enterFlowState(elements) {
    const { timerLabelElement, timerStatusElement, progressRingCircle } = elements;
    
    timerState.isFlowState = true;
    if (timerLabelElement) timerLabelElement.textContent = 'Flow State';
    if (timerStatusElement) timerStatusElement.textContent = 'In flow state - timer continues';
    
    // Visual indication
    if (timerState.enableVisualCues && progressRingCircle) {
        progressRingCircle.classList.add('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--warning-color)';
    }
}

/**
 * Reset to a clean state but keep settings
 */
function resetTimerState(preserveSettings = true) {
    console.log('Resetting timer state, preserveSettings:', preserveSettings);
    
    const currentSettings = preserveSettings ? {
        focusTime: timerState.focusTime || 25 * 60,
        breakTime: timerState.breakTime || 5 * 60,
        longBreakTime: timerState.longBreakTime || 15 * 60,
        sessionsBeforeLongBreak: timerState.sessionsBeforeLongBreak || 4,
        enableVisualCues: timerState.enableVisualCues !== undefined ? timerState.enableVisualCues : true,
        enableSoundNotifications: timerState.enableSoundNotifications !== undefined ? timerState.enableSoundNotifications : false,
        visualCueIntensity: timerState.visualCueIntensity || 5,
        theme: timerState.theme || 'dark',
        accentColor: timerState.accentColor || '#0a84ff'
    } : null;
    
    // Clear timer interval if running
    if (timerState.timerInterval) {
        clearInterval(timerState.timerInterval);
    }
    
    // Get default state
    const defaultState = createDefaultTimerState();
    
    // Reset to default state by updating properties instead of replacing the object
    Object.assign(timerState, defaultState);
    
    // Restore settings if needed
    if (preserveSettings && currentSettings) {
        timerState.focusTime = currentSettings.focusTime;
        timerState.breakTime = currentSettings.breakTime;
        timerState.longBreakTime = currentSettings.longBreakTime;
        timerState.sessionsBeforeLongBreak = currentSettings.sessionsBeforeLongBreak;
        timerState.enableVisualCues = currentSettings.enableVisualCues;
        timerState.enableSoundNotifications = currentSettings.enableSoundNotifications;
        timerState.visualCueIntensity = currentSettings.visualCueIntensity;
        timerState.theme = currentSettings.theme;
        timerState.accentColor = currentSettings.accentColor;
        timerState.currentSeconds = currentSettings.focusTime;
    }
    
    console.log('Timer state reset with settings preserved:', preserveSettings);
    console.log('Timer state is now:', timerState);
    return timerState;
}

/**
 * Reset session data
 */
function resetSessionData() {
    console.log('Resetting session data');
    const defaultSessionData = createDefaultSessionData();
    
    // Reset by updating properties instead of replacing the object
    Object.assign(sessionData, defaultSessionData);
    
    console.log('Session data reset');
    console.log('Session data is now:', sessionData);
    return sessionData;
}

/**
 * Export the timer module
 */
const TimerModule = {
    timerState,
    sessionData,
    getElapsedSeconds,
    updateTimerDisplay,
    updateProgressRing,
    startTimer,
    pauseTimer,
    updateTimerInternal,
    enterFlowState,
    resetTimerState,
    resetSessionData,
    CIRCUMFERENCE
};

// Make it available globally
window.TimerModule = TimerModule; 
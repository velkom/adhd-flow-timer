/**
 * timer-logic.js - Core timer functionality for Flow Timer
 * v1.3.0
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
window.timerState = createDefaultTimerState();

// Session data with default values
const createDefaultSessionData = () => ({
    sessions: [],
    currentSession: null
});

// Initialize session data
window.sessionData = createDefaultSessionData();

// Make all functions globally available
window.getElapsedSeconds = function() {
    if (!window.timerState.startTime) return 0;
    return Math.floor((Date.now() - window.timerState.startTime) / 1000);
};

window.updateTimerDisplay = function(timerTimeElement) {
    if (!timerTimeElement) return;
    
    const absSeconds = Math.abs(window.timerState.currentSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    
    timerTimeElement.textContent = `${window.timerState.isFlowState ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

window.updateProgressRing = function(progressRingCircle, elapsedSeconds) {
    if (!progressRingCircle) return;
    
    const totalTime = window.timerState.isBreak 
        ? (window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime)
        : window.timerState.focusTime;
    
    let percentage = Math.min(elapsedSeconds / totalTime, 1);
    
    // For flow state, keep the ring full but change color
    if (window.timerState.isFlowState) {
        percentage = 1;
    }
    
    const dashoffset = CIRCUMFERENCE * (1 - percentage);
    progressRingCircle.style.strokeDashoffset = dashoffset;
    progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
    
    // Update color based on progress
    if (!window.timerState.isFlowState && !window.timerState.isBreak) {
        if (percentage < 0.33) {
            progressRingCircle.style.stroke = 'var(--focus-color)';
        } else if (percentage < 0.66) {
            progressRingCircle.style.stroke = 'var(--warning-color)';
        } else {
            progressRingCircle.style.stroke = 'var(--error-color)';
        }
    }
};

window.startTimer = function() {
    console.log('Start timer called');
    
    if (window.timerState.isRunning && !window.timerState.isPaused) return;
    
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const skipButton = document.getElementById('skipBtn');
    const resetButton = document.getElementById('resetBtn');
    const timerStatusElement = document.getElementById('timerStatus');
    const timerTimeElement = document.getElementById('timerTime');
    
    if (!window.timerState.isRunning) {
        // Starting a new timer
        window.timerState.isRunning = true;
        window.timerState.startTime = Date.now() - (window.timerState.elapsedBeforePause * 1000);
        window.timerState.elapsedBeforePause = 0;
        
        // Create a new session record if starting a focus session
        if (!window.timerState.isBreak) {
            window.sessionData.currentSession = {
                start: new Date(),
                plannedDuration: window.timerState.focusTime,
                actualDuration: 0,
                isCompleted: false,
                flowStateDuration: 0,
                type: 'focus'
            };
        } else {
            window.sessionData.currentSession = {
                start: new Date(),
                plannedDuration: window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime,
                actualDuration: 0,
                isCompleted: false,
                type: 'break'
            };
        }
    } else {
        // Resuming from pause
        window.timerState.isPaused = false;
        window.timerState.startTime = Date.now() - (window.timerState.elapsedBeforePause * 1000);
    }
    
    // Update UI
    if (startButton) startButton.disabled = true;
    if (pauseButton) pauseButton.disabled = false;
    if (skipButton) skipButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
    
    window.timerState.timerInterval = setInterval(() => window.updateTimer(), 1000);
    if (timerStatusElement) {
        timerStatusElement.textContent = window.timerState.isBreak ? 'Taking a break' : 'Focusing';
    }
    
    console.log('Timer started successfully');
};

/**
 * Pause the timer
 */
function pauseTimer(elements) {
    const { startButton, pauseButton, timerStatusElement } = elements;
    
    if (!window.timerState.isRunning || window.timerState.isPaused) return;
    
    clearInterval(window.timerState.timerInterval);
    window.timerState.isPaused = true;
    window.timerState.elapsedBeforePause = window.getElapsedSeconds();
    
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
    
    const elapsedSeconds = window.getElapsedSeconds();
    const timeLeft = window.timerState.isBreak 
        ? (window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime) - elapsedSeconds
        : window.timerState.focusTime - elapsedSeconds;
    
    // Check if timer has ended
    if (timeLeft <= 0 && window.timerState.isBreak) {
        // Break ended, switch to focus mode
        clearInterval(window.timerState.timerInterval);
        completeSessionCallback('break');
        return;
    }
    
    // Check for flow state (continuing past the planned focus time)
    if (!window.timerState.isBreak && elapsedSeconds > window.timerState.focusTime) {
        if (!window.timerState.isFlowState) {
            enterFlowStateCallback();
        }
        // Update flow state information
        const flowSeconds = elapsedSeconds - window.timerState.focusTime;
        updateFlowStateCallback(flowSeconds);
    }
    
    // Update timer display
    window.timerState.currentSeconds = Math.max(0, window.timerState.isBreak 
        ? (window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime) - elapsedSeconds
        : window.timerState.isFlowState ? -(elapsedSeconds - window.timerState.focusTime) : window.timerState.focusTime - elapsedSeconds);
    
    window.updateTimerDisplay(timerTimeElement);
    window.updateProgressRing(progressRingCircle, elapsedSeconds);
}

/**
 * Enter flow state - user has continued past the focus time
 */
function enterFlowState(elements) {
    const { timerLabelElement, timerStatusElement, progressRingCircle } = elements;
    
    window.timerState.isFlowState = true;
    if (timerLabelElement) timerLabelElement.textContent = 'Flow State';
    if (timerStatusElement) timerStatusElement.textContent = 'In flow state - timer continues';
    
    // Visual indication
    if (window.timerState.enableVisualCues && progressRingCircle) {
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
        focusTime: window.timerState.focusTime || 25 * 60,
        breakTime: window.timerState.breakTime || 5 * 60,
        longBreakTime: window.timerState.longBreakTime || 15 * 60,
        sessionsBeforeLongBreak: window.timerState.sessionsBeforeLongBreak || 4,
        enableVisualCues: window.timerState.enableVisualCues !== undefined ? window.timerState.enableVisualCues : true,
        enableSoundNotifications: window.timerState.enableSoundNotifications !== undefined ? window.timerState.enableSoundNotifications : false,
        visualCueIntensity: window.timerState.visualCueIntensity || 5,
        theme: window.timerState.theme || 'dark',
        accentColor: window.timerState.accentColor || '#0a84ff'
    } : null;
    
    // Clear timer interval if running
    if (window.timerState.timerInterval) {
        clearInterval(window.timerState.timerInterval);
    }
    
    // Get default state
    const defaultState = createDefaultTimerState();
    
    // Reset to default state by updating properties instead of replacing the object
    Object.assign(window.timerState, defaultState);
    
    // Restore settings if needed
    if (preserveSettings && currentSettings) {
        window.timerState.focusTime = currentSettings.focusTime;
        window.timerState.breakTime = currentSettings.breakTime;
        window.timerState.longBreakTime = currentSettings.longBreakTime;
        window.timerState.sessionsBeforeLongBreak = currentSettings.sessionsBeforeLongBreak;
        window.timerState.enableVisualCues = currentSettings.enableVisualCues;
        window.timerState.enableSoundNotifications = currentSettings.enableSoundNotifications;
        window.timerState.visualCueIntensity = currentSettings.visualCueIntensity;
        window.timerState.theme = currentSettings.theme;
        window.timerState.accentColor = currentSettings.accentColor;
        window.timerState.currentSeconds = currentSettings.focusTime;
    }
    
    console.log('Timer state reset with settings preserved:', preserveSettings);
    console.log('Timer state is now:', window.timerState);
    return window.timerState;
}

/**
 * Reset session data
 */
function resetSessionData() {
    console.log('Resetting session data');
    const defaultSessionData = createDefaultSessionData();
    
    // Reset by updating properties instead of replacing the object
    Object.assign(window.sessionData, defaultSessionData);
    
    console.log('Session data reset');
    console.log('Session data is now:', window.sessionData);
    return window.sessionData;
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

// Pause timer function
window.pauseTimer = function() {
    console.log('Pause timer called');
    
    if (!window.timerState.isRunning || window.timerState.isPaused) return;
    
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const timerStatusElement = document.getElementById('timerStatus');
    
    clearInterval(window.timerState.timerInterval);
    window.timerState.isPaused = true;
    window.timerState.elapsedBeforePause = window.getElapsedSeconds();
    
    // Update UI
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (timerStatusElement) timerStatusElement.textContent = 'Paused';
    
    console.log('Timer paused successfully');
};

// Update timer function - called by the interval
window.updateTimer = function() {
    console.log('Update timer called');
    
    const progressRingCircle = document.querySelector('.progress-ring-circle');
    const timerTimeElement = document.getElementById('timerTime');
    const timerLabelElement = document.getElementById('timerLabel');
    const timerStatusElement = document.getElementById('timerStatus');
    
    const elapsedSeconds = window.getElapsedSeconds();
    const timeLeft = window.timerState.isBreak 
        ? (window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime) - elapsedSeconds
        : window.timerState.focusTime - elapsedSeconds;
    
    // Check if timer has ended
    if (timeLeft <= 0 && window.timerState.isBreak) {
        // Break ended, switch to focus mode
        clearInterval(window.timerState.timerInterval);
        window.completeSession('break');
        return;
    }
    
    // Check for flow state (continuing past the planned focus time)
    if (!window.timerState.isBreak && elapsedSeconds > window.timerState.focusTime) {
        if (!window.timerState.isFlowState) {
            window.enterFlowState();
        }
        // Update flow state information
        const flowSeconds = elapsedSeconds - window.timerState.focusTime;
        window.updateFlowStateInfo(flowSeconds);
    }
    
    // Update timer display
    window.timerState.currentSeconds = Math.max(0, window.timerState.isBreak 
        ? (window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime) - elapsedSeconds
        : window.timerState.isFlowState ? -(elapsedSeconds - window.timerState.focusTime) : window.timerState.focusTime - elapsedSeconds);
    
    window.updateTimerDisplay(timerTimeElement);
    window.updateProgressRing(progressRingCircle, elapsedSeconds);
    
    console.log('Timer updated successfully');
};

// Enter flow state function
window.enterFlowState = function() {
    console.log('Enter flow state called');
    
    const timerLabelElement = document.getElementById('timerLabel');
    const timerStatusElement = document.getElementById('timerStatus');
    const progressRingCircle = document.querySelector('.progress-ring-circle');
    
    window.timerState.isFlowState = true;
    if (timerLabelElement) timerLabelElement.textContent = 'Flow State';
    if (timerStatusElement) timerStatusElement.textContent = 'In flow state - timer continues';
    
    // Visual indication
    if (window.timerState.enableVisualCues && progressRingCircle) {
        progressRingCircle.classList.add('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--warning-color)';
    }
    
    console.log('Entered flow state successfully');
};

// Update flow state info
window.updateFlowStateInfo = function(flowSeconds) {
    console.log('Update flow state info called with', flowSeconds, 'seconds');
    
    const flowStateInfoElement = document.getElementById('flowStateInfo');
    const minutes = Math.floor(flowSeconds / 60);
    
    if (flowStateInfoElement) {
        flowStateInfoElement.textContent = `Flow state: +${minutes}m`;
    }
    
    if (window.sessionData.currentSession) {
        window.sessionData.currentSession.flowStateDuration = flowSeconds;
    }
    
    console.log('Flow state info updated successfully');
};

// Handle skip button click
window.handleSkipButton = function() {
    console.log('Handle skip button called');
    
    if (window.timerState.isBreak) {
        window.skipToWork();
    } else {
        window.skipToBreak();
    }
    
    console.log('Skip button handled successfully');
};

// Skip to break
window.skipToBreak = function() {
    console.log('Skip to break called');
    
    if (!window.timerState.isRunning || window.timerState.isBreak) return;
    
    // Save current state for undo
    window.saveStateForUndo('skipToBreak');
    
    // Complete the current focus session
    clearInterval(window.timerState.timerInterval);
    window.completeSession('focus');
    window.switchToBreakMode();
    
    console.log('Skipped to break successfully');
};

// Skip to work
window.skipToWork = function() {
    console.log('Skip to work called');
    
    if (!window.timerState.isRunning || !window.timerState.isBreak) return;
    
    // Save current state for undo
    window.saveStateForUndo('skipToWork');
    
    // Complete the current break session
    clearInterval(window.timerState.timerInterval);
    window.completeSession('break');
    window.switchToFocusMode();
    
    console.log('Skipped to work successfully');
};

// Switch to focus mode
window.switchToFocusMode = function() {
    console.log('Switching to focus mode');
    
    window.timerState.isRunning = false;
    window.timerState.isPaused = false;
    window.timerState.isBreak = false;
    window.timerState.isFlowState = false;
    window.timerState.elapsedBeforePause = 0;
    window.timerState.currentSeconds = window.timerState.focusTime;
    
    const timerLabelElement = document.getElementById('timerLabel');
    const timerTimeElement = document.getElementById('timerTime');
    const timerStatusElement = document.getElementById('timerStatus');
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const skipButton = document.getElementById('skipBtn');
    const resetButton = document.getElementById('resetBtn');
    const undoButton = document.getElementById('undoBtn');
    const progressRingCircle = document.querySelector('.progress-ring-circle');
    const flowStateInfoElement = document.getElementById('flowStateInfo');
    
    // Update UI
    if (timerLabelElement) timerLabelElement.textContent = 'Focus Time';
    if (timerStatusElement) timerStatusElement.textContent = 'Ready to start';
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (skipButton) {
        skipButton.disabled = true;
        skipButton.textContent = 'Skip to Break';
    }
    if (resetButton) resetButton.disabled = true;
    if (undoButton) undoButton.disabled = !window.timerState.lastAction;
    
    if (progressRingCircle) {
        progressRingCircle.classList.remove('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--focus-color)';
    }
    
    if (flowStateInfoElement) flowStateInfoElement.textContent = '';
    
    // Reset progress ring
    window.updateProgressRing(progressRingCircle, 0);
    window.updateTimerDisplay(timerTimeElement);
    
    console.log('Switch to focus mode completed');
};

// Switch to break mode
window.switchToBreakMode = function() {
    console.log('Switching to break mode');
    
    window.timerState.isRunning = false;
    window.timerState.isPaused = false;
    window.timerState.isBreak = true;
    window.timerState.isFlowState = false;
    window.timerState.elapsedBeforePause = 0;
    
    // Check if it's time for a long break
    window.timerState.isLongBreak = window.timerState.completedSessions % window.timerState.sessionsBeforeLongBreak === 0 
                           && window.timerState.completedSessions > 0;
    
    window.timerState.currentSeconds = window.timerState.isLongBreak ? window.timerState.longBreakTime : window.timerState.breakTime;
    
    const timerLabelElement = document.getElementById('timerLabel');
    const timerStatusElement = document.getElementById('timerStatus');
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const skipButton = document.getElementById('skipBtn');
    const resetButton = document.getElementById('resetBtn');
    const undoButton = document.getElementById('undoBtn');
    const progressRingCircle = document.querySelector('.progress-ring-circle');
    const flowStateInfoElement = document.getElementById('flowStateInfo');
    
    // Update UI
    if (timerLabelElement) timerLabelElement.textContent = window.timerState.isLongBreak ? 'Long Break' : 'Break Time';
    if (timerStatusElement) timerStatusElement.textContent = 'Ready to start break';
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (skipButton) {
        skipButton.disabled = true;
        skipButton.textContent = 'Skip to Focus';
    }
    if (resetButton) resetButton.disabled = true;
    if (undoButton) undoButton.disabled = !window.timerState.lastAction;
    
    if (progressRingCircle) {
        progressRingCircle.classList.remove('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--break-color)';
    }
    
    if (flowStateInfoElement) flowStateInfoElement.textContent = '';
    
    // Reset progress ring
    window.updateProgressRing(progressRingCircle, 0);
    window.updateTimerDisplay(document.getElementById('timerTime'));
    
    console.log('Switch to break mode completed');
};

// Complete session
window.completeSession = function(type) {
    console.log('Complete session called with type:', type);
    
    if (!window.sessionData.currentSession) return;
    
    const endTime = new Date();
    const elapsedSeconds = window.getElapsedSeconds();
    
    window.sessionData.currentSession.end = endTime;
    window.sessionData.currentSession.actualDuration = elapsedSeconds;
    window.sessionData.currentSession.isCompleted = true;
    
    window.sessionData.sessions.push(window.sessionData.currentSession);
    window.sessionData.currentSession = null;
    
    if (type === 'focus') {
        window.timerState.completedSessions++;
        window.updateSessionCount();
    }
    
    // Save session data to localStorage
    window.saveSessionData();
    
    console.log('Session completed successfully');
};

// Reset current session
window.resetCurrentSession = function() {
    console.log('Reset current session called');
    
    if (!window.timerState.isRunning) return;
    
    // Save current state for undo
    window.saveStateForUndo('reset');
    
    // Clear current timer
    clearInterval(window.timerState.timerInterval);
    
    // Reset to beginning of current mode
    if (window.timerState.isBreak) {
        window.switchToBreakMode();
    } else {
        window.switchToFocusMode();
    }
    
    const timerStatusElement = document.getElementById('timerStatus');
    if (timerStatusElement) {
        timerStatusElement.textContent = 'Session reset';
        setTimeout(() => {
            timerStatusElement.textContent = 'Ready to start';
        }, 1500);
    }
    
    console.log('Current session reset successfully');
};

// Save session data
window.saveSessionData = function() {
    console.log('Save session data called');
    
    try {
        localStorage.setItem('flowTimerSessionData', JSON.stringify(window.sessionData));
        console.log('Session data saved successfully');
    } catch (error) {
        console.error('Error saving session data:', error);
    }
};

// Full App Reset Function
window.fullReset = function() {
    console.log('Full reset function called');
    
    // Clear all session data and reset timer state
    window.resetSessionData();
    window.resetTimerState(true);
    
    // Update UI
    window.updateTimerDisplay(document.getElementById('timerTime'));
    window.updateSessionCount();
    
    const progressRingCircle = document.querySelector('.progress-ring-circle');
    const timerStatusElement = document.getElementById('timerStatus');
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const skipButton = document.getElementById('skipBtn');
    const resetButton = document.getElementById('resetBtn');
    const undoButton = document.getElementById('undoBtn');
    
    if (progressRingCircle) {
        progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
        progressRingCircle.style.strokeDashoffset = CIRCUMFERENCE;
        progressRingCircle.style.stroke = 'var(--focus-color)';
        progressRingCircle.classList.remove('subtle-pulse');
    }
    
    // Update timer status
    if (timerStatusElement) {
        timerStatusElement.textContent = 'All data reset. Ready to start fresh.';
    }
    
    // Reset buttons
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (skipButton) skipButton.disabled = true;
    if (resetButton) resetButton.disabled = true;
    if (undoButton) undoButton.disabled = true;
    
    // Save the cleared data
    window.saveSessionData();
    
    // Close modal if open
    window.closeModal();
    
    console.log('Full reset completed');
};

// Update session count
window.updateSessionCount = function() {
    console.log('Update session count called');
    
    const sessionCountElement = document.getElementById('sessionCount');
    if (sessionCountElement) {
        sessionCountElement.textContent = window.timerState.completedSessions;
    }
    
    console.log('Session count updated successfully');
};

// Save state for undo functionality
window.saveStateForUndo = function(actionType) {
    console.log('Save state for undo called with action type:', actionType);
    
    window.timerState.lastAction = {
        type: actionType,
        isBreak: window.timerState.isBreak,
        isRunning: window.timerState.isRunning,
        isPaused: window.timerState.isPaused,
        isFlowState: window.timerState.isFlowState,
        currentSeconds: window.timerState.currentSeconds,
        elapsedBeforePause: window.timerState.elapsedBeforePause,
        startTime: window.timerState.startTime,
        sessionData: window.sessionData.currentSession ? {...window.sessionData.currentSession} : null
    };
    
    // Enable undo button
    const undoButton = document.getElementById('undoBtn');
    if (undoButton) {
        undoButton.disabled = false;
    }
    
    console.log('State saved for undo successfully');
};

// Modal functions
window.openModal = function() {
    console.log('Opening modal');
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.add('active');
        console.log('Modal opened');
    } else {
        console.error('Modal element not found');
    }
};

window.closeModal = function() {
    console.log('Closing modal');
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('Modal closed');
    } else {
        console.error('Modal element not found');
    }
}; 
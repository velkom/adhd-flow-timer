// DOM Elements
let timerTimeElement;
let timerLabelElement;
let timerStatusElement;
let startButton;
let pauseButton;
let skipButton;
let resetButton;
let undoButton;
let sessionCountElement;
let flowStateInfoElement;
let progressRingCircle;
let themeToggleButton;
let navLinks;
let viewSections;

// Chart elements
let sessionDurationChart;
let focusVsBreakChart;

// Directly reference the CIRCUMFERENCE constant
const CIRCUMFERENCE = 2 * Math.PI * 120; // Fallback value in case TimerModule is not loaded

// Global references to timer state and session data
let timerState;
let sessionData;

// Helper functions to access timer state and session data
function getTimerState() {
    return timerState;
}

function getSessionData() {
    return sessionData;
}

// Initialize
function init() {
    console.log('Initializing app...');
    
    try {
        // Setup basic references
        timerTimeElement = document.getElementById('timerTime');
        timerLabelElement = document.getElementById('timerLabel');
        timerStatusElement = document.getElementById('timerStatus');
        startButton = document.getElementById('startBtn');
        pauseButton = document.getElementById('pauseBtn');
        skipButton = document.getElementById('skipBtn');
        resetButton = document.getElementById('resetBtn');
        undoButton = document.getElementById('undoBtn');
        sessionCountElement = document.getElementById('sessionCount');
        flowStateInfoElement = document.getElementById('flowStateInfo');
        progressRingCircle = document.querySelector('.progress-ring-circle');
        themeToggleButton = document.getElementById('themeToggle');
        navLinks = document.querySelectorAll('.nav-link');
        viewSections = document.querySelectorAll('.view-section');
        
        console.log('Element references:', {
            timerTimeElement: !!timerTimeElement,
            timerLabelElement: !!timerLabelElement,
            timerStatusElement: !!timerStatusElement,
            startButton: !!startButton,
            pauseButton: !!pauseButton,
            skipButton: !!skipButton,
            resetButton: !!resetButton,
            undoButton: !!undoButton,
            sessionCountElement: !!sessionCountElement,
            flowStateInfoElement: !!flowStateInfoElement,
            progressRingCircle: !!progressRingCircle,
            themeToggleButton: !!themeToggleButton
        });
        
        // Check if TimerModule is accessible
        if (!window.TimerModule) {
            console.error('TimerModule not found! Make sure timer-logic.js is loaded before app.js');
            return;
        }
        
        console.log('TimerModule found:', {
            timerState: !!window.TimerModule.timerState,
            sessionData: !!window.TimerModule.sessionData,
            CIRCUMFERENCE: window.TimerModule.CIRCUMFERENCE
        });
        
        // Set global references to timer state and session data
        timerState = window.TimerModule.timerState;
        sessionData = window.TimerModule.sessionData;
        
        // Setup chart references
        sessionDurationChart = document.getElementById('sessionDurationChart');
        focusVsBreakChart = document.getElementById('focusVsBreakChart');
        
        // Initialize the progress ring
        if (progressRingCircle) {
            progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
            progressRingCircle.style.strokeDashoffset = CIRCUMFERENCE;
            console.log('Progress ring initialized');
        } else {
            console.error('Progress ring not found during initialization');
        }
        
        // Load stored settings
        loadSettings();
        
        // Load session data
        loadSessionData();
        
        // Update UI
        updateTimerDisplay();
        updateSessionCount();
        updateSettingsForm();
        applyTheme();
        setupVisualCueListeners();
        updateVisualCuePreview();
        
        // Setup event listeners
        setupEventListeners();
        setupModalListeners();
        
        console.log('Initialization complete. Current state:', {
            timerState: {
                isRunning: getTimerState().isRunning,
                isPaused: getTimerState().isPaused,
                isBreak: getTimerState().isBreak,
                currentSeconds: getTimerState().currentSeconds
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Timer controls - use direct onclick handlers for better reliability
    if (startButton) {
        startButton.onclick = function(e) {
            console.log('Start button clicked (direct handler)');
            startTimer();
        };
        console.log('Start button handler set up');
    } else {
        console.error('Start button not found');
    }
    
    if (pauseButton) {
        pauseButton.onclick = function(e) {
            console.log('Pause button clicked (direct handler)');
            pauseTimer();
        };
        console.log('Pause button handler set up');
    } else {
        console.error('Pause button not found');
    }
    
    if (skipButton) {
        skipButton.onclick = function(e) {
            console.log('Skip button clicked (direct handler)');
            handleSkipButton();
        };
        console.log('Skip button handler set up');
    } else {
        console.error('Skip button not found');
    }
    
    if (resetButton) {
        resetButton.onclick = function(e) {
            console.log('Reset button clicked (direct handler)');
            resetCurrentSession();
        };
        console.log('Reset button handler set up');
    } else {
        console.error('Reset button not found');
    }
    
    if (undoButton) {
        undoButton.onclick = function(e) {
            console.log('Undo button clicked (direct handler)');
            undoLastAction();
        };
        console.log('Undo button handler set up');
    } else {
        console.error('Undo button not found');
    }
    
    // Navigation
    if (navLinks && navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const view = link.getAttribute('data-view');
                console.log('Navigation clicked: ' + view);
                changeView(view);
            });
        });
    } else {
        console.error('Nav links not found');
    }
    
    // Theme toggle
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', function(e) {
            console.log('Theme toggle clicked');
            toggleTheme();
        });
    } else {
        console.error('Theme toggle button not found');
    }
    
    // Settings form
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function(e) {
            console.log('Save settings clicked');
            saveSettings();
        });
    }
    
    const resetSettingsBtn = document.getElementById('resetSettings');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function(e) {
            console.log('Reset settings clicked');
            resetSettings();
        });
    }
    
    // Analytics timeframe buttons
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    if (timeframeButtons && timeframeButtons.length > 0) {
        timeframeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const timeframe = btn.getAttribute('data-timeframe');
                console.log('Timeframe clicked: ' + timeframe);
                updateAnalyticsView(timeframe);
                
                // Update active state
                timeframeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    // Export data button
    const exportDataBtn = document.getElementById('exportData');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function(e) {
            console.log('Export data clicked');
            exportSessionData();
        });
    }
}

// Timer Functions
function startTimer() {
    console.log('Start timer called');
    console.log('Current timerState:', {
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        isBreak: getTimerState().isBreak,
        currentSeconds: getTimerState().currentSeconds
    });
    
    const elements = {
        startButton,
        pauseButton,
        skipButton,
        resetButton,
        timerStatusElement
    };
    
    const callbacks = {
        updateTimerCallback: updateTimer,
        updateFlowStateCallback: updateFlowStateInfo
    };
    
    console.log('Calling TimerModule.startTimer with elements:', {
        startButton: !!elements.startButton,
        pauseButton: !!elements.pauseButton,
        skipButton: !!elements.skipButton,
        resetButton: !!elements.resetButton,
        timerStatusElement: !!elements.timerStatusElement
    });
    
    window.TimerModule.startTimer(elements, callbacks);
    
    console.log('TimerModule.startTimer completed, timerState:', {
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        timerInterval: !!getTimerState().timerInterval
    });
}

function pauseTimer() {
    console.log('Pause timer called');
    
    const elements = {
        startButton,
        pauseButton,
        timerStatusElement
    };
    
    window.TimerModule.pauseTimer(elements);
}

function updateTimer() {
    console.log('Update timer called');
    
    const elements = {
        progressRingCircle,
        timerTimeElement,
        timerLabelElement,
        timerStatusElement
    };
    
    const callbacks = {
        completeSessionCallback: completeSession,
        enterFlowStateCallback: enterFlowState,
        updateFlowStateCallback: updateFlowStateInfo
    };
    
    window.TimerModule.updateTimerInternal(elements, callbacks);
}

function handleTimerEnd() {
    if (getTimerState().isBreak) {
        // Break ended, switch to focus mode
        clearInterval(getTimerState().timerInterval);
        completeSession('break');
        switchToFocusMode();
    } else {
        // Focus time ended, but don't interrupt - enter flow state
        if (!getTimerState().isFlowState) {
            enterFlowState();
        }
    }
}

function enterFlowState() {
    console.log('Enter flow state called');
    
    const elements = {
        timerLabelElement,
        timerStatusElement,
        progressRingCircle
    };
    
    window.TimerModule.enterFlowState(elements);
    
    // Sound notification
    if (getTimerState().enableSoundNotifications) {
        playSound('flow');
    }
}

function updateFlowStateInfo(flowSeconds) {
    const minutes = Math.floor(flowSeconds / 60);
    if (flowStateInfoElement) {
        flowStateInfoElement.textContent = `Flow state: +${minutes}m`;
    }
    
    if (getSessionData().currentSession) {
        getSessionData().currentSession.flowStateDuration = flowSeconds;
    }
}

function handleSkipButton() {
    if (getTimerState().isBreak) {
        skipToWork();
    } else {
        skipToBreak();
    }
}

function skipToBreak() {
    if (!getTimerState().isRunning || getTimerState().isBreak) return;
    
    // Save current state for undo
    saveStateForUndo('skipToBreak');
    
    // Complete the current focus session
    clearInterval(getTimerState().timerInterval);
    completeSession('focus');
    switchToBreakMode();
}

function skipToWork() {
    if (!getTimerState().isRunning || !getTimerState().isBreak) return;
    
    // Save current state for undo
    saveStateForUndo('skipToWork');
    
    // Complete the current break session
    clearInterval(getTimerState().timerInterval);
    completeSession('break');
    switchToFocusMode();
}

function switchToFocusMode() {
    console.log('Switching to focus mode');
    
    getTimerState().isRunning = false;
    getTimerState().isPaused = false;
    getTimerState().isBreak = false;
    getTimerState().isFlowState = false;
    getTimerState().elapsedBeforePause = 0;
    getTimerState().currentSeconds = getTimerState().focusTime;
    
    console.log('Focus mode timerState updated:', {
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        isBreak: getTimerState().isBreak,
        currentSeconds: getTimerState().currentSeconds
    });
    
    // Update UI
    if (timerLabelElement) {
        timerLabelElement.textContent = 'Focus Time';
        console.log('Timer label updated');
    } else {
        console.error('Timer label element not found');
    }
    
    if (timerStatusElement) {
        timerStatusElement.textContent = 'Ready to start';
        console.log('Timer status updated');
    } else {
        console.error('Timer status element not found');
    }
    
    if (startButton) {
        startButton.disabled = false;
        console.log('Start button enabled');
    } else {
        console.error('Start button not found');
    }
    
    if (pauseButton) {
        pauseButton.disabled = true;
        console.log('Pause button disabled');
    } else {
        console.error('Pause button not found');
    }
    
    if (skipButton) {
        skipButton.disabled = true;
        skipButton.textContent = 'Skip to Break';
        console.log('Skip button updated');
    } else {
        console.error('Skip button not found');
    }
    
    if (resetButton) {
        resetButton.disabled = true;
        console.log('Reset button disabled');
    } else {
        console.error('Reset button not found');
    }
    
    if (undoButton) {
        undoButton.disabled = !getTimerState().lastAction;
        console.log('Undo button updated');
    } else {
        console.error('Undo button not found');
    }
    
    if (progressRingCircle) {
        progressRingCircle.classList.remove('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--focus-color)';
        console.log('Progress ring updated');
    } else {
        console.error('Progress ring not found');
    }
    
    if (flowStateInfoElement) {
        flowStateInfoElement.textContent = '';
        console.log('Flow state info cleared');
    } else {
        console.error('Flow state info element not found');
    }
    
    // Reset progress ring
    updateProgressRing(0);
    updateTimerDisplay();
    console.log('Switch to focus mode completed');
}

function switchToBreakMode() {
    getTimerState().isRunning = false;
    getTimerState().isPaused = false;
    getTimerState().isBreak = true;
    getTimerState().isFlowState = false;
    getTimerState().elapsedBeforePause = 0;
    
    // Check if it's time for a long break
    getTimerState().isLongBreak = getTimerState().completedSessions % getTimerState().sessionsBeforeLongBreak === 0 
                             && getTimerState().completedSessions > 0;
    
    getTimerState().currentSeconds = getTimerState().isLongBreak ? getTimerState().longBreakTime : getTimerState().breakTime;
    
    // Update UI
    timerLabelElement.textContent = getTimerState().isLongBreak ? 'Long Break' : 'Break Time';
    timerStatusElement.textContent = 'Ready to start break';
    startButton.disabled = false;
    pauseButton.disabled = true;
    skipButton.disabled = true;
    skipButton.textContent = 'Skip to Focus';
    resetButton.disabled = true;
    undoButton.disabled = !getTimerState().lastAction;
    progressRingCircle.classList.remove('subtle-pulse');
    progressRingCircle.style.stroke = 'var(--break-color)';
    flowStateInfoElement.textContent = '';
    
    // Reset progress ring
    updateProgressRing(0);
    updateTimerDisplay();
}

function completeSession(type) {
    if (!getSessionData().currentSession) return;
    
    const endTime = new Date();
    const elapsedSeconds = getElapsedSeconds();
    
    getSessionData().currentSession.end = endTime;
    getSessionData().currentSession.actualDuration = elapsedSeconds;
    getSessionData().currentSession.isCompleted = true;
    
    getSessionData().sessions.push(getSessionData().currentSession);
    getSessionData().currentSession = null;
    
    if (type === 'focus') {
        getTimerState().completedSessions++;
        updateSessionCount();
    }
    
    // Save session data to localStorage
    saveSessionData();
    
    // If analytics view is active, update it
    if (document.getElementById('analyticsView').classList.contains('active')) {
        updateAnalyticsView('day');
    }
}

// Helper Functions
function getElapsedSeconds() {
    return window.TimerModule.getElapsedSeconds();
}

function updateTimerDisplay() {
    window.TimerModule.updateTimerDisplay(timerTimeElement);
}

function updateProgressRing(elapsedSeconds) {
    window.TimerModule.updateProgressRing(progressRingCircle, elapsedSeconds);
}

function updateSessionCount() {
    sessionCountElement.textContent = getTimerState().completedSessions;
}

// Settings and Theme Functions
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('flowTimerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Update timer settings
            getTimerState().focusTime = settings.focusTime ?? 25 * 60;
            getTimerState().breakTime = settings.breakTime ?? 5 * 60;
            getTimerState().longBreakTime = settings.longBreakTime ?? 15 * 60;
            getTimerState().sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak ?? 4;
            
            // Update notification settings
            getTimerState().enableVisualCues = settings.enableVisualCues ?? true;
            getTimerState().enableSoundNotifications = settings.enableSoundNotifications ?? false;
            getTimerState().visualCueIntensity = settings.visualCueIntensity ?? 5;
            
            // Update theme settings
            getTimerState().theme = settings.theme ?? 'dark';
            getTimerState().accentColor = settings.accentColor ?? '#4C8BF5';
            
            // Update session count
            getTimerState().completedSessions = settings.completedSessions ?? 0;
            
            // Update current time
            getTimerState().currentSeconds = getTimerState().isBreak 
                ? (getTimerState().isLongBreak ? getTimerState().longBreakTime : getTimerState().breakTime)
                : getTimerState().focusTime;
            
            // Update form elements
            updateSettingsForm();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function saveSettings() {
    // Get values from settings form
    const focusTimeInput = document.getElementById('focusTime');
    const breakTimeInput = document.getElementById('breakTime');
    const longBreakTimeInput = document.getElementById('longBreakTime');
    const sessionsBeforeLongBreakInput = document.getElementById('sessionsBeforeLongBreak');
    const enableVisualCuesInput = document.getElementById('enableVisualCues');
    const enableSoundNotificationsInput = document.getElementById('enableSoundNotifications');
    const visualCueIntensityInput = document.getElementById('visualCueIntensity');
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const accentColorInput = document.getElementById('accentColor');
    
    // Update timer settings
    getTimerState().focusTime = parseInt(focusTimeInput.value, 10) * 60;
    getTimerState().breakTime = parseInt(breakTimeInput.value, 10) * 60;
    getTimerState().longBreakTime = parseInt(longBreakTimeInput.value, 10) * 60;
    getTimerState().sessionsBeforeLongBreak = parseInt(sessionsBeforeLongBreakInput.value, 10);
    
    // Update notification settings
    getTimerState().enableVisualCues = enableVisualCuesInput.checked;
    getTimerState().enableSoundNotifications = enableSoundNotificationsInput.checked;
    getTimerState().visualCueIntensity = parseInt(visualCueIntensityInput.value, 10);
    
    // Update theme settings
    let selectedTheme = 'dark';
    themeRadios.forEach(radio => {
        if (radio.checked) {
            selectedTheme = radio.value;
        }
    });
    getTimerState().theme = selectedTheme;
    getTimerState().accentColor = accentColorInput.value;
    
    // Save to localStorage
    const settingsToSave = {
        focusTime: getTimerState().focusTime,
        breakTime: getTimerState().breakTime,
        longBreakTime: getTimerState().longBreakTime,
        sessionsBeforeLongBreak: getTimerState().sessionsBeforeLongBreak,
        enableVisualCues: getTimerState().enableVisualCues,
        enableSoundNotifications: getTimerState().enableSoundNotifications,
        visualCueIntensity: getTimerState().visualCueIntensity,
        theme: getTimerState().theme,
        accentColor: getTimerState().accentColor,
        completedSessions: getTimerState().completedSessions
    };
    
    localStorage.setItem('flowTimerSettings', JSON.stringify(settingsToSave));
    
    // Update current timer if not running
    if (!getTimerState().isRunning) {
        getTimerState().currentSeconds = getTimerState().isBreak 
            ? (getTimerState().isLongBreak ? getTimerState().longBreakTime : getTimerState().breakTime)
            : getTimerState().focusTime;
        updateTimerDisplay();
    }
    
    // Apply theme
    applyTheme();
    
    // Show success message
    timerStatusElement.textContent = 'Settings saved';
    setTimeout(() => {
        timerStatusElement.textContent = getTimerState().isRunning 
            ? (getTimerState().isBreak ? 'Taking a break' : (getTimerState().isFlowState ? 'In flow state - timer continues' : 'Focusing'))
            : 'Ready to start';
    }, 1500);
    
    // Switch back to timer view
    changeView('timer');
}

function resetSettings() {
    // Reset to defaults
    getTimerState().focusTime = 25 * 60;
    getTimerState().breakTime = 5 * 60;
    getTimerState().longBreakTime = 15 * 60;
    getTimerState().sessionsBeforeLongBreak = 4;
    getTimerState().enableVisualCues = true;
    getTimerState().enableSoundNotifications = false;
    getTimerState().visualCueIntensity = 5;
    getTimerState().theme = 'dark';
    getTimerState().accentColor = '#4C8BF5';
    
    // Update form elements
    updateSettingsForm();
    
    // Apply theme
    applyTheme();
}

function updateSettingsForm() {
    // Update timer settings inputs
    const focusTimeInput = document.getElementById('focusTime');
    const breakTimeInput = document.getElementById('breakTime');
    const longBreakTimeInput = document.getElementById('longBreakTime');
    const sessionsBeforeLongBreakInput = document.getElementById('sessionsBeforeLongBreak');
    
    if (focusTimeInput) focusTimeInput.value = getTimerState().focusTime / 60;
    if (breakTimeInput) breakTimeInput.value = getTimerState().breakTime / 60;
    if (longBreakTimeInput) longBreakTimeInput.value = getTimerState().longBreakTime / 60;
    if (sessionsBeforeLongBreakInput) sessionsBeforeLongBreakInput.value = getTimerState().sessionsBeforeLongBreak;
    
    // Update notification settings inputs
    const enableVisualCuesInput = document.getElementById('enableVisualCues');
    const enableSoundNotificationsInput = document.getElementById('enableSoundNotifications');
    const visualCueIntensityInput = document.getElementById('visualCueIntensity');
    
    if (enableVisualCuesInput) enableVisualCuesInput.checked = getTimerState().enableVisualCues;
    if (enableSoundNotificationsInput) enableSoundNotificationsInput.checked = getTimerState().enableSoundNotifications;
    if (visualCueIntensityInput) visualCueIntensityInput.value = getTimerState().visualCueIntensity;
    
    // Update theme settings inputs
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const accentColorInput = document.getElementById('accentColor');
    
    if (themeRadios) {
        themeRadios.forEach(radio => {
            radio.checked = radio.value === getTimerState().theme;
        });
    }
    
    if (accentColorInput) accentColorInput.value = getTimerState().accentColor;
    
    // Add visual cue preview example
    updateVisualCuePreview();
}

function applyTheme() {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', getTimerState().theme);
    
    // Update accent color
    document.documentElement.style.setProperty('--accent-color', getTimerState().accentColor);
    document.documentElement.style.setProperty('--focus-color', getTimerState().accentColor);
    
    // Update theme toggle button
    themeToggleButton.textContent = getTimerState().theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    const newTheme = getTimerState().theme === 'dark' ? 'light' : 'dark';
    getTimerState().theme = newTheme;
    
    // Update radio buttons in settings if visible
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.checked = radio.value === getTimerState().theme;
    });
    
    // Apply theme
    applyTheme();
    
    // Save settings
    const settings = JSON.parse(localStorage.getItem('flowTimerSettings') || '{}');
    settings.theme = getTimerState().theme;
    localStorage.setItem('flowTimerSettings', JSON.stringify(settings));
}

// Navigation Functions
function changeView(view) {
    // Update nav links
    navLinks.forEach(link => {
        if (link.getAttribute('data-view') === view) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update view sections
    viewSections.forEach(section => {
        if (section.id === `${view}View`) {
            section.classList.add('active');
            
            // If switching to analytics, update the view
            if (view === 'analytics') {
                updateAnalyticsView('day');
            }
        } else {
            section.classList.remove('active');
        }
    });
}

// Data Storage Functions
function loadSessionData() {
    try {
        const savedSessionData = localStorage.getItem('flowTimerSessionData');
        if (savedSessionData) {
            const parsedData = JSON.parse(savedSessionData);
            
            // Parse date strings back to Date objects
            getSessionData().sessions = parsedData.sessions.map(session => {
                return {
                    ...session,
                    start: new Date(session.start),
                    end: session.end ? new Date(session.end) : null
                };
            });
            
            // Update session count if needed
            const focusSessions = getSessionData().sessions.filter(s => s.type === 'focus' && s.isCompleted);
            if (focusSessions.length > getTimerState().completedSessions) {
                getTimerState().completedSessions = focusSessions.length;
                updateSessionCount();
            }
        }
    } catch (error) {
        console.error('Error loading session data:', error);
    }
}

function saveSessionData() {
    try {
        localStorage.setItem('flowTimerSessionData', JSON.stringify(getSessionData()));
    } catch (error) {
        console.error('Error saving session data:', error);
    }
}

function exportSessionData() {
    try {
        // Create a blob with the data
        const dataStr = JSON.stringify(getSessionData(), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flow-timer-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    } catch (error) {
        console.error('Error exporting session data:', error);
    }
}

// Playback of subtle sound notifications
function playSound(type) {
    // This would be implemented with actual sound files
    console.log(`Playing ${type} sound`);
    
    // Example implementation with Web Audio API:
    /*
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure based on notification type
    switch (type) {
        case 'flow':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
            break;
        case 'break':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
            break;
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
    */
}

// Add function to update the visual cue preview
function updateVisualCuePreview() {
    const visualCuePreview = document.getElementById('visualCuePreview');
    if (!visualCuePreview) return;
    
    if (getTimerState().enableVisualCues) {
        visualCuePreview.classList.remove('hidden');
        
        // Set the intensity based on the slider
        const intensity = getTimerState().visualCueIntensity / 10;
        visualCuePreview.style.animation = `subtle-pulse ${3 - (intensity * 2)}s infinite`;
        visualCuePreview.style.opacity = 0.5 + (intensity * 0.5);
    } else {
        visualCuePreview.classList.add('hidden');
    }
}

// Add event listener for visual cue settings changes
function setupVisualCueListeners() {
    const visualCueIntensityInput = document.getElementById('visualCueIntensity');
    const enableVisualCuesInput = document.getElementById('enableVisualCues');
    
    if (visualCueIntensityInput) {
        visualCueIntensityInput.addEventListener('input', () => {
            getTimerState().visualCueIntensity = parseInt(visualCueIntensityInput.value, 10);
            updateVisualCuePreview();
        });
    }
    
    if (enableVisualCuesInput) {
        enableVisualCuesInput.addEventListener('change', () => {
            getTimerState().enableVisualCues = enableVisualCuesInput.checked;
            updateVisualCuePreview();
        });
    }
}

// Reset current session
function resetCurrentSession() {
    if (!getTimerState().isRunning) return;
    
    // Save current state for undo
    saveStateForUndo('reset');
    
    // Clear current timer
    clearInterval(getTimerState().timerInterval);
    
    // Reset to beginning of current mode
    if (getTimerState().isBreak) {
        switchToBreakMode();
    } else {
        switchToFocusMode();
    }
    
    timerStatusElement.textContent = 'Session reset';
    setTimeout(() => {
        timerStatusElement.textContent = 'Ready to start';
    }, 1500);
}

// Save current state for undo functionality
function saveStateForUndo(actionType) {
    getTimerState().lastAction = {
        type: actionType,
        isBreak: getTimerState().isBreak,
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        isFlowState: getTimerState().isFlowState,
        currentSeconds: getTimerState().currentSeconds,
        elapsedBeforePause: getTimerState().elapsedBeforePause,
        startTime: getTimerState().startTime,
        sessionData: getSessionData().currentSession ? {...getSessionData().currentSession} : null
    };
    
    // Enable undo button
    undoButton.disabled = false;
}

// Undo last action
function undoLastAction() {
    if (!getTimerState().lastAction) return;
    
    clearInterval(getTimerState().timerInterval);
    
    const lastAction = getTimerState().lastAction;
    
    // Restore previous state
    getTimerState().isBreak = lastAction.isBreak;
    getTimerState().isRunning = lastAction.isRunning;
    getTimerState().isPaused = lastAction.isPaused;
    getTimerState().isFlowState = lastAction.isFlowState;
    getTimerState().currentSeconds = lastAction.currentSeconds;
    getTimerState().elapsedBeforePause = lastAction.elapsedBeforePause;
    getTimerState().startTime = lastAction.startTime;
    
    // Restore session data
    if (lastAction.type === 'skipToBreak' || lastAction.type === 'skipToWork') {
        // Remove the last session if we just completed it
        if (getSessionData().sessions.length > 0) {
            getSessionData().sessions.pop();
        }
        
        // Restore the current session
        getSessionData().currentSession = lastAction.sessionData;
        
        // If we skipped to break, decrement the session count
        if (lastAction.type === 'skipToBreak') {
            getTimerState().completedSessions--;
            updateSessionCount();
        }
    }
    
    // Update UI based on restored state
    if (getTimerState().isBreak) {
        timerLabelElement.textContent = getTimerState().isLongBreak ? 'Long Break' : 'Break Time';
        progressRingCircle.style.stroke = 'var(--break-color)';
    } else {
        timerLabelElement.textContent = getTimerState().isFlowState ? 'Flow State' : 'Focus Time';
        if (getTimerState().isFlowState) {
            progressRingCircle.style.stroke = 'var(--warning-color)';
            progressRingCircle.classList.add('subtle-pulse');
        } else {
            progressRingCircle.style.stroke = 'var(--focus-color)';
            progressRingCircle.classList.remove('subtle-pulse');
        }
    }
    
    // Update timer display and buttons
    updateTimerDisplay();
    updateProgressRing(getTimerState().isRunning ? getElapsedSeconds() : 0);
    
    // Update button states
    startButton.disabled = getTimerState().isRunning && !getTimerState().isPaused;
    pauseButton.disabled = !getTimerState().isRunning || getTimerState().isPaused;
    skipButton.textContent = getTimerState().isBreak ? 'Skip to Focus' : 'Skip to Break';
    
    // Resume timer if it was running
    if (getTimerState().isRunning && !getTimerState().isPaused) {
        getTimerState().timerInterval = setInterval(updateTimer, 1000);
        timerStatusElement.textContent = getTimerState().isBreak ? 'Taking a break' : 
            (getTimerState().isFlowState ? 'In flow state - timer continues' : 'Focusing');
    } else if (getTimerState().isPaused) {
        timerStatusElement.textContent = 'Paused';
    } else {
        timerStatusElement.textContent = 'Ready to start';
    }
    
    // Clear the lastAction
    getTimerState().lastAction = null;
    undoButton.disabled = true;
    
    // Save the session data
    saveSessionData();
}

// Full App Reset Function
function fullReset() {
    console.log('Full reset function called');
    console.log('Initial timerState:', {
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        isBreak: getTimerState().isBreak,
        currentSeconds: getTimerState().currentSeconds,
        timerInterval: !!getTimerState().timerInterval
    });
    
    // Clear all session data and reset timer state
    const resetSessionResult = window.TimerModule.resetSessionData();
    console.log('Session data reset, returned:', !!resetSessionResult);
    
    const resetTimerResult = window.TimerModule.resetTimerState(true);
    console.log('Timer state reset, returned:', !!resetTimerResult);
    console.log('After reset, timerState:', {
        isRunning: getTimerState().isRunning,
        isPaused: getTimerState().isPaused,
        isBreak: getTimerState().isBreak,
        currentSeconds: getTimerState().currentSeconds,
        timerInterval: !!getTimerState().timerInterval
    });
    
    // Update UI
    updateTimerDisplay();
    updateSessionCount();
    
    if (progressRingCircle) {
        progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
        progressRingCircle.style.strokeDashoffset = CIRCUMFERENCE;
        progressRingCircle.style.stroke = 'var(--focus-color)';
        progressRingCircle.classList.remove('subtle-pulse');
        console.log('Progress ring updated');
    } else {
        console.error('Progress ring element not found');
    }
    
    // Update timer status
    if (timerStatusElement) {
        timerStatusElement.textContent = 'All data reset. Ready to start fresh.';
        console.log('Timer status updated');
    } else {
        console.error('Timer status element not found');
    }
    
    // Reset buttons
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
    if (skipButton) skipButton.disabled = true;
    if (resetButton) resetButton.disabled = true;
    if (undoButton) undoButton.disabled = true;
    console.log('Button states updated');
    
    // Save the cleared data
    saveSessionData();
    console.log('Session data saved');
    
    // Close modal if open
    closeModal();
    console.log('Modal closed');
    
    console.log('Full reset completed');
}

// Reset progress ring to starting position
function resetProgressRing() {
    progressRingCircle.style.strokeDashoffset = progressRingCircle.style.strokeDasharray;
    progressRingCircle.style.stroke = 'var(--focus-color)';
    progressRingCircle.classList.remove('subtle-pulse');
}

// Modal functions
function openModal() {
    console.log('Opening modal');
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.add('active');
        console.log('Modal opened');
    } else {
        console.error('Modal element not found');
    }
}

function closeModal() {
    console.log('Closing modal');
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('Modal closed');
    } else {
        console.error('Modal element not found');
    }
}

// Set up modal event listeners
function setupModalListeners() {
    console.log('Setting up modal listeners');
    
    const fullResetBtn = document.getElementById('fullResetBtn');
    const modal = document.getElementById('resetModal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelResetBtn');
    const confirmBtn = document.getElementById('confirmResetBtn');
    
    console.log('Modal elements:', {
        fullResetBtn: !!fullResetBtn,
        modal: !!modal,
        closeBtn: !!closeBtn,
        cancelBtn: !!cancelBtn,
        confirmBtn: !!confirmBtn
    });
    
    if (fullResetBtn) {
        fullResetBtn.onclick = function(e) {
            console.log('Full reset button clicked (direct handler)');
            openModal();
        };
        console.log('Full reset button handler set up');
    } else {
        console.error('Full reset button not found');
    }
    
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            console.log('Close modal button clicked (direct handler)');
            closeModal();
        };
        console.log('Modal close button handler set up');
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = function(e) {
            console.log('Cancel reset button clicked (direct handler)');
            closeModal();
        };
        console.log('Cancel reset button handler set up');
    }
    
    if (confirmBtn) {
        confirmBtn.onclick = function(e) {
            console.log('Confirm reset button clicked (direct handler)');
            console.log('Before fullReset, timerState exists:', !!getTimerState());
            fullReset();
            console.log('After fullReset, timerState exists:', !!getTimerState());
        };
        console.log('Confirm reset button handler set up');
    }
    
    // Close modal when clicking outside
    if (modal) {
        window.onclick = function(event) {
            if (event.target === modal) {
                console.log('Clicked outside modal - closing');
                closeModal();
            }
        };
    }
    
    // Close modal with Escape key
    document.onkeydown = function(event) {
        if (event.key === 'Escape' && modal && modal.classList.contains('active')) {
            console.log('Escape key pressed - closing modal');
            closeModal();
        }
    };
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // A small delay to ensure TimerModule is fully initialized
    setTimeout(function() {
        console.log('Initializing app after ensuring TimerModule is loaded');
        init();
    }, 100);
}); 
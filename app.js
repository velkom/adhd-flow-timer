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

// Timer state
let timerState = {
    isRunning: false,
    isPaused: false,
    isBreak: false,
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
    accentColor: '#4C8BF5'
};

// Session data for analytics
let sessionData = {
    sessions: [],
    currentSession: null
};

// Constants
const CIRCUMFERENCE = 2 * Math.PI * 120; // Circumference of the progress ring

// Initialize
function init() {
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
    
    // Setup chart references
    sessionDurationChart = document.getElementById('sessionDurationChart');
    focusVsBreakChart = document.getElementById('focusVsBreakChart');
    
    // Initialize the progress ring
    if (progressRingCircle) {
        progressRingCircle.style.strokeDasharray = CIRCUMFERENCE;
        progressRingCircle.style.strokeDashoffset = CIRCUMFERENCE;
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
    
    console.log('Initialization complete');
}

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Timer controls
    if (startButton) {
        startButton.addEventListener('click', function(e) {
            console.log('Start button clicked');
            startTimer();
        });
    } else {
        console.error('Start button not found');
    }
    
    if (pauseButton) {
        pauseButton.addEventListener('click', function(e) {
            console.log('Pause button clicked');
            pauseTimer();
        });
    } else {
        console.error('Pause button not found');
    }
    
    if (skipButton) {
        skipButton.addEventListener('click', function(e) {
            console.log('Skip button clicked');
            handleSkipButton();
        });
    } else {
        console.error('Skip button not found');
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            console.log('Reset button clicked');
            resetCurrentSession();
        });
    } else {
        console.error('Reset button not found');
    }
    
    if (undoButton) {
        undoButton.addEventListener('click', function(e) {
            console.log('Undo button clicked');
            undoLastAction();
        });
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
    startButton.disabled = true;
    pauseButton.disabled = false;
    skipButton.disabled = false;
    resetButton.disabled = false;
    
    timerState.timerInterval = setInterval(updateTimer, 1000);
    timerStatusElement.textContent = timerState.isBreak ? 'Taking a break' : 'Focusing';
}

function pauseTimer() {
    if (!timerState.isRunning || timerState.isPaused) return;
    
    clearInterval(timerState.timerInterval);
    timerState.isPaused = true;
    timerState.elapsedBeforePause = getElapsedSeconds();
    
    // Update UI
    startButton.disabled = false;
    pauseButton.disabled = true;
    timerStatusElement.textContent = 'Paused';
}

function updateTimer() {
    const elapsedSeconds = getElapsedSeconds();
    const timeLeft = timerState.isBreak 
        ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime) - elapsedSeconds
        : timerState.focusTime - elapsedSeconds;
    
    // Check if timer has ended
    if (timeLeft <= 0) {
        handleTimerEnd();
        return;
    }
    
    // Check for flow state (continuing past the planned focus time)
    if (!timerState.isBreak && elapsedSeconds > timerState.focusTime) {
        if (!timerState.isFlowState) {
            enterFlowState();
        }
        // Update flow state information
        updateFlowStateInfo(elapsedSeconds - timerState.focusTime);
    }
    
    // Update timer display
    timerState.currentSeconds = Math.max(0, timerState.isBreak 
        ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime) - elapsedSeconds
        : timerState.isFlowState ? -(elapsedSeconds - timerState.focusTime) : timerState.focusTime - elapsedSeconds);
    
    updateTimerDisplay();
    updateProgressRing(elapsedSeconds);
}

function handleTimerEnd() {
    if (timerState.isBreak) {
        // Break ended, switch to focus mode
        clearInterval(timerState.timerInterval);
        completeSession('break');
        switchToFocusMode();
    } else {
        // Focus time ended, but don't interrupt - enter flow state
        if (!timerState.isFlowState) {
            enterFlowState();
        }
    }
}

function enterFlowState() {
    timerState.isFlowState = true;
    timerLabelElement.textContent = 'Flow State';
    timerStatusElement.textContent = 'In flow state - timer continues';
    
    // Visual indication
    if (timerState.enableVisualCues) {
        progressRingCircle.classList.add('subtle-pulse');
        progressRingCircle.style.stroke = 'var(--warning-color)';
    }
    
    // Subtle notification
    if (timerState.enableSoundNotifications) {
        playSound('flow');
    }
}

function updateFlowStateInfo(flowSeconds) {
    const minutes = Math.floor(flowSeconds / 60);
    flowStateInfoElement.textContent = `Flow state: +${minutes}m`;
    
    if (sessionData.currentSession) {
        sessionData.currentSession.flowStateDuration = flowSeconds;
    }
}

function handleSkipButton() {
    if (timerState.isBreak) {
        skipToWork();
    } else {
        skipToBreak();
    }
}

function skipToBreak() {
    if (!timerState.isRunning || timerState.isBreak) return;
    
    // Save current state for undo
    saveStateForUndo('skipToBreak');
    
    // Complete the current focus session
    clearInterval(timerState.timerInterval);
    completeSession('focus');
    switchToBreakMode();
}

function skipToWork() {
    if (!timerState.isRunning || !timerState.isBreak) return;
    
    // Save current state for undo
    saveStateForUndo('skipToWork');
    
    // Complete the current break session
    clearInterval(timerState.timerInterval);
    completeSession('break');
    switchToFocusMode();
}

function switchToFocusMode() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    timerState.isBreak = false;
    timerState.isFlowState = false;
    timerState.elapsedBeforePause = 0;
    timerState.currentSeconds = timerState.focusTime;
    
    // Update UI
    timerLabelElement.textContent = 'Focus Time';
    timerStatusElement.textContent = 'Ready to start';
    startButton.disabled = false;
    pauseButton.disabled = true;
    skipButton.disabled = true;
    skipButton.textContent = 'Skip to Break';
    resetButton.disabled = true;
    undoButton.disabled = !timerState.lastAction;
    progressRingCircle.classList.remove('subtle-pulse');
    progressRingCircle.style.stroke = 'var(--focus-color)';
    flowStateInfoElement.textContent = '';
    
    // Reset progress ring
    updateProgressRing(0);
    updateTimerDisplay();
}

function switchToBreakMode() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    timerState.isBreak = true;
    timerState.isFlowState = false;
    timerState.elapsedBeforePause = 0;
    
    // Check if it's time for a long break
    timerState.isLongBreak = timerState.completedSessions % timerState.sessionsBeforeLongBreak === 0 
                             && timerState.completedSessions > 0;
    
    timerState.currentSeconds = timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime;
    
    // Update UI
    timerLabelElement.textContent = timerState.isLongBreak ? 'Long Break' : 'Break Time';
    timerStatusElement.textContent = 'Ready to start break';
    startButton.disabled = false;
    pauseButton.disabled = true;
    skipButton.disabled = true;
    skipButton.textContent = 'Skip to Focus';
    resetButton.disabled = true;
    undoButton.disabled = !timerState.lastAction;
    progressRingCircle.classList.remove('subtle-pulse');
    progressRingCircle.style.stroke = 'var(--break-color)';
    flowStateInfoElement.textContent = '';
    
    // Reset progress ring
    updateProgressRing(0);
    updateTimerDisplay();
}

function completeSession(type) {
    if (!sessionData.currentSession) return;
    
    const endTime = new Date();
    const elapsedSeconds = getElapsedSeconds();
    
    sessionData.currentSession.end = endTime;
    sessionData.currentSession.actualDuration = elapsedSeconds;
    sessionData.currentSession.isCompleted = true;
    
    sessionData.sessions.push(sessionData.currentSession);
    sessionData.currentSession = null;
    
    if (type === 'focus') {
        timerState.completedSessions++;
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
    return Math.floor((Date.now() - timerState.startTime) / 1000);
}

function updateTimerDisplay() {
    const absSeconds = Math.abs(timerState.currentSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    
    timerTimeElement.textContent = `${timerState.isFlowState ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgressRing(elapsedSeconds) {
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

function updateSessionCount() {
    sessionCountElement.textContent = timerState.completedSessions;
}

// Settings and Theme Functions
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('flowTimerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Update timer settings
            timerState.focusTime = settings.focusTime ?? 25 * 60;
            timerState.breakTime = settings.breakTime ?? 5 * 60;
            timerState.longBreakTime = settings.longBreakTime ?? 15 * 60;
            timerState.sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak ?? 4;
            
            // Update notification settings
            timerState.enableVisualCues = settings.enableVisualCues ?? true;
            timerState.enableSoundNotifications = settings.enableSoundNotifications ?? false;
            timerState.visualCueIntensity = settings.visualCueIntensity ?? 5;
            
            // Update theme settings
            timerState.theme = settings.theme ?? 'dark';
            timerState.accentColor = settings.accentColor ?? '#4C8BF5';
            
            // Update session count
            timerState.completedSessions = settings.completedSessions ?? 0;
            
            // Update current time
            timerState.currentSeconds = timerState.isBreak 
                ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime)
                : timerState.focusTime;
            
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
    timerState.focusTime = parseInt(focusTimeInput.value, 10) * 60;
    timerState.breakTime = parseInt(breakTimeInput.value, 10) * 60;
    timerState.longBreakTime = parseInt(longBreakTimeInput.value, 10) * 60;
    timerState.sessionsBeforeLongBreak = parseInt(sessionsBeforeLongBreakInput.value, 10);
    
    // Update notification settings
    timerState.enableVisualCues = enableVisualCuesInput.checked;
    timerState.enableSoundNotifications = enableSoundNotificationsInput.checked;
    timerState.visualCueIntensity = parseInt(visualCueIntensityInput.value, 10);
    
    // Update theme settings
    let selectedTheme = 'dark';
    themeRadios.forEach(radio => {
        if (radio.checked) {
            selectedTheme = radio.value;
        }
    });
    timerState.theme = selectedTheme;
    timerState.accentColor = accentColorInput.value;
    
    // Save to localStorage
    const settingsToSave = {
        focusTime: timerState.focusTime,
        breakTime: timerState.breakTime,
        longBreakTime: timerState.longBreakTime,
        sessionsBeforeLongBreak: timerState.sessionsBeforeLongBreak,
        enableVisualCues: timerState.enableVisualCues,
        enableSoundNotifications: timerState.enableSoundNotifications,
        visualCueIntensity: timerState.visualCueIntensity,
        theme: timerState.theme,
        accentColor: timerState.accentColor,
        completedSessions: timerState.completedSessions
    };
    
    localStorage.setItem('flowTimerSettings', JSON.stringify(settingsToSave));
    
    // Update current timer if not running
    if (!timerState.isRunning) {
        timerState.currentSeconds = timerState.isBreak 
            ? (timerState.isLongBreak ? timerState.longBreakTime : timerState.breakTime)
            : timerState.focusTime;
        updateTimerDisplay();
    }
    
    // Apply theme
    applyTheme();
    
    // Show success message
    timerStatusElement.textContent = 'Settings saved';
    setTimeout(() => {
        timerStatusElement.textContent = timerState.isRunning 
            ? (timerState.isBreak ? 'Taking a break' : (timerState.isFlowState ? 'In flow state - timer continues' : 'Focusing'))
            : 'Ready to start';
    }, 1500);
    
    // Switch back to timer view
    changeView('timer');
}

function resetSettings() {
    // Reset to defaults
    timerState.focusTime = 25 * 60;
    timerState.breakTime = 5 * 60;
    timerState.longBreakTime = 15 * 60;
    timerState.sessionsBeforeLongBreak = 4;
    timerState.enableVisualCues = true;
    timerState.enableSoundNotifications = false;
    timerState.visualCueIntensity = 5;
    timerState.theme = 'dark';
    timerState.accentColor = '#4C8BF5';
    
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
    
    if (focusTimeInput) focusTimeInput.value = timerState.focusTime / 60;
    if (breakTimeInput) breakTimeInput.value = timerState.breakTime / 60;
    if (longBreakTimeInput) longBreakTimeInput.value = timerState.longBreakTime / 60;
    if (sessionsBeforeLongBreakInput) sessionsBeforeLongBreakInput.value = timerState.sessionsBeforeLongBreak;
    
    // Update notification settings inputs
    const enableVisualCuesInput = document.getElementById('enableVisualCues');
    const enableSoundNotificationsInput = document.getElementById('enableSoundNotifications');
    const visualCueIntensityInput = document.getElementById('visualCueIntensity');
    
    if (enableVisualCuesInput) enableVisualCuesInput.checked = timerState.enableVisualCues;
    if (enableSoundNotificationsInput) enableSoundNotificationsInput.checked = timerState.enableSoundNotifications;
    if (visualCueIntensityInput) visualCueIntensityInput.value = timerState.visualCueIntensity;
    
    // Update theme settings inputs
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const accentColorInput = document.getElementById('accentColor');
    
    if (themeRadios) {
        themeRadios.forEach(radio => {
            radio.checked = radio.value === timerState.theme;
        });
    }
    
    if (accentColorInput) accentColorInput.value = timerState.accentColor;
    
    // Add visual cue preview example
    updateVisualCuePreview();
}

function applyTheme() {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', timerState.theme);
    
    // Update accent color
    document.documentElement.style.setProperty('--accent-color', timerState.accentColor);
    document.documentElement.style.setProperty('--focus-color', timerState.accentColor);
    
    // Update theme toggle button
    themeToggleButton.textContent = timerState.theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    const newTheme = timerState.theme === 'dark' ? 'light' : 'dark';
    timerState.theme = newTheme;
    
    // Update radio buttons in settings if visible
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.checked = radio.value === timerState.theme;
    });
    
    // Apply theme
    applyTheme();
    
    // Save settings
    const settings = JSON.parse(localStorage.getItem('flowTimerSettings') || '{}');
    settings.theme = timerState.theme;
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
            sessionData.sessions = parsedData.sessions.map(session => {
                return {
                    ...session,
                    start: new Date(session.start),
                    end: session.end ? new Date(session.end) : null
                };
            });
            
            // Update session count if needed
            const focusSessions = sessionData.sessions.filter(s => s.type === 'focus' && s.isCompleted);
            if (focusSessions.length > timerState.completedSessions) {
                timerState.completedSessions = focusSessions.length;
                updateSessionCount();
            }
        }
    } catch (error) {
        console.error('Error loading session data:', error);
    }
}

function saveSessionData() {
    try {
        localStorage.setItem('flowTimerSessionData', JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error saving session data:', error);
    }
}

function exportSessionData() {
    try {
        // Create a blob with the data
        const dataStr = JSON.stringify(sessionData, null, 2);
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
    
    if (timerState.enableVisualCues) {
        visualCuePreview.classList.remove('hidden');
        
        // Set the intensity based on the slider
        const intensity = timerState.visualCueIntensity / 10;
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
            timerState.visualCueIntensity = parseInt(visualCueIntensityInput.value, 10);
            updateVisualCuePreview();
        });
    }
    
    if (enableVisualCuesInput) {
        enableVisualCuesInput.addEventListener('change', () => {
            timerState.enableVisualCues = enableVisualCuesInput.checked;
            updateVisualCuePreview();
        });
    }
}

// Reset current session
function resetCurrentSession() {
    if (!timerState.isRunning) return;
    
    // Save current state for undo
    saveStateForUndo('reset');
    
    // Clear current timer
    clearInterval(timerState.timerInterval);
    
    // Reset to beginning of current mode
    if (timerState.isBreak) {
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
    timerState.lastAction = {
        type: actionType,
        isBreak: timerState.isBreak,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        isFlowState: timerState.isFlowState,
        currentSeconds: timerState.currentSeconds,
        elapsedBeforePause: timerState.elapsedBeforePause,
        startTime: timerState.startTime,
        sessionData: sessionData.currentSession ? {...sessionData.currentSession} : null
    };
    
    // Enable undo button
    undoButton.disabled = false;
}

// Undo last action
function undoLastAction() {
    if (!timerState.lastAction) return;
    
    clearInterval(timerState.timerInterval);
    
    const lastAction = timerState.lastAction;
    
    // Restore previous state
    timerState.isBreak = lastAction.isBreak;
    timerState.isRunning = lastAction.isRunning;
    timerState.isPaused = lastAction.isPaused;
    timerState.isFlowState = lastAction.isFlowState;
    timerState.currentSeconds = lastAction.currentSeconds;
    timerState.elapsedBeforePause = lastAction.elapsedBeforePause;
    timerState.startTime = lastAction.startTime;
    
    // Restore session data
    if (lastAction.type === 'skipToBreak' || lastAction.type === 'skipToWork') {
        // Remove the last session if we just completed it
        if (sessionData.sessions.length > 0) {
            sessionData.sessions.pop();
        }
        
        // Restore the current session
        sessionData.currentSession = lastAction.sessionData;
        
        // If we skipped to break, decrement the session count
        if (lastAction.type === 'skipToBreak') {
            timerState.completedSessions--;
            updateSessionCount();
        }
    }
    
    // Update UI based on restored state
    if (timerState.isBreak) {
        timerLabelElement.textContent = timerState.isLongBreak ? 'Long Break' : 'Break Time';
        progressRingCircle.style.stroke = 'var(--break-color)';
    } else {
        timerLabelElement.textContent = timerState.isFlowState ? 'Flow State' : 'Focus Time';
        if (timerState.isFlowState) {
            progressRingCircle.style.stroke = 'var(--warning-color)';
            progressRingCircle.classList.add('subtle-pulse');
        } else {
            progressRingCircle.style.stroke = 'var(--focus-color)';
            progressRingCircle.classList.remove('subtle-pulse');
        }
    }
    
    // Update timer display and buttons
    updateTimerDisplay();
    updateProgressRing(timerState.isRunning ? getElapsedSeconds() : 0);
    
    // Update button states
    startButton.disabled = timerState.isRunning && !timerState.isPaused;
    pauseButton.disabled = !timerState.isRunning || timerState.isPaused;
    skipButton.textContent = timerState.isBreak ? 'Skip to Focus' : 'Skip to Break';
    
    // Resume timer if it was running
    if (timerState.isRunning && !timerState.isPaused) {
        timerState.timerInterval = setInterval(updateTimer, 1000);
        timerStatusElement.textContent = timerState.isBreak ? 'Taking a break' : 
            (timerState.isFlowState ? 'In flow state - timer continues' : 'Focusing');
    } else if (timerState.isPaused) {
        timerStatusElement.textContent = 'Paused';
    } else {
        timerStatusElement.textContent = 'Ready to start';
    }
    
    // Clear the lastAction
    timerState.lastAction = null;
    undoButton.disabled = true;
    
    // Save the session data
    saveSessionData();
}

// Full App Reset Function
function fullReset() {
    // Clear all session data
    sessionData = {
        sessions: [],
        currentSession: null
    };
    
    // Reset timer state
    timerState = {
        isRunning: false,
        isPaused: false,
        isBreak: false,
        isLongBreak: false,
        isFlowState: false,
        currentSeconds: timerState.settings.focusTime * 60,
        completedSessions: 0,
        timerInterval: null,
        startTime: 0,
        elapsedBeforePause: 0,
        settings: {...timerState.settings}, // Keep current settings
        lastAction: null,
        enableVisualCues: timerState.enableVisualCues,
        visualCueIntensity: timerState.visualCueIntensity
    };
    
    // Reset UI
    updateTimerDisplay();
    updateSessionCount();
    resetProgressRing();
    
    // Update timer status
    timerStatusElement.textContent = 'All data reset. Ready to start fresh.';
    
    // Reset buttons
    startButton.disabled = false;
    pauseButton.disabled = true;
    skipButton.disabled = true;
    resetButton.disabled = true;
    undoButton.disabled = true;
    
    // Save the cleared data
    saveSessionData();
    
    // Close modal if open
    closeModal();
}

// Reset progress ring to starting position
function resetProgressRing() {
    progressRingCircle.style.strokeDashoffset = progressRingCircle.style.strokeDasharray;
    progressRingCircle.style.stroke = 'var(--focus-color)';
    progressRingCircle.classList.remove('subtle-pulse');
}

// Modal functions
function openModal() {
    const modal = document.getElementById('resetModal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('resetModal');
    modal.classList.remove('active');
}

// Set up modal event listeners
function setupModalListeners() {
    const fullResetBtn = document.getElementById('fullResetBtn');
    const modal = document.getElementById('resetModal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelResetBtn');
    const confirmBtn = document.getElementById('confirmResetBtn');
    
    if (fullResetBtn) {
        fullResetBtn.addEventListener('click', openModal);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', fullReset);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    init();
}); 
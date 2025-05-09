// This is a minimal stub file. All functionality has been moved to timer-logic.js
// and is accessible directly via onclick handlers in the HTML.

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing app from app.js stub');
    
    // A small delay to ensure all scripts are fully loaded
    setTimeout(function() {
        console.log('Calling initial UI updates');
        
        // Update the UI elements
        const timerTimeElement = document.getElementById('timerTime');
        const progressRingCircle = document.querySelector('.progress-ring-circle');
        
        if (progressRingCircle) {
            progressRingCircle.style.strokeDasharray = window.CIRCUMFERENCE || (2 * Math.PI * 120);
            progressRingCircle.style.strokeDashoffset = window.CIRCUMFERENCE || (2 * Math.PI * 120);
        }
        
        if (timerTimeElement && window.updateTimerDisplay) {
            window.updateTimerDisplay(timerTimeElement);
        }
        
        if (window.updateSessionCount) {
            window.updateSessionCount();
        }
        
        // Apply saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }
        
        // Setup visual cue intensity preview
        setupVisualCuePreview();
        
        console.log('Initial UI updates completed');
    }, 200);
});

/**
 * Setup visual cue intensity preview
 */
function setupVisualCuePreview() {
    const visualCueIntensitySlider = document.getElementById('visualCueIntensity');
    const previewCircle = document.querySelector('.preview-circle');
    
    if (visualCueIntensitySlider && previewCircle) {
        // Setup initial preview
        updateVisualCuePreview(visualCueIntensitySlider.value);
        
        // Setup event listener for changes
        visualCueIntensitySlider.addEventListener('input', function() {
            updateVisualCuePreview(this.value);
        });
    }
}

/**
 * Update visual cue preview based on intensity value
 * @param {number} intensity - Value between 1-10
 */
function updateVisualCuePreview(intensity) {
    const previewCircle = document.querySelector('.preview-circle');
    if (!previewCircle) return;
    
    // Remove any existing animation
    previewCircle.style.animation = 'none';
    
    // Calculate animation duration (higher intensity = faster pulse)
    const duration = 3 - (intensity * 0.2); // 1 = 2.8s, 10 = 1s
    
    // Trigger reflow to restart animation
    void previewCircle.offsetWidth;
    
    // Add animation with new duration
    previewCircle.style.animation = `subtle-pulse ${duration}s infinite`;
    
    console.log('Visual cue preview updated with intensity:', intensity);
}

/**
 * Switch between Timer, Settings, and Analytics views
 */
function switchView(viewName) {
    console.log('Switching to view:', viewName);
    
    // Update active link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show the selected view, hide others
    const viewSections = document.querySelectorAll('.view-section');
    viewSections.forEach(section => {
        if (section.id === viewName + 'View') {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Initialize analytics if switching to analytics view
    if (viewName === 'analytics' && window.updateAnalyticsView) {
        // Find the active timeframe
        const activeTimeframe = document.querySelector('.timeframe-btn.active');
        const timeframe = activeTimeframe ? activeTimeframe.getAttribute('data-timeframe') : 'day';
        window.updateAnalyticsView(timeframe);
    }
}

/**
 * Switch timeframe in Analytics view
 */
function switchTimeframe(timeframe, buttonElement) {
    console.log('Switching timeframe to:', timeframe);
    
    // Update active button
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    timeframeButtons.forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    
    // Update analytics view with the selected timeframe
    if (window.updateAnalyticsView) {
        window.updateAnalyticsView(timeframe);
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // Update the toggle button text
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    
    console.log('Theme switched to:', newTheme);
}

/**
 * Saves the user's settings
 */
function saveSettings() {
    // Get settings values
    const focusTime = document.getElementById('focusTime').value;
    const breakTime = document.getElementById('breakTime').value;
    const longBreakTime = document.getElementById('longBreakTime').value;
    const sessionsBeforeLongBreak = document.getElementById('sessionsBeforeLongBreak').value;
    const enableVisualCues = document.getElementById('enableVisualCues').checked;
    const visualCueIntensity = document.getElementById('visualCueIntensity').value;
    const enableSoundNotifications = document.getElementById('enableSoundNotifications').checked;
    const accentColor = document.getElementById('accentColor').value;
    
    // Get selected theme
    let selectedTheme = 'dark';
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        if (radio.checked) {
            selectedTheme = radio.value;
        }
    });
    
    // Save to localStorage
    const settings = {
        focusTime,
        breakTime,
        longBreakTime,
        sessionsBeforeLongBreak,
        enableVisualCues,
        visualCueIntensity,
        enableSoundNotifications,
        accentColor,
        theme: selectedTheme
    };
    
    localStorage.setItem('timer_settings', JSON.stringify(settings));
    
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
}

/**
 * Resets settings to default values
 */
function resetSettings() {
    // Default settings
    const defaultSettings = {
        focusTime: 25,
        breakTime: 5,
        longBreakTime: 15,
        sessionsBeforeLongBreak: 4,
        enableVisualCues: true,
        visualCueIntensity: 5,
        enableSoundNotifications: false,
        accentColor: '#0a84ff',
        theme: 'dark'
    };
    
    // Update UI with default values
    document.getElementById('focusTime').value = defaultSettings.focusTime;
    document.getElementById('breakTime').value = defaultSettings.breakTime;
    document.getElementById('longBreakTime').value = defaultSettings.longBreakTime;
    document.getElementById('sessionsBeforeLongBreak').value = defaultSettings.sessionsBeforeLongBreak;
    document.getElementById('enableVisualCues').checked = defaultSettings.enableVisualCues;
    document.getElementById('visualCueIntensity').value = defaultSettings.visualCueIntensity;
    document.getElementById('enableSoundNotifications').checked = defaultSettings.enableSoundNotifications;
    document.getElementById('accentColor').value = defaultSettings.accentColor;
    
    // Set theme radio
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.checked = radio.value === defaultSettings.theme;
    });
    
    // Save to localStorage
    localStorage.setItem('timer_settings', JSON.stringify(defaultSettings));
    
    // Update visual cue preview
    updateVisualCuePreview(defaultSettings.visualCueIntensity);
    
    console.log('Settings reset to defaults');
    alert('Settings reset to defaults!');
}

/**
 * Function to export session data as JSON
 */
function exportSessionData() {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('session_data') || '[]';
    
    // Create a blob with the JSON data
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'flow-timer-session-data.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('Session data exported');
}

/**
 * Function to open the reset confirmation modal
 */
function openModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Function to close the reset confirmation modal
 */
function closeModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Function to perform a full reset of all data
 */
function fullReset() {
    // Clear session data
    localStorage.removeItem('session_data');
    localStorage.removeItem('current_session');
    
    // Reset settings to defaults
    resetSettings();
    
    // Close the modal
    closeModal();
    
    // Update UI elements
    if (window.TimerModule && window.TimerModule.resetState) {
        window.TimerModule.resetState();
    }
    
    if (window.updateSessionCount) {
        window.updateSessionCount();
    }
    
    console.log('Full reset performed');
    alert('All data has been reset successfully!');
}

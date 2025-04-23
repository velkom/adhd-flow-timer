// Analytics functionality for Flow Timer

// DOM Elements
const totalFocusTimeElement = document.getElementById('totalFocusTime');
const avgSessionLengthElement = document.getElementById('avgSessionLength');
const flowStatePercentageElement = document.getElementById('flowStatePercentage');
const completedSessionsElement = document.getElementById('completedSessions');
const insightsContainerElement = document.getElementById('insightsContainer');

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analytics module loaded');
    
    // Initialize charts
    initCharts();
});

// Chart instances
let sessionDurationChartInstance = null;
let focusVsBreakChartInstance = null;

// Chart colors
const chartColors = {
    focus: '#4C8BF5',
    break: '#4cd964',
    flowState: '#ffcc00',
    planned: 'rgba(255, 255, 255, 0.2)'
};

// Initialize charts
function initCharts() {
    // Set Chart.js defaults for dark theme
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    
    // Initialize session duration chart
    const sessionDurationCtx = document.getElementById('sessionDurationChart')?.getContext('2d');
    if (sessionDurationCtx) {
        sessionDurationChartInstance = new Chart(sessionDurationCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Planned Duration',
                        data: [],
                        backgroundColor: chartColors.planned,
                        borderWidth: 0
                    },
                    {
                        label: 'Focus Time',
                        data: [],
                        backgroundColor: chartColors.focus,
                        borderWidth: 0
                    },
                    {
                        label: 'Flow State',
                        data: [],
                        backgroundColor: chartColors.flowState,
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Minutes'
                        },
                        ticks: {
                            callback: (value) => `${value}m`
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value} min`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Initialize focus vs. break chart
    const focusVsBreakCtx = document.getElementById('focusVsBreakChart')?.getContext('2d');
    if (focusVsBreakCtx) {
        focusVsBreakChartInstance = new Chart(focusVsBreakCtx, {
            type: 'doughnut',
            data: {
                labels: ['Focus Time', 'Flow State', 'Break Time'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [chartColors.focus, chartColors.flowState, chartColors.break],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} min (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Ensure charts don't keep growing
    setupChartResizeLimits();
    
    console.log('Charts initialized');
}

/**
 * Setup limits to prevent charts from growing beyond container
 */
function setupChartResizeLimits() {
    // Add resize observer to maintain proper chart sizes
    const chartContainers = document.querySelectorAll('.chart-container');
    
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Destroy and reinitialize charts if container width changes significantly
                if (entry.target.contains(document.getElementById('sessionDurationChart')) && 
                    sessionDurationChartInstance) {
                    sessionDurationChartInstance.resize();
                }
                
                if (entry.target.contains(document.getElementById('focusVsBreakChart')) && 
                    focusVsBreakChartInstance) {
                    focusVsBreakChartInstance.resize();
                }
            }
        });
        
        chartContainers.forEach(container => {
            resizeObserver.observe(container);
        });
    }
}

// Update analytics view based on timeframe
function updateAnalyticsView(timeframe) {
    console.log('Updating analytics view for timeframe:', timeframe);
    
    try {
        const sessions = JSON.parse(localStorage.getItem('session_data') || '[]');
        if (!sessions.length) {
            showNoDataMessage();
            return;
        }
        
        // Filter sessions based on timeframe
        const filteredSessions = filterSessionsByTimeframe(sessions, timeframe);
        if (!filteredSessions.length) {
            showNoDataMessage();
            return;
        }
        
        // Calculate statistics
        const stats = calculateStats(filteredSessions);
        
        // Update summary cards
        updateSummaryCards(stats);
        
        // Update charts
        updateSessionDurationChart(filteredSessions, timeframe);
        updateFocusVsBreakChart(stats);
        
        // Generate insights
        generateInsights(stats, timeframe);
        
        console.log('Analytics view updated successfully');
    } catch (error) {
        console.error('Error updating analytics view:', error);
        showNoDataMessage();
    }
}

// Filter sessions based on timeframe
function filterSessionsByTimeframe(sessions, timeframe) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let startDate;
    
    switch (timeframe) {
        case 'day':
            startDate = startOfDay;
            break;
        case 'week':
            startDate = startOfWeek;
            break;
        case 'month':
            startDate = startOfMonth;
            break;
        default:
            startDate = startOfDay;
    }
    
    return sessions.filter(session => new Date(session.start) >= startDate);
}

// Calculate statistics from sessions
function calculateStats(sessions) {
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const breakSessions = sessions.filter(s => s.type === 'break');
    
    const totalFocusSeconds = focusSessions.reduce((total, session) => total + session.actualDuration, 0);
    const totalFlowSeconds = focusSessions.reduce((total, session) => total + (session.flowStateDuration || 0), 0);
    const totalBreakSeconds = breakSessions.reduce((total, session) => total + session.actualDuration, 0);
    
    const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
    const totalFlowMinutes = Math.round(totalFlowSeconds / 60);
    const totalBreakMinutes = Math.round(totalBreakSeconds / 60);
    
    const avgSessionLength = focusSessions.length > 0 
        ? Math.round((totalFocusSeconds - totalFlowSeconds) / focusSessions.length / 60) 
        : 0;
    
    const flowStatePercentage = totalFocusSeconds > 0 
        ? Math.round((totalFlowSeconds / totalFocusSeconds) * 100) 
        : 0;
    
    return {
        totalFocusMinutes,
        totalFlowMinutes,
        totalBreakMinutes,
        avgSessionLength,
        flowStatePercentage,
        completedSessions: focusSessions.length,
        focusSessions,
        breakSessions
    };
}

// Update summary cards
function updateSummaryCards(stats) {
    totalFocusTimeElement.textContent = formatTime(stats.totalFocusMinutes);
    avgSessionLengthElement.textContent = `${stats.avgSessionLength}m`;
    flowStatePercentageElement.textContent = `${stats.flowStatePercentage}%`;
    completedSessionsElement.textContent = stats.completedSessions;
}

// Update session duration chart
function updateSessionDurationChart(sessions, timeframe) {
    const focusSessions = sessions.filter(s => s.type === 'focus');
    
    // Sort sessions by start time
    focusSessions.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Limit to the last 10 sessions for readability
    const recentSessions = focusSessions.slice(-10);
    
    // Format labels based on timeframe
    const labels = recentSessions.map(session => formatSessionLabel(session, timeframe));
    
    // Calculate base focus times (excluding flow states)
    const baseFocusTimes = recentSessions.map(session => 
        Math.min(Math.round(session.actualDuration / 60), Math.round(session.plannedDuration / 60))
    );
    
    // Calculate flow state times
    const flowStateTimes = recentSessions.map(session => 
        Math.round((session.flowStateDuration || 0) / 60)
    );
    
    // Calculate planned durations
    const plannedDurations = recentSessions.map(session => 
        Math.round(session.plannedDuration / 60)
    );
    
    // Update chart data
    sessionDurationChartInstance.data.labels = labels;
    sessionDurationChartInstance.data.datasets[0].data = plannedDurations;
    sessionDurationChartInstance.data.datasets[1].data = baseFocusTimes;
    sessionDurationChartInstance.data.datasets[2].data = flowStateTimes;
    
    sessionDurationChartInstance.update();
}

// Update focus vs break chart
function updateFocusVsBreakChart(stats) {
    focusVsBreakChartInstance.data.datasets[0].data = [
        stats.totalFocusMinutes - stats.totalFlowMinutes,
        stats.totalFlowMinutes,
        stats.totalBreakMinutes
    ];
    
    focusVsBreakChartInstance.update();
}

// Generate insights based on session data
function generateInsights(stats, timeframe) {
    // Clear previous insights
    insightsContainerElement.innerHTML = '';
    
    if (stats.completedSessions < 3) {
        insightsContainerElement.innerHTML = `
            <p class="no-data-message">Complete more sessions to see personalized insights.</p>
        `;
        return;
    }
    
    const insights = [];
    
    // Flow state insight
    if (stats.flowStatePercentage > 0) {
        insights.push(`
            <div class="insight-item">
                <h4>Flow State Analysis</h4>
                <p>You spend approximately ${stats.flowStatePercentage}% of your focus time in flow state, 
                extending your sessions by an average of ${Math.round(stats.totalFlowMinutes / stats.completedSessions)} minutes.</p>
            </div>
        `);
    }
    
    // Average session length insight
    insights.push(`
        <div class="insight-item">
            <h4>Session Duration</h4>
            <p>Your average focus session lasts ${stats.avgSessionLength} minutes 
            ${stats.avgSessionLength > 25 ? '(longer than the standard 25 min)' : '(shorter than the standard 25 min)'}.</p>
        </div>
    `);
    
    // Focus to break ratio insight
    const focusToBreakRatio = stats.totalBreakMinutes > 0 
        ? (stats.totalFocusMinutes / stats.totalBreakMinutes).toFixed(1) 
        : 'N/A';
    
    insights.push(`
        <div class="insight-item">
            <h4>Focus to Break Ratio</h4>
            <p>Your focus to break ratio is ${focusToBreakRatio}:1. 
            ${parseFloat(focusToBreakRatio) > 5 ? 'Consider taking more breaks for optimal productivity.' : 
              parseFloat(focusToBreakRatio) < 3 ? 'You take frequent breaks, which is good for maintaining attention.' : 
              'This is a balanced ratio of work to rest.'}</p>
        </div>
    `);
    
    // Add productivity patterns if enough data
    if (stats.focusSessions.length >= 5) {
        const timePatterns = analyzeTimePatternsFromSessions(stats.focusSessions);
        if (timePatterns) {
            insights.push(`
                <div class="insight-item">
                    <h4>Productivity Patterns</h4>
                    <p>${timePatterns}</p>
                </div>
            `);
        }
    }
    
    // Add insights to container
    insightsContainerElement.innerHTML = insights.join('');
}

// Analyze time patterns from session data
function analyzeTimePatternsFromSessions(sessions) {
    if (sessions.length < 5) return null;
    
    // Group sessions by hour of day
    const hourCounts = {};
    const hourFlowStates = {};
    
    sessions.forEach(session => {
        const hour = new Date(session.start).getHours();
        
        if (!hourCounts[hour]) {
            hourCounts[hour] = 0;
            hourFlowStates[hour] = 0;
        }
        
        hourCounts[hour]++;
        
        if (session.flowStateDuration) {
            hourFlowStates[hour] += session.flowStateDuration;
        }
    });
    
    // Find most productive hour (most sessions)
    let mostProductiveHour = 0;
    let maxCount = 0;
    
    for (const hour in hourCounts) {
        if (hourCounts[hour] > maxCount) {
            maxCount = hourCounts[hour];
            mostProductiveHour = hour;
        }
    }
    
    // Find most flow state hour (most flow state time)
    let mostFlowHour = 0;
    let maxFlowSeconds = 0;
    
    for (const hour in hourFlowStates) {
        if (hourFlowStates[hour] > maxFlowSeconds) {
            maxFlowSeconds = hourFlowStates[hour];
            mostFlowHour = hour;
        }
    }
    
    // Format the time for display
    const formatHour = (hour) => {
        const hourNum = parseInt(hour, 10);
        if (hourNum === 0) return '12 AM';
        if (hourNum === 12) return '12 PM';
        return hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`;
    };
    
    if (maxCount > 1) {
        return `You tend to be most productive around ${formatHour(mostProductiveHour)}${
            maxFlowSeconds > 0 
                ? ` and enter flow states most often around ${formatHour(mostFlowHour)}`
                : ''
        }.`;
    }
    
    return null;
}

// Show message when no data is available
function showNoDataMessage() {
    totalFocusTimeElement.textContent = '0h 0m';
    avgSessionLengthElement.textContent = '0m';
    flowStatePercentageElement.textContent = '0%';
    completedSessionsElement.textContent = '0';
    
    insightsContainerElement.innerHTML = `
        <p class="no-data-message">No data available for the selected time period.</p>
    `;
    
    // Reset charts
    if (sessionDurationChartInstance) {
        sessionDurationChartInstance.data.labels = [];
        sessionDurationChartInstance.data.datasets.forEach(dataset => dataset.data = []);
        sessionDurationChartInstance.update();
    }
    
    if (focusVsBreakChartInstance) {
        focusVsBreakChartInstance.data.datasets[0].data = [0, 0, 0];
        focusVsBreakChartInstance.update();
    }
}

// Format time for display
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    }
    
    return `${hours}h ${mins}m`;
}

// Format session labels based on timeframe
function formatSessionLabel(session, timeframe) {
    const date = new Date(session.start);
    
    switch (timeframe) {
        case 'day':
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case 'week':
            return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
                   date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case 'month':
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        default:
            return date.toLocaleDateString();
    }
}

// Export functions to make them available in the main app
window.initCharts = initCharts;
window.updateAnalyticsView = updateAnalyticsView; 
// Global variables and configuration
let currentDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0]; // Set today as the default selected date
let symptoms = [];
let symptomsData = {};

// DOM Elements - with null checks
const elements = {
    symptomSelect: document.getElementById('symptomSelect'),
    noSymptomsBtn: document.getElementById('noSymptomsBtn'),
    submitBtn: document.getElementById('submitBtn'),
    confirmBtn: document.getElementById('confirmBtn'),
    prevMonthBtn: document.getElementById('prevMonth'),
    nextMonthBtn: document.getElementById('nextMonth'),
    currentMonthElement: document.getElementById('currentMonth'),
    calendarDaysElement: document.getElementById('calendarDays'),
    selectedDateElement: document.getElementById('selectedDate'),
    symptomsListElement: document.getElementById('symptomsList')
};

// Bootstrap Modals - with null checks
const modals = {
    confirmModal: document.getElementById('confirmModal') ? new bootstrap.Modal(document.getElementById('confirmModal')) : null,
    successModal: document.getElementById('successModal') ? new bootstrap.Modal(document.getElementById('successModal')) : null
};

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Calendar functions
function renderCalendar(date = currentDate) {
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Update month display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    elements.currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Get the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Create header row for days of the week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('calendar-header');
        dayHeader.textContent = day;
        calendarDays.appendChild(dayHeader);
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        
        const currentDate = new Date(currentYear, currentMonth, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        dayElement.dataset.date = dateStr;
        
        // Add event listener
        dayElement.addEventListener('click', () => selectDate(dateStr));
        
        // Check if this day has symptoms
        if (symptomsData && symptomsData[dateStr]) {
            if (symptomsData[dateStr].length === 0) {
                dayElement.classList.add('no-symptoms');
            } else {
                dayElement.classList.add('has-symptoms');
            }
        }
        
        // Check if this is today
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // Check if this is the selected date
        if (dateStr === selectedDate) {
            dayElement.classList.add('selected');
        }
        
        calendarDays.appendChild(dayElement);
    }

    // Fill remaining slots with empty cells to maintain the grid
    const totalCells = 7 * 6; // 6 rows (5 for days + 1 for headers)
    const remainingCells = totalCells - (startingDay + daysInMonth + 7); // +7 for header row
    for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(emptyDay);
    }
}

// Initialize calendar function
function initializeCalendar() {
    // Set up calendar navigation
    if (elements.prevMonthBtn) {
        elements.prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
    }

    if (elements.nextMonthBtn) {
        elements.nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    // Initial calendar render
    renderCalendar(currentDate);

    // Load symptom history
    loadSymptomHistory();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!checkAuth()) return;

        // Update welcome message
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const welcomeElement = document.getElementById('userWelcome');
        if (welcomeElement && userData.username) {
            welcomeElement.textContent = userData.username;
        }

        // Initialize event listeners only if elements exist
        if (elements.submitBtn) {
            elements.submitBtn.addEventListener('click', async () => {
                const selectedSymptoms = getSelectedSymptoms();
                if (selectedSymptoms.length > 0) {
                    showConfirmationModal(selectedSymptoms);
                } else {
                    showError('Please select at least one symptom');
                }
            });
        }

        // Add event listener for confirm button
        if (elements.confirmBtn) {
            elements.confirmBtn.addEventListener('click', async () => {
                const selectedSymptoms = getSelectedSymptoms();
                const success = await submitSymptoms(selectedSymptoms);
                if (success) {
                    modals.confirmModal.hide();
                    modals.successModal.show();
                    // Reload geographic data after submitting symptoms
                    await loadSymptomData();
                }
            });
        }

        // Initialize calendar if elements exist
        if (elements.calendarDaysElement && elements.currentMonthElement) {
            initializeCalendar();
        }

        // Load symptoms data if the list element exists
        if (elements.symptomsListElement) {
            await loadSymptoms();
        }

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to initialize dashboard. Please try refreshing the page.');
    }
});

// Error display function
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.container').firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Functions
async function loadSymptoms() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/symptoms`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        symptoms = data;
        populateSymptomSelect(symptoms);
    } catch (error) {
        console.error('Error loading symptoms:', error);
        showError('Failed to load symptoms. Please try refreshing the page.');
        throw error; // Re-throw to handle in the calling function
    }
}

function populateSymptomSelect(symptoms) {
    // Clear existing options
    elements.symptomSelect.innerHTML = '';
    
    // Sort symptoms alphabetically by name
    const sortedSymptoms = [...symptoms].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add options to select
    sortedSymptoms.forEach(symptom => {
        const option = document.createElement('option');
        option.value = symptom.id;
        option.textContent = symptom.name;
        elements.symptomSelect.appendChild(option);
    });
}

function getSelectedSymptoms() {
    const selectedOptions = Array.from(elements.symptomSelect.selectedOptions);
    return selectedOptions.map(option => ({
        id: parseInt(option.value),
        name: option.textContent
    }));
}

function showConfirmationModal(selectedSymptoms) {
    const list = document.getElementById('selectedSymptomsList');
    list.innerHTML = selectedSymptoms
        .map(symptom => `<div class="symptom-item">${symptom.name}</div>`)
        .join('');
    modals.confirmModal.show();
}

async function submitSymptoms(selectedSymptoms) {
    if (!selectedDate) {
        showError('Please select a date first');
        return false;
    }

    try {
        // Create a date object at the start of the selected day in local time
        const localDate = new Date(selectedDate + 'T00:00:00');
        console.log('Local date before conversion:', localDate);

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/symptoms/entry`, {
            method: 'POST',
            body: JSON.stringify({
                symptoms: selectedSymptoms,
                date: selectedDate
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Update UI after successful submission
        await loadSymptomHistory();
        
        return true;
    } catch (error) {
        console.error('Error submitting symptoms:', error);
        showError('Failed to submit symptoms. Please try again.');
        return false;
    }
}

function isDateToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

async function loadSymptomHistory() {
    try {
        if (!checkAuth()) return;
        
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/symptoms/history`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const history = await response.json();
        console.log('Received history:', history);
        
        if (!history) {
            console.log('No history data received');
            return;
        }
        
        // Clear existing data
        symptomsData = {};
        
        // Populate symptomsData object with dates
        history.forEach(entry => {
            if (!entry || !entry.date) {
                console.log('Invalid entry:', entry);
                return;
            }

            try {
                // Convert UTC date to local date for display
                const utcDate = new Date(entry.date);
                console.log('Processing UTC date:', utcDate);
                
                const localDate = new Date(
                    utcDate.getUTCFullYear(),
                    utcDate.getUTCMonth(),
                    utcDate.getUTCDate()
                ).toISOString().split('T')[0];
                
                console.log('Converted to local date:', localDate);
                
                // Check both 'symptoms' and 'Symptoms' properties
                const symptoms = entry.symptoms || entry.Symptoms || [];
                symptomsData[localDate] = symptoms;
                
                console.log(`Added symptoms for ${localDate}:`, symptoms);
            } catch (err) {
                console.error('Error processing date:', err);
            }
        });
        
        console.log('Final symptomsData:', symptomsData);
        
        // Update UI elements
        updateCalendarUI();
        showSymptomsForDate(selectedDate);
        
        // Force calendar re-render
        renderCalendar();
    } catch (error) {
        console.error('Error loading symptom history:', error);
        showError('Failed to load symptom history');
    }
}

function updateCalendarUI() {
    const days = document.querySelectorAll('.calendar-day');
    days.forEach(day => {
        const date = day.dataset.date;
        if (date) {
            // Remove existing classes first
            day.classList.remove('has-symptoms', 'no-symptoms');
            
            // Check if we have data for this date
            if (symptomsData.hasOwnProperty(date)) {
                const symptoms = symptomsData[date];
                if (symptoms && symptoms.length > 0) {
                    day.classList.add('has-symptoms');
                } else {
                    day.classList.add('no-symptoms');
                }
            }
            
            // Highlight selected date
            if (date === selectedDate) {
                day.classList.add('selected');
            } else {
                day.classList.remove('selected');
            }
        }
    });
}

async function selectDate(date) {
    try {
        // Remove selected class from all days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selected class to clicked day
        const selectedDay = document.querySelector(`.calendar-day[data-date="${date}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }

        // Update selected date
        selectedDate = date;
        
        // Show symptoms for selected date
        await showSymptomsForDate(date);
    } catch (error) {
        console.error('Error selecting date:', error);
        showError('Failed to load symptoms for selected date');
    }
}

async function showSymptomsForDate(date) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/symptoms/history/${date}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Received data for date:', data);
            elements.selectedDateElement.textContent = new Date(date).toLocaleDateString();
            
            // Check if we have symptoms in the symptomsData object
            const dateSymptoms = symptomsData[date];
            if (dateSymptoms) {
                if (dateSymptoms.length === 0) {
                    // This is a "No symptoms" day
                    elements.symptomsListElement.innerHTML = '<p class="text-muted">✓ No symptoms reported for this date</p>';
                } else {
                    // This is a day with symptoms
                    elements.symptomsListElement.innerHTML = '<p>Reported symptoms:</p>' + 
                        dateSymptoms
                            .map(symptom => `<div class="symptom-item">• ${symptom.name}</div>`)
                            .join('');
                }
            } else {
                elements.symptomsListElement.innerHTML = '<p class="text-muted">No entry for this date</p>';
            }
            
            document.getElementById('selectedDaySymptoms').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading symptoms for date:', error);
        showError('Failed to load symptoms for selected date');
    }
}

function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('errorMessage').textContent = message;
    errorModal.show();
}

async function logout() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear local storage and redirect, even if server request fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        throw new Error('Authentication failed');
    }

    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.addEventListener('hidden.bs.modal', () => {
            // Ensure UI is interactive after modal is hidden
            document.body.classList.remove('modal-open');
            const modalBackdrop = document.querySelector('.modal-backdrop');
            if (modalBackdrop) {
                modalBackdrop.remove();
            }
        });
    }
});
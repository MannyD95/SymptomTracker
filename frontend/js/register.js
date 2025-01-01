// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced error logging function
function logError(context, error, additionalData = {}) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        context: context,
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        additionalData
    };
    console.error('Detailed Error Log:', JSON.stringify(errorLog, null, 2));
    return errorLog;
}

// Location search using Nominatim
const locationInput = document.getElementById('location');
const locationResults = document.getElementById('locationResults');

const searchLocation = async (query) => {
    if (!query.trim()) {
        locationResults.classList.add('d-none');
        return;
    }

    try {
        console.log(`Searching location for query: "${query}"`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        console.log('Request URL:', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Sniffly-App/1.0'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);

        if (data.length > 0) {
            locationResults.innerHTML = data.map(place => `
                <button type="button" class="list-group-item list-group-item-action" 
                    data-lat="${place.lat}" 
                    data-lon="${place.lon}"
                    data-display="${place.display_name}">
                    ${place.display_name}
                </button>
            `).join('');
            locationResults.classList.remove('d-none');
        } else {
            console.log('No results found for query:', query);
            locationResults.innerHTML = '<div class="list-group-item">No results found</div>';
            locationResults.classList.remove('d-none');
        }
    } catch (error) {
        const errorLog = logError('Location Search', error, { query });
        locationResults.innerHTML = `<div class="list-group-item text-danger">
            Error searching location. Check console for details.
            <br><small class="text-muted">Error ID: ${errorLog.timestamp}</small>
        </div>`;
        locationResults.classList.remove('d-none');
    }
};

const debouncedSearch = debounce(searchLocation, 300);

locationInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Handle location selection
locationResults.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const lat = button.dataset.lat;
    const lon = button.dataset.lon;
    const displayName = button.dataset.display;

    console.log('Selected location:', { lat, lon, displayName });

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lon;
    document.getElementById('displayLocation').value = displayName;
    locationInput.value = displayName;
    locationResults.classList.add('d-none');
});

// Click outside to close results
document.addEventListener('click', (e) => {
    if (!locationInput.contains(e.target) && !locationResults.contains(e.target)) {
        locationResults.classList.add('d-none');
    }
});

// Get location button handler
document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        logError('Geolocation', new Error('Geolocation not supported'));
        alert('Geolocation is not supported by your browser');
        return;
    }

    document.getElementById('getLocationBtn').disabled = true;
    document.getElementById('getLocationBtn').textContent = '📍 Getting location...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log('Got current position:', { lat, lon });
            
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
                console.log('Reverse geocoding URL:', url);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Sniffly-App/1.0'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
                }

                const data = await response.json();
                console.log('Reverse geocoding result:', data);
                
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lon;
                document.getElementById('displayLocation').value = data.display_name;
                document.getElementById('location').value = data.display_name;
                document.getElementById('getLocationBtn').textContent = '📍 Location updated';
            } catch (error) {
                const errorLog = logError('Reverse Geocoding', error, { lat, lon });
                console.error('Reverse geocoding error:', error);
                alert(`Error getting location name. Please try entering it manually.\nError ID: ${errorLog.timestamp}`);
            } finally {
                document.getElementById('getLocationBtn').disabled = false;
            }
        },
        (error) => {
            const errorLog = logError('Geolocation', error);
            console.error('Geolocation error:', error);
            alert(`Unable to get your location. Please enter it manually.\nError ID: ${errorLog.timestamp}`);
            document.getElementById('getLocationBtn').textContent = '📍 Get My Location';
            document.getElementById('getLocationBtn').disabled = false;
        }
    );
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);

    // Validate password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Validate location
    if (isNaN(latitude) || isNaN(longitude)) {
        alert('Please provide valid location coordinates');
        return;
    }

    if (latitude < -90 || latitude > 90) {
        alert('Latitude must be between -90 and 90 degrees');
        return;
    }

    if (longitude < -180 || longitude > 180) {
        alert('Longitude must be between -180 and 180 degrees');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username, 
                email, 
                password,
                latitude,
                longitude
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.details || 'Registration failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message);
        console.error('Registration error:', error);
    }
});
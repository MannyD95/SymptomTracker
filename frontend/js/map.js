// Map configuration
const MAP_CONFIG = {
    zoom: 13,
    maxZoom: 18
};

let map = null;
let symptomsLayer;
let regionLayer;

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize map
async function initMap() {
    try {
        // Check if map is already initialized
        if (map) {
            console.log('Map already initialized, skipping initialization');
            return;
        }

        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Get user's location from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('User data from localStorage:', user);
        
        const userLat = user.latitude || 43.2557; // Default to Hamilton if no location
        const userLng = user.longitude || -79.8711;
        console.log('Map center coordinates:', { userLat, userLng });

        // Create map instance centered on user's location
        map = L.map('map').setView([userLat, userLng], 12);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(map);

        // Add refresh button
        const refreshButton = L.control({ position: 'topright' });
        refreshButton.onAdd = function() {
            const button = L.DomUtil.create('button', 'btn btn-sm btn-primary');
            button.innerHTML = '🔄 Refresh';
            button.onclick = loadSymptomData;
            return button;
        };
        refreshButton.addTo(map);

        // Add user marker
        if (user.latitude && user.longitude) {
            L.marker([user.latitude, user.longitude])
                .addTo(map)
                .bindPopup('Your Location')
                .openPopup();
        }

        // Load initial data
        loadSymptomData();

    } catch (error) {
        console.error('Error initializing map:', error);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.textContent = 'Unable to initialize map. Please refresh the page.';
            mapContainer.appendChild(errorMessage);
        }
    }
}

// Load and display symptom data
async function loadSymptomData() {
    try {
        console.log('Loading geographic symptom data...');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/symptoms/geographic`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received geographic data:', {
            totalEntries: data.totalEntries,
            locations: data.locations?.length || 0
        });

        // Clear existing markers
        if (window.symptomMarkers) {
            window.symptomMarkers.forEach(marker => marker.remove());
        }
        window.symptomMarkers = [];

        // Update the stats UI
        const statsContent = document.querySelector('#geographicStats .stats-content');
        if (statsContent) {
            console.log('Found stats content element, updating...');
            if (data.totalEntries === 0) {
                statsContent.innerHTML = `
                    <div class="alert alert-info">
                        <p class="mb-0">No symptoms reported in your area in the last 24 hours.</p>
                        <small class="text-muted">This is good news! It means people are feeling well.</small>
                    </div>
                `;
            } else {
                // Sort symptoms by count for trending display
                const sortedSymptoms = Object.entries(data.symptomCounts)
                    .sort(([,a], [,b]) => b - a);

                let html = `
                    <div class="alert alert-info">
                        <div class="mb-3">
                            <h6 class="mb-2">Last 24 Hours Summary:</h6>
                            <p class="mb-1">${data.totalEntries} user${data.totalEntries !== 1 ? 's' : ''} reported symptoms in your area</p>
                        </div>`;

                if (sortedSymptoms.length > 0) {
                    html += `
                        <div class="mb-0">
                            <h6 class="mb-2">Trending in Your Area:</h6>
                            <ul class="mb-0">
                                ${sortedSymptoms.map(([symptom, count]) => 
                                    `<li>${symptom}: ${count} report${count !== 1 ? 's' : ''}</li>`
                                ).join('')}
                            </ul>
                        </div>`;
                }

                html += '</div>';
                statsContent.innerHTML = html;
            }
            console.log('Stats content updated');
        }

        if (!data.locations || data.locations.length === 0) {
            console.log('No symptom data with location information available');
            return;
        }

        // Add markers for symptoms
        data.locations.forEach(location => {
            if (!location.latitude || !location.longitude) {
                console.log('Skipping location without coordinates');
                return;
            }

            const marker = L.marker([location.latitude, location.longitude])
                .addTo(map)
                .bindPopup(`
                    <div class="symptom-popup">
                        <h6>Reported Symptoms:</h6>
                        <ul class="mb-0">
                            ${location.symptoms.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                `);

            window.symptomMarkers.push(marker);
        });

        // Update map view if there are markers
        if (window.symptomMarkers.length > 0) {
            const group = L.featureGroup(window.symptomMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

    } catch (error) {
        console.error('Error loading symptom data:', error);
        // Show error message on map
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'map-error-overlay';
        errorOverlay.innerHTML = `
            <div class="alert alert-warning">
                <p class="mb-0">Unable to load symptom data. Please try again later.</p>
            </div>
        `;
        map.getContainer().appendChild(errorOverlay);

        // Update stats with error message
        const statsContent = document.querySelector('#geographicStats .stats-content');
        if (statsContent) {
            statsContent.innerHTML = `
                <div class="alert alert-warning">
                    <p class="mb-0">Unable to load regional statistics at this time.</p>
                    <small class="text-muted">Please try again later.</small>
                </div>
            `;
        }
    }
}

// Make authenticated request
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    return fetch(url, { ...defaultOptions, ...options });
}

// Initialize map when the page loads
window.addEventListener('load', initMap, { once: true });
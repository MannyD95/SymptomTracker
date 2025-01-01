// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3000/api'
    : `http://${window.location.hostname}:3000/api`;

// Export for other modules
window.API_BASE_URL = API_BASE_URL;
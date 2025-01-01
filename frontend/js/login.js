// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable form and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // Clear previous error messages
            const existingError = document.getElementById('errorMessage');
            if (existingError) {
                existingError.remove();
            }

            console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Login response status:', response.status);

            if (!response.ok) {
                throw new Error(data.error || data.details || `Login failed: ${response.status}`);
            }

            if (!data.token) {
                throw new Error('No token received from server');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Show success message before redirect
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success mt-3';
            successDiv.textContent = 'Login successful! Redirecting...';
            loginForm.insertBefore(successDiv, document.querySelector('.d-grid'));

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);

        } catch (error) {
            console.error('Login error:', error);
            
            // Create or update error message element
            let errorDiv = document.getElementById('errorMessage');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'errorMessage';
                errorDiv.className = 'alert alert-danger mt-3';
                loginForm.insertBefore(errorDiv, document.querySelector('.d-grid'));
            }
            
            // Set appropriate error message based on error type
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorDiv.textContent = 'Unable to connect to the server. Please check your internet connection.';
            } else {
                errorDiv.textContent = error.message || 'Login failed. Please try again.';
            }
        } finally {
            // Re-enable form
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});
// // API URL
// const API_BASE_URL = 'http://localhost:5000/api';

import { API_BASE_URL } from './config.js'

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('smo_token') !== null;
}

// Redirect to login page if not logged in (except on login page)
function checkAuth() {
    if (!isLoggedIn() && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (isLoggedIn() && window.location.href.includes('index.html')) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('smo_user');
    return userData ? JSON.parse(userData) : null;
}

// Login user using API
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/app-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save token to localStorage
            localStorage.setItem('smo_token', data.token);
            
            // Save user data to localStorage
            localStorage.setItem('smo_user', JSON.stringify(data.user));
            
            // Save employee data if available
            if (data.employee) {
                localStorage.setItem('smo_employee', JSON.stringify(data.employee));
            }
            
            // Record login time for attendance tracking
            recordAttendance('login');
            
            return true;
        } else {
            console.error('Login error:', data.message || 'Authentication failed');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Logout user
function logoutUser() {
    // Record logout time for attendance tracking
    recordAttendance('logout');
    
    // Remove user data from localStorage
    localStorage.removeItem('smo_token');
    localStorage.removeItem('smo_user');
    localStorage.removeItem('smo_employee');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Record attendance (login/logout)
function recordAttendance(type) {
    const user = getCurrentUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Get existing attendance records
    let attendance = JSON.parse(localStorage.getItem('smo_attendance') || '[]');
    
    // Find today's record
    let todayRecord = attendance.find(a => a.date === today && a.userId === user.id);
    
    if (!todayRecord) {
        // Create new record if none exists
        todayRecord = {
            userId: user.id,
            date: today,
            loginTime: type === 'login' ? time : null,
            logoutTime: type === 'logout' ? time : null
        };
        attendance.push(todayRecord);
    } else {
        // Update existing record
        if (type === 'login' && !todayRecord.loginTime) {
            todayRecord.loginTime = time;
        } else if (type === 'logout') {
            todayRecord.logoutTime = time;
        }
    }
    
    // Save updated attendance
    localStorage.setItem('smo_attendance', JSON.stringify(attendance));
    
    // In a real implementation, we could also send this data to the server
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('smo_token');
}

// Helper function to make authenticated API requests
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('No authentication token available');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Fetch employee tasks from API
async function fetchEmployeeTasks(employeeId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/app/employee/tasks/${employeeId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch employee tasks');
        }
        
        const data = await response.json();
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Update user information in header
function updateUserInfoInHeader() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user name in header if element exists
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name; // Updated to use the API response structure
    }
    
    // Update current time
    updateCurrentTime();
}

// Update current time in header
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    if (!currentTimeElement) return;
    
    const updateTime = () => {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentTimeElement.textContent = now.toLocaleString('en-US', options);
    };
    
    // Update immediately
    updateTime();
    
    // Update every minute
    setInterval(updateTime, 60000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check auth status
    checkAuth();
    
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('login-error');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            
            // Disable button and show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';
            }
            
            // Clear previous error messages
            errorMessage.textContent = '';
            
            try {
                const success = await loginUser(username, password);
                
                if (success) {
                    window.location.href = 'dashboard.html';
                } else {
                    errorMessage.textContent = 'Invalid username or password';
                    
                    // Reset button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Login';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = 'An error occurred during login. Please try again.';
                
                // Reset button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Login';
                }
            }
        });
    }
    
    // Logout button handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
    
    // Update user info in header
    updateUserInfoInHeader();
});

// Export the functions needed by other modules
export {
    isLoggedIn,
    checkAuth,
    getCurrentUser,
    loginUser,
    logoutUser,
    getAuthToken,
    fetchWithAuth,
    fetchEmployeeTasks,
    updateUserInfoInHeader
};
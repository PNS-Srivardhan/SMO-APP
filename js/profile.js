// Import required functions from auth.js
import { getCurrentUser, fetchWithAuth, logoutUser } from './auth.js';

// Load profile data
function loadProfile() {
    const user = getCurrentUser();
    const employee = JSON.parse(localStorage.getItem('smo_employee') || 'null');
    
    if (!user) return;
    
    // Update profile information elements
    updateProfileInfo(user, employee);
    
    // Load performance stats
    loadPerformanceStats(user);
}

// Update profile information in the UI
function updateProfileInfo(user, employee) {
    // Use employee data if available, otherwise use user data
    const displayName = employee ? employee.name : user.name;
    
    // Set user name 
    document.getElementById('profile-full-name').textContent = displayName;
    
    // Set user role/position
    document.getElementById('profile-position').textContent = user.role || 'Employee';
    
    // Set employee ID if available
    document.getElementById('profile-id').textContent = employee ? employee.id : (user.id || '--');
    
    // If RFID is available, display it in the department field
    if (employee && employee.rfid) {
        document.getElementById('profile-department').textContent = `RFID: ${employee.rfid}`;
    } else {
        document.getElementById('profile-department').textContent = '--';
    }
    
    // Set other fields with placeholder values until we have API endpoints for this data
    document.getElementById('profile-join-date').textContent = '--';
    document.getElementById('profile-email').textContent = '--';
    document.getElementById('profile-phone').textContent = '--';
}

// Load performance statistics
function loadPerformanceStats(user) {
    if (!user) return;
    
    // Get attendance data
    const attendance = JSON.parse(localStorage.getItem('smo_attendance') || '[]');
    const userAttendance = attendance.filter(a => a.userId === user.id);
    
    // For now, we'll continue using mock data for tasks until we have API endpoints
    // In a real implementation, we would fetch these statistics from the server
    
    // Calculate statistics
    const totalDays = userAttendance.length;
    
    // Set placeholder values for now
    // In a production app, these would come from API calls
    const totalTasksCompleted = 0;
    const totalPiecesCompleted = 0;
    
    // Update UI
    document.getElementById('total-days').textContent = totalDays;
    document.getElementById('total-tasks-completed').textContent = totalTasksCompleted;
    document.getElementById('total-pieces-completed').textContent = totalPiecesCompleted;
}

// Format date to a user-friendly format
function formatDate(dateString) {
    if (!dateString) return '--';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Handle password change form
function initPasswordChangeForm() {
    const form = document.getElementById('change-password-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get password values
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Get error and success message elements
        const errorElement = document.getElementById('password-error');
        const successElement = document.getElementById('password-success');
        
        // Reset messages
        errorElement.textContent = '';
        successElement.classList.add('hidden');
        
        // Validate user session
        const token = localStorage.getItem('smo_token');
        if (!token) {
            errorElement.textContent = 'User session not found. Please log in again.';
            return;
        }
        
        // Validate new password
        if (newPassword.length < 6) {
            errorElement.textContent = 'New password must be at least 6 characters long.';
            return;
        }
        
        // Confirm passwords match
        if (newPassword !== confirmPassword) {
            errorElement.textContent = 'New passwords do not match.';
            return;
        }
        
        // In a real app, we would make an API call to change the password
        // For now, we'll simulate a successful password change
        try {
            // This is a placeholder for a real API call
            // const response = await fetchWithAuth(`${API_BASE_URL}/user/change-password`, {
            //     method: 'POST',
            //     body: JSON.stringify({
            //         currentPassword,
            //         newPassword
            //     })
            // });
            
            // Show success message
            successElement.classList.remove('hidden');
            
            // Clear form
            form.reset();
        } catch (error) {
            errorElement.textContent = 'An error occurred while changing your password. Please try again.';
            console.error('Password change error:', error);
        }
    });
}

// Setup logout button functionality
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
            // No need to redirect here as logoutUser() already handles that
        });
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    initPasswordChangeForm();
    setupLogoutButton();
});
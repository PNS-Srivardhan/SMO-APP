import { API_BASE_URL } from './config.js'

function getEmployeeId() {
    const employeeData = localStorage.getItem('smo_employee');
    if (employeeData) {
        const employee = JSON.parse(employeeData);
        return employee.id;
    }
    return null;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (notification && notificationMessage) {
        // Set message
        notificationMessage.textContent = message;
        
        // Set notification type (class)
        notification.className = 'notification';
        notification.classList.add(`notification-${type}`);
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Update date and time in header
function updateDateTime() {
    const currentTimeElement = document.getElementById('current-time');
    const currentDateElement = document.getElementById('current-date');
    const loginTimeElement = document.getElementById('login-time');
    
    // Set initial login time (once)
    if (loginTimeElement && !loginTimeElement.dataset.set) {
        const now = new Date();
        loginTimeElement.textContent = now.toLocaleTimeString();
        loginTimeElement.dataset.set = 'true';
    }
    
    if (currentTimeElement) {
        setInterval(() => {
            const now = new Date();
            currentTimeElement.textContent = now.toLocaleTimeString();
            
            if (currentDateElement) {
                currentDateElement.textContent = now.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }, 1000);
    }
}

// Update user name in header
function updateUserName() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        const employeeData = JSON.parse(localStorage.getItem('smo_employee') || '{}');
        if (employeeData.name) {
            userNameElement.textContent = employeeData.name;
            // Show welcome notification
            setTimeout(() => {
                showNotification(`Welcome back, ${employeeData.name}!`);
            }, 1000);
        }
    }
}

async function fetchEmployeeTasks() {
    const employeeId = getEmployeeId();
    
    // Show loading state
    showLoadingState(true);
    
    if (!employeeId) {
        showNoTasksMessage('Employee ID not found. Please log in.');
        showLoadingState(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/app/employee/tasks/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('smo_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch employee tasks');
        }

        const data = await response.json();

        if (data && data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
            // Separate tasks by status
            const assignedTasks = data.tasks.filter(task => task.status === 'Assigned' || task.status === 'In Progress');
            const completedTasks = data.tasks.filter(task => task.status === 'Completed');
            
            // Render tasks in their respective containers
            displayAssignedTasks(assignedTasks);
            displayCompletedTasks(completedTasks);
            
            // Update machine info if there's an assigned task
            if (assignedTasks.length > 0) {
                updateMachineInfo(assignedTasks[0]);
            }
            
            // Update production stats
            updateProductionStats(data.tasks);
            
            // Hide loading state
            showLoadingState(false);
        } else {
            showNoTasksMessage('No tasks found.');
            showLoadingState(false);
        }
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        showNoTasksMessage(`Error: ${error.message}`);
        showLoadingState(false);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Show loading state
function showLoadingState(isLoading) {
    // Find or create loading indicator for assigned tasks
    let assignedLoadingElement = document.getElementById('assigned-loading');
    if (!assignedLoadingElement) {
        assignedLoadingElement = document.createElement('div');
        assignedLoadingElement.id = 'assigned-loading';
        assignedLoadingElement.className = 'loading-message';
        assignedLoadingElement.innerHTML = '<div class="loading-spinner"></div>Loading assigned tasks...';
        const assignedTasksBlocks = document.getElementById('assigned-tasks-blocks');
        if (assignedTasksBlocks) {
            assignedTasksBlocks.appendChild(assignedLoadingElement);
        }
    }
    
    // Find or create loading indicator for completed tasks
    let completedLoadingElement = document.getElementById('completed-loading');
    if (!completedLoadingElement) {
        completedLoadingElement = document.createElement('tr');
        completedLoadingElement.id = 'completed-loading';
        completedLoadingElement.innerHTML = '<td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Loading completed tasks...</td>';
        const completedTasksList = document.getElementById('completed-tasks-list');
        if (completedTasksList) {
            completedTasksList.appendChild(completedLoadingElement);
        }
    }
    
    // Show/hide loading elements
    if (isLoading) {
        assignedLoadingElement.classList.remove('hidden');
        completedLoadingElement.classList.remove('hidden');
    } else {
        assignedLoadingElement.classList.add('hidden');
        completedLoadingElement.classList.add('hidden');
    }
}

// Show no tasks message
function showNoTasksMessage(message) {
    const noTasksMessage = document.getElementById('no-tasks-message');
    if (noTasksMessage) {
        noTasksMessage.classList.remove('hidden');
        noTasksMessage.innerHTML = `<p>${message}</p>`;
    }
}

// Display Assigned tasks as blocks
function displayAssignedTasks(tasks) {
    const assignedTasksBlocks = document.getElementById('assigned-tasks-blocks');
    
    if (!assignedTasksBlocks) return;
    
    // Clear existing blocks (except loading indicator)
    const blocksToRemove = assignedTasksBlocks.querySelectorAll('.assigned-task-block');
    blocksToRemove.forEach(block => block.remove());
    
    // If no assigned tasks, show empty message
    if (!tasks || tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard fa-2x" style="color: #ccc; margin-bottom: 10px;"></i><br>No assigned tasks found.';
        assignedTasksBlocks.appendChild(emptyMessage);
        return;
    }
    
    // Create blocks for each assigned task with animation delay
    tasks.forEach((task, index) => {
        const blockElement = document.createElement('div');
        blockElement.className = 'assigned-task-block';
        blockElement.setAttribute('data-task-id', task.id);
        blockElement.style.animationDelay = `${index * 0.1}s`;
        
        // Create block content
        blockElement.innerHTML = `
            <div class="assigned-task-header">
                <div class="assigned-task-title"><i class="fas fa-clipboard-check"></i> Order #${task.id}</div>
                <div class="assigned-task-status">Assigned</div>
            </div>
            <div class="assigned-task-content">
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Employee ID</span>
                    <span class="assigned-task-value">${task.employee_id || '--'}</span>
                </div>
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Target</span>
                    <span class="assigned-task-value">${task.target || '0'}</span>
                </div>
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Completed</span>
                    <span class="assigned-task-value">${task.completed || '0'}</span>
                </div>
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Status</span>
                    <span class="assigned-task-value status-assigned">${task.status || 'Assigned'}</span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${task.target > 0 ? (task.completed / task.target * 100) : 0}%"></div>
            </div>
            <div class="assigned-task-machine">
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Machine ID</span>
                    <span class="assigned-task-value">${task.MachineAllocation ? task.MachineAllocation.machine_id : '--'}</span>
                </div>
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Step</span>
                    <span class="assigned-task-value">${task.MachineAllocation ? task.MachineAllocation.step : '--'}</span>
                </div>
            </div>
        `;
        
        // Add click event to show details
        blockElement.addEventListener('click', () => {
            showTaskDetails(task.id, tasks);
        });
        
        assignedTasksBlocks.appendChild(blockElement);
    });
}

// Display Completed tasks in table
function displayCompletedTasks(tasks) {
    const completedTasksList = document.getElementById('completed-tasks-list');
    
    if (!completedTasksList) return;
    
    // Clear existing rows (except loading indicator)
    const rowsToRemove = completedTasksList.querySelectorAll('tr:not(#completed-loading)');
    rowsToRemove.forEach(row => row.remove());
    
    // If no completed tasks, show empty message
    if (!tasks || tasks.length === 0) {
        completedTasksList.innerHTML = '<tr><td colspan="6" class="empty-message"><i class="fas fa-clipboard-check fa-2x" style="color: #ccc; margin-bottom: 10px;"></i><br>No completed tasks found.</td></tr>';
        return;
    }
    
    // Create rows for each completed task
    tasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-task-id', task.id);
        row.style.animation = 'fadeIn 0.5s ease-out';
        row.style.animationDelay = `${index * 0.1}s`;
        row.style.animationFillMode = 'both';
        
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.employee_id || '--'}</td>
            <td>${task.target || '0'}</td>
            <td>${task.completed || '0'}</td>
            <td>${task.MachineAllocation ? task.MachineAllocation.machine_id : '--'}</td>
            <td>${task.MachineAllocation ? task.MachineAllocation.step : '--'}</td>
        `;
        
        // Add click event to show details
        row.addEventListener('click', () => {
            showTaskDetails(task.id, tasks);
        });
        
        completedTasksList.appendChild(row);
    });
}

// Show task details in a modal
function showTaskDetails(taskId, tasks) {
    const task = tasks.find(t => t.id === parseInt(taskId, 10));
    if (!task) return;
    
    // Create modal element if it doesn't exist
    let modalElement = document.getElementById('task-detail-modal');
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'task-detail-modal';
        modalElement.className = 'modal';
        
        modalElement.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3 class="modal-title"></h3>
                <div class="modal-content-inner"></div>
            </div>
        `;
        
        document.body.appendChild(modalElement);
        
        // Add close event to the new modal
        const closeButton = modalElement.querySelector('.close-modal');
        if (closeButton) {
            closeButton.onclick = function() {
                modalElement.classList.remove('visible');
                setTimeout(() => {
                    modalElement.classList.add('hidden');
                }, 300);
            };
        }
    }
    
    // Update modal content
    const titleElement = modalElement.querySelector('.modal-title');
    if (titleElement) {
        titleElement.innerHTML = `<i class="fas fa-clipboard-list"></i> Task Details - Order #${task.id}`;
    }
    
    const contentElement = modalElement.querySelector('.modal-content-inner');
    if (contentElement) {
        const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '--';
        const completePercent = task.target > 0 ? Math.round((task.completed / task.target) * 100) : 0;
        
        contentElement.innerHTML = `
            <div class="task-details-container">
                <div class="task-details-row">
                    <div class="detail-column">
                        <div class="detail-row">
                            <span class="detail-label">Employee ID:</span>
                            <span class="detail-value">${task.employee_id || '--'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Target:</span>
                            <span class="detail-value">${task.target || '0'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Completed:</span>
                            <span class="detail-value">${task.completed || '0'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value ${task.status === 'Completed' ? 'status-completed' : 'status-assigned'}">${task.status}</span>
                        </div>
                    </div>
                    <div class="detail-column">
                        <div class="detail-row">
                            <span class="detail-label">Machine ID:</span>
                            <span class="detail-value">${task.MachineAllocation ? task.MachineAllocation.machine_id : '--'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Step:</span>
                            <span class="detail-value">${task.MachineAllocation ? task.MachineAllocation.step : '--'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Created:</span>
                            <span class="detail-value">${createdDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Progress:</span>
                            <span class="detail-value">${completePercent}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="progress-detail">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${completePercent}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Show modal with animation
    modalElement.classList.remove('hidden');
    setTimeout(() => {
        modalElement.classList.add('visible');
    }, 10);
}

// Update machine info in dashboard cards
function updateMachineInfo(task) {
    const machineIdElement = document.getElementById('machine-id');
    const machineStepElement = document.getElementById('machine-step');
    const completedCountElement = document.getElementById('completed-count');
    const targetCountElement = document.getElementById('target-count');
    const progressBarElement = document.getElementById('machine-progress-bar');
    const machineStatusElement = document.getElementById('machine-status');
    
    let machineId = null;
    
    if (machineIdElement && task.MachineAllocation) {
        machineId = task.MachineAllocation.machine_id || '--';
        animateValueUpdate(machineIdElement, machineId);
        
        // Store machine ID in localStorage for use in scan.js
        localStorage.setItem('smo_machine_id', machineId);
    }
    
    if (machineStepElement && task.MachineAllocation) {
        animateValueUpdate(machineStepElement, task.MachineAllocation.step || '--');
    }
    
    if (completedCountElement) {
        animateNumberChange(completedCountElement, parseInt(task.completed || '0'));
    }
    
    if (targetCountElement) {
        animateNumberChange(targetCountElement, parseInt(task.target || '0'));
    }
    
    if (progressBarElement) {
        const percent = task.target > 0 ? (task.completed / task.target) * 100 : 0;
        animateProgressBar(progressBarElement, percent);
    }
    
    if (machineStatusElement) {
        machineStatusElement.textContent = task.status || '--';
        
        // Update status color
        machineStatusElement.className = 'stat-value status-indicator';
        if (task.status === 'Completed') {
            machineStatusElement.classList.add('status-completed');
        } else if (task.status === 'Assigned') {
            machineStatusElement.classList.add('status-assigned');
        }
    }
    
    // Store current task in employee data for easy access in scan page
    if (task && task.MachineAllocation) {
        const employeeData = JSON.parse(localStorage.getItem('smo_employee') || '{}');
        employeeData.currentTask = task;
        localStorage.setItem('smo_employee', JSON.stringify(employeeData));
    }
}

// Function to animate value updates
function animateValueUpdate(element, newValue) {
    element.classList.add('updating');
    setTimeout(() => {
        element.textContent = newValue;
        element.classList.remove('updating');
    }, 300);
}

// Function to animate number changes
function animateNumberChange(element, newValue) {
    const duration = 1000; // milliseconds
    const startValue = parseInt(element.textContent) || 0;
    const change = newValue - startValue;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const currentValue = Math.floor(startValue + change * easeOutQuad(progress));
            element.textContent = currentValue;
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = newValue;
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Function to animate progress bar
function animateProgressBar(element, newPercent) {
    element.style.transition = 'width 1s ease-out';
    element.style.width = `${newPercent}%`;
}

// Easing function
function easeOutQuad(t) {
    return t * (2 - t);
}

// Update production stats
function updateProductionStats(tasks) {
    const todayCompletedElement = document.getElementById('today-completed');
    const weeklyCompletedElement = document.getElementById('weekly-completed');
    
    if (!todayCompletedElement || !weeklyCompletedElement) return;
    
    // Calculate today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate start of this week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    // Filter and calculate completed pieces
    let todayCompleted = 0;
    let weeklyCompleted = 0;
    
    tasks.forEach(task => {
        const taskDate = new Date(task.updatedAt || task.createdAt);
        
        // Count for today
        if (taskDate >= today) {
            todayCompleted += parseInt(task.completed || 0);
        }
        
        // Count for this week
        if (taskDate >= startOfWeek) {
            weeklyCompleted += parseInt(task.completed || 0);
        }
    });
    
    // Update the UI with animation
    animateNumberChange(todayCompletedElement, todayCompleted);
    animateNumberChange(weeklyCompletedElement, weeklyCompleted);
}

// Add CSS styles for animations
function addAnimationStyles() {
    let styleElement = document.getElementById('animation-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'animation-styles';
        styleElement.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .updating {
                animation: pulse 0.5s ease-in-out;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .assigned-task-block {
                animation: fadeIn 0.5s ease-out;
                animation-fill-mode: both;
            }
            
            .notification-error {
                background-color: var(--danger-color);
            }
            
            .notification-warning {
                background-color: var(--warning-color);
                color: var(--dark-color);
            }
            
            .task-details-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .task-details-row {
                display: flex;
                flex-wrap: wrap;
                gap: 30px;
                justify-content: space-between;
            }
            
            .detail-column {
                flex: 1;
                min-width: 200px;
            }
            
            .detail-row {
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(236, 240, 241, 0.5);
            }
            
            .detail-label {
                font-weight: 600;
                color: var(--grey-color);
            }
            
            .detail-value {
                font-weight: 500;
                color: var(--dark-color);
            }
            
            .progress-detail {
                margin-top: 10px;
            }
            
            .empty-message {
                text-align: center;
                color: var(--grey-color);
                padding: 30px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .loading-message {
                text-align: center;
                color: var(--grey-color);
                padding: 20px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    addAnimationStyles();
    updateDateTime();
    updateUserName();
    fetchEmployeeTasks();
    
    // Set up modal close when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('task-detail-modal');
        if (modal && event.target === modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    });
    
    // Animate cards on page load
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
    });
    
    // Start polling for updates
    setInterval(fetchEmployeeTasks, 30000); // Poll every 30 seconds
});

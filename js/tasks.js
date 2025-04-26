/**
 * Tasks Module for SMO Production App
 * Handles displaying and managing assigned tasks
 */
import { API_BASE_URL } from './config.js';
import { getCurrentUser, fetchEmployeeTasks } from './auth.js';

// Variable to store the interval for polling tasks
let taskPollingInterval = null;

// Load and display tasks data
async function loadTasks() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Get employee data
    const employeeData = JSON.parse(localStorage.getItem('smo_employee'));
    if (!employeeData || !employeeData.id) {
        console.error('No employee data found');
        return;
    }
    
    // Add loading indicator
    showLoadingState(true);
    
    try {
        // Fetch employee tasks from API
        const result = await fetchEmployeeTasks(employeeData.id);
        
        if (!result.success) {
            console.error('Failed to load tasks:', result.error);
            showLoadingState(false);
            showNoTasksMessage('Failed to load tasks. Please try again.');
            return;
        }
        
        const { tasks, taskHistory } = result.data;
        
        // Separate tasks by status
        const assignedTasks = tasks.filter(task => task.status === 'Assigned');
        const completedTasks = tasks.filter(task => task.status === 'Completed');
        const allTasks = [...tasks];
        
        // Apply filter if set
        const statusFilter = document.getElementById('task-status-filter');
        let filteredTasks = [...tasks];
        
        if (statusFilter && statusFilter.value !== 'all') {
            if (statusFilter.value === 'assigned') {
                filteredTasks = assignedTasks;
            } else if (statusFilter.value === 'completed') {
                filteredTasks = completedTasks;
            }
        }
        
        // Apply search filter if any text is entered
        const searchInput = document.getElementById('task-search');
        if (searchInput && searchInput.value) {
            const searchText = searchInput.value.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                (task.MachineAllocation && task.MachineAllocation.step && task.MachineAllocation.step.toLowerCase().includes(searchText)) || 
                (task.MachineAllocation && task.MachineAllocation.machine_id && ('Machine ' + task.MachineAllocation.machine_id).toLowerCase().includes(searchText))
            );
        }
        
        // Update visibility based on filter
        updateContainerVisibility(statusFilter ? statusFilter.value : 'all');
        
        // Display tasks based on their status
        displayAssignedTasks(statusFilter && statusFilter.value === 'completed' ? [] : assignedTasks);
        displayCompletedTasks(statusFilter && statusFilter.value === 'assigned' ? [] : completedTasks);
        
        // Show or hide no tasks message
        const noTasksMessage = document.getElementById('no-tasks-message');
        if (noTasksMessage) {
            if (filteredTasks.length === 0) {
                noTasksMessage.classList.remove('hidden');
                noTasksMessage.innerHTML = '<p>No tasks found.</p>';
            } else {
                noTasksMessage.classList.add('hidden');
            }
        }
        
        // Hide loading state
        showLoadingState(false);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showLoadingState(false);
        showNoTasksMessage('An error occurred while loading tasks.');
    }
}

// Update container visibility based on filter
function updateContainerVisibility(filterValue) {
    const assignedContainer = document.getElementById('assigned-tasks-container');
    const completedContainer = document.getElementById('completed-tasks-container');
    
    if (assignedContainer && completedContainer) {
        switch(filterValue) {
            case 'assigned':
                assignedContainer.classList.remove('hidden');
                completedContainer.classList.add('hidden');
                break;
            case 'completed':
                assignedContainer.classList.add('hidden');
                completedContainer.classList.remove('hidden');
                break;
            default: // 'all'
                assignedContainer.classList.remove('hidden');
                completedContainer.classList.remove('hidden');
                break;
        }
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
        assignedLoadingElement.innerHTML = 'Loading assigned tasks...';
        const assignedTasksBlocks = document.getElementById('assigned-tasks-blocks');
        if (assignedTasksBlocks) {
            assignedTasksBlocks.appendChild(assignedLoadingElement);
        }
    }
    
    // Find or create loading indicator for completed tasks
    let completedLoadingElement = document.getElementById('completed-loading');
    if (!completedLoadingElement) {
        completedLoadingElement = document.createElement('div');
        completedLoadingElement.id = 'completed-loading';
        completedLoadingElement.className = 'loading-message';
        completedLoadingElement.innerHTML = 'Loading completed tasks...';
        const completedTasksBlocks = document.getElementById('completed-tasks-blocks');
        if (completedTasksBlocks) {
            completedTasksBlocks.appendChild(completedLoadingElement);
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

// Start polling for tasks at regular intervals
function startTaskPolling() {
    // Clear any existing interval first
    stopTaskPolling();
    
    // Get the employee ID
    const user = getCurrentUser();
    if (!user) return;
    
    const employeeData = JSON.parse(localStorage.getItem('smo_employee'));
    if (!employeeData || !employeeData.id) {
        console.error('No employee ID found for task polling');
        return;
    }
    
    // Set up the interval to fetch tasks every 5 seconds
    taskPollingInterval = setInterval(async () => {
        try {
            // Fetch employee tasks from the API directly using the endpoint
            const result = await fetchEmployeeTasks(employeeData.id);
            
            if (result.success && result.data) {
                // Update the UI with the latest data if we're on the tasks page
                if (window.location.href.includes('tasks.html')) {
                    const { tasks } = result.data;
                    
                    // Separate tasks by status
                    const assignedTasks = tasks.filter(task => task.status === 'Assigned');
                    const completedTasks = tasks.filter(task => task.status === 'Completed');
                    
                    // Get current filter value
                    const statusFilter = document.getElementById('task-status-filter');
                    const currentFilter = statusFilter ? statusFilter.value : 'all';
                    
                    // Display tasks based on filter
                    if (currentFilter === 'all' || currentFilter === 'assigned') {
                        displayAssignedTasks(assignedTasks);
                    }
                    
                    if (currentFilter === 'all' || currentFilter === 'completed') {
                        displayCompletedTasks(completedTasks);
                    }
                }
            }
        } catch (error) {
            console.error('Error during task polling:', error);
            // Don't show errors in UI for background polling - just log to console
        }
    }, 5000); // Poll every 5 seconds
    
    console.log('Task polling started');
}

// Stop the polling interval
function stopTaskPolling() {
    if (taskPollingInterval) {
        clearInterval(taskPollingInterval);
        taskPollingInterval = null;
        console.log('Task polling stopped');
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
        emptyMessage.textContent = 'No assigned tasks found.';
        assignedTasksBlocks.appendChild(emptyMessage);
        return;
    }
    
    // Create blocks for each assigned task
    tasks.forEach(task => {
        const blockElement = document.createElement('div');
        blockElement.className = 'assigned-task-block';
        blockElement.setAttribute('data-task-id', task.id);
        
        // Create block content
        blockElement.innerHTML = `
            <div class="assigned-task-header">
                <div class="assigned-task-title">Order #${task.id}</div>
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
            <div class="assigned-task-machine">
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Machine ID</span>
                    <span class="assigned-task-value">${task.MachineAllocation ? task.MachineAllocation.machine_id : '4'}</span>
                </div>
                <div class="assigned-task-item">
                    <span class="assigned-task-label">Step</span>
                    <span class="assigned-task-value">${task.MachineAllocation ? task.MachineAllocation.step : 'testing'}</span>
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

// Display Completed tasks in blocks (similar to assigned tasks)
function displayCompletedTasks(tasks) {
    const completedTasksBlocks = document.getElementById('completed-tasks-blocks');
    
    if (!completedTasksBlocks) return;
    
    // Clear existing blocks
    const blocksToRemove = completedTasksBlocks.querySelectorAll('.completed-task-block');
    blocksToRemove.forEach(block => block.remove());
    
    // If no completed tasks, show empty message
    if (!tasks || tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No completed tasks found.';
        completedTasksBlocks.appendChild(emptyMessage);
        return;
    }
    
    // Create blocks for each completed task
    tasks.forEach(task => {
        const blockElement = document.createElement('div');
        blockElement.className = 'completed-task-block';
        blockElement.setAttribute('data-task-id', task.id);
        
        // Create block content
        blockElement.innerHTML = `
            <div class="completed-task-header">
                <div class="completed-task-title">Order #${task.id}</div>
                <div class="completed-task-status">Completed</div>
            </div>
            <div class="completed-task-content">
                <div class="completed-task-item">
                    <span class="completed-task-label">Employee ID</span>
                    <span class="completed-task-value">${task.employee_id || '--'}</span>
                </div>
                <div class="completed-task-item">
                    <span class="completed-task-label">Target</span>
                    <span class="completed-task-value">${task.target || '0'}</span>
                </div>
                <div class="completed-task-item">
                    <span class="completed-task-label">Completed</span>
                    <span class="completed-task-value">${task.completed || '0'}</span>
                </div>
                <div class="completed-task-item">
                    <span class="completed-task-label">Status</span>
                    <span class="completed-task-value status-completed">${task.status || 'Completed'}</span>
                </div>
            </div>
            <div class="completed-task-machine">
                <div class="completed-task-item">
                    <span class="completed-task-label">Machine ID</span>
                    <span class="completed-task-value">${task.MachineAllocation ? task.MachineAllocation.machine_id : '4'}</span>
                </div>
                <div class="completed-task-item">
                    <span class="completed-task-label">Step</span>
                    <span class="completed-task-value">${task.MachineAllocation ? task.MachineAllocation.step : 'testing'}</span>
                </div>
            </div>
        `;
        
        // Add click event to show details
        blockElement.addEventListener('click', () => {
            showTaskDetails(task.id, tasks);
        });
        
        completedTasksBlocks.appendChild(blockElement);
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
                modalElement.classList.add('hidden');
            };
        }
    }
    
    // Update modal content
    const titleElement = modalElement.querySelector('.modal-title');
    if (titleElement) {
        titleElement.textContent = `Task Details - Order #${task.id}`;
    }
    
    const contentElement = modalElement.querySelector('.modal-content-inner');
    if (contentElement) {
        const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '--';
        
        contentElement.innerHTML = `
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
            <div class="detail-row">
                <span class="detail-label">Machine ID:</span>
                <span class="detail-value">${task.MachineAllocation ? task.MachineAllocation.machine_id : '4'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Step:</span>
                <span class="detail-value">${task.MachineAllocation ? task.MachineAllocation.step : 'testing'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${createdDate}</span>
            </div>
        `;
    }
    
    // Show modal
    modalElement.classList.remove('hidden');
}

// Add modal styles if not already in CSS
function addModalStyles() {
    let styleElement = document.getElementById('modal-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'modal-styles';
        styleElement.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                overflow: auto;
            }
            
            .modal.hidden {
                display: none;
            }
            
            .modal-content {
                background-color: white;
                margin: 10% auto;
                padding: 20px;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
                position: relative;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            .close-modal {
                position: absolute;
                right: 20px;
                top: 15px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                color: #95a5a6;
            }
            
            .close-modal:hover {
                color: #34495e;
            }
            
            .modal-title {
                margin-bottom: 20px;
                border-bottom: 1px solid #ecf0f1;
                padding-bottom: 10px;
            }
            
            .modal-content-inner {
                margin-top: 20px;
            }
            
            .detail-row {
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .detail-label {
                font-weight: 600;
                color: #95a5a6;
            }
            
            .loading-message, .empty-message {
                text-align: center;
                color: #95a5a6;
                padding: 20px;
                width: 100%;
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Debounce function to limit how often a function can fire
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Initialize event listeners
function initEventListeners() {
    // Status filter change
    const statusFilter = document.getElementById('task-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            updateContainerVisibility(statusFilter.value);
            loadTasks();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadTasks, 300));
    }
    
    // Modal close when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('task-detail-modal');
        if (modal && event.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-tasks');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTasks);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    addModalStyles();
    initEventListeners();
    loadTasks();
    startTaskPolling();
});
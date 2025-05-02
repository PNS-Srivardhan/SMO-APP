// Import the API_BASE_URL from config.js
import { API_BASE_URL } from './config.js';

console.log('Scan.js loaded - API Base URL:', API_BASE_URL);

const scanResultMessage = document.getElementById('scan-result-message');
const scanResult = document.getElementById('scan-result');
const scannedTaskId = document.getElementById('scanned-task-id');
const scannedStepName = document.getElementById('scanned-step-name');
const scannedQuantity = document.getElementById('scanned-quantity');
const confirmScanButton = document.getElementById('confirm-scan');
const notificationMessage = document.getElementById('notification-message');
const scanNotification = document.getElementById('scan-notification');
const cameraPermissionButton = document.getElementById('camera-permission');
const scannerViewport = document.getElementById('scanner-viewport');

// Create a container for the success animation
const successAnimationContainer = document.createElement('div');
successAnimationContainer.id = 'success-animation';
successAnimationContainer.className = 'success-animation hidden';
successAnimationContainer.style.position = 'fixed';
successAnimationContainer.style.top = '50%';
successAnimationContainer.style.left = '50%';
successAnimationContainer.style.transform = 'translate(-50%, -50%)';
successAnimationContainer.style.width = '200px';
successAnimationContainer.style.height = '200px';
successAnimationContainer.style.zIndex = '1000';
document.body.appendChild(successAnimationContainer);

// Create a container for the failed animation
const failedAnimationContainer = document.createElement('div');
failedAnimationContainer.id = 'failed-animation';
failedAnimationContainer.className = 'failed-animation hidden';
failedAnimationContainer.style.position = 'fixed';
failedAnimationContainer.style.top = '50%';
failedAnimationContainer.style.left = '50%';
failedAnimationContainer.style.transform = 'translate(-50%, -50%)';
failedAnimationContainer.style.width = '200px';
failedAnimationContainer.style.height = '200px';
failedAnimationContainer.style.zIndex = '1000';
document.body.appendChild(failedAnimationContainer);

// Create a modal for machine mismatch error
const mismatchModal = document.createElement('div');
mismatchModal.className = 'modal hidden';
mismatchModal.id = 'machine-mismatch-modal';
mismatchModal.innerHTML = `
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3 class="modal-title">Machine Mismatch Error</h3>
        <div class="modal-content-inner">
            <p>The scanned machine ID does not match your assigned machine.</p>
            <p>Please scan the QR code on your assigned machine.</p>
        </div>
    </div>
`;
document.body.appendChild(mismatchModal);

// Add event listener to close the modal
const closeModalButton = mismatchModal.querySelector('.close-modal');
if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        mismatchModal.classList.add('hidden');
        // Resume scanning after closing the modal
        if (html5QrCode) {
            html5QrCode.resume();
        }
    });
}

// Add event listener to close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === mismatchModal) {
        mismatchModal.classList.add('hidden');
        // Resume scanning after closing the modal
        if (html5QrCode) {
            html5QrCode.resume();
        }
    }
});

let html5QrCode = null;

// Handle camera permission button click
cameraPermissionButton.addEventListener('click', initializeScanner);

// Initialize the QR scanner
function initializeScanner() {
    // Hide the permission button once clicked
    cameraPermissionButton.style.display = 'none';
    
    // Show initializing message
    scanResultMessage.textContent = "Initializing camera...";
    scanResultMessage.style.color = "#333";
    
    // First check if camera access is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        scanResultMessage.textContent = "Camera access is not supported by your browser. Please try a different browser.";
        scanResultMessage.style.color = "red";
        cameraPermissionButton.style.display = 'block';
        return;
    }

    try {
        // Create a new instance of Html5Qrcode directly
        html5QrCode = new Html5Qrcode("scanner-viewport");
        
        // Calculate the viewport dimensions
        const viewportElement = document.getElementById('scanner-viewport');
        const viewportWidth = viewportElement.clientWidth;
        const viewportHeight = viewportElement.clientHeight;
        
        // Calculate qrbox size - 70% of the viewport size to match the scan-area CSS
        const qrboxSize = Math.min(viewportWidth, viewportHeight) * 0.7;
        
        console.log('Viewport dimensions:', viewportWidth, 'x', viewportHeight);
        console.log('Setting QR box size to:', qrboxSize);
        
        // Start scanning
        html5QrCode.start(
            { facingMode: "environment" }, // Use back camera
            {
                fps: 10,
                qrbox: { width: qrboxSize, height: qrboxSize },
                aspectRatio: 1.0
            },
            onScanSuccess,
            onScanError
        )
        .then(() => {
            // Camera started successfully
            scanResultMessage.textContent = "Camera is active! Scan a QR code to continue.";
            scanResultMessage.style.color = "green";
            
            // Apply additional styling to ensure video fits properly
            setTimeout(adjustVideoElement, 1000);
        })
        .catch((err) => {
            console.error("Error starting camera:", err);
            scanResultMessage.textContent = "Error starting camera: " + err.message;
            scanResultMessage.style.color = "red";
            cameraPermissionButton.style.display = 'block';
        });
        
        // Check if camera is actually working after a short delay
        setTimeout(checkCameraStatus, 5000);
    } catch (error) {
        console.error("Error initializing scanner:", error);
        scanResultMessage.textContent = "Error initializing camera: " + error.message;
        scanResultMessage.style.color = "red";
        cameraPermissionButton.style.display = 'block';
    }
}

// Function to adjust the video element styling
function adjustVideoElement() {
    const videoElement = document.querySelector('#scanner-viewport video');
    if (videoElement) {
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        console.log('Video element styling adjusted');
    }
}

// Check if camera appears to be working
function checkCameraStatus() {
    const videoElement = document.querySelector('#scanner-viewport video');
    
    if (!videoElement) {
        scanResultMessage.textContent = "Camera could not be initialized. Try refreshing the page or check your camera permissions.";
        scanResultMessage.style.color = "red";
        cameraPermissionButton.style.display = 'block';
    } else {
        // Update with success message if video element exists
        scanResultMessage.textContent = "Camera is active! Scan a QR code to continue.";
        scanResultMessage.style.color = "green";
    }
}

// Handle QR Scan Success
function onScanSuccess(decodedText, decodedResult) {
    try {
        console.log('Scanned QR code:', decodedText);
        
        // Direct handling for numeric or simple string values
        let scannedMachineId = decodedText;
        
        // Check if it's potentially JSON
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
            try {
                // Attempt to parse as JSON
                const scannedData = JSON.parse(decodedText);
                // If JSON, extract machine ID from the object structure
                scannedMachineId = scannedData.machineId || scannedData.machine_id || scannedData.id || decodedText;
            } catch (parseError) {
                console.log('Not valid JSON, using raw value');
                // Keep the original text as machine ID
            }
        }
        
        console.log('Extracted machine ID from scan:', scannedMachineId);
        
        // Get the stored machine ID from localStorage
        const storedMachineId = localStorage.getItem('smo_machine_id');
        console.log('Stored machine ID:', storedMachineId);
        
        // Compare machine IDs - normalize both to strings and trim whitespace
        const normalizedScannedId = String(scannedMachineId).trim();
        const normalizedStoredId = String(storedMachineId).trim();
        
        console.log('Comparing IDs:', normalizedScannedId, normalizedStoredId);
        
        if (normalizedScannedId === normalizedStoredId) {
            console.log('Machine ID match confirmed!');
            
            // Get employee data from localStorage
            const employeeData = JSON.parse(localStorage.getItem('smo_employee') || '{}');
            const employeeRfid = employeeData.rfid;
            
            if (!employeeRfid) {
                console.error('Employee RFID not found in localStorage');
                scanResultMessage.textContent = "Error: Employee RFID not found";
                scanResultMessage.classList.remove('hidden');
                scanResultMessage.style.color = "red";
                return;
            }
            
            console.log('Employee RFID found:', employeeRfid);
            
            // Send the RFID scan request to the API
            sendRfidScanRequest(employeeRfid, normalizedScannedId);
            
            // Pause scanning after successful scan
            if (html5QrCode) {
                html5QrCode.pause();
            }
        } else {
            console.error('Machine ID mismatch!', 
                'Scanned:', normalizedScannedId, 
                'Stored:', normalizedStoredId);
            
            // Show the failed animation
            showFailedAnimation();
            
            // Show the machine mismatch modal
            mismatchModal.classList.remove('hidden');
            
            // Pause scanning until modal is dismissed
            if (html5QrCode) {
                html5QrCode.pause();
            }
        }
    } catch (error) {
        console.error('Error processing QR data:', error);
        scanResultMessage.textContent = "Invalid QR code format. Please try again.";
        scanResultMessage.classList.remove('hidden');
        scanResultMessage.style.color = "red";
    }
}

// Send RFID scan request to the API
function sendRfidScanRequest(rfid, machineId) {
    console.log('Sending RFID scan request:', { rfid, machineId });
    
    // Show processing message
    scanResultMessage.textContent = "Processing RFID scan...";
    scanResultMessage.classList.remove('hidden');
    scanResultMessage.style.color = "#333";
    
    // Prepare request data
    const requestData = { 
        rfid: rfid,
        machine_id: machineId 
    };
    
    // Send the API request
    fetch('https://smo-backend-production.up.railway.app/api/rfid/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('smo_token')}`
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('RFID scan response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('RFID scan successful, server response:', data);
        
        // Show success notification
        scanNotification.classList.remove('hidden');
        notificationMessage.textContent = 'RFID scan successful!';
        
        // Display the scan result
        if (data.task) {
            displayScanResult(data.task);
        } else {
            // Handle case where API returns success but no task data
            scanResult.classList.remove('hidden');
            scannedTaskId.textContent = "Successfully scanned";
            scannedStepName.textContent = "Machine ID: " + machineId;
            scannedQuantity.textContent = "RFID: " + rfid;
        }
        
        // Show success animation
        showSuccessAnimation();

        // Resume scanning after 5 seconds
        setTimeout(() => {
            if (html5QrCode) {
                console.log('Resuming scanner after 5-second delay');
                html5QrCode.resume();
            }
        }, 5000);
    })
    .catch(error => {
        console.error('Error with RFID scan:', error);
        
        // Show error notification
        scanNotification.classList.remove('hidden');
        notificationMessage.textContent = 'Error processing RFID scan. Please try again.';
        
        // Resume scanning
        if (html5QrCode) {
            html5QrCode.resume();
        }
    });
}

// Show success animation
function showSuccessAnimation() {
    const animationContainer = document.getElementById('success-animation');
    if (animationContainer) {
        animationContainer.classList.remove('hidden');
        const animation = bodymovin.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'success.json'
        });
        animation.addEventListener('complete', () => {
            animationContainer.classList.add('hidden');
        });
    }
}

// Show failed animation
function showFailedAnimation() {
    const animationContainer = document.getElementById('failed-animation');
    if (animationContainer) {
        animationContainer.classList.remove('hidden');
        const animation = bodymovin.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'failed-mail.json'
        });
        animation.addEventListener('complete', () => {
            animationContainer.classList.add('hidden');
        });
    }
}

// Handle QR Scan Error
function onScanError(errorMessage) {
    // Don't log common scan errors like "No MultiFormat Readers were able to detect the code"
    // These happen when the camera is on but no QR code is in view
    if (!errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
        console.error('QR scan error:', errorMessage);
    }
    
    // Only update the UI for critical errors, not for every frame without a QR code
    if (errorMessage.includes("permission") || errorMessage.includes("denied") || errorMessage.includes("failed")) {
        scanResultMessage.textContent = "Error scanning QR code: " + errorMessage;
        scanResultMessage.style.color = "red";
        cameraPermissionButton.style.display = 'block';
    }
}

// Display scan results in UI
function displayScanResult(resultData) {
    console.log('Displaying scan result data:', resultData);
    scanResultMessage.classList.add('hidden');
    scanResult.classList.remove('hidden');
    
    scannedTaskId.textContent = resultData.taskId || "Unknown";
    scannedStepName.textContent = resultData.stepName || "Unknown";
    scannedQuantity.textContent = resultData.quantity || "Unknown";
    
    console.log('Task ID displayed:', resultData.taskId);
    
    // Add event listener to confirm scan button
    confirmScanButton.addEventListener('click', function() {
        completeTask(resultData.taskId);
    });
}

// Function to complete a task
function completeTask(taskId) {
    console.log('Sending request to:', `${API_BASE_URL}/tasks/complete`);
    
    fetch(`${API_BASE_URL}/tasks/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Added token if authentication is needed
        },
        body: JSON.stringify({
            taskId: taskId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Task completed successfully:', data);
        
        // Show success notification
        scanNotification.classList.remove('hidden');
        notificationMessage.textContent = 'Task completed successfully!';
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    })
    .catch(error => {
        console.error('Error completing task:', error);
        
        // Show error notification
        scanNotification.classList.remove('hidden');
        notificationMessage.textContent = 'Error completing task. Please try again.';
    });
}

// Initialize scanner when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, automatically initializing camera');
    
    // Check if the camera permission button exists
    if (cameraPermissionButton) {
        console.log('Camera permission button found');
        // Hide the button initially as we're starting camera automatically
        cameraPermissionButton.style.display = 'none';
        // Initialize the scanner automatically
        initializeScanner();
    } else {
        console.error('Camera permission button not found in the DOM');
    }
    
    // Check if notification element exists
    if (scanNotification && notificationMessage) {
        console.log('Notification elements found');
        
        // Add click event listener to close the notification
        scanNotification.addEventListener('click', function() {
            scanNotification.classList.add('hidden');
        });
    }
});
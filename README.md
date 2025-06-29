# Enterprise-Production App - Detailed Documentation

## Table of Contents
1. Introduction
2. Tech Stack
3. Page Descriptions
   - Login Page
   - Dashboard
   - Tasks Page
   - QR Code Scanning Page
   - Profile Page
4. API Integration
5. Data Flow
6. Mobile Optimization
7. Security Features
8. Future Enhancements

---

## 1. Introduction
The SMO Production App is a mobile-first web application designed to streamline production management. It provides employees with tools to manage tasks, scan QR codes for machine identification, and view their profiles. The app is optimized for mobile devices and ensures a seamless user experience.

---

## 2. Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: RESTful API hosted at `https://smo-backend-production.up.railway.app`
- **Libraries**:
  - Font Awesome for icons
  - QR Code.js for generating QR codes
  - HTML5 QR Code Scanner for scanning functionality
- **Storage**: LocalStorage for session and temporary data
- **Deployment**: Optimized for mobile browsers

---

## 3. Page Descriptions

### Login Page (`index.html`)
- **Purpose**: Allows employees to log in using their credentials.
- **Features**:
  - Username and password fields.
  - Error handling for invalid credentials.
  - Redirects to the dashboard upon successful login.
- **Key Components**:
  - `auth.js`: Handles login logic and API calls.

### Dashboard (`dashboard.html`)
- **Purpose**: Displays an overview of production stats and assigned tasks.
- **Features**:
  - Production stats (e.g., completed units today and this week).
  - List of assigned tasks.
  - Notifications for updates.
- **Key Components**:
  - `dashboard.js`: Fetches and displays tasks and stats.
  - `dashboard.css`: Styles the dashboard layout.

### Tasks Page (`tasks.html`)
- **Purpose**: Allows employees to view and manage tasks.
- **Features**:
  - Filters for task status (e.g., assigned, completed).
  - Search functionality.
  - Detailed task view in a modal.
- **Key Components**:
  - `tasks.js`: Manages task data and interactions.
  - `tasks.css`: Styles the task list and filters.

### QR Code Scanning Page (`scan.html`)
- **Purpose**: Enables employees to scan machine QR codes.
- **Features**:
  - Camera-based QR code scanning.
  - Validation of machine assignments.
  - Error handling for mismatches.
- **Key Components**:
  - `scan.js`: Implements scanning logic and API integration.
  - `scan.css`: Styles the scanning interface.

### Profile Page (`profile.html`)
- **Purpose**: Displays and allows updates to user information.
- **Features**:
  - View user details (e.g., name, role, employee ID).
  - Change password functionality.
  - Logout button.
- **Key Components**:
  - `profile.js`: Manages profile data and interactions.
  - `profile.css`: Styles the profile layout.

---

## 4. API Integration
- **Authentication**:
  - Endpoint: `/auth/app-login`
  - Method: POST
  - Description: Validates user credentials and returns a session token.
- **Task Management**:
  - Endpoint: `/auth/app/employee/tasks/{employeeId}`
  - Method: GET
  - Description: Fetches tasks assigned to the employee.
- **RFID Scanning**:
  - Endpoint: `/rfid/scan`
  - Method: POST
  - Description: Validates scanned machine IDs.

---

## 5. Data Flow
1. **Login**:
   - User enters credentials.
   - `auth.js` sends a POST request to the login API.
   - On success, user data is stored in LocalStorage.
2. **Dashboard**:
   - `dashboard.js` fetches tasks and stats from the API.
   - Data is displayed in cards and tables.
3. **Tasks**:
   - `tasks.js` fetches and filters tasks based on user input.
   - Task details are shown in a modal.
4. **Scanning**:
   - `scan.js` initializes the QR scanner.
   - Scanned data is validated via the API.
5. **Profile**:
   - `profile.js` fetches and updates user data.

---

## 6. Mobile Optimization
- **Responsive Design**:
  - CSS media queries ensure proper scaling on different screen sizes.
- **Touch Interactions**:
  - Ripple effects for buttons.
  - Optimized layouts for touch navigation.

---

## 7. Security Features
- **Authentication**:
  - Token-based authentication for API requests.
- **Data Storage**:
  - Sensitive data is stored securely in LocalStorage.
- **Error Handling**:
  - Graceful handling of API errors and invalid inputs.

---

## 8. Future Enhancements
- **Push Notifications**:
  - Real-time updates for task assignments.
- **Offline Mode**:
  - Caching data for offline access.
- **Enhanced Analytics**:
  - Detailed performance metrics for employees.

---

This document provides a comprehensive overview of the SMO Production App, its functionality, and technical details. For further assistance, please refer to the codebase or contact the development team.

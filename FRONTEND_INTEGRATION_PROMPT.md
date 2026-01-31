Objective
Connect the existing React Frontend to the newly created Node.js/Express Backend. The frontend must switch from using local/mock data to fetching fetching data from the API, handling authentication via JWT, and respecting the new database schema.

Backend Connection Details
Base URL: http://localhost:5000/api
Authentication: Bearer Token in Authorization header.
Data Format: JSON (Note: Backend returns snake_case properties).

1. Configuration & Setup
   Create/Update .env file:
   VITE_API_URL=http://localhost:5000/api

Setup Axios (or similar) with an interceptor to:
Automatically attach Authorization: Bearer <token> to requests from localStorage.
Handle 401 Unauthorized responses by clearing local storage and redirecting to login.

2. Authentication Flow
   Login Page:
   Endpoint: POST /auth/login
   Payload: { email, password }
   Response: { token, user }
   Action: Store token and user info.
   Critical Check: Check user.needs_password_change. If true, immediately redirect the user to the "Change Password" screen/modal. Do not allow access to the dashboard until the password is changed.
   Change Password Screen:
   Endpoint: POST /auth/change-password
   Payload: { password, newPassword } (Note: 'password' is the current temporary password).
   On success, redirect to Dashboard.

3. Data Interfaces & Adaptation
   The backend returns data in snake_case. You must update your TypeScript interfaces or create adapters to map these to your frontend components.

User Interface:
interface User {
id: string;
name: string;
email: string;
role: 'admin' | 'staff';
department?: string;
avatar?: string;
needs_password_change: boolean;
created_at: string;
}

Task Interface:
interface Task {
id: string;
title: string;
description: string;
status: 'todo' | 'in-process' | 'review' | 'completed';
priority: 'low' | 'medium' | 'high';
due_date: string | null; // Backend sends ISO string
time_allocation: number | null;// In minutes/hours
creator_id: string;
assignee_id: string | null;
activity_logs?: ActivityLog[]; // Included in GET /tasks/:id
}

4. Feature Implementation
   A. Task Management (Dashboard)
   Fetch Tasks: GET /tasks. Support query params for filtering: ?status=...&priority=....
   Kanban/List View:
   Populate columns based on status.
   Drag & Drop: When a task is dropped, call PATCH /tasks/:id/status with { status: newStatus }.
   Create Task:
   Fields: Title, Description, Priority, Due Date, Time Allocation, Assignee (Dropdown).
   Endpoint: POST /tasks.
   Task Details:
   Fetch full details via GET /tasks/:id.
   Display Activity Logs history (returned in the response) showing who modified the task and when.
   B. User Management (Admin Only)
   List Users: GET /users.
   Create User:
   Fields: Name, Email, Role, Department.
   Endpoint: POST /users.
   Important: The response contains a tempPassword. You must display this to the Admin immediately upon creation so they can share it with the new user.
   Edit/Delete: Implement PUT /users/:id and DELETE /users/:id.

5. UI Guidelines
   Show Loading States (spinners/skeletons) while fetching data.
   Handle Errors gracefully (e.g., display "Access Denied" if a Staff member tries to access Admin pages).
   Ensure Dates are formatted correctly (backend sends ISO UTC strings).

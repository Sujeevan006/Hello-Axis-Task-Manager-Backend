# Frontend Integration Plan for Task Manager

**Objective:**  
Integrate the current React frontend with the deployed Node.js/Express backend hosted on Railway. The integration replaces local mock data with real API calls, utilizing JWT authentication and adhering to the backend's data schema.

## 1. Backend Configuration

**Base URL:**  
`https://hello-axis-task-manager-backend-production.up.railway.app/api`

**CORS & Environment:**

- The backend allows requests from `http://localhost:3000` and `https://project.axivers.com`.
- Create or update your `.env` file in the frontend project:
  ```bash
  VITE_API_BASE_URL=https://hello-axis-task-manager-backend-production.up.railway.app/api
  ```

## 2. Authentication & Security

- **Auth Method:** Bearer Token.
- **Header:** `Authorization: Bearer <token>`
- **Token Persistence:** Store the `token` and `user` object in `localStorage` upon login.
- **Interceptors:**
  - **Request:** Automatically inject the `Authorization` header if a token exists.
  - **Response:** Intercept `401 Unauthorized` errors to clear `localStorage` and redirect the user to `/login`.

## 3. Data Models (TypeScript Interfaces)

The backend returns data in **snake_case**. You should align your frontend interfaces to match these keys directly to avoid complex mapping layers.

### **User Interface**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar?: string;
  department?: string;
  needs_password_change: boolean;
  created_at: string; // ISO Date String
  updated_at: string;
}
```

### **Task Interface**

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-process' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null; // ISO Date String
  time_allocation: number | null; // Minutes/Hours
  creator_id: string;
  assignee_id: string | null;
  created_at: string;

  // Relations (often included)
  creator?: { id: string; name: string; avatar?: string };
  assignee?: { id: string; name: string; avatar?: string };
  activity_logs?: ActivityLog[];
}
```

### **Activity Log Interface**

```typescript
interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  timestamp: string;
  user?: { name: string };
}
```

## 4. API Endpoints & Implementation Rules

### **A. Authentication Module**

1.  **Login:**
    - **Endpoint:** `POST /auth/login`
    - **Body:** `{ email, password }`
    - **Response:** `{ token: string, user: User }`
    - **Logic:**
      - Store response data.
      - **CRITICAL:** Check `user.needs_password_change`. If `true`, **block access** to the dashboard and force redirect to the **Change Password** page/modal.
2.  **Change Password (Force Check):**
    - **Endpoint:** `POST /auth/change-password`
    - **Body:** `{ password, newPassword }` (Use the temporary password as `password`).
    - **On Success:** Redirect to Dashboard.

### **B. Task Management (Dashboard)**

1.  **Fetch All Tasks:**
    - **Endpoint:** `GET /tasks`
    - **Filters:** Support query params: `?status=in-process&priority=high&assignee=UUID`
    - **Data Display:** Use the `status` field to organize tasks into Kanban columns.
2.  **Create Task:**
    - **Endpoint:** `POST /tasks`
    - **Body:**
      ```typescript
      {
        title: string;       // Min 3 chars
        description: string;
        priority: 'low' | 'medium' | 'high';
        due_date?: string;   // ISO String
        time_allocation?: number;
        assignee_id?: string;
      }
      ```
3.  **Update Task Status (Drag & Drop):**
    - **Endpoint:** `PATCH /tasks/:id/status`
    - **Body:** `{ status: 'completed' }`
    - **UI:** Optimistically update the UI. Revert if the API call fails.
4.  **Task Details:**
    - **Endpoint:** `GET /tasks/:id`
    - **Display:** Show full details including `activity_logs` history.

### **C. User Management (Admin Only)**

1.  **List Users:** `GET /users`
2.  **Create User:** parameters: `{ name, email, role, department }` -> `POST /users`
    - **IMPORTANT:** The backend generates a **temporary password** and returns it in the response. **You must display this password to the Admin** via a modal or alert so they can copy it for the new user.
3.  **Edit User:** `PUT /users/:id`
4.  **Delete User:** `DELETE /users/:id`

## 5. UI/UX Polishing

- **Loading States:** Show skeletons or spinners during async data fetching.
- **Error Handling:** Catch 403 Forbidden errors (e.g., Staff trying to delete a user) and show a toast notification.
- **Dates:** Format ISO strings (e.g., `2024-02-03T10:00:00.000Z`) to readable formats like "Feb 3, 2024".

---

**Note to Agent:** The backend code has been updated to include the `GET /tasks/:id` endpoint. If you encounter a 404 on this route, it means the latest backend code hasn't been re-deployed to Railway yet. In that case, use `GET /tasks` and find the task client-side as a temporary fallback.

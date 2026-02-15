# Frontend Integration Prompt - Hello Axis Task Manager

## **Context**

The backend for the **Hello Axis Task Manager** has been finalized and is running locally. It is a **Node.js/Express** application backed by **Google Cloud Firestore**.

You are required to integrate the **React Frontend** with this backend.

## **Backend Connection Details**

- **Base URL:** `http://localhost:5000/api`
- **Authentication:** JWT (JSON Web Token) sent in the `Authorization` header as `Bearer <token>`.

## **Integration Tasks**

### 1. API Client Configuration (`src/api/axios.ts` or similar)

- Configure the Axios instance to use `http://localhost:5000/api` as the `baseURL`.
- Add a request interceptor to retrieve the `token` from `localStorage` (or your auth store) and attach it to the `Authorization` header.
- Add a response interceptor to handle `401 Unauthorized` errors (e.g., redirect to login).

### 2. Type Definitions (`src/types/index.ts`)

Update your TypeScript interfaces to match the Firestore data structure perfectly:

```typescript
// Enums
export type TaskStatus = 'todo' | 'in_process' | 'completed';
export type UserRole = 'admin' | 'staff';
export type TaskPriority = 'low' | 'medium' | 'high';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  department?: string | null;
  created_at: string; // ISO Date string
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null; // ISO Date string
  time_allocation: number | null;
  assignee: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user: {
    id: string;
    name: string;
  };
  action: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[]; // Note: Backend returns { tasks: [...], total, ... } or { users: [...], total, ... }. You might need to map API response to this generic or handle specific keys.
  total: number;
  page: number;
  limit: number;
}
```

### 3. API Service Updates (`src/services/api.ts` or similar)

**Authentication:**

- `POST /auth/login`: Accepts `{ email, password }`. Returns `{ token, user }`.
- `POST /auth/register`: Accepts `{ name, email, password, role, ... }`. Returns `{ token, user }`.
- `GET /auth/me`: Returns `{ user }` profile.

**Task Management:**

- `GET /tasks`: Supports query params `{ page, limit, status, priority, assignee }`.
  - **Response:** `{ tasks: Task[], total: number, page: number, limit: number }`
- `POST /tasks`: Accepts `{ title, description, priority, due_date, assignee_id }`.
- `PUT /tasks/:id`: Updates task details.
- `PATCH /tasks/:id/status`: Accepts `{ status }`. **Use this for drag-and-drop or status changes.**
- `DELETE /tasks/:id`: Deletes a task.

**User Management:**

- `GET /users`: Supports `{ page, limit }`.
  - **Response:** `{ users: User[], total: number, page: number, limit: number }`
- `POST /users`: (Admin only) Creates a new user. Returns `{ message, user, tempPassword }`. **Display the `tempPassword` to the admin so they can share it.**

### 4. Component Refactoring & State Management

- **Auth Context:** Ensure `login` and `logout` functions persist the token correctly.
- **Task Board / List:**
  - Update the data fetching logic to handle the `paginated` response structure (`response.data.tasks` instead of just `response.data`).
  - Ensure dates are parsed correctly (use `date-fns` or native `new Date()` format) for display.
  - Update the **Drag and Drop** logic to call `PATCH /tasks/:id/status` when a card is moved.
- **Forms:**
  - **Create Task Modal:** Ensure `assignee_id` is sent instead of a full object.
  - **Create User Modal:** Display the returned `tempPassword` clearly after success.

### 5. Verification

- Verify that `Admin` users can see/edit all tasks.
- Verify that `Staff` users can only see/edit their own tasks (if that restriction is enabled in your backend logic, otherwise check permissions).

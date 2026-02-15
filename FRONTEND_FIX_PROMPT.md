# FIX: Frontend API Configuration Double Prefix Issue

## **Problem Diagnosis**

The frontend is making requests to `http://localhost:5000/api/api/auth/login`, which results in a **404 Not Found** error. This is because the URL contains a double `/api` prefix.

## **Investigation & Logic**

1.  **Backend Route:** Defined as `/api/auth/login`.
2.  **Current Request:** `.../api/api/auth/login` (Incorrect).
3.  **Root Cause:** The `axios` configurations `baseURL` is likely set to `http://localhost:5000/api`, but the API calls in the service files are also prepending `/api` (e.g., `axios.post('/api/auth/login', ...)`), leading to the duplication.

## **Required Fixes**

### 1. Check `src/api/axios.ts`

Review the `baseURL` setting.

**Option A (Recommended): Clean Base URL**
Set the `baseURL` to the root of the server:

```typescript
const instance = axios.create({
  baseURL: 'http://localhost:5000', // No /api here
  withCredentials: true,
  // ...
});
```

_If you choose this, ensure all your service calls include the full path, e.g., `/api/auth/login`._

**Option B: Contextual Base URL**
If you keep the `baseURL` as `http://localhost:5000/api`:

```typescript
const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  // ...
});
```

_Then you MUST allow update all service calls to remove the leading `/api`. E.g., change `/api/auth/login` to just `/auth/login`._

### 2. Update `src/services/api.ts` (and others)

Scan all API calls. If they look like this:

```typescript
// INCORRECT if baseURL includes /api
return api.post('/api/auth/login', data);
```

Change them to align with your chosen `baseURL` strategy.

**Final expected URL construction:**
`baseURL` + `endpoint` = `http://localhost:5000/api/auth/login`

### 3. Verify Other Endpoints

Run a global search for `/api/` in your codebase to ensure no other endpoints (Tasks, Users) are double-prefixed.

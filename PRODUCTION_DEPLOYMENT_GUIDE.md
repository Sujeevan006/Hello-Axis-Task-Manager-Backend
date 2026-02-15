# Production Deployment & Debugging Guide

## **1. Backend Deployment (Database Access)**

Code changes have been made to `src/utils/firebase.ts` to allow loading credentials from an environment variable. This is critical for cloud hosting (Railway, Heroku, etc.).

**Action Required:**

1.  Open your `firebase-key.json` file locally.
2.  Copy the **entire content** (the JSON object).
3.  Go to your Hosting Provider's Dashboard (e.g., Railway).
4.  Add a new Environment Variable:
    - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
    - **Value:** Paste the JSON content you copied.
5.  **Remove** `FIREBASE_SERVICE_ACCOUNT_PATH` from your production environment variables to avoid conflicts.

## **2. Frontend Integration (The Likely Culprit)**

If login works locally but fails in production, it is usually because the **Frontend** doesn't know where the **Backend** is, or is constructing the URL incorrectly.

**Check these in your Frontend Project:**

### **A. Environment Variables (.env.production)**

Ensure you have a `.env.production` file in your frontend project (or set these in your hosting dashboard used for the frontend, e.g., Vercel/Netlify).

```env
# Example for Vite
VITE_API_URL=https://your-production-backend-url.com
```

**CRITICAL:** Do **NOT** add `/api` to the end if your code adds it manually.

- **CORRECT:** `https://api.myapp.com` (if code does `axios.post('/api/login')`)
- **INCORRECT:** `https://api.myapp.com/api` (this leads to `/api/api/login`)

### **B. CORS Configuration (Backend)**

Your backend is currently configured to allow these origins in `src/app.ts`:

```typescript
origin: [
  'https://project.axivers.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
```

**Action:** If your hosted frontend is on a different domain (e.g., `https://myapp.vercel.app`), you **MUST** add it to this list in `src/app.ts` and redeploy the backend.

### **C. Network Tab Debugging**

1.  Open your hosted website.
2.  Open **Developer Tools (F12)** -> **Network** tab.
3.  Attempt to login.
4.  Click the failed request (likely red).
5.  **Look at the "Request URL".**
    - Does it look like `https://api.myapp.com/api/auth/login`? (Correct)
    - Does it look like `https://api.myapp.com/api/api/auth/login`? (Double prefix error -> Fix Frontend Code)
    - Does it look like `http://localhost:5000/...`? (Frontend using local URL in prod -> Fix Frontend ENV)

## **Summary Checklist**

- [ ] Backend: `FIREBASE_SERVICE_ACCOUNT_JSON` env var set in hosting.
- [ ] Backend: `src/app.ts` allows the frontend's domain in CORS.
- [ ] Frontend: `VITE_API_URL` (or equivalent) is set to the **production backend URL**.
- [ ] Frontend: No double `/api` segments in the requested URL.

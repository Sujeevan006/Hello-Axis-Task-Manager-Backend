# Task Management Backend (Firestore Edition)

## Overview

A high-performance Node.js/Express backend for a Task Management System, fully migrated to **Google Cloud Firestore**. This architecture uses NoSQL denormalization (embedded snapshots) for maximum speed and scalability on Google Cloud Run.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Google Cloud Firestore
- **SDK**: Firebase Admin SDK
- **Authentication**: JWT, bcryptjs

## Prerequisites

- Node.js (v18+)
- A Google Cloud Project with Firestore enabled.
- A Service Account Key file (`.json`) with "Cloud Datastore User" permissions.

## Setup Instructions

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Update the configuration:
      ```env
      JWT_SECRET="your_secret_key"
      PORT=5000
      FIREBASE_SERVICE_ACCOUNT_PATH="path/to/your/service-account.json"
      ```

3.  **Data Migration (Optional)**:
    If you are migrating from the old MySQL version, run the migration script:

    ```bash
    # Test first
    node scripts/migrate-to-firestore.js --dry-run
    # Execute
    node scripts/migrate-to-firestore.js
    ```

4.  **Start the Server**:
    - Development Mode:
      ```bash
      npm run dev
      ```
    - The server will start on port 5000 (default).

## Database Architecture (NoSQL)

This project uses a denormalized schema for better performance:

- **Tasks**: Embeds snapshots of the `creator` and `assignee` (`{id, name, avatar}`).
- **Activity Logs**: Embeds snapshots of the `user` who performed the action.
- **Transactions**: All critical updates (task changes + logging) are performed via `firestore.runTransaction()`.

## API Endpoints

### Auth

- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login & receive JWT
- `GET /api/auth/me`: Get current user profile
- `POST /api/auth/change-password`: Update password

### Users

- `GET /api/users`: List users (Paginated)
- `GET /api/users/:id`: Get user details
- `POST /api/users`: Admin create user
- `PUT /api/users/:id`: Update user profile
- `DELETE /api/users/:id`: Delete user & cleanup assignments

### Tasks

- `GET /api/tasks`: List tasks (Filtered & Paginated)
- `GET /api/tasks/:id`: Get task with activity logs
- `POST /api/tasks`: Create task
- `PUT /api/tasks/:id`: Update task
- `PATCH /api/tasks/:id/status`: Update status
- `DELETE /api/tasks/:id`: Delete task & logs

## Scripts

- `npm run build`: Compile TypeScript
- `npm start`: Production start
- `node scripts/migrate-to-firestore.js`: MySQL to Firestore migration utility

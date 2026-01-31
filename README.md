# Task Management Backend

## Overview

A robust Node.js/Express backend for a Task Management System, using MySQL as the database and Prisma/Sequelize as the ORM.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL (Database name: `hello_manage`)
- **ORM**: Prisma
- **Authentication**: JWT, bcryptjs

## Prerequisites

- Node.js (v18+)
- MySQL Server running locally or remotely

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
    - Update `DATABASE_URL` in `.env` with your MySQL credentials:
      ```env
      DATABASE_URL="mysql://user:password@localhost:3306/hello_manage"
      ```

3.  **Database Migration**:
    - Run migrations to create the database (`hello_manage`) and tables:
      ```bash
      npx prisma migrate dev --name init
      ```
    - _Note_: This will automatically generate the Prisma Client.

4.  **Start the Server**:
    - Development Mode:
      ```bash
      npm run dev
      ```
    - The server will start on port 5000 (default).
    - **Seeding**: The server automatically seeds a default Super Admin user on startup if one does not exist.
      - Email: `avsinfo0824@gmail.com`
      - Password: `admin123`

## API Endpoints

### Auth

- `POST /api/auth/login`: Login
- `POST /api/auth/change-password`: Change password

### Users

- `GET /api/users`: List all users (Admin)
- `GET /api/users/:id`: Get user details
- `POST /api/users`: Create user (Admin) - Returns temp password
- `PUT /api/users/:id`: Update user
- `DELETE /api/users/:id`: Delete user (Admin)

### Tasks

- `GET /api/tasks`: List all tasks (Filter by status, assignee, priority)
- `GET /api/tasks/:id`: Get task details
- `POST /api/tasks`: Create task
- `PUT /api/tasks/:id`: Update task
- `PATCH /api/tasks/:id/status`: Update task status
- `DELETE /api/tasks/:id`: Delete task

## Scripts

- `npm run build`: Build for production
- `npm start`: Start production server

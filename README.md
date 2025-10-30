## JIMS TestHub — Domain MCQ Platform

TestHUB (JIMS TestHub) is a lightweight web platform for managing domain-based multiple-choice tests, created for faculty and students. It includes an admin panel to manage users and tests, a faculty interface for question/test creation, and a secure student test interface with anti-cheating measures.

Key features
- Role-based users: admin, faculty, student
- Question bank with domains & subjects
- Test creation (randomize, pool size, scheduling)
- Student test interface with enhanced anti-cheating (fullscreen enforcement, tab-switch and shortcut detection)
- Test attempt recording, results, and progress tracking
- CSV / Excel import for questions

## Badges

![Node.js](https://img.shields.io/badge/Node.js-16%2B-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-fast-yellow)
![MongoDB](https://img.shields.io/badge/MongoDB-%20-47A248)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-blue)

## Table of contents
- [Overview](#jims-testhub-—-domain-mcq-platform)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Running](#running)
- [API highlights](#api-highlights)
- [Default admin account](#default-admin-account)
- [Troubleshooting / Git tips](#troubleshooting--git-tips)
- [Contributing](#contributing)
- [License](#license)

## Tech stack
- Frontend: React + TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, Mongoose (MongoDB)
- Authentication: JSON Web Tokens (JWT)
- Storage: MongoDB (local or hosted)
- Other: multer (file uploads), xlsx / papaparse (imports)

## Repository structure
Key folders and files you'll work with:

- `src/` – React app (components, services, types)
	- `src/components` – UI components (Admin, Faculty, Student)
	- `src/services/api.ts` – client API helper
- `server/` – Express backend and database code
	- `server/index.js` – Express app and routes
	- `server/database.js` – Mongoose schemas and DB operations
	- `server/uploads/` – uploaded files (not committed)
- `public/` – static assets
- `package.json` – root scripts for development and build

## Getting started (development)
Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn/pnpm)
- MongoDB running locally or a MongoDB connection URI

Install dependencies (root installs client + dev tools):

```bash
cd /home/kd/Desktop/MinorProject/project
npm install
```

Start server and client together (development):

```bash
# from project root
npm run dev:full
```

This runs the Express server and Vite dev server concurrently. Alternatively, run server and client separately:

```bash
# start backend only
npm run server

# start frontend dev server
npm run dev
```

Server scripts (inside `server/`):

```bash
cd server
npm install
npm run dev   # requires nodemon
npm start     # node index.js
```

Configuration
- The backend currently connects to MongoDB at `mongodb://localhost:27017/mcq_platform` by default (see `server/database.js`). If you want to use a different URI, update the connection string in `server/database.js` or replace it with an environment-based config before deployment.
- JWT secret is set in `server/index.js` as `JWT_SECRET`. Replace it in production with a secure secret (use env vars).

## Running (production build)

```bash
# build frontend
npm run build

# serve static build and run server separately (customize as needed)
cd server
npm start
```

## API highlights
Some of the important endpoints (see `server/index.js` for full list):

- `POST /api/auth/login` – login, returns JWT
- `POST /api/admin/create-user` – create admin/faculty/student (admin only)
- `GET /api/admin/users` – list users (admin only)
- `POST /api/questions` – create question
- `POST /api/tests` – create test
- `POST /api/test-attempts` – save student attempt (server upserts by testId+studentId)

The backend contains protective measures for test attempts: it performs an upsert so repeated saves for the same test+student update the existing attempt instead of creating duplicates.

## Default admin account
On first run the server creates a default admin user if none exists:

- Email: `admin@jims.edu`
- Password: `admin123`

Change this account immediately in production.

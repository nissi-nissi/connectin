# Cloud Drive (Google Drive/Dropbox Style)

Full-stack cloud storage web application where all file operations are handled by your backend API. Users never interact with AWS S3 directly.

## Stack

- Frontend: React + Vite, TailwindCSS, Axios, React Router
- Backend: Node.js, Express, JWT auth, Multer
- Database: MongoDB (Mongoose)
- Object Storage: AWS S3 (through backend service layer only)

## Features Implemented

- Authentication
  - Register, login, logout endpoint
  - JWT auth middleware
  - Password hashing with bcrypt
- Files
  - Upload (100MB max, drag-and-drop frontend)
  - List by folder + search by file name
  - Download via backend-generated signed URL
  - Delete (S3 object + metadata + share links)
  - Rename
  - Move between folders
  - Metadata route
  - Preview route for image/video/audio/doc links
- Folders
  - Create
  - List (by parent or all)
  - Delete (non-empty folders are blocked)
- Sharing
  - Generate token-based public links
  - Optional expiration
  - Public preview endpoint
  - Public download endpoint
- Dashboard
  - Storage usage panel
- Folder navigation (breadcrumbs with home icon)
- Interactive folder panels with rename/delete buttons and toggled creation form
- File list/grid views with icons, tooltips, and inline actions (preview/download/rename/move/share)
- Upload area with drag‑drop, icon and progress indicators
- Preview modal with download option

## Project Structure

```txt
backend
  controllers
  routes
  middleware
  services
  models
  config
  server.js

frontend
  components
  pages
  services
  hooks
```

## Backend Routes

Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`

Files

- `POST /files/upload`
- `GET /files/list`
- `GET /files/stats`  (dashboard metrics: total files/folders, usage, top‑shared)
- `GET /files/usage`
- `GET /files/download/:id`
- `DELETE /files/delete/:id`
- `PATCH /files/rename/:id`
- `POST /files/move/:id`
- `POST /files/share/:id`
- `GET /files/metadata/:id`
- `GET /files/preview/:id`
- `GET /files/shared/:token` (public)
- `GET /files/shared/:token/download` (public)

Folders

- `POST /folders/create`
- `PATCH /folders/rename/:id`  (rename a folder)
- `GET /folders/list`
- `DELETE /folders/delete/:id`

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cloud_drive
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run Locally

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:5000`

## Architecture Notes

- MVC-style backend:
  - `controllers/` contain business logic
  - `models/` handle persistence schemas
  - `routes/` map HTTP endpoints to controller actions
  - `services/s3Service.js` isolates S3 logic
- Security:
  - Ownership checks on every protected file/folder operation
  - JWT token validation middleware
  - Multer size limit and MIME validation
- Storage flow:
  - Frontend uploads to backend
  - Backend uploads to S3
  - Backend stores metadata in MongoDB
  - Frontend renders metadata from backend responses

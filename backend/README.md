# MedBridge Backend

This folder contains the backend API server for the MedBridge project.

## Setup

1. Open a terminal in `backend/`
2. Run `npm install`
3. Run `npm run dev`

The backend listens on `http://localhost:8000` by default and exposes the API under `/api/v1`.

## Frontend integration

The frontend is already configured to use `VITE_API_BASE_URL=http://localhost:8000/api/v1` by default.
If you run the backend locally, the frontend should send API requests to this server.

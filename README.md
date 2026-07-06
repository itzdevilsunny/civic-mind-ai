# CivicMind AI | Decision Intelligence Platform

This is the CivicMind AI Decision Intelligence Platform, a live London Municipal Dashboard showing meteorological telemetry, transport statuses, and media feeds.

## Tech Stack

* **Frontend**: React + Vite + TailwindCSS + ECharts + Leaflet.js
* **Backend**: FastAPI + Python Requests + XML RSS Parser

## Running Locally

1. Start the backend:

   ```bash
   cd backend
   python -m uvicorn main:app --port 8002 --reload
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

# Deployment Guide - CivicMind AI Decision Intelligence Platform

This guide walks you through deploying the CivicMind AI platform to **Supabase** (for the database) and **Render** (for the FastAPI backend and React frontend).

---

## Part 1: Supabase Database Setup

1. **Create a Supabase Project:**
   - Go to [Supabase](https://supabase.com/) and sign in.
   - Click **New Project** and select your organization.
   - Input a project name (e.g., `CivicMind AI`) and set a secure database password. Choose a region close to your target audience.

2. **Execute the Database Schema:**
   - Once the database is ready, navigate to the **SQL Editor** tab in the left sidebar of the Supabase dashboard.
   - Click **New Query**.
   - Copy the entire SQL contents from your local file [backend/schema.sql](file:///c:/Users/Pinky/Desktop/my%20projects/ai%20for%20better%20living%20and%20smarter%20communities/backend/schema.sql) and paste them into the SQL editor.
   - Click **Run** (at the bottom right). This will create the `tickets`, `telemetry_logs`, and `action_history` tables, indexes, and insert the initial mock tickets.

3. **Retrieve API Credentials:**
   - Go to **Project Settings** (gear icon at the bottom of the left sidebar).
   - Select **API** settings.
   - Copy your **Project URL** (under Project API keys).
   - Copy your **anon public key** (under Project API keys).

---

## Part 2: Gemini API Key Setup

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key**.
3. Create a new key and copy the token string (e.g., `AIzaSy...`).

---

## Part 3: Deploying to Render via Blueprints

The repository includes a `render.yaml` file, which defines the entire infrastructure-as-code. Connect your Git repository to Render to spin up both the React frontend and the Python backend in a single click.

1. **Commit and Push Code:**
   - Push your project files (including the root `package.json`, `render.yaml`, and the `backend/` folder) to a private or public GitHub/GitLab repository.

2. **Create a Blueprint Instance:**
   - Go to [Render](https://render.com/) and log in.
   - Click **New +** (top right) and select **Blueprint**.
   - Connect your GitHub account and select your `ai-for-better-living-and-smarter-communities` repository.

3. **Configure Environment Variables:**
   Render will parse your `render.yaml` and prompt you for the required configuration parameters:
   - **`GEMINI_API_KEY`**: Paste your Google Gemini token here.
   - **`SUPABASE_URL`**: Paste your Supabase project URL here.
   - **`SUPABASE_KEY`**: Paste your Supabase `anon` public key here.

4. **Deploy:**
   - Click **Apply**.
   - Render will build and link your backend and compile your Vite frontend, automatically inject the backend's host into the frontend's build variable `VITE_API_URL`, and deploy both.
   - Once completed, click the **civicmind-frontend** service in your Render dashboard to find your live, public URL (e.g., `https://civicmind-frontend.onrender.com`).

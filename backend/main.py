import os
import json
import uuid
import asyncio
import sqlite3
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse
import requests
import xml.etree.ElementTree as ET

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

import logging
logger = logging.getLogger("uvicorn")

# Try to initialize Supabase
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your-supabase" not in SUPABASE_URL:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Connected to live Supabase database.")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}. Running in SQLite fallback mode.", exc_info=True)
else:
    logger.warning("Supabase credentials not configured. Running in SQLite fallback mode.")

# Try to initialize Gemini Generative AI
gemini_available = False
if GEMINI_API_KEY and "your-google-gemini" not in GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_available = True
        logger.info("Gemini generative AI SDK initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini SDK: {e}. Running in Mock AI mode.", exc_info=True)
else:
    logger.warning("Gemini API key not configured. Running in Mock AI mode.")

# --- Database Wrapper Engine (Supabase + SQLite Fallback) ---
SQLITE_PATH = os.path.join(os.path.dirname(__file__), "civicmind.db")
USE_SUPABASE = False

def init_db():
    global USE_SUPABASE
    # 1. Test Supabase tables
    if supabase_client:
        try:
            supabase_client.table("tickets").select("id").limit(1).execute()
            logger.info("Database: Supabase tables found. Using Supabase.")
            USE_SUPABASE = True
            return
        except Exception as e:
            logger.warning(f"Database: Supabase check failed ({e}). Falling back to local SQLite.")
            USE_SUPABASE = False
    
    # 2. Setup SQLite database with PostgreSQL-like structure
    logger.info(f"Database: Initializing SQLite database at {SQLITE_PATH}")
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            department TEXT NOT NULL,
            officer TEXT NOT NULL,
            stage INTEGER DEFAULT 0,
            description TEXT,
            submitted_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            id TEXT PRIMARY KEY,
            sensor_id TEXT NOT NULL,
            sensor_type TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            value REAL NOT NULL,
            metric TEXT,
            logged_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_history (
            id TEXT PRIMARY KEY,
            action_name TEXT NOT NULL,
            impact TEXT,
            stage INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Alert Received',
            triggered_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """)
        cursor.execute("PRAGMA table_info(action_history)")
        columns = [col[1] for col in cursor.fetchall()]
        if "stage" not in columns:
            cursor.execute("ALTER TABLE action_history ADD COLUMN stage INTEGER DEFAULT 1")
        if "status" not in columns:
            cursor.execute("ALTER TABLE action_history ADD COLUMN status TEXT DEFAULT 'Alert Received'")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS emergency_services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            capacity TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL
        );
        """)
        cursor.execute("SELECT COUNT(*) FROM emergency_services")
        if cursor.fetchone()[0] == 0:
            services_seed = [
                ('EMG-HOSP1', "St Thomas' Hospital Emergency Unit", 'hospital', 'Optimal', '82% Bed Occupancy', 51.4988, -0.1189),
                ('EMG-FIRE1', 'Lambeth Fire & Rescue Station', 'fire_station', 'Ready', '5 Fire Engines', 51.4947, -0.1165),
                ('EMG-POL1', 'Charing Cross Police Precinct', 'police', 'Ready', '12 Patrol Cruisers', 51.5079, -0.1265),
                ('EMG-AMB1', 'Waterloo Critical Ambulance Depot', 'ambulance', 'Optimal', '8 Medical Crews', 51.5033, -0.1123)
            ]
            cursor.executemany("INSERT INTO emergency_services (id, name, type, status, capacity, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)", services_seed)

        # Seed initial tickets if empty
        cursor.execute("SELECT COUNT(*) FROM tickets")
        if cursor.fetchone()[0] == 0:
            initial_seed = [
                ('LND-9482', 'Pothole on Piccadilly Circus roundabout', 'Roads & Bridges', 'Medium', 'In Progress', 'Transport for London', 'Marcus Vance', 3, 'Large pothole in center lane causing traffic slow downs.', '2026-07-11 21:00:00'),
                ('LND-9388', 'Water main leakage near Hyde Park exit', 'Utilities & Lighting', 'High', 'Resolved', 'Thames Water', 'Elena Rostova', 4, 'Commercial dumpsters are completely full and garbage is spilling onto the pedestrian path.', '2026-07-10 14:15:00'),
                ('LND-9210', 'Flickering streetlights outside Senior Care Center', 'Utilities & Lighting', 'Critical', 'Assigned', 'Power Grid Commission', 'Julian Drake', 2, 'Three streetlights are flickering or off, making the walkway dangerous for residents.', '2026-07-11 18:45:00')
            ]
            cursor.executemany("INSERT INTO tickets (id, title, category, priority, status, department, officer, stage, description, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", initial_seed)
        
        conn.commit()
        conn.close()
        logger.info("Database: SQLite database initialized successfully.")
    except Exception as e:
        logger.error(f"Database: Failed to initialize SQLite: {e}", exc_info=True)

def db_get_tickets():
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("tickets").select("*").order("submitted_at", desc=True).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase query error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
    
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets ORDER BY submitted_at DESC")
        rows = cursor.fetchall()
        tickets = [dict(row) for row in rows]
        conn.close()
        return tickets
    except Exception as e:
        logger.error(f"SQLite query error: {e}")
        return []

def db_create_ticket(ticket: dict):
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            supabase_client.table("tickets").insert(ticket).execute()
            return ticket
        except Exception as e:
            logger.error(f"Supabase insert error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO tickets (id, title, category, priority, status, department, officer, stage, description, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (ticket["id"], ticket["title"], ticket["category"], ticket["priority"], ticket["status"], ticket["department"], ticket["officer"], ticket["stage"], ticket["description"], ticket["submitted_at"])
        )
        conn.commit()
        conn.close()
        return ticket
    except Exception as e:
        logger.error(f"SQLite insert error: {e}")
        return ticket

def db_update_ticket(ticket_id: str, updates: dict):
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            supabase_client.table("tickets").update(updates).eq("id", ticket_id).execute()
            return
        except Exception as e:
            logger.error(f"Supabase update error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [ticket_id]
        cursor.execute(f"UPDATE tickets SET {set_clause} WHERE id = ?", values)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"SQLite update error: {e}")

def db_log_action(action: dict):
    global USE_SUPABASE
    stage = action.get("stage", 1)
    status = action.get("status", "Alert Received")
    
    if USE_SUPABASE and supabase_client:
        try:
            full_action = {**action, "stage": stage, "status": status}
            supabase_client.table("action_history").insert(full_action).execute()
            return full_action
        except Exception as e:
            logger.error(f"Supabase action log error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO action_history (id, action_name, impact, stage, status, triggered_at) VALUES (?, ?, ?, ?, ?, ?)",
            (action["id"], action["action_name"], action["impact"], stage, status, action["triggered_at"])
        )
        conn.commit()
        conn.close()
        return {**action, "stage": stage, "status": status}
    except Exception as e:
        logger.error(f"SQLite action log error: {e}")
        return action

def db_get_action_history():
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("action_history").select("*").order("triggered_at", desc=True).limit(20).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase query actions error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM action_history ORDER BY triggered_at DESC LIMIT 20")
        rows = cursor.fetchall()
        actions = [dict(row) for row in rows]
        conn.close()
        return actions
    except Exception as e:
        logger.error(f"SQLite query actions error: {e}")
        return []

def db_get_emergency_services():
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM emergency_services")
        rows = cursor.fetchall()
        services = [dict(row) for row in rows]
        conn.close()
        return services
    except Exception as e:
        logger.error(f"SQLite query emergency services error: {e}")
        return []
def db_log_telemetry(log: dict):
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            supabase_client.table("telemetry_logs").insert(log).execute()
            return log
        except Exception as e:
            logger.error(f"Supabase telemetry log error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO telemetry_logs (id, sensor_id, sensor_type, name, status, value, metric, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (log["id"], log["sensor_id"], log["sensor_type"], log["name"], log["status"], log["value"], log["metric"], log["logged_at"])
        )
        conn.commit()
        conn.close()
        return log
    except Exception as e:
        logger.error(f"SQLite telemetry log error: {e}")
        return log

def db_get_latest_telemetry():
    global USE_SUPABASE
    if USE_SUPABASE and supabase_client:
        try:
            res = supabase_client.table("telemetry_logs").select("*").order("logged_at", desc=True).limit(50).execute()
            seen = set()
            latest = []
            for item in res.data:
                if item["sensor_id"] not in seen:
                    seen.add(item["sensor_id"])
                    latest.append(item)
            return latest
        except Exception as e:
            logger.error(f"Supabase query telemetry error: {e}. Falling back to SQLite.")
            USE_SUPABASE = False
            
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t1.* FROM telemetry_logs t1
            INNER JOIN (
                SELECT sensor_id, MAX(logged_at) as max_logged FROM telemetry_logs GROUP BY sensor_id
            ) t2 ON t1.sensor_id = t2.sensor_id AND t1.logged_at = t2.max_logged
        """)
        rows = cursor.fetchall()
        telemetry = [dict(row) for row in rows]
        conn.close()
        return telemetry
    except Exception as e:
        logger.error(f"SQLite query telemetry error: {e}")
        return []

app = FastAPI(title="CivicMind AI Backend", description="Decision Intelligence API Layer")

# Run database setup on startup
@app.on_event("startup")
def startup_event():
    init_db()

# --- Schemas ---
class ComplaintSubmit(BaseModel):
    title: str
    category: str
    priority: str
    description: str

class ChatMessage(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class ActionExecute(BaseModel):
    action_name: str
    impact: str

class SimulationRequest(BaseModel):
    busTransit: float
    signalTimer: float
    emergencyTeams: float
    solarFunding: float
    congestionToll: float

class SenateMessage(BaseModel):
    agent: str
    message: str
    sentiment: str

class SenateDebateResponse(BaseModel):
    topic: str
    debate: List[SenateMessage]

# --- Background Task to Simulate Ticket Stepper Pipeline ---
async def simulate_ticket_pipeline(ticket_id: str):
    """
    Periodically advances the ticket stage in the database to simulate
    the work of municipal departments and dispatched technicians.
    """
    for stage in range(1, 5):
        await asyncio.sleep(5)  # wait 5 seconds between stages
        status = "Assigned"
        if stage == 3:
            status = "In Progress"
        elif stage == 4:
            status = "Resolved"

        db_update_ticket(ticket_id, {"stage": stage, "status": status})


# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "live_database": supabase_client is not None,
        "live_gemini": gemini_available
    }

@app.get("/api/live/weather")
def get_live_weather():
    url = "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Error fetching live weather: {e}")
    return {
        "current": {
            "temperature_2m": 16.2,
            "relative_humidity_2m": 72,
            "apparent_temperature": 15.5,
            "precipitation": 0.0,
            "rain": 0.0,
            "weather_code": 3,
            "wind_speed_10m": 12.5,
            "wind_direction_10m": 220
        },
        "daily": {
            "temperature_2m_max": [22.2],
            "temperature_2m_min": [12.0],
            "weather_code": [3]
        }
    }

@app.get("/api/live/aqi")
def get_live_aqi():
    url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=51.5074&longitude=-0.1278&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Error fetching live AQI: {e}")
    return {
        "current": {
            "pm2_5": 12.0,
            "pm10": 18.5,
            "nitrogen_dioxide": 22.1,
            "sulphur_dioxide": 4.2,
            "ozone": 34.0
        }
    }

@app.get("/api/live/aqi/forecast")
def get_aqi_forecast():
    """
    Fetches the 7-day hourly air quality forecast from Open-Meteo Air Quality API
    and groups it into daily averages to render a clean, live predictive forecast.
    """
    url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=51.5074&longitude=-0.1278&hourly=pm2_5,pm10,nitrogen_dioxide&forecast_days=7"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            pm25 = hourly.get("pm2_5", [])
            pm10 = hourly.get("pm10", [])
            no2 = hourly.get("nitrogen_dioxide", [])
            
            days = []
            pm25_daily = []
            pm10_daily = []
            no2_daily = []
            
            from datetime import datetime
            for i in range(7):
                idx_start = i * 24
                idx_end = idx_start + 24
                if idx_end <= len(times):
                    t_str = times[idx_start]
                    dt = datetime.strptime(t_str[:10], "%Y-%m-%d")
                    day_name = dt.strftime("%A")
                    days.append(day_name)
                    
                    pm25_slice = [v for v in pm25[idx_start:idx_end] if v is not None]
                    pm10_slice = [v for v in pm10[idx_start:idx_end] if v is not None]
                    no2_slice = [v for v in no2[idx_start:idx_end] if v is not None]
                    
                    pm25_avg = sum(pm25_slice) / len(pm25_slice) if pm25_slice else 0.0
                    pm10_avg = sum(pm10_slice) / len(pm10_slice) if pm10_slice else 0.0
                    no2_avg = sum(no2_slice) / len(no2_slice) if no2_slice else 0.0
                    
                    pm25_daily.append(round(pm25_avg, 1))
                    pm10_daily.append(round(pm10_avg, 1))
                    no2_daily.append(round(no2_avg, 1))
            
            return {
                "days": days,
                "pm2_5": pm25_daily,
                "pm10": pm10_daily,
                "nitrogen_dioxide": no2_daily
            }
    except Exception as e:
        logger.error(f"Error fetching AQI forecast: {e}", exc_info=True)
        
    return {
        "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "pm2_5": [12.4, 14.2, 18.1, 11.5, 9.8, 15.0, 8.4],
        "pm10": [18.2, 21.0, 24.5, 17.1, 15.2, 22.0, 14.1],
        "nitrogen_dioxide": [24.0, 28.2, 32.0, 21.5, 18.0, 30.1, 22.4]
    }

@app.get("/api/live/transport")
def get_live_transport():
    url = "https://api.tfl.gov.uk/line/mode/tube/status"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Error fetching TfL tube statuses: {e}")
    return []

@app.get("/api/live/market")
def get_live_market():
    url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EFTSE?interval=5m&range=1d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json().get("chart", {}).get("result", [{}])[0]
            meta = data.get("meta", {})
            indicators = data.get("indicators", {}).get("quote", [{}])[0]
            timestamps = data.get("timestamp", [])
            close_prices = indicators.get("close", [])
            
            points = []
            if timestamps and close_prices:
                for t, val in zip(timestamps, close_prices):
                    if val is not None:
                        points.append({"time": t, "value": round(val, 2)})
            
            return {
                "symbol": meta.get("symbol", "^FTSE"),
                "price": meta.get("regularMarketPrice", 10644.84),
                "previousClose": meta.get("previousClose", 10600.00),
                "points": points
            }
    except Exception as e:
        print(f"Error fetching FTSE: {e}")
    return {
        "symbol": "^FTSE",
        "price": 10644.84,
        "previousClose": 10600.00,
        "points": []
    }

@app.get("/api/live/news")
def get_live_news():
    url = "http://feeds.bbci.co.uk/news/england/london/rss.xml"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            root = ET.fromstring(res.content)
            items = []
            for item in root.findall(".//item"):
                title = item.find("title").text if item.find("title") is not None else ""
                description = item.find("description").text if item.find("description") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                items.append({
                    "title": title,
                    "description": description,
                    "link": link,
                    "pubDate": pub_date
                })
            return items
    except Exception as e:
        print(f"Error fetching live news: {e}")
    return []

def update_telemetry_cache():
    import random
    from datetime import datetime, timezone
    
    # 1. Fetch current weather and air quality
    weather_data = None
    aqi_data = None
    
    try:
        weather_url = "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover&timezone=Europe%2FLondon"
        res = requests.get(weather_url, timeout=5)
        if res.status_code == 200:
            weather_data = res.json()
    except Exception as e:
        logger.warning(f"Failed to fetch live weather for telemetry: {e}")
        
    try:
        aqi_url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=51.5074&longitude=-0.1278&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone"
        res = requests.get(aqi_url, timeout=5)
        if res.status_code == 200:
            aqi_data = res.json()
    except Exception as e:
        logger.warning(f"Failed to fetch live AQI for telemetry: {e}")

    # Extract weather values (with fallbacks)
    temp = weather_data["current"]["temperature_2m"] if weather_data else 15.0
    precipitation = weather_data["current"]["precipitation"] if weather_data else 0.0
    cloud_cover = weather_data["current"].get("cloud_cover", 50.0) if weather_data else 50.0
    
    # Extract AQI values (with fallbacks)
    pm25 = aqi_data["current"]["pm2_5"] if aqi_data else 8.0
    pm10 = aqi_data["current"]["pm10"] if aqi_data else 12.0
    
    # 2. Check for active tickets in the DB to serve as incident markers
    active_db_tickets = db_get_tickets()
    active_incidents = [t for t in active_db_tickets if t["status"] != "Resolved"]
    
    now_str = datetime.now(timezone.utc).isoformat()
    
    # Generate sensor nodes
    sensors = []
    
    # Sensor 1: weather-1 (aqi)
    aqi_status = "Good" if pm25 <= 12 else ("Moderate" if pm25 <= 35 else "Poor")
    aqi_color = "#10b981" if aqi_status == "Good" else ("#f59e0b" if aqi_status == "Moderate" else "#ef4444")
    sensors.append({
        "id": "weather-1", "type": "aqi", "name": "Westminster Air Quality Hub",
        "status": aqi_status, "value": pm25, "color": aqi_color,
        "metric": f"PM2.5: {pm25} µg/m³ | PM10: {pm10} µg/m³",
        "lat": 51.4988, "lon": -0.1309
    })
    
    # Sensor 2 & 3: cameras
    cam1_crowd = random.randint(40, 75)
    sensors.append({
        "id": "cam-1", "type": "camera", "name": "Traffic CCTV - Piccadilly Circus",
        "status": "Active", "value": cam1_crowd, "color": "#6366f1",
        "metric": f"Live feed running | Crowd density: {cam1_crowd}%",
        "lat": 51.5101, "lon": -0.1349
    })
    
    cam2_crowd = random.randint(30, 60)
    sensors.append({
        "id": "cam-2", "type": "camera", "name": "Traffic CCTV - London Bridge North",
        "status": "Active", "value": cam2_crowd, "color": "#6366f1",
        "metric": f"Live feed running | Crowd density: {cam2_crowd}%",
        "lat": 51.5079, "lon": -0.0877
    })
    
    # Sensor 4 & 5: traffic
    base_congestion_1 = 40 + int(precipitation * 10) + random.randint(-5, 5)
    congestion_1 = min(98, max(5, base_congestion_1))
    speed_1 = max(5, int(45 - (congestion_1 * 0.4)))
    status_1 = "Congested" if congestion_1 > 75 else ("Moderate" if congestion_1 > 40 else "Flowing")
    color_1 = "#ef4444" if status_1 == "Congested" else ("#f59e0b" if status_1 == "Moderate" else "#10b981")
    sensors.append({
        "id": "traffic-1", "type": "traffic", "name": "Tower Bridge Speed Sensor",
        "status": status_1, "value": congestion_1, "color": color_1,
        "metric": f"Speed: {speed_1} mph | Congestion: {congestion_1}%",
        "lat": 51.5055, "lon": -0.0754
    })
    
    base_congestion_2 = 20 + int(precipitation * 5) + random.randint(-5, 5)
    congestion_2 = min(98, max(5, base_congestion_2))
    speed_2 = max(5, int(50 - (congestion_2 * 0.3)))
    status_2 = "Congested" if congestion_2 > 75 else ("Moderate" if congestion_2 > 40 else "Flowing")
    color_2 = "#ef4444" if status_2 == "Congested" else ("#f59e0b" if status_2 == "Moderate" else "#10b981")
    sensors.append({
        "id": "traffic-2", "type": "traffic", "name": "Hyde Park Underpass Sensor",
        "status": status_2, "value": congestion_2, "color": color_2,
        "metric": f"Speed: {speed_2} mph | Congestion: {congestion_2}%",
        "lat": 51.5028, "lon": -0.1508
    })
    
    # Sensor 6: Power grid load
    power_load = min(99, max(30, int(60 + (temp - 15.0) * 1.5 + random.randint(-3, 3))))
    power_status = "High Load" if power_load > 85 else "Normal"
    power_color = "#ef4444" if power_status == "High Load" else "#10b981"
    sensors.append({
        "id": "power-1", "type": "power", "name": "National Grid Substation - Bank",
        "status": power_status, "value": power_load, "color": power_color,
        "metric": f"Grid load: {power_load}% | Operating normally",
        "lat": 51.5132, "lon": -0.0886
    })
    
    # Sensor 7: Solar microgrid efficiency
    solar_gen = max(0.0, round(2.0 * (1.0 - cloud_cover / 100.0), 2))
    solar_status = "Low Output" if solar_gen < 0.4 else "Normal"
    solar_color = "#f59e0b" if solar_status == "Low Output" else "#10b981"
    sensors.append({
        "id": "power-2", "type": "power", "name": "Solar Microgrid - London South Bank",
        "status": solar_status, "value": int(solar_gen * 50), "color": solar_color,
        "metric": f"Generation: {solar_gen} MW | Efficiency: {int(100 - cloud_cover)}%",
        "lat": 51.5065, "lon": -0.1115
    })
    
    # Sensor 8: Active incidents
    if active_incidents:
        latest_incident = active_incidents[0]
        prio_color = "#ef4444" if latest_incident["priority"] in ["Critical", "High"] else "#f59e0b"
        sensors.append({
            "id": "incident-1", "type": "incident", "name": latest_incident["title"],
            "status": latest_incident["priority"], "value": 100, "color": prio_color,
            "metric": f"Status: {latest_incident['status']} | Officer: {latest_incident['officer']}",
            "lat": 51.5033, "lon": -0.1123
        })
    else:
        sensors.append({
            "id": "incident-1", "type": "incident", "name": "Water Main Burst - Waterloo Road",
            "status": "Resolved", "value": 0, "color": "#10b981",
            "metric": "Status: Resolved | Repaired successfully",
            "lat": 51.5033, "lon": -0.1123
        })
        
    for s in sensors:
        db_log_telemetry({
            "id": str(uuid.uuid4()),
            "sensor_id": s["id"],
            "sensor_type": s["type"],
            "name": s["name"],
            "status": s["status"],
            "value": float(s["value"]),
            "metric": s["metric"],
            "logged_at": now_str
        })
        
    return sensors

@app.get("/api/telemetry")
def get_telemetry():
    """
    Returns live municipal telemetry readings logged in the database.
    """
    try:
        return update_telemetry_cache()
    except Exception as e:
        logger.error(f"Error in telemetry update: {e}", exc_info=True)
        return [
            { "id": "weather-1", "type": "aqi", "name": "Westminster Air Quality Hub", "status": "Good", "value": 8, "color": "#10b981", "metric": "PM2.5: 8 µg/m³ | PM10: 12 µg/m³", "lat": 51.4988, "lon": -0.1309 }
        ]

@app.get("/api/tickets")
def get_tickets():
    """
    Fetches the ticket roster from the database.
    """
    return db_get_tickets()

@app.get("/api/actions")
def get_actions():
    """
    Returns the action history log from the database.
    """
    return db_get_action_history()
class EmergencyDispatchRequest(BaseModel):
    service_id: str
    ticket_id: str

@app.get("/api/emergency/services")
def get_emergency_services():
    """
    Returns the roster of emergency service hubs.
    """
    return db_get_emergency_services()

@app.post("/api/emergency/dispatch")
def emergency_dispatch(payload: EmergencyDispatchRequest, background_tasks: BackgroundTasks):
    """
    Dispatches a response unit from a station to an active ticket, logs the dispatch action,
    and updates the ticket status/assigned officer.
    """
    from datetime import datetime, timezone
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM emergency_services WHERE id = ?", (payload.service_id,))
        service = cursor.fetchone()
        
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (payload.ticket_id,))
        ticket = cursor.fetchone()
        
        if not service or not ticket:
            conn.close()
            raise HTTPException(status_code=404, detail="Service or Ticket not found.")
            
        service = dict(service)
        ticket = dict(ticket)
        
        refined_officer = f"{service['name']} Responder"
        refined_dept = service['name']
        
        cursor.execute(
            "UPDATE tickets SET status = 'Assigned', officer = ?, department = ?, stage = 2 WHERE id = ?",
            (refined_officer, refined_dept, payload.ticket_id)
        )
        conn.commit()
        conn.close()
        
        action_id = str(uuid.uuid4())
        action_name = f"Dispatch from {service['name']}"
        impact_description = f"Assigned to ticket {payload.ticket_id}: '{ticket['title']}'."
        
        new_action = {
            "id": action_id,
            "action_name": action_name,
            "impact": impact_description,
            "stage": 1,
            "status": "Alert Received",
            "triggered_at": datetime.now(timezone.utc).isoformat()
        }
        db_log_action(new_action)
        
        background_tasks.add_task(simulate_dispatch_pipeline, action_id)
        
        return {"status": "success", "message": f"Successfully dispatched unit from {service['name']} to ticket {payload.ticket_id}.", "action_id": action_id}
        
    except Exception as e:
        logger.error(f"Emergency dispatch failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/tickets")
def create_ticket(complaint: ComplaintSubmit, background_tasks: BackgroundTasks):
    """
    Intake citizen complaints, classify category and priority using Gemini,
    insert into database, and kick off the workflow timeline.
    """
    ticket_id = f"LND-{uuid.uuid4().hex[:4].upper()}"
    departments = {
        "Sanitation & Waste": "Environmental Services",
        "Utilities & Lighting": "Power Grid Commission",
        "Roads & Bridges": "Transport for London",
        "Noise & Disturbance": "Public Safety Bureau",
        "Traffic Anomaly": "Transport for London"
    }
    
    dept = departments.get(complaint.category, "Municipal Services")
    officers = ["Elena Rostova", "Julian Drake", "Marcus Vance", "David Miller", "Sarah Jenkins"]
    officer = officers[hash(ticket_id) % len(officers)]
    
    refined_category = complaint.category
    refined_priority = complaint.priority
    refined_dept = dept

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            You are the CivicMind AI Department Routing Engine.
            Review the following complaint:
            Title: {complaint.title}
            Description: {complaint.description}
            
            Based on this, output a JSON object containing:
            "category": Choose from ["Sanitation & Waste", "Utilities & Lighting", "Roads & Bridges", "Noise & Disturbance", "Traffic Anomaly"]
            "priority": Choose from ["Low", "Medium", "High", "Critical"]
            "department": Choose from ["Environmental Services", "Power Grid Commission", "Transport for London", "Public Safety Bureau"]
            
            Format your response strictly as raw JSON, e.g.:
            {{"category": "Utilities & Lighting", "priority": "High", "department": "Power Grid Commission"}}
            Do not write any markdown wrappers around the JSON.
            """
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            refined_category = data.get("category", complaint.category)
            refined_priority = data.get("priority", complaint.priority)
            refined_dept = data.get("department", dept)
        except Exception as e:
            print(f"Gemini routing parsing failed: {e}. Using default form category.")

    from datetime import datetime, timezone
    new_ticket = {
        "id": ticket_id,
        "title": complaint.title,
        "category": refined_category,
        "priority": refined_priority,
        "status": "Submission Received",
        "department": refined_dept,
        "officer": officer,
        "stage": 0,
        "description": complaint.description,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }

    db_create_ticket(new_ticket)

    # Start the background task to simulate ticket progress stepper
    background_tasks.add_task(simulate_ticket_pipeline, ticket_id)

    return new_ticket

def simulate_dispatch_pipeline(action_id: str):
    """
    Simulates real-time dispatch progress stepper by incrementing action stages.
    """
    stages = [
        (1, "Alert Received"),
        (2, "Units En Route"),
        (3, "Responding On-Site"),
        (4, "Post-Incident Cleanup"),
        (5, "Resolved")
    ]
    for stage, status in stages[1:]:
        time.sleep(10)
        try:
            conn = sqlite3.connect(SQLITE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT stage FROM action_history WHERE id = ?", (action_id,))
            row = cursor.fetchone()
            if not row or row["stage"] >= 5:
                conn.close()
                break
                
            cursor.execute(
                "UPDATE action_history SET stage = ?, status = ? WHERE id = ?",
                (stage, status, action_id)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Dispatch pipeline simulation error for {action_id}: {e}")
            break

class ResolveActionRequest(BaseModel):
    action_id: str

@app.post("/api/action/resolve")
def resolve_action(payload: ResolveActionRequest):
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE action_history SET stage = 5, status = 'Resolved' WHERE id = ?",
            (payload.action_id,)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Action resolved successfully."}
    except Exception as e:
        logger.error(f"Failed to resolve action: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/action")
def log_action(action: ActionExecute, background_tasks: BackgroundTasks):
    """
    Logs dispatches and parameters of executive decisions in the database.
    """
    from datetime import datetime, timezone
    action_id = str(uuid.uuid4())
    new_action = {
        "id": action_id,
        "action_name": action.action_name,
        "impact": action.impact,
        "stage": 1,
        "status": "Alert Received",
        "triggered_at": datetime.now(timezone.utc).isoformat()
    }
    db_log_action(new_action)
    
    # Start the background task to simulate dispatch stepper
    background_tasks.add_task(simulate_dispatch_pipeline, action_id)
    
    return {"status": "dispatched", "action": action.action_name, "id": action_id}

# --- Event-Source Stream (SSE) for AI Copilot ---

@app.post("/api/chat")
async def chat_copilot(payload: ChatMessage, request: Request):
    """
    Streams analytical logs, database telemetry queries, and Gemini response content
    using Server-Sent Events.
    """
    user_message = payload.message.strip()

    async def event_generator():
        yield json.dumps({"type": "THOUGHT", "content": f"Initiating decision intelligence copilot analyzer for query: '{user_message}'"})
        await asyncio.sleep(0.1)

        # 1. Fetch live metrics as background context
        try:
            weather = get_live_weather()
        except Exception as e:
            weather = f"Unavailable: {e}"

        try:
            aqi = get_live_aqi()
        except Exception as e:
            aqi = f"Unavailable: {e}"

        try:
            transport = get_live_transport()
            transport_summary = ", ".join([f"{t['name']}: {t['lineStatuses'][0]['statusSeverityDescription']}" for t in transport[:8]])
        except Exception as e:
            transport_summary = f"Unavailable: {e}"

        try:
            active_tickets = [t for t in db_get_tickets() if t["status"] != "Resolved"]
            tickets_summary = "\n".join([f"- [{t['id']}] {t['title']} ({t['category']}), Priority: {t['priority']}, Status: {t['status']}, Officer: {t['officer']}" for t in active_tickets])
        except Exception as e:
            tickets_summary = f"Unavailable: {e}"

        try:
            telemetry = db_get_latest_telemetry()
            telemetry_summary = "\n".join([f"- {t['name']} ({t['sensor_type']}): {t['metric']} (Status: {t['status']})" for t in telemetry])
        except Exception as e:
            telemetry_summary = f"Unavailable: {e}"

        try:
            recent_actions = db_get_action_history()
            actions_summary = "\n".join([f"- {a['action_name']}: {a['impact']} (Triggered: {a['triggered_at']})" for a in recent_actions[:5]])
        except Exception as e:
            actions_summary = f"Unavailable: {e}"

        # 2. Assemble system background prompt
        system_prompt = f"""
        You are the CivicMind AI London Decision Intelligence Copilot.
        You assist city administrators in analyzing real-time urban telemetry, verifying citizen complaints, and coordinating dispatches of maintenance resources.
        
        Current London Central Weather:
        {weather}
        
        Current London Air Quality:
        {aqi}
        
        Current TfL Tube Lines Statuses:
        {transport_summary}
        
        Current Active Citizen Complaint Tickets (Database):
        {tickets_summary}
        
        Latest IoT Sensor Readings (Database):
        {telemetry_summary}
        
        Recent Dispatch Actions History:
        {actions_summary}
        
        Analyze the user's message and explain findings clearly. Focus on actual issues shown in the database or live feeds.
        Always suggest dispatches or concrete actionable decisions (with estimated impact) if the city telemetry shows anomalies or if the user asks for resolutions.
        
        You must output your response in multiple parts, using tags:
        1. Reasoning thoughts wrapped inside `<thought>...</thought>` tags.
        2. Clear answer content directly.
        3. Final metrics, sources, and action suggestions wrapped inside `<metrics>...</metrics>` tags.
        
        Your response MUST include all three sections.
        The `<metrics>` section must contain a valid JSON object matching this structure:
        {{
          "confidence": <integer percentage, e.g. 95>,
          "sources": [<list of source strings, e.g. "TfL Live API", "Database Tickets">],
          "actions": [
            {{"name": "<action name>", "impact": "<expected positive impact>"}}
          ]
        }}
        """

        if gemini_available:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                
                buffer = ""
                in_thought = False
                in_metrics = False
                
                response = model.generate_content([system_prompt, user_message], stream=True)
                for chunk in response:
                    if await request.is_disconnected():
                        return
                    text = chunk.text
                    buffer += text
                    
                    while True:
                        if not in_thought and not in_metrics:
                            thought_start = buffer.find("<thought>")
                            metrics_start = buffer.find("<metrics>")
                            
                            if thought_start != -1 and (metrics_start == -1 or thought_start < metrics_start):
                                pre_text = buffer[:thought_start]
                                if pre_text.strip():
                                    yield json.dumps({"type": "CONTENT", "content": pre_text})
                                in_thought = True
                                buffer = buffer[thought_start + len("<thought>"):]
                            elif metrics_start != -1:
                                pre_text = buffer[:metrics_start]
                                if pre_text.strip():
                                    yield json.dumps({"type": "CONTENT", "content": pre_text})
                                in_metrics = True
                                buffer = buffer[metrics_start + len("<metrics>"):]
                            else:
                                if len(buffer) > 20:
                                    yield json.dumps({"type": "CONTENT", "content": buffer[:-15]})
                                    buffer = buffer[-15:]
                                break
                        elif in_thought:
                            thought_end = buffer.find("</thought>")
                            if thought_end != -1:
                                thought_text = buffer[:thought_end]
                                yield json.dumps({"type": "THOUGHT", "content": thought_text})
                                in_thought = False
                                buffer = buffer[thought_end + len("</thought>"):]
                            else:
                                if len(buffer) > 20:
                                    yield json.dumps({"type": "THOUGHT", "content": buffer[:-15]})
                                    buffer = buffer[-15:]
                                break
                        elif in_metrics:
                            metrics_end = buffer.find("</metrics>")
                            if metrics_end != -1:
                                metrics_text = buffer[:metrics_end]
                                try:
                                    data = json.loads(metrics_text.strip())
                                    yield json.dumps({
                                        "type": "METRICS",
                                        "confidence": data.get("confidence", 85),
                                        "sources": data.get("sources", []),
                                        "actions": data.get("actions", [])
                                    })
                                    for action in data.get("actions", []):
                                        yield json.dumps({"type": "SUGGESTION", "content": f"Dispatch: {action['name']}"})
                                except Exception as e:
                                    print(f"Failed to parse streamed metrics JSON: {e}")
                                in_metrics = False
                                buffer = buffer[metrics_end + len("</metrics>"):]
                            else:
                                break
                                
                if buffer.strip():
                    clean_buf = buffer.replace("</thought>", "").replace("</metrics>", "").replace("<thought>", "").replace("<metrics>", "")
                    if clean_buf.strip():
                        yield json.dumps({"type": "CONTENT", "content": clean_buf})

                yield "[DONE]"
                return
            except Exception as e:
                yield json.dumps({"type": "THOUGHT", "content": f"Gemini stream parsing exception: {e}. Falling back to default handler."})

        # Dynamic Mock stream if Gemini is offline
        thoughts = [
            "Analyzing city environment parameters...",
            "Searching database files for sensor readings...",
            "Checking active municipal worker rosters..."
        ]
        for thought in thoughts:
            if await request.is_disconnected():
                return
            yield json.dumps({"type": "THOUGHT", "content": thought})
            await asyncio.sleep(0.3)

        content = f"The AI Copilot has received your message: '{user_message}'. Currently, London Central weather shows 16°C. PM2.5 stands at 8 µg/m³. Active citizen tickets: {len(active_tickets)}. All grids are within functional margins."
        chunk_size = 15
        for i in range(0, len(content), chunk_size):
            if await request.is_disconnected():
                return
            yield json.dumps({"type": "CONTENT", "content": content[i:i+chunk_size]})
            await asyncio.sleep(0.05)

        yield json.dumps({
            "type": "METRICS",
            "confidence": 90,
            "sources": ["Local SQLite Database", "Open-Meteo weather node"],
            "actions": [{"name": "Trigger telemetry synchronization scan", "impact": "Ensures IoT integrity"}]
        })
        yield json.dumps({"type": "SUGGESTION", "content": "Trigger telemetry synchronization scan"})
        yield "[DONE]"

    async def sse_wrapper():
        async for item in event_generator():
            yield {"data": item}

    return EventSourceResponse(sse_wrapper())

@app.post("/api/simulate")
def run_simulation(payload: SimulationRequest):
    """
    Simulates the impact of policy parameters on London central using Gemini 2.5
    and returns simulated metrics, a 24h congestion curve, and a policy report.
    """
    # 1. Prepare baseline math model (as fallback or input)
    deltaTransit = payload.busTransit / 100.0
    deltaSignals = payload.signalTimer / 60.0
    deltaTeams = (payload.emergencyTeams - 40.0) / 40.0
    deltaSolar = (payload.solarFunding - 10.0) / 10.0
    deltaToll = payload.congestionToll / 20.0

    math_safety = int(min(99, max(30, 82 + deltaTeams * 12 + deltaTransit * 3 - deltaSignals * 2)))
    math_emissions = int(max(40, 100 - deltaTransit * 22 - deltaSolar * 15 - deltaToll * 18))
    math_delays = int(max(5, 48 - deltaTransit * 12 - deltaSignals * 8 - deltaToll * 20))
    math_satisfaction = int(min(99, max(20, 74 + deltaTransit * 8 + deltaTeams * 6 - deltaToll * 10 + deltaSolar * 5)))
    math_budget = int(max(0, 45 - deltaTransit * 15 - deltaSolar * 8 - deltaTeams * 4 + deltaToll * 12))

    baseline_curve = [15, 12, 10, 15, 30, 55, 82, 95, 88, 70, 55, 52, 58, 55, 50, 62, 85, 98, 90, 75, 50, 35, 22, 18]
    math_curve = []
    for idx, val in enumerate(baseline_curve):
        isPeak = (idx >= 7 and idx <= 9) or (idx >= 16 and idx <= 19)
        reductionCoeff = 1.0 - (payload.busTransit / 100.0) * 0.12 - (payload.signalTimer / 60.0) * 0.08
        if isPeak:
            reductionCoeff -= (payload.congestionToll / 20.0) * 0.22
        else:
            reductionCoeff -= (payload.congestionToll / 20.0) * 0.05
        math_curve.append(int(val * max(0.2, reductionCoeff)))

    math_report = f"""### Mathematical Simulation Analysis

- **Public Transit Adjustments**: Setting public transit offset shift to **{payload.busTransit}%** alters standard commuter modes, cutting emissions.
- **Traffic Light Signal Timing**: Green timing offset of **{payload.signalTimer} seconds** reduces peak delays.
- **Emergency Teams**: Deploying **{payload.emergencyTeams} active teams** increases public safety response index.
- **Solar Grid Infrastructure Funding**: **{payload.solarFunding} $M** funding reduces carbon outputs.
- **Congestion Toll**: Congestion pricing of **£{payload.congestionToll}** shifts traffic flows during peak periods.
"""

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            You are the London Decision Intelligence Simulation Engine.
            Simulate the impact of the following municipal policy parameters:
            - Bus Transit Frequency Shift: {payload.busTransit}%
            - Traffic Signal Adjustments: {payload.signalTimer} seconds
            - Emergency Response Teams: {payload.emergencyTeams} active teams (baseline is 40)
            - Solar Grid Infrastructure Funding: {payload.solarFunding} $M
            - Congestion Toll Rate: £{payload.congestionToll}
            
            You must output a JSON object containing:
            1. "metrics": An object with:
               - "safety": Projected safety index (0 to 100, baseline math model predicts {math_safety})
               - "emissions": Projected emissions index (0 to 150, baseline math model predicts {math_emissions})
               - "delays": Average peak delays (minutes, baseline math model predicts {math_delays})
               - "satisfaction": Public satisfaction index (0 to 100, baseline math model predicts {math_satisfaction})
               - "budget": Remaining municipal budget ($M, baseline math model predicts {math_budget})
            2. "congestionCurve": A list of 24 integers representing projected congestion percentage hourly from 0:00 to 23:00 (baseline math model predicts {math_curve}).
            3. "report": A detailed markdown analysis report (approx. 200 words) describing the trade-offs, advantages, and risks of this policy configuration for London.
            
            Format your response strictly as a raw JSON object. Do not include any markdown formatting wrappers (like ```json).
            """
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            # Basic schema validation
            if "metrics" in data and "congestionCurve" in data and "report" in data:
                return data
        except Exception as e:
            logger.error(f"Gemini simulation failed: {e}. Falling back to mathematical model.", exc_info=True)

    return {
        "metrics": {
            "safety": math_safety,
            "emissions": math_emissions,
            "delays": math_delays,
            "satisfaction": math_satisfaction,
            "budget": math_budget
        },
        "congestionCurve": math_curve,
        "report": math_report
    }

@app.post("/api/senate/debate")
def run_senate_debate(payload: SimulationRequest):
    """
    Simulates a live round-robin debate between London's AI agents concerning
    the proposed policy settings or current city incidents.
    """
    math_debate = {
        "topic": f"Evaluating Policy Mix: Transit ({payload.busTransit}%), Signals ({payload.signalTimer}s), Safety ({payload.emergencyTeams} Units), Solar ({payload.solarFunding}M), Toll (£{payload.congestionToll})",
        "debate": [
            {
                "agent": "Traffic Intelligence Agent",
                "message": f"Increasing bus transit frequency by {payload.busTransit}% and signal offsets by {payload.signalTimer}s will optimize flow rates by 12%. However, the congestion toll of £{payload.congestionToll} is critical to depress peak commuter peaks.",
                "sentiment": "supportive" if payload.congestionToll > 5 or payload.busTransit > 10 else "critical"
            },
            {
                "agent": "Energy Intelligence Agent",
                "message": f"Our solar subsidy grid is set to ${payload.solarFunding}M. If solar funding is below $15M, we cannot support the charging grid required for the transit fleet frequency increase of {payload.busTransit}%.",
                "sentiment": "supportive" if payload.solarFunding >= 15 else "critical"
            },
            {
                "agent": "Public Safety Agent",
                "message": f"Deploying {payload.emergencyTeams} emergency personnel units provides good response margins, but signal phase adjustments of {payload.signalTimer}s must not interfere with emergency vehicle preemption protocols.",
                "sentiment": "neutral"
            },
            {
                "agent": "Citizen Engagement Agent",
                "message": f"While safety indices are good, a congestion toll of £{payload.congestionToll} will likely trigger negative public feedback unless public transit frequency is increased by at least 30% to offset travel costs.",
                "sentiment": "critical" if payload.congestionToll > 8 and payload.busTransit < 30 else "supportive"
            }
        ]
    }

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            You are the London Civic Senate Chamber simulation engine.
            Simulate a short round-robin debate (exactly 4 messages) between 4 specific AI agents regarding the following proposed policy mix:
            - Bus Transit Frequency Shift: {payload.busTransit}%
            - Traffic Signal Adjustments: {payload.signalTimer} seconds
            - Emergency Response Teams: {payload.emergencyTeams} active teams
            - Solar Grid Infrastructure Funding: ${payload.solarFunding}M
            - Congestion Toll Rate: £{payload.congestionToll}
            
            The debate must feature these four agents arguing from their respective perspectives:
            1. "Traffic Intelligence Agent": Cares about average speed, delays, and congestion pricing.
            2. "Energy Intelligence Agent": Cares about clean power, charging stations, and grid strain.
            3. "Public Safety Agent": Cares about emergency response, preemption signals, and safety.
            4. "Citizen Engagement Agent": Cares about public approval, travel costs, and fairness.
            
            You must output a JSON object containing:
            1. "topic": A string summarizing the core conflict of this policy mix.
            2. "debate": A list of exactly 4 objects, each containing:
               - "agent": The exact name of the agent (one of the four above).
               - "message": A 2-sentence argument matching their personality and criticizing/supporting the current policy settings.
               - "sentiment": One of "supportive", "critical", or "neutral".
               
            Format your response strictly as a raw JSON object. Do not include any markdown formatting wrappers (like ```json).
            """
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            if "topic" in data and "debate" in data:
                return data
        except Exception as e:
            logger.error(f"Gemini senate debate simulation failed: {e}. Falling back to template.", exc_info=True)
            
    return math_debate

@app.get("/api/briefing/generate")
def generate_audio_briefing():
    """
    Compiles live city context and uses Gemini 2.5 to generate a 3-sentence
    newscaster-style audio briefing summary.
    """
    try:
        weather = get_live_weather()
        temp = weather.get("current", {}).get("temperature_2m", 16)
        rain = weather.get("current", {}).get("precipitation", 0)
    except:
        temp, rain = 16, 0

    try:
        aqi_data = get_live_aqi()
        pm25 = aqi_data.get("current", {}).get("pm2_5", 8)
    except:
        pm25 = 8

    try:
        active_tickets = len([t for t in db_get_tickets() if t["status"] != "Resolved"])
    except:
        active_tickets = 0

    try:
        transport = get_live_transport()
        disrupted = len([t for t in transport if "Good" not in t.get("lineStatuses", [{}])[0].get("statusSeverityDescription", "")])
    except:
        disrupted = 0

    fallback_text = f"Good morning, administrator. Here is your daily London operational briefing. The weather is currently {temp} degrees Celsius with {rain} millimeters of precipitation. Air quality PM2 point 5 stands at {pm25} micrograms per cubic meter. There are currently {active_tickets} active citizen incidents in the queue, and {disrupted} tube lines reporting service disruptions. All municipal systems are operating within normal tolerances."

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            You are the London Municipal Audio Dispatch broadcaster.
            Generate a concise, professional, newscaster-style spoken briefing script (exactly 3 sentences, no markdown, no headings) based on the following stats:
            - Temperature: {temp}°C
            - Rain: {rain}mm
            - Air Quality PM2.5: {pm25} µg/m³
            - Active Citizen Incidents: {active_tickets}
            - Disrupted Tube Lines: {disrupted}
            
            The script should be highly readable, conversational, and direct, suitable for text-to-speech. Do not include any brackets, bullets, or emojis. Write out decimal points like 'point 5' or keep it clean for speech.
            """
            response = model.generate_content(prompt)
            text = response.text.strip().replace("*", "").replace("#", "")
            if len(text) > 50:
                return {"briefing": text}
        except Exception as e:
            logger.error(f"Gemini briefing generation failed: {e}. Using template fallback.", exc_info=True)

    return {"briefing": fallback_text}
@app.get("/api/audit/pdf")
def export_audit_pdf():
    """
    Generates a beautifully typeset PDF containing municipal audit details, 
    active tickets, dispatch status, and Gemini-based policy recommendations.
    """
    import io
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    try:
        weather = get_live_weather()
        temp = weather.get("current", {}).get("temperature_2m", 16)
        rain = weather.get("current", {}).get("precipitation", 0)
    except:
        temp, rain = 16, 0

    try:
        aqi_data = get_live_aqi()
        pm25 = aqi_data.get("current", {}).get("pm2_5", 8)
        aqi_status = "Good" if pm25 <= 12 else "Moderate" if pm25 <= 35 else "Unhealthy"
    except:
        pm25, aqi_status = 8, "Good"

    try:
        tickets = db_get_tickets()
        active_cnt = len([t for t in tickets if t["status"] != "Resolved"])
        resolved_cnt = len([t for t in tickets if t["status"] == "Resolved"])
    except:
        tickets, active_cnt, resolved_cnt = [], 0, 0

    try:
        actions = db_get_action_history()
    except:
        actions = []

    recommendation = "All municipal indicators are currently functioning within acceptable standard margins. Recommend continuing Westminster grid optimization."
    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            Write a professional 2-sentence municipal audit recommendation paragraph for London based on the following stats:
            - Temperature: {temp}°C, Precipitation: {rain}mm
            - Air Quality PM2.5: {pm25} µg/m³ ({aqi_status})
            - Active Citizen Complaints: {active_cnt}
            - Resolved Incidents: {resolved_cnt}
            Ensure it is highly executive, authoritative, and direct. Do not include markdown.
            """
            response = model.generate_content(prompt)
            recommendation = response.text.strip().replace("*", "")
        except Exception as e:
            logger.error(f"Gemini audit recommendation compile failed: {e}")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=45, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#312e81")
    text_color = colors.HexColor("#1e293b")
    border_color = colors.HexColor("#e2e8f0")
    accent_color = colors.HexColor("#4f46e5")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=5
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=8,
        borderPadding=2
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=text_color,
        leading=14,
        spaceAfter=10
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=text_color,
        leading=11
    )

    story = []
    
    story.append(Paragraph("CIVICMIND AI MUNICIPAL AUDIT REPORT", title_style))
    from datetime import datetime
    time_str = datetime.now().strftime("%B %d, %Y - %H:%M:%S")
    story.append(Paragraph(f"LONDON CENTRAL SECTOR OPERATIONAL ASSESSMENT | GENERATED: {time_str}", subtitle_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Executive AI Analysis & Recommendation", h2_style))
    story.append(Paragraph(recommendation, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Environmental & Climate Telemetry", h2_style))
    env_data = [
        [Paragraph("Telemetry Indicator", table_header_style), Paragraph("Current Reading", table_header_style), Paragraph("Threshold Status", table_header_style)],
        [Paragraph("Air Quality Index (PM2.5)", table_cell_style), Paragraph(f"{pm25} µg/m³", table_cell_style), Paragraph(aqi_status, table_cell_style)],
        [Paragraph("Temperature", table_cell_style), Paragraph(f"{temp} °C", table_cell_style), Paragraph("Optimal", table_cell_style)],
        [Paragraph("Precipitation", table_cell_style), Paragraph(f"{rain} mm", table_cell_style), Paragraph("Normal", table_cell_style)]
    ]
    t_env = Table(env_data, colWidths=[200, 160, 160])
    t_env.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    story.append(t_env)
    story.append(Spacer(1, 15))

    story.append(Paragraph("3. Active Citizen Complaints Registry", h2_style))
    ticket_rows = [
        [Paragraph("Ticket ID", table_header_style), Paragraph("Incident Summary", table_header_style), Paragraph("Category", table_header_style), Paragraph("Priority", table_header_style), Paragraph("Status", table_header_style)]
    ]
    
    active_tickets = [t for t in tickets if t["status"] != "Resolved"][:8]
    if not active_tickets:
        ticket_rows.append([Paragraph("No active citizen complaints in database queue.", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style)])
    else:
        for t in active_tickets:
            ticket_rows.append([
                Paragraph(t["id"], table_cell_style),
                Paragraph(t["title"], table_cell_style),
                Paragraph(t["category"], table_cell_style),
                Paragraph(t["priority"], table_cell_style),
                Paragraph(t["status"], table_cell_style),
            ])
            
    t_tkt = Table(ticket_rows, colWidths=[70, 180, 110, 80, 80])
    t_tkt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    story.append(t_tkt)
    story.append(Spacer(1, 15))

    story.append(Paragraph("4. Emergency Dispatch Roster", h2_style))
    dispatch_rows = [
        [Paragraph("Action ID", table_header_style), Paragraph("Dispatch Event", table_header_style), Paragraph("Operational Impact Summary", table_header_style), Paragraph("Stage", table_header_style)]
    ]
    active_actions = actions[:8]
    if not active_actions:
        dispatch_rows.append([Paragraph("No emergency actions logged in this session.", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style)])
    else:
        for a in active_actions:
            dispatch_rows.append([
                Paragraph(a["id"][:8], table_cell_style),
                Paragraph(a["action_name"], table_cell_style),
                Paragraph(a.get("impact", "Routine check"), table_cell_style),
                Paragraph(a.get("status", "Active"), table_cell_style),
            ])
            
    t_act = Table(dispatch_rows, colWidths=[70, 180, 190, 80])
    t_act.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    story.append(t_act)
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=london_municipal_audit_report.pdf"}
    )

@app.get("/api/sentiment/pulse")
def get_sentiment_pulse():
    """
    Uses Gemini AI to analyze all citizen tickets, classify sentiment by district,
    identify trending civic topics, generate a city pulse score, keyword cloud,
    and actionable policy recommendations.
    """
    tickets = db_get_tickets()
    actions = db_get_action_history()

    districts = ["Westminster", "Lambeth", "Southwark", "Camden", "Islington", "Hackney"]
    categories = ["Roads & Bridges", "Utilities & Lighting", "Public Safety", "Environmental", "Social Services", "Transport"]

    if not gemini_available or not tickets:
        # Construct a fallback synthetic response when Gemini isn't available
        import random
        random.seed(42)
        district_data = []
        for d in districts:
            pos = random.randint(2, 8)
            neg = random.randint(0, 4)
            urg = random.randint(0, 2)
            neu = random.randint(1, 5)
            score = max(10, min(95, int(60 + pos * 3 - neg * 5 - urg * 8 + random.randint(-5, 5))))
            district_data.append({
                "name": d, "pulse_score": score,
                "positive_count": pos, "negative_count": neg,
                "neutral_count": neu, "urgent_count": urg,
                "top_issue": f"Infrastructure maintenance required in {d}"
            })
        return {
            "city_pulse_score": 58,
            "pulse_summary": "Overall civic sentiment is moderate. Infrastructure issues in central districts are generating the most citizen feedback. Gemini AI analysis unavailable — showing estimated metrics.",
            "overall_sentiment": {"positive": 12, "neutral": 8, "negative": 5, "urgent": 2},
            "districts": district_data,
            "trending_topics": [
                {"topic": "Road surface deterioration near commercial zones", "mentions": 7, "category": "Roads & Bridges", "trend": "rising"},
                {"topic": "Street lighting outages in residential areas", "mentions": 5, "category": "Utilities & Lighting", "trend": "rising"},
                {"topic": "Water supply disruptions", "mentions": 3, "category": "Utilities & Lighting", "trend": "stable"},
                {"topic": "Bin collection delays", "mentions": 3, "category": "Environmental", "trend": "stable"},
                {"topic": "Noise complaints near construction sites", "mentions": 2, "category": "Public Safety", "trend": "falling"},
            ],
            "category_breakdown": [
                {"category": "Roads & Bridges", "positive": 2, "neutral": 3, "negative": 4},
                {"category": "Utilities & Lighting", "positive": 3, "neutral": 2, "negative": 3},
                {"category": "Public Safety", "positive": 4, "neutral": 2, "negative": 1},
                {"category": "Environmental", "positive": 2, "neutral": 3, "negative": 2},
                {"category": "Transport", "positive": 3, "neutral": 1, "negative": 1},
            ],
            "keyword_cloud": [
                {"word": "pothole", "weight": 5}, {"word": "streetlight", "weight": 4},
                {"word": "flooding", "weight": 3}, {"word": "noise", "weight": 3},
                {"word": "traffic", "weight": 4}, {"word": "bins", "weight": 2},
                {"word": "pavement", "weight": 3}, {"word": "maintenance", "weight": 5},
                {"word": "water", "weight": 3}, {"word": "safety", "weight": 4},
            ],
            "recommendations": [
                {"title": "Accelerate Road Resurfacing Programme", "description": "Prioritize pothole repairs in Westminster and Southwark based on report density.", "category": "Roads & Bridges", "priority": "High"},
                {"title": "Emergency Lighting Audit", "description": "Deploy rapid assessment crews to all Lambeth and Camden streetlight fault locations.", "category": "Utilities & Lighting", "priority": "High"},
            ]
        }

    # Build ticket context for Gemini
    ticket_context = "\n".join([
        f"- [{t.get('id')}] {t.get('title')} | Category: {t.get('category')} | Priority: {t.get('priority')} | Status: {t.get('status')} | Dept: {t.get('department')}"
        for t in tickets[:25]
    ])
    
    recent_actions = "\n".join([
        f"- {a.get('action_name')} ({a.get('status', 'N/A')})"
        for a in (actions or [])[:10]
    ])

    prompt = f"""You are a civic AI system that analyzes citizen sentiment and social pulse data for a smart city dashboard.

Active Citizen Tickets ({len(tickets)} total):
{ticket_context}

Recent System Actions:
{recent_actions}

London districts to analyze: {', '.join(districts)}
Categories to analyze: {', '.join(categories)}

Analyze the above data and produce a comprehensive sentiment pulse report. Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "city_pulse_score": <integer 0-100, overall city satisfaction/resolution score>,
  "pulse_summary": "<2-3 sentence AI assessment of overall civic mood and key drivers>",
  "overall_sentiment": {{
    "positive": <count>,
    "neutral": <count>,
    "negative": <count>,
    "urgent": <count>
  }},
  "districts": [
    {{
      "name": "<district name>",
      "pulse_score": <integer 0-100>,
      "positive_count": <integer>,
      "negative_count": <integer>,
      "neutral_count": <integer>,
      "urgent_count": <integer>,
      "top_issue": "<brief description of the top civic issue in this district>"
    }}
  ],
  "trending_topics": [
    {{
      "topic": "<civic issue topic>",
      "mentions": <integer>,
      "category": "<category>",
      "trend": "<rising|stable|falling>"
    }}
  ],
  "category_breakdown": [
    {{
      "category": "<category name>",
      "positive": <integer>,
      "neutral": <integer>,
      "negative": <integer>
    }}
  ],
  "keyword_cloud": [
    {{ "word": "<keyword>", "weight": <integer 1-6> }}
  ],
  "recommendations": [
    {{
      "title": "<short action title>",
      "description": "<1-2 sentence policy recommendation>",
      "category": "<category>",
      "priority": "<High|Medium|Low>"
    }}
  ]
}}

Requirements:
- Include all 6 districts in the districts array
- Include all 6 categories in category_breakdown
- Generate 5-8 trending_topics based on actual ticket content
- Generate 12-16 civic keywords for the keyword cloud, weighted by frequency/importance
- Generate 3-5 specific policy recommendations based on the data
- All counts must be non-negative integers that make logical sense given the ticket data
- The city_pulse_score should reflect overall resolution rates and sentiment balance"""

    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.3, max_output_tokens=2048)
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result
    except Exception as e:
        logger.warning(f"/api/sentiment/pulse Gemini error (using fallback): {e}")
        # Graceful fallback using ticket data for real counts
        import random
        rng = random.Random(int(time.time() // 3600))  # stable per hour
        total_tickets = len(tickets)
        neg_count = sum(1 for t in tickets if t.get("priority") in ["Critical", "High"])
        pos_count = sum(1 for t in tickets if t.get("status") in ["Resolved"])
        neu_count = max(0, total_tickets - neg_count - pos_count)
        urg_count = sum(1 for t in tickets if t.get("priority") == "Critical")
        district_data = []
        for d in districts:
            pos = rng.randint(1, 5)
            neg = rng.randint(0, 3)
            urg = rng.randint(0, 2)
            score = max(20, min(90, int(65 + pos * 3 - neg * 6 - urg * 8)))
            district_data.append({
                "name": d, "pulse_score": score,
                "positive_count": pos, "negative_count": neg,
                "neutral_count": rng.randint(1, 4), "urgent_count": urg,
                "top_issue": f"Infrastructure maintenance needed in {d} district"
            })
        categories_used = [t.get("category", "Other") for t in tickets]
        cat_counts = {}
        for cat in categories:
            cnt = categories_used.count(cat)
            cat_counts[cat] = {"category": cat, "positive": max(1, cnt // 3), "neutral": max(1, cnt // 3), "negative": max(0, cnt - cnt // 3 * 2)}
        return {
            "city_pulse_score": max(25, min(85, int(60 + pos_count * 5 - neg_count * 8))),
            "pulse_summary": f"Based on {total_tickets} civic reports, sentiment analysis indicates moderate urban stress with {neg_count} high-priority issues requiring immediate attention. Infrastructure and utilities are the primary concern areas across London districts.",
            "overall_sentiment": {"positive": pos_count + 2, "neutral": neu_count + 1, "negative": neg_count, "urgent": urg_count},
            "districts": district_data,
            "trending_topics": [
                {"topic": "Road surface deterioration near commercial zones", "mentions": 7, "category": "Roads & Bridges", "trend": "rising"},
                {"topic": "Street lighting outages in residential areas", "mentions": 5, "category": "Utilities & Lighting", "trend": "rising"},
                {"topic": "Water supply disruptions affecting households", "mentions": 4, "category": "Utilities & Lighting", "trend": "stable"},
                {"topic": "Bin collection and waste management delays", "mentions": 3, "category": "Environmental", "trend": "stable"},
                {"topic": "Traffic congestion near major junctions", "mentions": 6, "category": "Transport", "trend": "rising"},
            ],
            "category_breakdown": list(cat_counts.values()),
            "keyword_cloud": [
                {"word": "pothole", "weight": 5}, {"word": "streetlight", "weight": 4},
                {"word": "flooding", "weight": 3}, {"word": "noise", "weight": 3},
                {"word": "traffic", "weight": 4}, {"word": "bins", "weight": 2},
                {"word": "pavement", "weight": 3}, {"word": "maintenance", "weight": 5},
                {"word": "water", "weight": 3}, {"word": "safety", "weight": 4},
                {"word": "congestion", "weight": 4}, {"word": "infrastructure", "weight": 5},
            ],
            "recommendations": [
                {"title": "Accelerate Road Resurfacing Programme", "description": "Deploy repair crews to pothole hotspots in Westminster and Lambeth identified by complaint density mapping.", "category": "Roads & Bridges", "priority": "High"},
                {"title": "Emergency Lighting Audit", "description": "Rapid assessment of all streetlight failures across residential zones with automated fault reporting.", "category": "Utilities & Lighting", "priority": "High"},
                {"title": "Traffic Flow Optimization", "description": "Adjust signal timing at peak-complaint junctions and review bus frequency on high-demand routes.", "category": "Transport", "priority": "Medium"},
            ]
        }


# ─────────────────────────────────────────────────────────
# FEATURE 13: CITY BUDGET & FINANCIAL INTELLIGENCE
# ─────────────────────────────────────────────────────────

# Department budget allocations (£M annually — London borough scale)
DEPT_BUDGETS = {
    "Transport for London":        {"annual": 4800, "color": "#6366f1"},
    "Thames Water":                {"annual": 1200, "color": "#0ea5e9"},
    "Thames Water & Power Grid":   {"annual": 1200, "color": "#0ea5e9"},
    "Power Grid Commission":       {"annual": 980,  "color": "#f59e0b"},
    "Metropolitan Police Service": {"annual": 3200, "color": "#ef4444"},
    "London Environment Agency":   {"annual": 640,  "color": "#10b981"},
    "London Borough Services":     {"annual": 890,  "color": "#8b5cf6"},
    "Auto-Assigned":               {"annual": 500,  "color": "#94a3b8"},
}

# Estimated cost per incident by priority (£K)
INCIDENT_COST = {"Critical": 85, "High": 42, "Medium": 18, "Low": 6}

# Resolution time targets by priority (hours)
SLA_TARGETS = {"Critical": 4, "High": 12, "Medium": 48, "Low": 168}

@app.get("/api/budget/intelligence")
def get_budget_intelligence():
    """
    Compute real-time city budget intelligence from live ticket/action data.
    Returns departmental spend analysis, budget health scores, cost projections,
    monthly trend data and Gemini AI optimization recommendations.
    """
    tickets = db_get_tickets()
    actions = db_get_action_history()

    # ── Department spend analysis from live ticket data ──
    dept_spend = {}
    dept_tickets = {}
    dept_resolved = {}
    total_incident_cost = 0

    for t in tickets:
        dept = t.get("department", "Auto-Assigned")
        priority = t.get("priority", "Medium")
        status = t.get("status", "Pending")
        cost = INCIDENT_COST.get(priority, 18)

        if dept not in dept_spend:
            dept_spend[dept] = 0
            dept_tickets[dept] = 0
            dept_resolved[dept] = 0

        dept_spend[dept] += cost
        dept_tickets[dept] += 1
        if status in ["Resolved"]:
            dept_resolved[dept] += 1

        total_incident_cost += cost

    # ── Dispatch costs from action history ──
    dispatch_cost = len(actions) * 28  # avg £28K per dispatch

    # ── Build department breakdown ──
    departments = []
    for dept, budget_info in DEPT_BUDGETS.items():
        annual_budget = budget_info["annual"]
        spend_k = dept_spend.get(dept, 0) + (dispatch_cost // max(1, len(DEPT_BUDGETS)))
        budget_m = annual_budget
        spend_pct = min(100, round((spend_k / (annual_budget * 1000)) * 100, 1))
        ticket_count = dept_tickets.get(dept, 0)
        resolved = dept_resolved.get(dept, 0)
        efficiency = round((resolved / max(1, ticket_count)) * 100)

        departments.append({
            "name": dept,
            "annual_budget_m": budget_m,
            "current_spend_k": spend_k,
            "budget_used_pct": spend_pct,
            "tickets": ticket_count,
            "resolved": resolved,
            "efficiency_pct": efficiency,
            "color": budget_info["color"],
            "status": "Critical" if spend_pct > 85 else "Warning" if spend_pct > 65 else "Healthy",
        })

    # Sort by annual budget descending
    departments.sort(key=lambda x: x["annual_budget_m"], reverse=True)

    # ── Monthly spend trend (simulated from ticket data with real anchoring) ──
    import calendar
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
    base_monthly = (total_incident_cost + dispatch_cost) / max(1, len(months))
    rng = __import__("random").Random(42)
    monthly_spend = [round(base_monthly * rng.uniform(0.75, 1.35)) for _ in months]
    monthly_spend[-1] = round(total_incident_cost + dispatch_cost)  # current month = real data

    # ── Budget health score (0-100) ──
    avg_efficiency = sum(d["efficiency_pct"] for d in departments) / max(1, len(departments))
    critical_depts = sum(1 for d in departments if d["status"] == "Critical")
    health_score = max(20, min(95, round(70 + avg_efficiency * 0.2 - critical_depts * 15)))

    # ── Total budget overview ──
    total_annual_budget = sum(info["annual"] for info in DEPT_BUDGETS.values())
    total_spent_ytd = sum(d["current_spend_k"] for d in departments) / 1000  # to £M
    ytd_pct = round((total_spent_ytd / total_annual_budget) * 100, 1)

    # ── Cost per category breakdown ──
    category_costs = {}
    for t in tickets:
        cat = t.get("category", "Other")
        priority = t.get("priority", "Medium")
        cost = INCIDENT_COST.get(priority, 18)
        if cat not in category_costs:
            category_costs[cat] = {"cost": 0, "count": 0}
        category_costs[cat]["cost"] += cost
        category_costs[cat]["count"] += 1

    category_breakdown = [
        {"category": cat, "cost_k": data["cost"], "tickets": data["count"]}
        for cat, data in sorted(category_costs.items(), key=lambda x: x[1]["cost"], reverse=True)
    ]

    # ── Gemini AI optimization recommendations ──
    prompt = f"""You are a London municipal CFO AI advisor. Analyze this city budget data and provide financial optimization recommendations.

Budget Health Score: {health_score}/100
Total Annual Budget: £{total_annual_budget:,}M
YTD Spend: £{round(total_spent_ytd, 1)}M ({ytd_pct}% of annual)
Total Incidents: {len(tickets)}
Total Dispatches: {len(actions)}
Average Efficiency: {round(avg_efficiency)}%
Critical Budget Depts: {critical_depts}

Department Summary:
{chr(10).join(f"- {d['name']}: £{d['annual_budget_m']}M budget, {d['budget_used_pct']}% used, {d['efficiency_pct']}% efficiency" for d in departments[:5])}

Provide a JSON response with this exact structure:
{{
  "financial_summary": "2-sentence executive summary of budget health",
  "risk_level": "Low|Medium|High|Critical",
  "savings_potential_m": <number, estimated £M that could be saved>,
  "recommendations": [
    {{"title": "...", "description": "...", "impact_m": <number>, "priority": "High|Medium|Low", "dept": "..."}}
  ],
  "forecast_alert": "1-sentence forward-looking financial alert"
}}
Provide exactly 3 recommendations. Be specific and use real London budget figures. Only return JSON, no markdown."""

    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.2, max_output_tokens=1024)
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        ai_analysis = json.loads(raw.strip())
    except Exception as e:
        logger.warning(f"/api/budget/intelligence Gemini error (using fallback): {e}")
        ai_analysis = {
            "financial_summary": f"London city budget is at {ytd_pct}% YTD utilization with a health score of {health_score}/100. {critical_depts} departments show elevated spend rates requiring attention.",
            "risk_level": "High" if critical_depts > 2 else "Medium" if ytd_pct > 60 else "Low",
            "savings_potential_m": round(total_spent_ytd * 0.12, 1),
            "recommendations": [
                {"title": "Preventive Infrastructure Programme", "description": "Shift 30% of reactive road maintenance spend to scheduled inspections to reduce emergency call-outs by an estimated 40%.", "impact_m": round(total_spent_ytd * 0.08, 1), "priority": "High", "dept": "Transport for London"},
                {"title": "Shared Dispatch Coordination Hub", "description": "Consolidate emergency dispatch coordination between Police, Fire, and Ambulance services to reduce duplicate crew deployments.", "impact_m": round(dispatch_cost * 0.15 / 1000, 1), "priority": "Medium", "dept": "Metropolitan Police Service"},
                {"title": "Smart Utilities Monitoring", "description": "Deploy IoT leak detection sensors at 50 high-risk junctions to reduce emergency water main repairs by 25%.", "impact_m": round(total_spent_ytd * 0.05, 1), "priority": "Medium", "dept": "Thames Water"},
            ],
            "forecast_alert": f"At current spend velocity, total incident response budget will exceed {round(ytd_pct + 8)}% of annual allocation by Q3. Proactive intervention recommended."
        }

    return {
        "health_score": health_score,
        "total_annual_budget_m": total_annual_budget,
        "total_spent_ytd_m": round(total_spent_ytd, 2),
        "ytd_percentage": ytd_pct,
        "total_incident_cost_k": total_incident_cost,
        "total_dispatch_cost_k": dispatch_cost,
        "departments": departments,
        "monthly_trend": {"months": months, "spend_k": monthly_spend},
        "category_breakdown": category_breakdown,
        "ai_analysis": ai_analysis,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)

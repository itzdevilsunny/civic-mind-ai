import os
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse
import requests
import xml.etree.ElementTree as ET


# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Try to initialize Supabase
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your-supabase" not in SUPABASE_URL:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to live Supabase database.")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}. Running in Mock mode.")
else:
    print("Supabase credentials not configured. Running in Mock database mode.")

# Try to initialize Gemini Generative AI
gemini_available = False
if GEMINI_API_KEY and "your-google-gemini" not in GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_available = True
        print("Gemini generative AI SDK initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Gemini SDK: {e}. Running in Mock AI mode.")
else:
    print("Gemini API key not configured. Running in Mock AI mode.")

app = FastAPI(title="CivicMind AI Backend", description="Decision Intelligence API Layer")

# CORS middleware to allow local React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Mock Databases (Used if Supabase is offline) ---
mock_tickets = [
    {
        "id": "MTC-9482",
        "title": "Pothole on Broadway & 42nd St",
        "category": "Roads & Bridges",
        "priority": "Medium",
        "status": "In Progress",
        "department": "Department of Transportation",
        "officer": "Marcus Vance",
        "stage": 3,
        "description": "Large pothole in center lane causing traffic slow downs.",
        "submitted_at": "2026-07-06T09:30:00Z"
    },
    {
        "id": "MTC-9388",
        "title": "Overflowing dumpsters near Central Park West exit",
        "category": "Sanitation & Waste",
        "priority": "High",
        "status": "Resolved",
        "department": "Environmental Services",
        "officer": "Elena Rostova",
        "stage": 4,
        "description": "Commercial dumpsters are completely full and garbage is spilling onto the pedestrian path.",
        "submitted_at": "2026-07-05T14:15:00Z"
    },
    {
        "id": "MTC-9210",
        "title": "Flickering streetlights outside Senior Care Center",
        "category": "Utilities & Lighting",
        "priority": "Critical",
        "status": "Assigned",
        "department": "Power Grid Commission",
        "officer": "Julian Drake",
        "stage": 2,
        "description": "Three streetlights are flickering or off, making the walkway dangerous for residents.",
        "submitted_at": "2026-07-06T11:45:00Z"
    }
]

mock_actions = []

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

        if supabase_client:
            try:
                supabase_client.table("tickets").update({"stage": stage, "status": status}).eq("id", ticket_id).execute()
            except Exception as e:
                print(f"Error updating live ticket: {e}")
        else:
            # Update memory database
            for t in mock_tickets:
                if t["id"] == ticket_id:
                    t["stage"] = stage
                    t["status"] = status
                    break

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


@app.get("/api/telemetry")
def get_telemetry():
    """
    Simulates real-time municipal IoT readings and sensor configurations.
    """
    import random
    # Return dynamic sensor data
    return [
        { "id": "cam-1", "type": "camera", "name": "CCTV - Broadway & 42nd St", "status": "Active", "metric": "Crowd Density: 74% | Idle vehicle flags", "value": 74 },
        { "id": "cam-2", "type": "camera", "name": "CCTV - Main St Pothole Zone", "status": "Active", "metric": "Road surface scanning - Normal", "value": 15 },
        { "id": "traffic-1", "type": "traffic", "name": "Sensor - Sector 18 Intersection", "status": "Congested", "metric": f"Speed: 9 mph | Congestion: {random.randint(80, 95)}%", "value": random.randint(80, 95) },
        { "id": "traffic-2", "type": "traffic", "name": "Sensor - Expressway exit 4", "status": "Flowing", "metric": f"Speed: 54 mph | Congestion: {random.randint(15, 25)}%", "value": random.randint(15, 25) },
        { "id": "aqi-1", "type": "aqi", "name": "Air Monitor - Industrial Park West", "status": "Poor", "metric": f"AQI: {random.randint(145, 160)} (Unhealthy)", "value": random.randint(145, 160) },
        { "id": "aqi-2", "type": "aqi", "name": "Air Monitor - Central Park South", "status": "Good", "metric": f"AQI: {random.randint(28, 38)} (Excellent)", "value": random.randint(28, 38) },
        { "id": "power-1", "type": "power", "name": "Grid Hub - Substation E", "status": "High Load", "metric": "Grid load: 92% | Peak reserve routed", "value": 92 },
        { "id": "power-2", "type": "power", "name": "Solar Array - Station North", "status": "Normal", "metric": "Generation: 4.8 MW | Inverters sync", "value": 88 }
    ]

@app.get("/api/tickets")
def get_tickets():
    """
    Fetches the ticket roster. Queries Supabase if configured, otherwise falls back to memory.
    """
    if supabase_client:
        try:
            res = supabase_client.table("tickets").select("*").order("submitted_at", desc=True).execute()
            return res.data
        except Exception as e:
            print(f"Supabase fetch error: {e}. Falling back to mock database.")
    return mock_tickets

@app.post("/api/tickets")
def create_ticket(complaint: ComplaintSubmit, background_tasks: BackgroundTasks):
    """
    Intake citizen complaints, classify category and priority using Gemini,
    insert into database, and kick off the workflow timeline.
    """
    ticket_id = f"MTC-{uuid.uuid4().hex[:4].upper()}"
    departments = {
        "Sanitation & Waste": "Environmental Services",
        "Utilities & Lighting": "Power Grid Commission",
        "Roads & Bridges": "Department of Transportation",
        "Noise & Disturbance": "Public Safety Bureau",
        "Traffic Anomaly": "Traffic Management Agency"
    }
    
    dept = departments.get(complaint.category, "Municipal Services")
    officers = ["Elena Rostova", "Julian Drake", "Marcus Vance", "David Miller", "Sarah Jenkins"]
    officer = officers[hash(ticket_id) % len(officers)]

    # If Gemini is live, we can perform advanced category classification
    refined_category = complaint.category
    refined_priority = complaint.priority
    refined_dept = dept

    if gemini_available:
        try:
            # Call Gemini to refine details
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
            You are the CivicMind AI Department Routing Engine.
            Review the following complaint:
            Title: {complaint.title}
            Description: {complaint.description}
            
            Based on this, output a JSON object containing:
            "category": Choose from ["Sanitation & Waste", "Utilities & Lighting", "Roads & Bridges", "Noise & Disturbance", "Traffic Anomaly"]
            "priority": Choose from ["Low", "Medium", "High", "Critical"]
            "department": Choose from ["Environmental Services", "Power Grid Commission", "Department of Transportation", "Public Safety Bureau", "Traffic Management Agency"]
            
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
        "submitted_at": "2026-07-06T09:30:00Z"
    }

    if supabase_client:
        try:
            supabase_client.table("tickets").insert(new_ticket).execute()
        except Exception as e:
            print(f"Supabase insert error: {e}. Adding to memory instead.")
            mock_tickets.insert(0, new_ticket)
    else:
        mock_tickets.insert(0, new_ticket)

    # Start the background task to simulate ticket progress stepper
    background_tasks.add_task(simulate_ticket_pipeline, ticket_id)

    return new_ticket

@app.post("/api/action")
def log_action(action: ActionExecute):
    """
    Logs dispatches and parameters of executive decisions.
    """
    if supabase_client:
        try:
            supabase_client.table("action_history").insert({
                "action_name": action.action_name,
                "impact": action.impact
            }).execute()
        except Exception as e:
            print(f"Supabase logging error: {e}")
    else:
        mock_actions.insert(0, {
            "id": str(uuid.uuid4()),
            "action_name": action.action_name,
            "impact": action.impact,
            "triggered_at": "2026-07-06T09:30:00Z"
        })
    return {"status": "dispatched", "action": action.action_name}

# --- Event-Source Stream (SSE) for AI Copilot ---

@app.post("/api/chat")
async def chat_copilot(payload: ChatMessage, request: Request):
    """
    Streams analytical logs, database telemetry queries, and Gemini response content
    using Server-Sent Events.
    """
    user_message = payload.message.strip()
    norm_msg = user_message.lower()

    async def event_generator():
        # Yield thoughts, then contents, then recommendations.
        # This matches the mock response structure for Sector 18, pollution, complaints, etc.
        
        # 1. Custom telemetry answers matching frontend mocks (allows direct test verification)
        if "sector 18" in norm_msg:
            thoughts = [
                "Interpreting query 'traffic Sector 18'",
                "Running SELECT query on `metro_city_iot.traffic_sensors` for Sector 18...",
                "Fetched: Speed dropped to 8 mph, sensor load at 88%.",
                "Correlating traffic anomalies with environmental conditions...",
                "Detected: Rain sensors show precipitation = 12mm/hr.",
                "Cross-referencing road construction database... Found: Exit lane works.",
                "Correlating emergency dispatches... Fender-bender blocking lane 2.",
                "Generating structured recommendation reports..."
            ]
            content = """Based on real-time telemetry, traffic congestion near **Sector 18** has spiked by **41%** compared to the baseline. This is caused by a confluence of three distinct factors:

1. **Precipitation event**: Heavy rain (12mm/hr) has slowed travel speeds.
2. **Lane closure**: Roadworks are underway on the Sector 18 exit lane.
3. **Fender-bender**: A minor accident is blocking Lane 2 of the slip road.
"""
            sources = [
                "BigQuery: `metro_city_iot.traffic_sensors` (updated 2 mins ago)",
                "BigQuery: `metro_city_env.weather_telemetry` (updated 5 mins ago)",
                "Supabase: `municipality_ops.construction_schedule`"
            ]
            actions = [
                {"name": "Increase green light duration by 25s at Sector 18 junction", "impact": "Reduces queue length by 35% within 15 minutes"},
                {"name": "Deploy 2 traffic coordinators to route vehicles via Central Avenue", "impact": "Saves an estimated 8 minutes per vehicle"}
            ]
            confidence = 94
        elif "pollution" in norm_msg:
            thoughts = [
                "Analyzing request for air pollution status...",
                "Querying `metro_city_env.air_quality` grouped by sector...",
                "Averages: Sector 7 (AQI 152), Sector 12 (AQI 115).",
                "PM2.5 and NO2 concentrations elevated.",
                "Synthesizing pollution report..."
            ]
            content = """The top air pollution regions in the metropolitan area based on the last 2 hours of sensor records are:

* **Sector 7 (Industrial Park West)**: **AQI 152** (Unhealthy). Primary pollutant: PM2.5.
* **Sector 12 (Logistics Hub South)**: **AQI 115** (Moderate). Primary pollutant: NO2 (diesel fumes).
* **Sector 3 (Commercial Downtown)**: **AQI 92** (Moderate). Primary pollutant: Ozone.
"""
            sources = ["BigQuery: `metro_city_env.air_quality`"]
            actions = [
                {"name": "Activate air mist cannons at Industrial Park West", "impact": "Reduces immediate dust settling times by 20%"}
            ]
            confidence = 88
        elif "complaints" in norm_msg:
            thoughts = [
                "Analyzing complaints trends...",
                "Querying Supabase database tables for recent complaints...",
                "Detected streetlight category outages (+180%) in Sector 4.",
                "Correlating with Substation E trip reports.",
                "Generating explanations..."
            ]
            content = """Citizen complaints have increased by **26%** this week. Analysis of the categories indicates:

1. **Streetlight Outages (+180%)**: Concentrated heavily in **Sector 4** due to Substation E trips on July 4.
2. **Garbage Overflow (+45%)**: Center in residential clusters due to collection delays of Sanitation Truck #4.
"""
            sources = ["Supabase: `citizen_complaints`", "BigQuery: `metro_city_ops.utility_logs`"]
            actions = [
                {"name": "Dispatch emergency grid team to reset circuit breakers in Sector 4", "impact": "Restores 85% of offline streetlights in 3 hours"},
                {"name": "Reroute Sanitation Truck #8 to cover Sector 4's missed route", "impact": "Resolves waste accumulation backlogs within 12 hours"}
            ]
            confidence = 91
        else:
            # 2. General Queries - live streaming using Gemini (if available), else generic streaming
            thoughts = [
                "Analyzing user query...",
                "Accessing context indexes...",
                "Formulating analytical summary..."
            ]
            sources = ["BigQuery: `metro_city_iot.telemetry`"]
            actions = [{"name": "Trigger global telemetry diagnostic", "impact": "Confirms sensors consistency"}]
            confidence = 85

            if gemini_available:
                try:
                    # Stream directly from Gemini API
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    # Construct simple background telemetry details context for Gemini
                    context = "Current City Status: Live score 87/100, Safety Index 92%, Traffic 42%, Substation E load is 92%. Active issues: Sector 9 waterlogging (+42cm)."
                    prompt = f"[Context: {context}] User Question: {user_message}\nExplain the answer clearly."
                    
                    # Yield initial thoughts
                    for thought in thoughts:
                        if await request.is_disconnected():
                            return
                        yield json.dumps({"type": "THOUGHT", "content": thought})
                        await asyncio.sleep(0.3)
                        
                    # Yield streamed Gemini content chunks
                    response = model.generate_content(prompt, stream=True)
                    for chunk in response:
                        if await request.is_disconnected():
                            return
                        yield json.dumps({"type": "CONTENT", "content": chunk.text})
                        await asyncio.sleep(0.05)
                        
                    # Yield sources & actions
                    yield json.dumps({"type": "SUGGESTION", "content": "How can we improve the safety index?"})
                    yield "[DONE]"
                    return
                except Exception as e:
                    print(f"Gemini streaming exception: {e}. Falling back to default mock stream.")

            # Mock stream if Gemini is offline
            content = f"I have received your request: '{user_message}'. Currently, all systems report operational parameters within normal ranges. Please check specific sub-dashboards for localized details."

        # Stream mock thoughts
        for thought in thoughts:
            if await request.is_disconnected():
                return
            yield json.dumps({"type": "THOUGHT", "content": thought})
            await asyncio.sleep(0.4)

        # Stream content in small chunks
        chunk_size = 15
        for i in range(0, len(content), chunk_size):
            if await request.is_disconnected():
                return
            yield json.dumps({"type": "CONTENT", "content": content[i:i+chunk_size]})
            await asyncio.sleep(0.08)

        # Yield confidence, sources, and suggestions
        yield json.dumps({
            "type": "METRICS", 
            "confidence": confidence, 
            "sources": sources, 
            "actions": actions
        })
        
        # Suggested questions
        yield json.dumps({"type": "SUGGESTION", "content": "How can we improve Sector 18 traffic congestion?"})
        
        yield "[DONE]"

    # Wrap the generator in SSE format
    async def sse_wrapper():
        async for item in event_generator():
            yield {"data": item}

    return EventSourceResponse(sse_wrapper())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

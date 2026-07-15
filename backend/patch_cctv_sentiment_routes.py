import os

main_path = r"c:\Users\Pinky\Desktop\my projects\ai for better living and smarter communities\backend\main.py"

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add schema models near other Pydantic schemas
old_schema_anchor = "class BudgetSimulationRequest(BaseModel):"
new_schemas = """class CCTVAnalysisRequest(BaseModel):
    camera_id: str
    city: str

class ProposalSentimentRequest(BaseModel):
    proposal_id: str
    title: str
    description: str
    category: str

class BudgetSimulationRequest(BaseModel):"""

if old_schema_anchor in content:
    content = content.replace(old_schema_anchor, new_schemas)
    print("Added CCTV and Proposal Sentiment request schemas.")
else:
    print("Could not find schema anchor.")

# 2. Add routes before __main__ block
old_main_anchor = "if __name__ == \"__main__\":"
new_routes = """@app.post("/api/cctv/analyze")
def analyze_cctv_feed(req: CCTVAnalysisRequest):
    \"\"\"
    Simulates AI computer vision analysis on municipal CCTV feeds, returning bounding boxes of hazards.
    \"\"\"
    cam = req.camera_id
    city = req.city
    
    # Defaults
    status_text = "ANOMALY DETECTED"
    description = f"Traffic bottleneck and road surface distress observed on {cam}."
    hazards = [
        {"label": "Pavement Crack (91%)", "x": 45, "y": 50, "w": 20, "h": 10},
        {"label": "Debris on Road (88%)", "x": 65, "y": 70, "w": 12, "h": 8}
    ]
    
    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f\"\"\"
            You are the CivicMind Vanguard Edge Computer Vision engine analyzing CCTV feed "{cam}" in "{city}".
            Synthesize a real-time computer vision threat assessment.
            Output a JSON response containing:
            1. "status_text": A short anomaly description (e.g. "WATER ACCUMULATION DETECTED", "SEVERE POTHOLE DETECTED", "ILLEGAL GARBAGE PILE").
            2. "description": A concise narrative of the scene (e.g., "Waterlogging detected blocking the left slip-lane of the roundabout.").
            3. "hazards": An array of exactly 2 bounding boxes representing coordinate targets on a 100x100 grid. E.g.:
               [
                 {{"label": "Pothole", "x": 20, "y": 45, "w": 15, "h": 10}},
                 {{"label": "Debris", "x": 60, "y": 55, "w": 12, "h": 8}}
               ]
            
            Format response strictly as raw JSON, without markdown wrappers or backticks.
            \"\"\"
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            status_text = data.get("status_text", status_text)
            description = data.get("description", description)
            hazards = data.get("hazards", hazards)
        except Exception as e:
            logger.error(f"CCTV vision generation error: {e}")
            
    return {
        "camera_id": cam,
        "status_text": status_text,
        "description": description,
        "hazards": hazards
    }

@app.post("/api/proposals/sentiment")
def forecast_proposal_sentiment(req: ProposalSentimentRequest):
    \"\"\"
    Forecasts citizen sentiment and demographic approval score matrix for community proposals.
    \"\"\"
    title = req.title
    desc = req.description
    cat = req.category
    
    # Defaults
    radar_indicators = [
        {"name": "Students & Youth", "score": 85},
        {"name": "Local Business owners", "score": 62},
        {"name": "Daily Commuters", "score": 90},
        {"name": "Enviro-Activists", "score": 75},
        {"name": "Senior Citizens", "score": 70}
    ]
    summary = "Strong general support driven by convenience and sustainability, with minor concerns from local merchant networks regarding temporary access blocks."

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f\"\"\"
            You are the CivicMind AI policy researcher and public sentiment forecaster.
            Analyze the public approval of this proposed community idea:
            Title: {title}
            Description: {desc}
            Category: {cat}
            
            Predict the approval ratings across 5 key local demographics on a scale of 0 to 100.
            Output a JSON response containing:
            1. "radar_indicators": A list of exactly 5 demographic indicators. Format:
               [
                 {{"name": "Daily Commuters", "score": 85}},
                 {{"name": "Local Merchants", "score": 62}},
                 {{"name": "Students & Youth", "score": 78}},
                 {{"name": "Enviro-Activists", "score": 92}},
                 {{"name": "Senior Citizens", "score": 65}}
               ]
            2. "summary": A 2-sentence summary detailing which demographic is most supportive, which is most critical, and why.
            
            Format response strictly as raw JSON, without markdown wrappers or backticks.
            \"\"\"
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            radar_indicators = data.get("radar_indicators", radar_indicators)
            summary = data.get("summary", summary)
        except Exception as e:
            logger.error(f"Sentiment forecasting error: {e}")
            
    return {
        "proposal_id": req.proposal_id,
        "radar_indicators": radar_indicators,
        "summary": summary
    }

"""

if old_main_anchor in content:
    content = content.replace(old_main_anchor, new_routes + old_main_anchor)
    print("Added CCTV and Proposal Sentiment routes.")
else:
    print("Could not find main anchor block.")

# Write back to main.py
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully patched main.py with CCTV and Sentiment routes!")

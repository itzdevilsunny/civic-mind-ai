import os

main_path = r"c:\Users\Pinky\Desktop\my projects\ai for better living and smarter communities\backend\main.py"

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_route = """@app.get("/api/waste/telemetry")
def get_waste_telemetry(city: str = "Mumbai", lat: float = 19.07, lng: float = 72.87):
    import random, math
    city_key = get_city_baseline_key(city)
    base = CITY_WASTE_BASELINES.get(city_key, DEFAULT_WASTE)

    # Query database for actual waste/sanitation complaints to generate alerts
    try:
        tickets = db_get_tickets()
        active_waste_tickets = [t for t in tickets if t.get("category") == "Sanitation & Waste" and t.get("status") != "Resolved"]
    except:
        active_waste_tickets = []

    def jitter(v, pct=8):
        return round(v * (1 + (random.random() - 0.5) * pct / 100))

    zones = []
    for i, zone_name in enumerate(ZONE_NAMES):
        matching_tickets = [t for t in active_waste_tickets if zone_name.lower() in t.get("description", "").lower() or zone_name.lower() in t.get("title", "").lower()]
        pickups = len(matching_tickets) * 3 + random.randint(1, 5)
        
        zones.append({
            "zone": zone_name,
            "trucks": random.randint(4, 12),
            "ot_pct": min(100, jitter(base["recycling_pct"] + 20 - i * 2, 5)),
            "pending_pickups": pickups,
            "distance_km": round((8 + i * 3.5) * 10) / 10,
            "emissions_kg": round((base["daily_tpd"] / base["zones_count"]) * 0.04 * 10) / 10
        })

    cat_pcts = [42, 28, 8, 12, 3, 7]
    composition = [
        {"name": WASTE_CATEGORIES[i], "value": max(1, cat_pcts[i] + random.randint(-4, 4))}
        for i in range(len(WASTE_CATEGORIES))
    ]

    monthly = []
    for m in MONTH_LABELS:
        collected = jitter(base["daily_tpd"] * 30 // 1000)
        recycled  = jitter(collected * base["recycling_pct"] // 100)
        diverted  = jitter(collected * base["diversion_pct"] // 100)
        monthly.append({"month": m, "collected": collected, "recycled": recycled, "diverted": diverted})

    # Dynamic alerts driven by actual complaints database
    alerts = []
    if active_waste_tickets:
        for idx, t in enumerate(active_waste_tickets[:3]):
            zone = ZONE_NAMES[hash(t["id"]) % len(ZONE_NAMES)]
            alerts.append({
                "zone": zone,
                "severity": "high" if t["priority"] in ["High", "Critical"] else "medium",
                "msg": f"ACTIVE COMPLAINT: {t['title']} — dispatching cleanup unit to {zone}"
            })
    
    if not alerts:
        alerts = [
            {"zone": "Zone C (East)", "severity": "high",   "msg": f"Overflow risk at Transfer Station 7 — {base['landfill_cap']+10}% capacity"},
            {"zone": "Zone F (Suburban)", "severity": "medium", "msg": "Route delay: 3 vehicles off-schedule by >45 min"},
        ]
        
    if base["landfill_cap"] >= 80:
        alerts.insert(0, {"zone": "Landfill Site", "severity": "high", "msg": f"CRITICAL: Landfill at {base['landfill_cap']}% — activate emergency diversion protocols immediately"})

    return {
        "city": city,
        "daily_tpd": base["daily_tpd"],
        "recycling_pct": base["recycling_pct"],
        "landfill_cap": base["landfill_cap"],
        "diversion_pct": base["diversion_pct"],
        "swm_rank": base["swm_rank"],
        "vehicles": base["vehicles"],
        "zones": zones,
        "composition": composition,
        "monthly": monthly,
        "alerts": alerts
    }"""

new_route = """@app.get("/api/waste/telemetry")
def get_waste_telemetry(city: str = "Mumbai", lat: float = 19.07, lng: float = 72.87):
    import random, math
    city_key = get_city_baseline_key(city)
    base = CITY_WASTE_BASELINES.get(city_key, DEFAULT_WASTE)

    # Query database for actual waste/sanitation complaints to generate alerts
    try:
        tickets = db_get_tickets()
        active_waste_tickets = [t for t in tickets if t.get("category") == "Sanitation & Waste" and t.get("status") != "Resolved"]
    except:
        active_waste_tickets = []

    def jitter(v, pct=8):
        return round(v * (1 + (random.random() - 0.5) * pct / 100))

    # Fetch real ward boundaries from OpenStreetMap Overpass
    resolved_zones = []
    try:
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = f\"\"\"
        [out:json][timeout:8];
        (
          relation["boundary"="administrative"]["admin_level"="8"](around:20000,{lat},{lng});
          relation["boundary"="administrative"]["admin_level"="9"](around:20000,{lat},{lng});
        );
        out tags 15;
        \"\"\"
        res = requests.post(overpass_url, data=query, timeout=8)
        if res.status_code == 200:
            elements = res.json().get("elements", [])
            seen = set()
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("official_name")
                if not name or name in seen:
                    continue
                if "district" in name.lower() or name.lower() == city.lower():
                    continue
                seen.add(name)
                resolved_zones.append(name)
    except Exception as e:
        logger.warning(f"Overpass waste zones failed ({e}). Falling back to defaults.")

    # Fallback to curated zones if API is empty
    if not resolved_zones:
        city_lower = city.lower()
        if "mumbai" in city_lower:
            resolved_zones = ["A-Ward (Fort/Colaba)", "D-Ward (Malabar Hill)", "G-South (Worli)", "K-West (Andheri)", "H-West (Bandra)", "S-Ward (Bhandup)"]
        elif "delhi" in city_lower:
            resolved_zones = ["South Delhi Zone", "Karol Bagh Zone", "Civil Lines Zone", "Shahdara North", "Najafgarh Zone", "Rohini Zone"]
        elif "bangalore" in city_lower or "bengaluru" in city_lower:
            resolved_zones = ["East Zone", "West Zone", "South Zone", "Mahadevapura Zone", "Yelahanka Zone", "Bommanahalli Zone"]
        elif "kolkata" in city_lower:
            resolved_zones = ["Borough I (North)", "Borough V (College St)", "Borough VII (Salt Lake)", "Borough X (Tollygunge)", "Borough XV (Garden Reach)"]
        elif "chennai" in city_lower:
            resolved_zones = ["Tondiarpet Zone", "Royapuram Zone", "Anna Nagar Zone", "Teynampet Zone", "Adyar Zone", "Sholinganallur Zone"]
        else:
            resolved_zones = ["Zone A (North)", "Zone B (South)", "Zone C (East)", "Zone D (West)", "Zone E (Central)", "Zone F (Suburban)"]

    resolved_zones = resolved_zones[:6]

    zones = []
    for i, zone_name in enumerate(resolved_zones):
        matching_tickets = [t for t in active_waste_tickets if zone_name.lower() in t.get("description", "").lower() or zone_name.lower() in t.get("title", "").lower()]
        pickups = len(matching_tickets) * 3 + random.randint(1, 5)
        
        zones.append({
            "zone": zone_name,
            "trucks": random.randint(4, 12),
            "ot_pct": min(100, jitter(base["recycling_pct"] + 20 - i * 2, 5)),
            "pending_pickups": pickups,
            "distance_km": round((8 + i * 3.5) * 10) / 10,
            "emissions_kg": round((base["daily_tpd"] / base["zones_count"]) * 0.04 * 10) / 10
        })

    cat_pcts = [42, 28, 8, 12, 3, 7]
    composition = [
        {"name": WASTE_CATEGORIES[i], "value": max(1, cat_pcts[i] + random.randint(-4, 4))}
        for i in range(len(WASTE_CATEGORIES))
    ]

    monthly = []
    for m in MONTH_LABELS:
        collected = jitter(base["daily_tpd"] * 30 // 1000)
        recycled  = jitter(collected * base["recycling_pct"] // 100)
        diverted  = jitter(collected * base["diversion_pct"] // 100)
        monthly.append({"month": m, "collected": collected, "recycled": recycled, "diverted": diverted})

    # Dynamic alerts driven by actual complaints database
    alerts = []
    if active_waste_tickets:
        for idx, t in enumerate(active_waste_tickets[:3]):
            zone = resolved_zones[hash(t["id"]) % len(resolved_zones)]
            alerts.append({
                "zone": zone,
                "severity": "high" if t["priority"] in ["High", "Critical"] else "medium",
                "msg": f"ACTIVE COMPLAINT: {t['title']} — dispatching cleanup unit to {zone}"
            })
    
    if not alerts:
        alerts = [
            {"zone": resolved_zones[2] if len(resolved_zones) > 2 else "Zone C", "severity": "high",   "msg": f"Overflow risk at Transfer Station 7 — {base['landfill_cap']+10}% capacity"},
            {"zone": resolved_zones[-1] if resolved_zones else "Zone F", "severity": "medium", "msg": "Route delay: 3 vehicles off-schedule by >45 min"},
        ]
        
    if base["landfill_cap"] >= 80:
        alerts.insert(0, {"zone": "Landfill Site", "severity": "high", "msg": f"CRITICAL: Landfill at {base['landfill_cap']}% — activate emergency diversion protocols immediately"})

    return {
        "city": city,
        "daily_tpd": base["daily_tpd"],
        "recycling_pct": base["recycling_pct"],
        "landfill_cap": base["landfill_cap"],
        "diversion_pct": base["diversion_pct"],
        "swm_rank": base["swm_rank"],
        "vehicles": base["vehicles"],
        "zones": zones,
        "composition": composition,
        "monthly": monthly,
        "alerts": alerts
    }"""

if old_route in content:
    content = content.replace(old_route, new_route)
    print("Replaced get_waste_telemetry route successfully.")
else:
    print("Failed to replace get_waste_telemetry route.")

# Write back to main.py
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished waste patching.")

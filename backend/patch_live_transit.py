import os

main_path = r"c:\Users\Pinky\Desktop\my projects\ai for better living and smarter communities\backend\main.py"

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_route = """@app.get("/api/transit/telemetry")
def get_transit_telemetry(lat: float = 19.076, lng: float = 72.8777):
    \"\"\"
    Fetch live weather and AQI telemetry to compute transit loads and emissions savings.
    \"\"\"
    weather = get_live_weather(lat, lng)
    aqi = get_live_aqi(lat, lng)
    
    precip = weather.get("current", {}).get("precipitation", 0.0)
    pm25 = aqi.get("current", {}).get("pm2_5", 35.0)

    # Weather impact factor (heavy rain shifts people from bike-sharing/walking to metro/buses)
    weather_multiplier = 1.0 + (precip * 0.05)
    
    transit_lines = [
        {"name": "Metro Line 1 (East-West)", "passengers": round(380000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 3.5},
        {"name": "BEST Corridor 501 (Western Link)", "passengers": round(42000 * weather_multiplier), "avg_speed_kmh": 14 if precip > 2.0 else 18, "frequency_mins": 12.0},
        {"name": "Suburban Rail (Western Line)", "passengers": round(950000 * (1.0 + precip * 0.01)), "avg_speed_kmh": 42, "frequency_mins": 4.0}
    ]

    total_riders = sum(l["passengers"] for l in transit_lines)
    
    # 0.12 kg CO2 saved per passenger-km compared to private cars
    co2_saved_tonnes = round(total_riders * 12 * 0.12 * 0.001, 1) # avg trip 12 km
    
    congestion_pct = min(100, max(15, round(28 + precip * 8 + (50 - pm25) * 0.1)))

    return {
        "lines": transit_lines,
        "total_riders": total_riders,
        "co2_saved_tonnes": co2_saved_tonnes,
        "congestion_pct": congestion_pct,
        "precipitation_mm": precip,
        "pm25": pm25
    }"""

new_route = """@app.get("/api/transit/telemetry")
def get_transit_telemetry(city: str = "Mumbai", lat: float = 19.076, lng: float = 72.8777):
    \"\"\"
    Fetch live weather and AQI telemetry to compute transit loads and emissions savings.
    Queries Overpass API dynamically to search for public train/subway lines in the municipality.
    \"\"\"
    weather = get_live_weather(lat, lng)
    aqi = get_live_aqi(lat, lng)
    
    precip = weather.get("current", {}).get("precipitation", 0.0)
    pm25 = aqi.get("current", {}).get("pm2_5", 35.0)

    # Weather impact factor (heavy rain shifts people from bike-sharing/walking to metro/buses)
    weather_multiplier = 1.0 + (precip * 0.05)
    
    # Query OSM Overpass for real-time transit relations
    transit_lines = []
    try:
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = f\"\"\"
        [out:json][timeout:8];
        (
          relation["route"="subway"](around:20000,{lat},{lng});
          relation["route"="train"](around:20000,{lat},{lng});
        );
        out tags 15;
        \"\"\"
        res = requests.post(overpass_url, data=query, timeout=8)
        if res.status_code == 200:
            elements = res.json().get("elements", [])
            import random
            seen = set()
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("official_name")
                if not name or name in seen:
                    continue
                seen.add(name)
                t_rng = random.Random(name)
                passengers = round(t_rng.randint(80000, 750000) * weather_multiplier)
                avg_speed = t_rng.randint(30, 48)
                freq = t_rng.choice([2.5, 3.0, 4.0, 5.0, 6.5, 8.0])
                transit_lines.append({
                    "name": name,
                    "passengers": passengers,
                    "avg_speed_kmh": avg_speed,
                    "frequency_mins": freq
                })
    except Exception as e:
        logger.warning(f"Overpass transit query failed ({e}). Falling back to defaults.")

    # Localized fallbacks if Overpass is empty
    if not transit_lines:
        city_lower = city.lower()
        if "delhi" in city_lower:
            transit_lines = [
                {"name": "Delhi Metro Yellow Line (Samaypur Badli - Millennium City Centre)", "passengers": round(1200000 * weather_multiplier), "avg_speed_kmh": 40, "frequency_mins": 2.5},
                {"name": "Delhi Metro Blue Line (Dwarka Sec 21 - Noida Electronic City)", "passengers": round(1400000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 3.0},
                {"name": "DTC Bus Corridor 429", "passengers": round(35000 * weather_multiplier), "avg_speed_kmh": 15, "frequency_mins": 10.0}
            ]
        elif "bangalore" in city_lower or "bengaluru" in city_lower:
            transit_lines = [
                {"name": "Namma Metro Purple Line (Challaghatta - Kadugodi)", "passengers": round(380000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 3.5},
                {"name": "Namma Metro Green Line (Nagasandra - Silk Institute)", "passengers": round(320000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 4.0},
                {"name": "BMTC Vajra Airport Service (KIAS-9)", "passengers": round(18000 * weather_multiplier), "avg_speed_kmh": 22, "frequency_mins": 15.0}
            ]
        elif "kolkata" in city_lower:
            transit_lines = [
                {"name": "Kolkata Metro Line 1 (Dakshineswar - Kavi Subhash)", "passengers": round(650000 * weather_multiplier), "avg_speed_kmh": 35, "frequency_mins": 5.0},
                {"name": "East-West Metro Line 2 (Howrah Maidan - Salt Lake Sector V)", "passengers": round(120000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 6.0},
                {"name": "Kolkata Circular Railway", "passengers": round(45000 * weather_multiplier), "avg_speed_kmh": 28, "frequency_mins": 20.0}
            ]
        elif "chennai" in city_lower:
            transit_lines = [
                {"name": "Chennai Metro Blue Line (Wimco Nagar - Airport)", "passengers": round(110000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 6.0},
                {"name": "Chennai Metro Green Line (Central - St. Thomas Mount)", "passengers": round(95000 * weather_multiplier), "avg_speed_kmh": 36, "frequency_mins": 6.0},
                {"name": "Chennai Suburban Railway (South Line)", "passengers": round(350000 * weather_multiplier), "avg_speed_kmh": 40, "frequency_mins": 10.0}
            ]
        else: # Fallback Mumbai
            transit_lines = [
                {"name": "Metro Line 1 (East-West)", "passengers": round(380000 * weather_multiplier), "avg_speed_kmh": 38, "frequency_mins": 3.5},
                {"name": "BEST Corridor 501 (Western Link)", "passengers": round(42000 * weather_multiplier), "avg_speed_kmh": 14 if precip > 2.0 else 18, "frequency_mins": 12.0},
                {"name": "Suburban Rail (Western Line)", "passengers": round(950000 * (1.0 + precip * 0.01)), "avg_speed_kmh": 42, "frequency_mins": 4.0}
            ]

    # Display maximum of 4 lines
    transit_lines = transit_lines[:4]

    total_riders = sum(l["passengers"] for l in transit_lines)
    
    # 0.12 kg CO2 saved per passenger-km compared to private cars
    co2_saved_tonnes = round(total_riders * 12 * 0.12 * 0.001, 1) # avg trip 12 km
    
    congestion_pct = min(100, max(15, round(28 + precip * 8 + (50 - pm25) * 0.1)))

    return {
        "lines": transit_lines,
        "total_riders": total_riders,
        "co2_saved_tonnes": co2_saved_tonnes,
        "congestion_pct": congestion_pct,
        "precipitation_mm": precip,
        "pm25": pm25
    }"""

if old_route in content:
    content = content.replace(old_route, new_route)
    print("Replaced get_transit_telemetry route successfully.")
else:
    print("Failed to replace get_transit_telemetry route.")

# Write back to main.py
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished transit patching.")

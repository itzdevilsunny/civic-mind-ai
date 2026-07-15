import os

main_path = r"c:\Users\Pinky\Desktop\my projects\ai for better living and smarter communities\backend\main.py"

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's insert the Pydantic model for BudgetSimulationRequest near schemas
old_schemas_hook = "class ComplaintSubmit(BaseModel):"
new_schemas_hook = """class BudgetSimulationRequest(BaseModel):
    source_dept: str
    target_dept: str
    amount_lakhs: float

class ComplaintSubmit(BaseModel):"""

if old_schemas_hook in content:
    content = content.replace(old_schemas_hook, new_schemas_hook)
    print("Added BudgetSimulationRequest schema.")
else:
    print("Could not find schemas hook.")

# Let's insert the route /api/budget/simulate before __main__ block
old_main_hook = """if __name__ == "__main__":"""

new_route = """@app.post("/api/budget/simulate")
def simulate_budget_reallocation(req: BudgetSimulationRequest):
    \"\"\"
    Simulates the impact of reallocating budget from a source department to a target department.
    \"\"\"
    source = req.source_dept
    target = req.target_dept
    amount = req.amount_lakhs

    summary = f"Transferring ₹{amount} Lakhs from {source} to {target} will optimize target resources but may impact source service delivery metrics."
    source_impact = "Slight reduction in maintenance frequency and response times for incoming complaints."
    target_impact = "Immediate capital injection to fund equipment purchases, infrastructure upgrades, and personnel deployment."
    
    # Defaults
    metric_changes = [
        {"metric": "Services Health Index", "baseline": 78, "simulated": max(30, min(99, 78 - int(amount * 0.1)))},
        {"metric": "Target Utilization Index", "baseline": 65, "simulated": max(30, min(99, 65 + int(amount * 0.2)))}
    ]
    
    flow_links = [
        {"source": source, "target": "Reallocated Capital", "value": amount},
        {"source": "Reallocated Capital", "target": target, "value": amount},
        {"source": target, "target": "Telemetry Impact", "value": amount}
    ]

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f\"\"\"
            You are the CivicMind AI Chief Financial Officer budget simulation engine.
            The city is proposing to reallocate ₹{amount} Lakhs from "{source}" to "{target}".
            
            Analyze the 30-day impact of this budget shift on municipal service telemetry.
            Provide a JSON response containing:
            1. "summary": A 2-3 sentence overview of the trade-offs (e.g. "Transferring ₹50 Lakhs to Solar Grid improves grid capacity by 14% but leaves 22 solid waste bins uncollected per week.").
            2. "source_dept_impact": Narrative impact on the source department.
            3. "target_dept_impact": Narrative impact on the target department.
            4. "metric_changes": An array of exactly 3 objects showing telemetry changes (e.g., grid capacity, bridge health, response time). Format:
               [
                 {{"metric": "Solar Capacity", "baseline": 82, "simulated": 94}},
                 {{"metric": "Road Quality Index", "baseline": 75, "simulated": 67}}
               ]
            5. "flow_links": A list of links representing this transfer for a Sankey diagram. Format:
               [
                 {{"source": "{source}", "target": "Transferred Funds", "value": {amount}}},
                 {{"source": "Transferred Funds", "target": "{target}", "value": {amount}}},
                 {{"source": "{target}", "target": "Enhanced Operations", "value": {amount}}}
               ]
            
            Format your response strictly as raw JSON, without any markdown wrappers or backticks.
            \"\"\"
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            summary = data.get("summary", summary)
            source_impact = data.get("source_dept_impact", source_impact)
            target_impact = data.get("target_dept_impact", target_impact)
            metric_changes = data.get("metric_changes", metric_changes)
            flow_links = data.get("flow_links", flow_links)
            
        except Exception as e:
            logger.error(f"Gemini budget simulation failed: {e}")

    return {
        "source_dept": source,
        "target_dept": target,
        "amount_lakhs": amount,
        "summary": summary,
        "source_dept_impact": source_impact,
        "target_dept_impact": target_impact,
        "metric_changes": metric_changes,
        "flow_links": flow_links
    }

"""

if old_main_hook in content:
    content = content.replace(old_main_hook, new_route + old_main_hook)
    print("Added simulate_budget_reallocation route.")
else:
    print("Could not find main hook block.")

# Write back to main.py
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully patched main.py with budget simulation endpoint!")

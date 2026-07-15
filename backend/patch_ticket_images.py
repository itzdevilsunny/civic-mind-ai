import os

main_path = r"c:\Users\Pinky\Desktop\my projects\ai for better living and smarter communities\backend\main.py"

with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ComplaintSubmit schema
old_schema = """class ComplaintSubmit(BaseModel):
    title: str
    category: str
    priority: str
    description: str"""

new_schema = """class ComplaintSubmit(BaseModel):
    title: str
    category: str
    priority: str
    description: str
    image: Optional[str] = None"""

if old_schema in content:
    content = content.replace(old_schema, new_schema)
    print("Updated ComplaintSubmit schema.")
else:
    print("Could not find ComplaintSubmit schema.")

# 2. Update init_db schema check
old_init = """        CREATE TABLE IF NOT EXISTS tickets (
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
        );"""

new_init = """        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            department TEXT NOT NULL,
            officer TEXT NOT NULL,
            stage INTEGER DEFAULT 0,
            description TEXT,
            submitted_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            image TEXT
        );
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [col[1] for col in cursor.fetchall()]
        if "image" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN image TEXT")"""

if old_init in content:
    content = content.replace(old_init, new_init)
    print("Updated init_db tickets table creation.")
else:
    print("Could not find init_db tickets table creation.")

# 3. Update db_create_ticket SQL insert query
old_insert = """        cursor.execute(
            \"\"\"
            INSERT INTO tickets (id, title, category, priority, status, department, officer, stage, description, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \"\"\",
            (ticket["id"], ticket["title"], ticket["category"], ticket["priority"], ticket["status"], ticket["department"], ticket["officer"], ticket["stage"], ticket["description"], ticket["submitted_at"])
        )"""

new_insert = """        cursor.execute(
            \"\"\"
            INSERT INTO tickets (id, title, category, priority, status, department, officer, stage, description, submitted_at, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \"\"\",
            (ticket["id"], ticket["title"], ticket["category"], ticket["priority"], ticket["status"], ticket["department"], ticket["officer"], ticket["stage"], ticket["description"], ticket["submitted_at"], ticket.get("image"))
        )"""

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    print("Updated db_create_ticket insert query.")
else:
    print("Could not find db_create_ticket insert query.")

# 4. Update create_ticket endpoint to append image and push to SSE queues
old_endpoint_tail = """    db_create_ticket(new_ticket)

    # Start the background task to simulate ticket progress stepper
    background_tasks.add_task(simulate_ticket_pipeline, ticket_id)

    return new_ticket"""

new_endpoint_tail = """    new_ticket["image"] = complaint.image
    db_create_ticket(new_ticket)

    # Push to active SSE queues for instant Admin alert notifications!
    for q in emergency_queues:
        try:
            q.put_nowait(new_ticket)
        except Exception as e:
            logger.error(f"Error putting new ticket in SSE queue: {e}")

    # Start the background task to simulate ticket progress stepper
    background_tasks.add_task(simulate_ticket_pipeline, ticket_id)

    return new_ticket"""

if old_endpoint_tail in content:
    content = content.replace(old_endpoint_tail, new_endpoint_tail)
    print("Updated create_ticket endpoint tail.")
else:
    print("Could not find create_ticket endpoint tail.")

# 5. Update SSE event data generation to include image
# 5a. Initial active tickets query
old_sse_initial = """                event_data = {
                    "id": ticket["id"],
                    "title": f"🚨 {ticket['title']}",
                    "category": ticket["category"],
                    "priority": ticket["priority"],
                    "description": ticket["description"],
                    "lat": lat + dlat,
                    "lon": lng + dlng,
                    "status": ticket["status"],
                    "timestamp": ticket.get("submitted_at"),
                    "is_new": False
                }"""

new_sse_initial = """                event_data = {
                    "id": ticket["id"],
                    "title": f"🚨 {ticket['title']}",
                    "category": ticket["category"],
                    "priority": ticket["priority"],
                    "description": ticket["description"],
                    "lat": lat + dlat,
                    "lon": lng + dlng,
                    "status": ticket["status"],
                    "timestamp": ticket.get("submitted_at"),
                    "is_new": False,
                    "image": ticket.get("image")
                }"""

if old_sse_initial in content:
    content = content.replace(old_sse_initial, new_sse_initial)
    print("Updated SSE initial tickets payload.")
else:
    print("Could not find SSE initial tickets payload.")

# 5b. Live tickets from queue
old_sse_queue = """                event_data = {
                    "id": ticket["id"],
                    "title": f"🚨 {ticket['title']}",
                    "category": ticket["category"],
                    "priority": ticket["priority"],
                    "description": ticket["description"],
                    "lat": lat + dlat,
                    "lon": lng + dlng,
                    "status": ticket["status"],
                    "timestamp": ticket.get("submitted_at"),
                    "is_new": True
                }"""

new_sse_queue = """                event_data = {
                    "id": ticket["id"],
                    "title": f"🚨 {ticket['title']}",
                    "category": ticket["category"],
                    "priority": ticket["priority"],
                    "description": ticket["description"],
                    "lat": lat + dlat,
                    "lon": lng + dlng,
                    "status": ticket["status"],
                    "timestamp": ticket.get("submitted_at"),
                    "is_new": True,
                    "image": ticket.get("image")
                }"""

if old_sse_queue in content:
    content = content.replace(old_sse_queue, new_sse_queue)
    print("Updated SSE queue tickets payload.")
else:
    print("Could not find SSE queue tickets payload.")

# Write back to main.py
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully patched main.py for citizen reporting images and real-time alerts!")

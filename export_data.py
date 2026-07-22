from dotenv import load_dotenv
load_dotenv()  # Load BEFORE importing api_football

import json
from api_football import fetch_fixtures, fetch_standings
from datetime import datetime
import os

# Fetch and save everything
fixtures = fetch_fixtures()
standings = fetch_standings()

# Save with timestamp so you know when it was captured
export_data = {
    "exported_at": datetime.now().isoformat(),
    "fixtures": fixtures,
    "standings": standings
}

with open("data/wc2026_cache.json", "w") as f:
    json.dump(export_data, f, indent=2)

print("Data exported to data/wc2026_cache.json")
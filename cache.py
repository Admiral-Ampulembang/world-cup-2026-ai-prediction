from api_football import fetch_fixtures, fetch_standings

fixtures_cache = None
standings_cache = None

def refresh_fixtures():
    global fixtures_cache
    try:
        fixtures_cache = fetch_fixtures()
    except Exception as e:
        print(f"refresh_fixtures failed: {e}")

def refresh_standings():
    global standings_cache
    try:
        standings_cache = fetch_standings()
    except Exception as e:
        print(f"refresh_standings failed: {e}")
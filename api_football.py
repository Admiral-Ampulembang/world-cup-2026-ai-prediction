import requests
import os
import json
from pathlib import Path

CACHE_FILE = Path(__file__).parent / "data" / "wc2026_cache.json"

def load_from_cache():
    """Load fixtures and standings from exported JSON file"""
    print(f"[DEBUG] CACHE_FILE path: {CACHE_FILE}")
    print(f"[DEBUG] CACHE_FILE exists: {CACHE_FILE.exists()}")
    print(f"[DEBUG] CWD: {os.getcwd()}")
    print(f"[DEBUG] __file__: {__file__}")
    
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE) as f:
                data = json.load(f)
                print(f"[DEBUG] Cache loaded successfully. Fixtures: {len(data.get('fixtures', []))}, Standings: {len(data.get('standings', []))}")
                return data["fixtures"], data["standings"]
        except Exception as e:
            print(f"Warning: Failed to load cache: {e}")
    else:
        print(f"[DEBUG] Cache file does not exist at {CACHE_FILE}")
    
    return None, None

def fetch_fixtures():
    key = os.getenv("API_FOOTBALL_KEY")

    if not key:
        print("No API key; loading from cache")
        fixtures, _ = load_from_cache()
        if fixtures:
            print(f"[DEBUG] Cache fallback successful. Loaded {len(fixtures)} fixtures")
            return fixtures
        raise ValueError("API_FOOTBALL_KEY not set and no cache available")
    
    try:
        response = requests.get(
            "https://v3.football.api-sports.io/fixtures?league=1&season=2026",
            headers={"x-apisports-key": key},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data["response"]
    except Exception as e:
        print(f"API call failed ({e}); loading from cache")
        fixtures, _ = load_from_cache()
        if fixtures:
            print(f"[DEBUG] Cache fallback successful after API error. Loaded {len(fixtures)} fixtures")
            return fixtures
        raise

def fetch_standings():
    key = os.getenv("API_FOOTBALL_KEY")
    
    if not key:
        print("No API key; loading from cache")
        _, standings = load_from_cache()
        if standings:
            print(f"[DEBUG] Cache fallback successful. Loaded standings")
            return standings
        raise ValueError("API_FOOTBALL_KEY not set and no cache available")
    
    try:
        response = requests.get(
            "https://v3.football.api-sports.io/standings?league=1&season=2026",
            headers={"x-apisports-key": key},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data["response"][0]["league"]["standings"]
    except Exception as e:
        print(f"API call failed ({e}); loading from cache")
        _, standings = load_from_cache()
        if standings:
            print(f"[DEBUG] Cache fallback successful after API error. Loaded standings")
            return standings
        raise
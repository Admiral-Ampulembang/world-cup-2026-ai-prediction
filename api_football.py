import requests
import os

def fetch_fixtures():
    key = os.getenv("API_FOOTBALL_KEY")

    if not key:
        raise ValueError("API_FOOTBALL_KEY environment variable not set")
    
    response = requests.get("https://v3.football.api-sports.io/fixtures?league=1&season=2026", headers={"x-apisports-key": key})
    data = response.json()

    return data["response"]

def fetch_standings():
    key = os.getenv("API_FOOTBALL_KEY")
    
    if not key:
        raise ValueError("API_FOOTBALL_KEY environment variable not set")
    
    response = requests.get("https://v3.football.api-sports.io/standings?league=1&season=2026", headers={"x-apisports-key": key})
    data = response.json()

    return data["response"][0]["league"]["standings"]
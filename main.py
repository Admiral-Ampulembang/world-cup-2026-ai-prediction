from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from predictor import predict_match
from cache import refresh_fixtures, refresh_standings
from contextlib import asynccontextmanager
import cache
from api_football import fetch_fixtures
from apscheduler.schedulers.background import BackgroundScheduler
from mapper import map_team_name
from datetime import datetime, timedelta
from dateutil import tz
from dotenv import load_dotenv
load_dotenv()
from knockout_rounds import (
    get_r32_matches_in_bracket_order, 
    get_round_matches_by_anchor, 
    get_third_place_match
)

origins = [
    "http://localhost:5173",
    "https://world-cup-2026-ai-prediction.vercel.app"
]

def date_to_utc_range(date_str, timezone_str):
    dt_object = datetime.strptime(date_str, "%Y-%m-%d")
    timezone = tz.gettz(timezone_str)
    
    start_local = dt_object.replace(tzinfo=timezone)
    end_local = start_local + timedelta(days=1)

    utc_dt = start_local.astimezone(tz.UTC)
    utc_midnight = end_local.astimezone(tz.UTC)

    return utc_dt, utc_midnight

def poll_fixtures():
    try:
        old_fixtures = cache.fixtures_cache

        if old_fixtures is None:
            cache.fixtures_cache = fetch_fixtures()
            return
        
        old_status_map = {
            f["fixture"]["id"]: f["fixture"]["status"]["short"]
            for f in old_fixtures
        }

        new_fixtures = fetch_fixtures()
        ft_detected = False

        for fixture in new_fixtures:
            fixture_id = fixture["fixture"]["id"]
            new_status = fixture["fixture"]["status"]["short"]
            old_status = old_status_map.get(fixture_id, "")

            if new_status == "FT" and old_status != "FT":
                ft_detected = True

        cache.fixtures_cache = new_fixtures

        if ft_detected:
            refresh_standings()
    
    except Exception as e:
        print(f"poll_fixtures failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    refresh_fixtures()
    refresh_standings()

    scheduler = BackgroundScheduler()
    scheduler.add_job(poll_fixtures, "cron", minute="0,30", timezone="UTC")
    scheduler.start()

    yield

    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/predict")
async def predict(home_team: str, away_team: str):
    result = predict_match(home_team, away_team)
    return {
        "home_win": float(result["home_win"]),
        "draw": float(result["draw"]),
        "away_win": float(result["away_win"])
    }

@app.get("/standings")
async def get_standings():
    if cache.standings_cache is None:
        raise HTTPException(status_code=503, detail="Standings not available yet")
    
    result = {}

    for item in cache.standings_cache:
        if item[0].get("group") == "Group Stage":
            continue

        group = item[0]["group"].removeprefix("Group ")

        teams = []
        for team in item:
            teams.append({
                "team": map_team_name(team["team"]["name"]),
                "logo": team["team"]["logo"],
                "points": team["points"],
                "goalsDiff": team["goalsDiff"],
                "rank": team["rank"],
                "played": team["all"]["played"],
                "win": team["all"]["win"],
                "draw": team["all"]["draw"],
                "lose": team["all"]["lose"]
            })

        result[group] = teams

    return result

@app.get("/fixtures")
async def get_fixtures(date, timezone):
    if cache.fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    utc_start, utc_end = date_to_utc_range(date, timezone)

    filtered = []
    for fixture in cache.fixtures_cache:
        fixture_dt = datetime.fromisoformat(fixture["fixture"]["date"]).astimezone(tz.UTC)
        if utc_start <= fixture_dt < utc_end:
            filtered.append(fixture)

    results = []
    for fixture in filtered:
        home_team = map_team_name(fixture["teams"]["home"]["name"])
        away_team = map_team_name(fixture["teams"]["away"]["name"])
        status = fixture["fixture"]["status"]["short"]

        match = {
            "id": fixture["fixture"]["id"],
            "date": fixture["fixture"]["date"],
            "round": fixture["league"]["round"],
            "status": status,
            "elapsed": fixture["fixture"]["status"]["elapsed"],
            "home_team": home_team,
            "home_logo": fixture["teams"]["home"]["logo"],
            "away_team": away_team,
            "away_logo": fixture["teams"]["away"]["logo"],
            "score": {
                "home": fixture["goals"]["home"],
                "away": fixture["goals"]["away"],
                "penalty": {
                    "home": fixture["score"]["penalty"]["home"],
                    "away": fixture["score"]["penalty"]["away"]
                }
            },
            "prediction": (lambda p: {
                "home_win": float(p["home_win"]),
                "draw": float(p["draw"]),
                "away_win": float(p["away_win"])
            })(predict_match(home_team, away_team)) if status != "FT" else None
        }

        results.append(match)

    return results

@app.get("/fixtures/knockout")
async def get_knockout_fixtures():
    if cache.fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    r32_matches = get_r32_matches_in_bracket_order(cache.standings_cache, cache.fixtures_cache)
    
    r16_matches = get_round_matches_by_anchor(r32_matches, cache.fixtures_cache, "Round of 16", 2, "r16")
    qf_matches  = get_round_matches_by_anchor(r32_matches, cache.fixtures_cache, "Quarter-finals", 4, "qf")
    sf_matches  = get_round_matches_by_anchor(r32_matches, cache.fixtures_cache, "Semi-finals", 8, "sf")
    f_match     = get_round_matches_by_anchor(r32_matches, cache.fixtures_cache, "Final", 16, "f")
    
    third_place_match = get_third_place_match(cache.fixtures_cache)
    
    results = r32_matches + r16_matches + qf_matches + sf_matches + f_match + [third_place_match]
    
    return results

@app.get("/teams")
async def get_teams():
    if cache.fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    teams = {}
    for fixture in cache.fixtures_cache:
        home = map_team_name(fixture["teams"]["home"]["name"])
        away = map_team_name(fixture["teams"]["away"]["name"])
        teams[home] = fixture["teams"]["home"]["logo"]
        teams[away] = fixture["teams"]["away"]["logo"]
    
    return teams

@app.get("/health")
def health():
    return {"status": "ok"}
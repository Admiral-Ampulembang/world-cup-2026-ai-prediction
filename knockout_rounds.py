from fastapi import HTTPException
from mapper import map_team_name

def build_r32_bracket_order():
    bracket_slots = [
        ('E', 'winner'),
        ('I', 'winner'),
        ('A', 'runner-up'),
        ('F', 'winner'),
        ('K', 'runner-up'),
        ('H', 'winner'),
        ('D', 'winner'),
        ('G', 'winner'),
        ('C', 'winner'),
        ('E', 'runner-up'),
        ('A', 'winner'),
        ('L', 'winner'),
        ('J', 'winner'),
        ('D', 'runner-up'),
        ('B', 'winner'),
        ('K', 'winner'),
    ]

    return bracket_slots

def get_r32_matches_in_bracket_order(standings_cache, fixtures_cache):
    if standings_cache is None or fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Data not available yet")
    
    # Build dictionaries from standings
    winners_dict = {}
    runnersup_dict = {}
    
    for item in standings_cache:
        if item[0].get("group") == "Group Stage":
            continue
        
        group = item[0]["group"].removeprefix("Group ")
        winners_dict[group] = map_team_name(item[0]["team"]["name"])
        runnersup_dict[group] = map_team_name(item[1]["team"]["name"])
    
    # Get all R32 matches from API
    all_r32_api_matches = []
    for fixture in fixtures_cache:
        knockout_round = fixture["league"]["round"]
        if knockout_round == "Round of 32":
            home_team = map_team_name(fixture["teams"]["home"]["name"])
            away_team = map_team_name(fixture["teams"]["away"]["name"])
            status = fixture["fixture"]["status"]["short"]
            
            match = {
                "id": fixture["fixture"]["id"],
                "round": knockout_round,
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
                }
            }

            all_r32_api_matches.append(match)
    
    # Build lookup by team
    matches_by_team = {}
    for match in all_r32_api_matches:
        matches_by_team[match["home_team"]] = match
        matches_by_team[match["away_team"]] = match
    
    # Get bracket structure
    bracket_slots = build_r32_bracket_order()
    
    # Reorder matches to bracket order
    ordered_matches = []
    for group, position in bracket_slots:
        if position == 'winner':
            anchor_team = winners_dict.get(group)
        else:  # runner-up
            anchor_team = runnersup_dict.get(group)
        
        if anchor_team and anchor_team in matches_by_team:
            match = matches_by_team[anchor_team]
            # Avoid duplicates - only add if not already in ordered_matches
            if not any(m["id"] == match["id"] for m in ordered_matches):
                ordered_matches.append(match)
        else:
            pass
    
    return ordered_matches


def get_round_matches_by_anchor(r32_matches, fixtures_cache, round_name, step_size, round_key):
    """
    Generic function to fetch bracket matches dynamically based on R32 team anchors.
    - round_name: The exact string from the API (e.g., 'Quarter-finals')
    - step_size: How many R32 matches funnel into a single match this round (R16=2, QF=4, SF=8, Final=16)
    - round_key: Prefix for unique TBD fallback IDs (e.g., 'qf', 'sf')
    """
    if fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
        
    api_matches = []
    for fixture in fixtures_cache:
        if fixture["league"]["round"] == round_name:
            api_matches.append({
                "id": fixture["fixture"]["id"],
                "round": round_name,
                "status": fixture["fixture"]["status"]["short"],
                "elapsed": fixture["fixture"]["status"]["elapsed"],
                "home_team": map_team_name(fixture["teams"]["home"]["name"]),
                "home_logo": fixture["teams"]["home"]["logo"],
                "away_team": map_team_name(fixture["teams"]["away"]["name"]),
                "away_logo": fixture["teams"]["away"]["logo"],
                "score": {
                    "home": fixture["goals"]["home"],
                    "away": fixture["goals"]["away"],
                    "penalty": {
                        "home": fixture["score"]["penalty"]["home"],
                        "away": fixture["score"]["penalty"]["away"]
                    }
                }
            })

    ordered_matches = []
    
    for i in range(0, len(r32_matches), step_size):
        possible_teams = []
        for offset in range(step_size):
            match = r32_matches[i + offset]
            possible_teams.extend([match["home_team"], match["away_team"]])
            
        match_found = None
        for api_match in api_matches:
            if api_match["home_team"] in possible_teams or api_match["away_team"] in possible_teams:
                match_found = api_match
                break
                
        if match_found is None:
            slot_idx = i // step_size
            match_found = {
                "id": f"tbd-{round_key}-{slot_idx}",
                "round": round_name,
                "status": "NS",
                "elapsed": None,
                "home_team": "TBD",
                "home_logo": None,
                "away_team": "TBD",
                "away_logo": None,
                "score": {"home": None, "away": None, "penalty": {"home": None, "away": None}}
            }
            
        ordered_matches.append(match_found)
        
    return ordered_matches


def get_third_place_match(fixtures_cache):
    if fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    for fixture in fixtures_cache:
        knockout_round = fixture["league"]["round"]
        if knockout_round == "3rd Place Final":
            home_team = map_team_name(fixture["teams"]["home"]["name"])
            away_team = map_team_name(fixture["teams"]["away"]["name"])
            status = fixture["fixture"]["status"]["short"]
            
            match = {
                "id": fixture["fixture"]["id"],
                "round": knockout_round,
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
                }
            }
            return match
    
    # Not in API yet, return TBD placeholder
    return {
        "id": "tbd-3p",
        "round": "3rd Place Final",
        "status": "NS",
        "elapsed": None,
        "home_team": "TBD",
        "home_logo": None,
        "away_team": "TBD",
        "away_logo": None,
        "score": {"home": None, "away": None, "penalty": {"home": None, "away": None}}
    }
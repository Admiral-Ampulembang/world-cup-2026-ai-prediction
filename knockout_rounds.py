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
    # NOTE: this array must stay exactly len(bracket_slots) long and in order.
    # get_round_matches_by_anchor pairs entries by fixed position (i, i+1) -
    # a dropped slot here silently shifts every later round's pairings.
    ordered_matches = []
    for group, position in bracket_slots:
        if position == 'winner':
            anchor_team = winners_dict.get(group)
        else:  # runner-up
            anchor_team = runnersup_dict.get(group)

        match = matches_by_team.get(anchor_team) if anchor_team else None

        if match is None:
            print(
                f"[knockout_rounds] WARNING: could not resolve R32 anchor "
                f"group={group} position={position} anchor_team={anchor_team!r}. "
                f"Known matches_by_team keys: {sorted(matches_by_team.keys())}. "
                f"Inserting placeholder - fix the name mismatch in mapper.py."
            )
            match = {
                "id": f"tbd-r32-{group}-{position}",
                "round": "Round of 32",
                "status": "NS",
                "elapsed": None,
                "home_team": "TBD",
                "home_logo": None,
                "away_team": "TBD",
                "away_logo": None,
                "score": {"home": None, "away": None, "penalty": {"home": None, "away": None}}
            }

        ordered_matches.append(match)

    return ordered_matches


def extract_winner(match):
    """
    Extract winner from a match based on score and status.
    Handles FT, AET, and PEN (penalty shootout) statuses.
    Returns winner team name or None if not determined.
    """
    if match["status"] not in ["FT", "AET", "PEN"] or match["score"]["home"] is None:
        return None
    
    home_score = match["score"]["home"]
    away_score = match["score"]["away"]
    
    if home_score > away_score:
        return match["home_team"]
    elif away_score > home_score:
        return match["away_team"]
    elif match["status"] == "PEN":
        # Penalty shootout
        home_penalty = match["score"]["penalty"]["home"]
        away_penalty = match["score"]["penalty"]["away"]
        if home_penalty is not None and away_penalty is not None:
            if home_penalty > away_penalty:
                return match["home_team"]
            elif away_penalty > home_penalty:
                return match["away_team"]
    
    return None


def extract_loser(match):
    """
    Extract loser from a match based on score and status.
    Handles FT, AET, and PEN (penalty shootout) statuses.
    Returns loser team name or None if not determined.
    """
    if match["status"] not in ["FT", "AET", "PEN"] or match["score"]["home"] is None:
        return None
    
    home_score = match["score"]["home"]
    away_score = match["score"]["away"]
    
    if home_score > away_score:
        return match["away_team"]
    elif away_score > home_score:
        return match["home_team"]
    elif match["status"] == "PEN":
        # Penalty shootout
        home_penalty = match["score"]["penalty"]["home"]
        away_penalty = match["score"]["penalty"]["away"]
        if home_penalty is not None and away_penalty is not None:
            if home_penalty > away_penalty:
                return match["away_team"]
            elif away_penalty > home_penalty:
                return match["home_team"]
    
    return None


def get_round_matches_by_anchor(feeder_matches, fixtures_cache, round_name, round_key):
    """
    Generic function to fetch bracket matches dynamically based on feeder round results.
    - feeder_matches: Matches from the previous round (e.g., R32 for R16, R16 for QF)
    - fixtures_cache: Raw fixture data from API
    - round_name: The exact string from the API (e.g., 'Quarter-finals')
    - round_key: Prefix for unique TBD fallback IDs (e.g., 'qf', 'sf')
    
    Logic: Groups feeder matches in pairs (2 winners per bracket slot),
    extracts winners, builds exact bracket pairings, searches API or infers.
    """
    if fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    # Fetch all matches of this round from API
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
    
    # Extract winners from feeder matches (always in pairs: every 2 feeder matches = 1 bracket match)
    ordered_matches = []
    
    for i in range(0, len(feeder_matches), 2):
        slot_idx = i // 2
        
        # Get the two feeder matches for this slot
        feeder1 = feeder_matches[i]
        feeder2 = feeder_matches[i + 1] if i + 1 < len(feeder_matches) else None
        
        # Extract winners
        team1 = extract_winner(feeder1)
        team2 = extract_winner(feeder2) if feeder2 else None
        
        print(f"DEBUG: {round_name} Slot {slot_idx + 1} -> {team1} vs {team2}")
        
        # Try to find this exact match in the API
        match_found = None
        if team1 and team2:
            for api_match in api_matches:
                if ((api_match["home_team"] == team1 and api_match["away_team"] == team2) or
                    (api_match["home_team"] == team2 and api_match["away_team"] == team1)):
                    match_found = api_match
                    print(f"DEBUG: Found {round_name} match: {api_match['home_team']} vs {api_match['away_team']}")
                    break
        
        # Create match object (API match, inferred match, or partial TBD)
        if match_found:
            ordered_matches.append(match_found)
        else:
            # Determine partial vs full TBD
            if team1 and not team2:
                home, away = team1, "TBD"
            elif team2 and not team1:
                home, away = "TBD", team2
            else:
                home, away = "TBD", "TBD"
            
            inferred_match = {
                "id": f"tbd-{round_key}-{slot_idx}",
                "round": round_name,
                "status": "NS",
                "elapsed": None,
                "home_team": home,
                "home_logo": None,
                "away_team": away,
                "away_logo": None,
                "score": {"home": None, "away": None, "penalty": {"home": None, "away": None}}
            }
            ordered_matches.append(inferred_match)
    
    return ordered_matches


def get_third_place_match(sf_matches, fixtures_cache):
    """
    Third place match: loser of SF1 vs loser of SF2.
    Extracts losers from SF results and infers/fetches the match.
    """
    if fixtures_cache is None:
        raise HTTPException(status_code=503, detail="Fixtures not available yet")
    
    # Extract losers from SF matches
    loser1 = extract_loser(sf_matches[0]) if len(sf_matches) > 0 else None
    loser2 = extract_loser(sf_matches[1]) if len(sf_matches) > 1 else None
    
    print(f"DEBUG: Third Place -> {loser1} vs {loser2}")
    
    # Try to find the third place match in the API
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
    
    # Not in API yet, return inferred or partial TBD placeholder
    if loser1 and not loser2:
        home, away = loser1, "TBD"
    elif loser2 and not loser1:
        home, away = "TBD", loser2
    else:
        home, away = "TBD", "TBD"
    
    return {
        "id": "tbd-3p",
        "round": "3rd Place Final",
        "status": "NS",
        "elapsed": None,
        "home_team": home,
        "home_logo": None,
        "away_team": away,
        "away_logo": None,
        "score": {"home": None, "away": None, "penalty": {"home": None, "away": None}}
    }
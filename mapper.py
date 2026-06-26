API_TO_MODEL_NAMES = {
    "Türkiye": "Turkey", 
    "Bosnia & Herzegovina": "Bosnia and Herzegovina",
    "Congo DR": "DR Congo",
    "Cape Verde Islands": "Cape Verde"
}

def map_team_name(api_name):
    return API_TO_MODEL_NAMES.get(api_name, api_name)
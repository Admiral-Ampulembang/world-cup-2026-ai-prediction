import pandas as pd
import joblib
from world_cup_teams import rankings, groups
import numpy as np
from itertools import combinations

df = pd.read_csv("data/results.csv")
fifa_rankings = pd.read_csv("data/fifa_rankings.csv")
model_xgb = joblib.load("models/xgb_model.joblib")

# remove rows that contains cells with empty values
df.dropna(inplace=True)

# convert date format from strings to date_time
df['date'] = pd.to_datetime(df['date'])

# filter rows by date (after 2010)
filtered_df = df[df['date'] > '2010-01-01']

# filter rows by tournament type
tournament = [
    'FIFA World Cup',
    'FIFA World Cup qualification',
    'UEFA Euro',
    'UEFA Euro qualification',
    'African Cup of Nations',
    'African Cup of Nations qualification',
    'AFC Asian Cup',
    'AFC Asian Cup qualification',
    'CONCACAF Nations League',
    'CONCACAF Nations League qualification',
    'Copa América',
    'Copa América qualification',
    'UEFA Nations League',
    'AFF Championship'
]

filtered_df = filtered_df[filtered_df['tournament'].isin(tournament)]

# fix team name mismatches in filtered_df to match world cup teams
filtered_df['home_team'] = filtered_df['home_team'].replace({
    'Czech Republic': 'Czechia',
    'United States': 'USA'
})

filtered_df['away_team'] = filtered_df['away_team'].replace({
    'Czech Republic': 'Czechia',
    'United States': 'USA'
})

# add a new column called results
conditions = [
    (filtered_df['home_score'] > filtered_df['away_score']),
    (filtered_df['home_score'] == filtered_df['away_score']),
    (filtered_df['home_score'] < filtered_df['away_score']),
]
results = ['home_win', 'draw', 'away_win']

# convert boolean (True/False) to 1/0
filtered_df['neutral'] = filtered_df['neutral'].astype(int)

# tournament encoder
filtered_df['tournament'] = filtered_df['tournament'].astype('category')
filtered_df['tournament_encode'] = filtered_df['tournament'].cat.codes

filtered_df['results'] = np.select(conditions, results, default='unknown')

# convert rank_date to datetime
fifa_rankings['rank_date'] = pd.to_datetime(fifa_rankings['rank_date'])

# fix team name mismatches between fifa_rankings and filtered_df
fifa_rankings['country_full'] = fifa_rankings['country_full'].replace({
    'Congo DR': 'DR Congo',
    'IR Iran': 'Iran',
    'Korea Republic': 'South Korea',
    'Korea DPR': 'North Korea',
    "Côte d'Ivoire": 'Ivory Coast',
    'Curacao': 'Curaçao',
    'Kyrgyz Republic': 'Kyrgyzstan',
    'Sao Tome and Principe': 'São Tomé and Príncipe',
    'Brunei Darussalam': 'Brunei',
    'The Gambia': 'Gambia',
    'St Kitts and Nevis': 'Saint Kitts and Nevis',
    'St Lucia': 'Saint Lucia',
    'St Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
    'Cabo Verde': 'Cape Verde'
})

# sort both dataframes by date (required for merge_asof)
filtered_df = filtered_df.sort_values(by='date', ascending=True)
fifa_rankings = fifa_rankings.sort_values(by='rank_date', ascending=True)

# merge_asof for home team
filtered_df = pd.merge_asof(left=filtered_df, right=fifa_rankings, left_on='date', right_on='rank_date', left_by='home_team', right_by='country_full', direction='backward')

# rename column rank to home_rank
filtered_df = filtered_df.rename(columns={"rank": "home_rank"})

# drop unnecessary columns (for merge 1 - home)
filtered_df = filtered_df.drop(columns=['country_full', 'country_abrv', 'total_points', 'previous_points', 'rank_change', 'confederation', 'rank_date'])

# merge_asof for away team
filtered_df = pd.merge_asof(left=filtered_df, right=fifa_rankings, left_on='date', right_on='rank_date', left_by='away_team', right_by='country_full', direction='backward')

# rename column rank to away_rank
filtered_df = filtered_df.rename(columns={"rank": "away_rank"})

# drop unnecessary columns (for merge 2 - away)
filtered_df = filtered_df.drop(columns=['country_full', 'country_abrv', 'total_points', 'previous_points', 'rank_change', 'confederation', 'rank_date'])

# find rank difference (home - away)
filtered_df['rank_difference'] = filtered_df['home_rank'] - filtered_df['away_rank']

# precompute recent form
all_teams = [team for group in groups.values() for team in group]
team_form = {}

for team in all_teams:
    team_matches = filtered_df[
        (filtered_df['home_team'] == team) | (filtered_df['away_team'] == team)
    ].sort_values(by='date').tail(5)
    wins = len(team_matches[
        ((team_matches['results'] == 'home_win') & (team_matches['home_team'] == team)) |
        ((team_matches['results'] == 'away_win') & (team_matches['away_team'] == team))
    ])
    team_form[team] = wins / len(team_matches) if len(team_matches) > 0 else 0

# precompute h2h
h2h_dict = {}
for home_team, away_team in combinations(all_teams, 2):
    previous_matches = filtered_df[
        ((filtered_df['home_team'] == home_team) & (filtered_df['away_team'] == away_team)) |
        ((filtered_df['home_team'] == away_team) & (filtered_df['away_team'] == home_team))
    ]
    home_wins = len(previous_matches[
        ((previous_matches['results'] == 'home_win') & (previous_matches['home_team'] == home_team)) |
        ((previous_matches['results'] == 'away_win') & (previous_matches['away_team'] == home_team))
    ])
    away_wins = len(previous_matches[
        ((previous_matches['results'] == 'home_win') & (previous_matches['home_team'] == away_team)) |
        ((previous_matches['results'] == 'away_win') & (previous_matches['away_team'] == away_team))
    ])
    draws = len(previous_matches[previous_matches['results'] == 'draw'])
    h2h_dict[(home_team, away_team)] = (home_wins, away_wins, draws)

# predict match
def predict_match(home_team, away_team):
    home_rank = rankings[home_team]
    away_rank = rankings[away_team]
    rank_difference = home_rank - away_rank
    neutral = 1
    tournament_encode = 9 #filtered_df[filtered_df['tournament'] == 'FIFA World Cup']['tournament_encode'].iloc[0]

    home_form = team_form[home_team]
    away_form = team_form[away_team]

    if (home_team, away_team) in h2h_dict:
        h2h_home_win, h2h_away_win, h2h_draw = h2h_dict[(home_team, away_team)]
    elif (away_team, home_team) in h2h_dict:
        h2h_away_win, h2h_home_win, h2h_draw = h2h_dict[(away_team, home_team)]
    else:
        h2h_home_win, h2h_away_win, h2h_draw = 0, 0, 0

    x = [[
        neutral, tournament_encode, h2h_home_win, 
        h2h_away_win, h2h_draw, home_form, away_form,
        home_rank, away_rank, rank_difference
    ]]

    probability = model_xgb.predict_proba(x)[0]
    results = {
        'home_win': probability[2],
        'draw': probability[1],
        'away_win': probability[0]
    }

    return results

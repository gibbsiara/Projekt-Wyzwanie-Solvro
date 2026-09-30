import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import Optional

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    clean_db_url = DB_URL.split("?")[0] if DB_URL else ""
    return psycopg2.connect(clean_db_url, cursor_factory=RealDictCursor)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

xG_string = ("Expected Goals (xG) jest wskażnikiem mierzącym jakoś sytuacji sztrzeleckich w meczu. "
             "Każdy strzał ma przypisywaną wartość (0.00 - 1.00), która określa prawdopodobieństwo padnięcia bramki. "
             "Większość popularnych modeli wylicza wartość wskaźnika na podstawie m.in. odległości od bramki, kąta uderzenia czy pozycji strzału. "
             "Dzięki temu xG pozwala ocenić, ile goli drużyna powinna strzelić na podstawie wykreowanych przez nią okazji.")

about_dataset = ("Wykorzystywany przez nas zbiór danych opiera się na bazie StatsBomb Open Data,"
                 " dostarczającej szczegółowe dane zdarzeniowe (event data). "
                 "Baza ta zawiera m.in. dokładne współrzędne każdego zagrania na boisku, "
                 "trajektorie podań i strzałów, dane o wywieranej presji oraz klatki zamrożone (freeze frames) "
                 "określające pozycje wszystkich zawodników w momencie uderzenia na bramkę.")

about_model_string = ("Zbudowany przez nas model opiera się na sieci neuronowej (MLP), do której "
                      "inputem są m.in. pozycja oddanego strzału, liczba obrońców na linii strzału, "
                      "informacja o tym, czy bramkarz znajdował się na linii strzału oraz pozycja, na"
                      " której gra zawodnik oddający strzał.")

author1_string = "Paweł Szuber"
author2_string = "Wiktor Krocz"


class UserInput(BaseModel):
    message: str


@app.get("/api/menu")
def get_menu():
    return [
        {"id": 1, "name": "O projekcie", "path": "/"},
        {"id": 2, "name": "xG z bazy", "path": "/XGFromDatabase"},
        {"id": 3, "name": "xG z własnych danych", "path": "/XGUserData"},
    ]


@app.get("/api/home-data")
def get_home_data():
    return {"about_xg": xG_string, "author1": author1_string,
            "author2": author2_string, "about_model": about_model_string,
            "about_dataset": about_dataset}


@app.get("/api/settings-data")
def get_settings_data():
    return {"theme": "dark", "notifications": True}


@app.get("/api/user_xg_data")
def get_profile_data():
    return {"username": "Pawcio", "role": "Analityk StatsBomb"}


@app.post("/api/send-data")
def receive_data(data: UserInput):
    return {"reply": f"Got message{data.message}"}


@app.get("/api/situations")
def get_situations():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT DISTINCT play_pattern FROM shots WHERE play_pattern IS NOT NULL ORDER BY play_pattern;')
    situations = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": row["play_pattern"], "name": row["play_pattern"]} for row in situations]


@app.get("/api/competitions")
def get_competitions():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('SELECT competition_id as id, competition_name as name FROM competitions;')
        competitions = cur.fetchall()
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        competitions = []
    cur.close()
    conn.close()
    return competitions


@app.get("/api/seasons")
def get_seasons(comp_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('SELECT season_id as id, season_name as name FROM seasons WHERE competition_id = %s;', (comp_id,))
        seasons = cur.fetchall()
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        seasons = []
    cur.close()
    conn.close()
    return seasons


@app.get("/api/matches")
def get_matches(season_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            SELECT match_id as id, home_team || ' vs ' || away_team as name 
            FROM matches 
            WHERE season_id = %s;
        ''', (season_id,))
        matches = cur.fetchall()
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        matches = []
    cur.close()
    conn.close()
    return matches


def get_shots_columns(cur):
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'shots';")
    return {row["column_name"] for row in cur.fetchall()}


@app.get("/api/xg-data")
def get_xg_data(
        competition: Optional[str] = None,
        season: Optional[str] = None,
        match: Optional[str] = None,
        situation: Optional[str] = None,
        limit: int = 50
):
    limit = max(1, min(limit, 2000))

    conn = get_db_connection()
    cur = conn.cursor()

    columns = get_shots_columns(cur)

    where = " WHERE 1=1"
    params = []
    ignored_filters = []

    if situation:
        where += ' AND play_pattern = %s'
        params.append(situation)

    for col, value, label in [
        ("competition_id", competition, "rozgrywki"),
        ("season_id", season, "sezon"),
        ("match_id", match, "mecz"),
    ]:
        if value:
            if col in columns:
                where += f' AND "{col}"::text = %s'
                params.append(value)
            else:
                ignored_filters.append(label)

    cur.execute(f'SELECT COALESCE(SUM("xG"), 0) AS total_xg, COUNT(id) AS shot_count FROM shots{where}',
                tuple(params))
    summary = cur.fetchone()

    cur.execute(f'''
        SELECT id, location, "xG" AS xg, position, play_pattern, shot_type,
               shot_body_part, shot_technique
        FROM shots{where}
        AND location IS NOT NULL
        ORDER BY "xG" DESC
        LIMIT %s
    ''', tuple(params) + (limit,))
    rows = cur.fetchall()

    cur.close()
    conn.close()

    shots = [
        {
            "id": r["id"],
            "location": r["location"],
            "xg": round(r["xg"], 3),
            "position": r["position"],
            "play_pattern": r["play_pattern"],
            "shot_type": r["shot_type"],
            "body_part": r["shot_body_part"],
            "technique": r["shot_technique"],
        }
        for r in rows
    ]

    warning = None
    if ignored_filters:
        warning = ("Tabela shots nie ma kolumn match_id / season_id / competition_id, "
                   "więc pominięto filtr: " + ", ".join(ignored_filters) + ".")

    return {
        "status": "success",
        "warning": warning,
        "data": {
            "total_xg": round(summary["total_xg"], 2),
            "shot_count": summary["shot_count"],
            "shots": shots,
            "shots_shown": len(shots),
        }
    }


@app.get("/api/shot/{shot_id}")
def get_shot(shot_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, location, "xG" AS xg, position, play_pattern, shot_type,
               shot_body_part, shot_technique, under_pressure, shot_first_time,
               shot_deflected, shot_aerial_won, shot_freeze_frame, period
        FROM shots WHERE id = %s;
    ''', (shot_id,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Nie znaleziono strzału")

    return {
        "id": r["id"],
        "location": r["location"],
        "xg": round(r["xg"], 3),
        "position": r["position"],
        "play_pattern": r["play_pattern"],
        "shot_type": r["shot_type"],
        "body_part": r["shot_body_part"],
        "technique": r["shot_technique"],
        "under_pressure": r["under_pressure"],
        "first_time": r["shot_first_time"],
        "deflected": r["shot_deflected"],
        "aerial_won": r["shot_aerial_won"],
        "period": r["period"],
        "freeze_frame": r["shot_freeze_frame"] or [],
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
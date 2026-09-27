import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
        {"id": 2, "name": "xG z bazy", "path": "XGFromDatabase"},
        {"id": 3, "name": "xG z własnych danych", "path": "/xGUserData"},
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
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

@app.post("/api/send-data")
def receive_data(data: UserInput):
    return{"reply": f"Got message{data.message}"}
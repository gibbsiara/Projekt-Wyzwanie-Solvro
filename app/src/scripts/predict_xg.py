import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import torch
import torch.nn as nn
import math
import os

LEARNING_RATE = 0.001
EPOCHS = 150
INPUT_SIZE = 60
HIDDEN_SIZE = 64
OUTPUT_SIZE = 1

SAVED_MEAN = np.array([
    1.56276164e+00, 2.46502266e-01, 3.07998172e-01, 1.37439646e-02,
    8.36739482e-02, 1.03733617e+02, 3.97581828e+01, 1.77760215e+00,
    4.11342167e+00, 9.49086823e-01, 1.62531952e-01, 4.69739816e-02,
    1.93341648e-01, 3.79101271e-02, 1.72262630e-02, 1.20275126e-02,
    1.80091626e-01, 1.69545943e-02, 3.32942295e-01, 3.21062965e-04,
    4.40720663e-02, 3.70457268e-05, 9.40936763e-01, 1.46330621e-02,
    1.58370482e-01, 3.06355812e-01, 2.98835529e-03, 5.32285351e-01,
    4.06268137e-03, 3.46994974e-03, 1.32734839e-01, 1.04221978e-02,
    7.82158778e-01, 5.00117311e-03, 6.21503810e-02, 6.80283029e-02,
    5.13700745e-03, 2.48082884e-02, 1.57827145e-01, 6.79171658e-04,
    1.60531483e-04, 4.91473309e-03, 3.56009434e-02, 3.42302515e-02,
    6.04462775e-02, 5.74579222e-02, 4.01822650e-02, 3.84905101e-02,
    1.02394389e-01, 1.00764377e-02, 5.24814463e-03, 3.35634285e-02,
    3.50452575e-02, 5.87792198e-02, 5.20122004e-02, 3.78113385e-02,
    3.38844914e-02, 9.30341685e-02, 9.68128326e-03, 5.06291599e-04
], dtype=np.float64)

SAVED_VAR = np.array([
    3.08421284e-01, 1.85738899e-01, 2.13135298e-01, 1.35550681e-02,
    7.66726186e-02, 7.71616369e+01, 9.60254985e+01, 1.14795588e+00,
    3.72081380e+00, 4.83210256e-02, 1.36115317e-01, 4.47674266e-02,
    1.55960655e-01, 3.64729493e-02, 1.69295188e-02, 1.18828516e-02,
    1.47658633e-01, 1.66671360e-02, 2.22091723e-01, 3.20959884e-04,
    4.21297193e-02, 3.70443544e-05, 5.55747711e-02, 1.44189356e-02,
    1.33289272e-01, 2.12501928e-01, 2.97942503e-03, 2.48957656e-01,
    4.04617599e-03, 3.45790919e-03, 1.15116302e-01, 1.03135756e-02,
    1.70386424e-01, 4.97616138e-03, 5.82877111e-02, 6.34004529e-02,
    5.11061860e-03, 2.41928372e-02, 1.32917737e-01, 6.78710383e-04,
    1.60505712e-04, 4.89057848e-03, 3.43335163e-02, 3.30585414e-02,
    5.67925251e-02, 5.41565094e-02, 3.85676506e-02, 3.70089908e-02,
    9.19097779e-02, 9.97490309e-03, 5.22060160e-03, 3.24369247e-02,
    3.38170875e-02, 5.53242231e-02, 4.93069314e-02, 3.63816411e-02,
    3.27363327e-02, 8.43788120e-02, 9.58755602e-03, 5.06035268e-04
], dtype=np.float64)

# Kolejność cech numerycznych odczytana ze SAVED_MEAN (pierwsze 10 wartości):
# 1.56 -> period, 0.25 -> under_pressure, 0.31 -> shot_first_time,
# 0.014 -> shot_deflected, 0.084 -> shot_aerial_won, 103.7 -> x, 39.8 -> y,
# 1.78 -> enemies, 4.11 -> teammates, 0.95 -> gk_in_range.
NUMERIC_COLS = [
    'period', 'under_pressure', 'shot_first_time', 'shot_deflected', 'shot_aerial_won',
    'location_x', 'location_y',
    'enemies_in_shooting_range', 'non_offside_teammates', 'is_gk_in_shooting_range'
]

CATEGORICAL_COLS = ['play_pattern', 'shot_type', 'shot_body_part', 'shot_technique', 'position']

# Kategorie w kolejności ALFABETYCZNEJ (tak jak zwraca OneHotEncoder po treningu).
# Wcześniej 'Kick Off' było na końcu w shot_type, a 'Center Forward' przed
# 'Center Defensive Midfield' - to przesuwało kolumny względem SAVED_MEAN/SAVED_VAR.
CATEGORIES = [
    [
        'From Counter', 'From Corner', 'From Free Kick', 'From Goal Kick',
        'From Keeper', 'From Other', 'From Throw In', 'Other', 'Regular Play'
    ],
    ['Corner', 'Free Kick', 'Kick Off', 'Open Play', 'Penalty'],
    ['Head', 'Left Foot', 'Other', 'Right Foot'],
    ['Backheel', 'Diving Header', 'Half Volley', 'Lob', 'Normal', 'Overhead Kick', 'Volley'],
    [
        'Center Attacking Midfield', 'Center Back', 'Center Defensive Midfield',
        'Center Forward', 'Center Midfield', 'Goalkeeper',
        'Left Attacking Midfield', 'Left Back', 'Left Center Back',
        'Left Center Forward', 'Left Center Midfield', 'Left Defensive Midfield',
        'Left Midfield', 'Left Wing', 'Left Wing Back',
        'Right Attacking Midfield', 'Right Back', 'Right Center Back',
        'Right Center Forward', 'Right Center Midfield', 'Right Defensive Midfield',
        'Right Midfield', 'Right Wing', 'Right Wing Back', 'Secondary Striker'
    ]
]

DEFAULTS = {
    'play_pattern': 'Regular Play',
    'shot_type': 'Open Play',
    'shot_body_part': 'Right Foot',
    'shot_technique': 'Normal',
    'position': 'Center Forward'
}


def get_fitted_encoder(categorical_cols):
    encoder = OneHotEncoder(
        categories=CATEGORIES,
        handle_unknown='ignore',
        sparse_output=False
    )
    sample_row = {col: [CATEGORIES[i][0]] for i, col in enumerate(categorical_cols)}
    encoder.fit(pd.DataFrame(sample_row))
    return encoder


def get_fitted_scaler():
    scaler = StandardScaler()
    scaler.mean_ = SAVED_MEAN
    scaler.var_ = SAVED_VAR
    scaler.scale_ = np.sqrt(SAVED_VAR)
    scaler.n_features_in_ = len(SAVED_MEAN)
    scaler.n_samples_seen_ = 1000
    return scaler


def _to_int(value, default=0):
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip().lower() in ('true', '1', 'yes')
    return bool(value)


class model_pipeline:

    CATEGORICAL_COLS = CATEGORICAL_COLS

    def __init__(self, dataset):
        dataset_processed = self.process_pipeline(dataset)

        self.encoder = get_fitted_encoder(self.CATEGORICAL_COLS)
        dataset_encoded = self.encode_categoricals(dataset_processed)

        if dataset_encoded.shape[1] != INPUT_SIZE:
            for idx, col in enumerate(dataset_encoded.columns):
                print(f"{idx}: {col}", file=sys.stderr)
            raise ValueError(f"Oczekiwano {INPUT_SIZE} cech, a otrzymano {dataset_encoded.shape[1]}.")

        self.std_scaler = get_fitted_scaler()
        # .to_numpy() - scaler był "fitowany" ręcznie, bez nazw kolumn
        self.dataset = self.std_scaler.transform(dataset_encoded.to_numpy(dtype=np.float64))

    def encode_categoricals(self, df):
        encoded_array = self.encoder.transform(df[self.CATEGORICAL_COLS])
        encoded_cols = self.encoder.get_feature_names_out(self.CATEGORICAL_COLS)
        encoded_df = pd.DataFrame(encoded_array, columns=encoded_cols, index=df.index)

        # Jawna kolejność: cechy numeryczne w kolejności z treningu, potem one-hot.
        return pd.concat([df[NUMERIC_COLS].astype(float), encoded_df], axis=1)

    def process_pipeline(self, dataframe_to_pipeline):
        df = dataframe_to_pipeline.copy()

        # Kategorie: braki -> wartości domyślne, nieznane wartości -> błąd
        # (handle_unknown='ignore' po cichu zerowałby całą kolumnę one-hot).
        for i, (col, default_val) in enumerate(DEFAULTS.items()):
            if col not in df.columns:
                df[col] = default_val
            df[col] = df[col].where(df[col].notna(), default_val)
            unknown = set(df[col]) - set(CATEGORIES[i])
            if unknown:
                raise ValueError(f"Nieznana wartość dla '{col}': {sorted(unknown)}")

        if 'period' not in df.columns:
            df['period'] = 1
        df['period'] = pd.to_numeric(df['period'], errors='coerce').fillna(1).clip(1, 5).astype(int)

        df = self.code_shot_location_data(df)
        df = self.code_shot_info(df)
        df = self.apply_processed_players_positions(df)
        return df

    @staticmethod
    def process_players_postions(shot_freeze_frame, location_x, location_y):
        """Pełny freeze_frame (gdyby kiedyś był dostępny, np. z danych StatsBomb)."""
        if not isinstance(shot_freeze_frame, list) or pd.isna(location_x) or pd.isna(location_y):
            return [0, 0, 0]

        count_enemies_in_shooting_range = 0
        count_non_offside_teammates = 0
        is_goal_keeper_in_shooting_range = 0
        left_post = [120, 36]
        right_post = [120, 44]

        def calculate_triangle_area(x1, y1, x2, y2, x3, y3):
            return abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0)

        def calculate_player_triangles_area(player_x, player_y):
            area = 0
            area += calculate_triangle_area(player_x, player_y, right_post[0], right_post[1], left_post[0], left_post[1])
            area += calculate_triangle_area(player_x, player_y, left_post[0], left_post[1], location_x, location_y)
            area += calculate_triangle_area(player_x, player_y, right_post[0], right_post[1], location_x, location_y)
            return area

        def find_offside_line(freeze_frame):
            offside_line = 120
            opponents_x = [
                player['location'][0]
                for player in freeze_frame
                if isinstance(player, dict) and player.get('teammate') == False and 'location' in player
            ]
            opponents_x.sort(reverse=True)
            if len(opponents_x) >= 2:
                offside_line = opponents_x[1]
            return offside_line

        shooting_triangle_area = calculate_triangle_area(location_x, location_y, right_post[0], right_post[1], left_post[0], left_post[1])
        offside_line = find_offside_line(shot_freeze_frame)

        for player in shot_freeze_frame:
            if not isinstance(player, dict) or 'location' not in player:
                continue

            player_area = calculate_player_triangles_area(player['location'][0], player['location'][1])
            is_teammate = player.get('teammate', False)
            in_triangle = math.isclose(player_area, shooting_triangle_area, abs_tol=0.5)

            if in_triangle and not is_teammate:
                count_enemies_in_shooting_range += 1
            if (player['location'][0] <= offside_line or player['location'][0] < location_x) and is_teammate:
                count_non_offside_teammates += 1

            position_info = player.get('position') or {}
            if position_info.get('name') == 'Goalkeeper' and not is_teammate and in_triangle:
                is_goal_keeper_in_shooting_range = 1

        return [count_enemies_in_shooting_range, count_non_offside_teammates, is_goal_keeper_in_shooting_range]

    @staticmethod
    def apply_processed_players_positions(df):
        """
        Dwa tryby:
        1) jest 'shot_freeze_frame' (lista) -> liczymy geometrię jak w treningu,
        2) brak freeze_frame -> bierzemy gotowe liczby z frontu:
             defenders_in_shooting_range (obrońcy w polu, BEZ bramkarza),
             gk_in_shooting_range (bool),
             non_offside_teammates (int).
           W treningu 'enemies_in_shooting_range' wliczał też bramkarza,
           dlatego enemies = obrońcy + bramkarz.
        """
        has_ff = 'shot_freeze_frame' in df.columns
        rows = []

        for idx in df.index:
            ff = df.at[idx, 'shot_freeze_frame'] if has_ff else None
            x, y = df.at[idx, 'location_x'], df.at[idx, 'location_y']

            if isinstance(ff, list) and len(ff) > 0:
                rows.append(model_pipeline.process_players_postions(ff, x, y))
                continue

            def get(col, default):
                return df.at[idx, col] if col in df.columns else default

            defenders = max(0, _to_int(get('defenders_in_shooting_range', 0)))
            gk = 1 if _to_bool(get('gk_in_shooting_range', True), default=True) else 0
            teammates = max(0, _to_int(get('non_offside_teammates', 0)))
            rows.append([defenders + gk, teammates, gk])

        cols = ['enemies_in_shooting_range', 'non_offside_teammates', 'is_gk_in_shooting_range']
        df[cols] = pd.DataFrame(rows, index=df.index, columns=cols)

        df = df.drop(columns=['shot_freeze_frame', 'defenders_in_shooting_range',
                              'gk_in_shooting_range'], errors='ignore')
        return df

    @staticmethod
    def code_shot_location_data(df):
        x_position, y_position = [], []
        for loc in df['location']:
            if isinstance(loc, (list, tuple)) and len(loc) >= 2:
                x_position.append(float(np.clip(loc[0], 0, 120)))
                y_position.append(float(np.clip(loc[1], 0, 80)))
            else:
                raise ValueError("Pole 'location' musi być listą [x, y]")

        df['location_x'] = x_position
        df['location_y'] = y_position
        return df.drop(columns=['location'], errors='ignore')

    @staticmethod
    def code_shot_info(df):
        cols = ['shot_aerial_won', 'shot_deflected', 'shot_first_time', 'under_pressure']
        for col in cols:
            if col in df.columns:
                df[col] = df[col].apply(_to_bool).astype(int)
            else:
                df[col] = 0
        return df


class get_dataset:

    def __init__(self):
        self.df = self.get_data()
        self.processed_df = model_pipeline(self.df)

    def get_data(self):
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            raise ValueError("Brak danych wejściowych z Node.js (stdin)")

        payload = json.loads(raw_input)
        if isinstance(payload, dict):
            payload = [payload]

        return pd.DataFrame(payload)


class Data_Load():

    def __init__(self):
        self.processed_df = get_dataset().processed_df
        self.dataset_tensor = self.convert_to_tensor(self.processed_df.dataset)

    @staticmethod
    def convert_to_tensor(dataset):
        return torch.from_numpy(dataset).float()


class statsbomb_mlp(nn.Module):

    def __init__(self, input_size=INPUT_SIZE, hidden_size=HIDDEN_SIZE, output_size=OUTPUT_SIZE, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(hidden_size, output_size),
        )

    def forward(self, x):
        return self.net(x)


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(current_dir, "../model/xG_model.pth")

    try:
        model = statsbomb_mlp()
        model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
        model.eval()

        data = Data_Load()
        input_tensor = data.dataset_tensor

        if input_tensor.dim() == 1:
            input_tensor = input_tensor.unsqueeze(0)

        with torch.no_grad():
            prob = torch.sigmoid(model(input_tensor))
            xg_value = prob.item()

        print(json.dumps({"xg": round(xg_value, 4)}))

    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import math

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

CATEGORIES = [
    [
        'From Counter', 'From Corner', 'From Free Kick', 'From Goal Kick',
        'From Keeper', 'From Other', 'From Throw In', 'Other', 'Regular Play'
    ],
    ['Corner', 'Free Kick', 'Open Play', 'Penalty', 'Kick Off'],
    ['Head', 'Left Foot', 'Other', 'Right Foot'],
    ['Backheel', 'Diving Header', 'Half Volley', 'Lob', 'Normal', 'Overhead Kick', 'Volley'],
    [
        'Center Attacking Midfield', 'Center Back', 'Center Forward',
        'Center Defensive Midfield', 'Center Midfield', 'Goalkeeper',
        'Left Attacking Midfield', 'Left Back', 'Left Center Back',
        'Left Center Forward', 'Left Center Midfield', 'Left Defensive Midfield',
        'Left Midfield', 'Left Wing', 'Left Wing Back',
        'Right Attacking Midfield', 'Right Back', 'Right Center Back',
        'Right Center Forward', 'Right Center Midfield', 'Right Defensive Midfield',
        'Right Midfield', 'Right Wing', 'Right Wing Back', 'Secondary Striker'
    ]
]

def get_fitted_encoder(categorical_cols):
    encoder = OneHotEncoder(
        categories=CATEGORIES,
        handle_unknown='ignore',
        sparse_output=False
    )
    sample_row = {col: [CATEGORIES[i][0]] for i, col in enumerate(categorical_cols)}
    dummy_df = pd.DataFrame(sample_row)

    encoder.fit(dummy_df)
    return encoder

def get_fitted_scaler():
    scaler = StandardScaler()
    scaler.mean_ = SAVED_MEAN
    scaler.var_ = SAVED_VAR
    scaler.scale_ = np.sqrt(SAVED_VAR)
    scaler.n_features_in_ = len(SAVED_MEAN)
    scaler.n_samples_seen_ = 1000
    return scaler

class model_pipeline:

    CATEGORICAL_COLS = ['play_pattern', 'shot_type', 'shot_body_part', 'shot_technique', 'position']

    def __init__(self, dataset):
        dataset_processed = self.process_pipeline(dataset)

        self.encoder = get_fitted_encoder(self.CATEGORICAL_COLS)

        dataset_encoded = self.encode_categoricals(dataset_processed)

        if dataset_encoded.shape[1] != 60:
            for idx, col in enumerate(dataset_encoded.columns):
                print(f"{idx}: {col}")
            raise ValueError(f"Oczekiwano 60 cech, a otrzymano {dataset_encoded.shape[1]}. Sprawdź listę kolumn.")

        self.std_scaler = get_fitted_scaler()

        self.dataset = self.std_scaler.transform(dataset_encoded)

    def encode_categoricals(self, df):
        encoded_array = self.encoder.transform(df[self.CATEGORICAL_COLS])
        encoded_cols = self.encoder.get_feature_names_out(self.CATEGORICAL_COLS)
        encoded_df = pd.DataFrame(encoded_array, columns=encoded_cols, index=df.index)

        df = df.drop(columns=self.CATEGORICAL_COLS)
        df = pd.concat([df, encoded_df], axis=1)
        return df

    def process_pipeline(self, dataframe_to_pipeline):
        dataframe_to_pipeline_copy = dataframe_to_pipeline.copy()

        if 'period' not in dataframe_to_pipeline_copy.columns:
            dataframe_to_pipeline_copy['period'] = 1

        dataframe_to_pipeline_copy = self.code_shot_location_data(dataframe_to_pipeline_copy)
        dataframe_to_pipeline_copy = self.code_shot_info(dataframe_to_pipeline_copy)
        dataframe_to_pipeline_copy = self.apply_processed_plaayers_postions(dataframe_to_pipeline_copy)
        dataframe_to_pipeline_copy = dataframe_to_pipeline_copy.drop(columns=['shot_statsbomb_xg'], errors='ignore')

        defaults = {
            'play_pattern': 'Regular Play',
            'shot_type': 'Open Play',
            'shot_body_part': 'Right Foot',
            'shot_technique': 'Normal',
            'position': 'Center Forward'
        }
        for col, default_val in defaults.items():
            if col not in dataframe_to_pipeline_copy.columns or pd.isna(dataframe_to_pipeline_copy[col].iloc[0]):
                dataframe_to_pipeline_copy[col] = default_val

        return dataframe_to_pipeline_copy

    @staticmethod
    def process_players_postions(shot_freeze_frame, location_x, location_y):
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

            if math.isclose(player_area, shooting_triangle_area, abs_tol=0.5) and not is_teammate:
                count_enemies_in_shooting_range += 1
            if (player['location'][0] <= offside_line or player['location'][0] < location_x) and is_teammate: #TODO: sprawdzenie połowy
                count_non_offside_teammates += 1

            position_info = player.get('position') or {}
            if position_info.get('name') == 'Goalkeeper' and not is_teammate:
                if math.isclose(player_area, shooting_triangle_area, abs_tol=0.5):
                    is_goal_keeper_in_shooting_range = 1

        return [count_enemies_in_shooting_range, count_non_offside_teammates, is_goal_keeper_in_shooting_range]

    @staticmethod
    def apply_processed_plaayers_postions(used_dataframe):

        processed_players_locations = []

        for freeze_frame, location_x, location_y in zip(used_dataframe['shot_freeze_frame'], used_dataframe['location_x'], used_dataframe['location_y']):
            processed_players_locations.append(model_pipeline.process_players_postions(freeze_frame, location_x, location_y))

        columns = ['enemies_in_shooting_range', 'non_offside_teammates', 'is_gk_in_shooting_range']

        used_dataframe[columns] = pd.DataFrame(processed_players_locations, index=used_dataframe.index)

        used_dataframe.drop(columns=['shot_freeze_frame'], inplace=True, errors='ignore')

        return used_dataframe

    @staticmethod
    def code_shot_location_data(used_dataframe):

        locations = used_dataframe['location']
        x_position = []
        y_position = []
        for loc in locations:
            if isinstance(loc, (list, tuple)) and len(loc) >= 2:
                x_position.append(loc[0])
                y_position.append(loc[1])
            else:
                x_position.append(None)
                y_position.append(None)

        used_dataframe.loc[:, 'location_x'] = x_position
        used_dataframe.loc[:, 'location_y'] = y_position
        used_dataframe = used_dataframe.drop(columns=['location'], errors='ignore')

        return used_dataframe

    @staticmethod
    def code_shot_info(used_dataframe):
        cols = ['shot_aerial_won', 'shot_deflected', 'shot_first_time', 'under_pressure']
        for col in cols:
            if col in used_dataframe.columns:
                used_dataframe[col] = (used_dataframe[col] == True).astype(int)
            else:
                used_dataframe[col] = 0

        used_dataframe[cols] = used_dataframe[cols].astype(int)
        return used_dataframe

class get_dataset:

  def __init__(self, file_path="test.json"):

    self.df = self.get_data()
    self.processed_df = model_pipeline(self.df)

  def get_data(self):
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        raise ValueError("Brak danych wejściowych z Node.js (stdin)")

    payload = json.loads(raw_input)
    if isinstance(payload, dict):
        payload = [payload]

    df = pd.DataFrame(payload)
    return df



class Data_Load():

  def __init__(self):
    self.get_processed_data()
    self.dataset_tensor = self.convert_to_tensor(self.processed_df.dataset)

  def get_processed_data(self):

    self.processed_df = get_dataset().processed_df
    return self.processed_df

  @staticmethod
  def convert_to_tensor(dataset):

    dataset_tensor = torch.from_numpy(dataset).float()

    return dataset_tensor

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

    MODEL_PATH = "/home/kukann/wakacyjne-wyzwanie-2026/ml-app/src/model/xG_model.pth"

    try:
        model = statsbomb_mlp()
        model.load_state_dict(torch.load(MODEL_PATH))
        model.eval()     

        data = Data_Load()
        input_tensor = data.dataset_tensor

        if input_tensor.dim() == 1:
            input_tensor = input_tensor.unsqueeze(0)


        with torch.no_grad():
            logits = model(input_tensor)
            prob = torch.sigmoid(logits)
            
            xg_value = prob.item()

        print(json.dumps({"xg": round(xg_value, 4)}))

    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()

import React, { useState, useEffect } from "react";
import { divStyle, titleStyle } from "../styles";

const PLAY_PATTERNS = ["Regular Play", "From Counter", "From Corner", "From Free Kick", "From Goal Kick", "From Keeper", "From Throw In", "From Other", "Other"];
const SHOT_TYPES = ["Open Play", "Free Kick", "Corner", "Penalty", "Kick Off"];
const BODY_PARTS = ["Right Foot", "Left Foot", "Head", "Other"];
const TECHNIQUES = ["Normal", "Volley", "Half Volley", "Lob", "Backheel", "Diving Header", "Overhead Kick"];
const POSITIONS = [
    "Center Forward", "Secondary Striker", "Left Center Forward", "Right Center Forward",
    "Left Wing", "Right Wing",
    "Center Attacking Midfield", "Left Attacking Midfield", "Right Attacking Midfield",
    "Center Midfield", "Left Center Midfield", "Right Center Midfield",
    "Left Midfield", "Right Midfield",
    "Center Defensive Midfield", "Left Defensive Midfield", "Right Defensive Midfield",
    "Left Wing Back", "Right Wing Back", "Left Back", "Right Back",
    "Center Back", "Left Center Back", "Right Center Back", "Goalkeeper"
];
const PERIODS = [
    { value: 1, label: "1. połowa" },
    { value: 2, label: "2. połowa" },
    { value: 3, label: "Dogrywka 1" },
    { value: 4, label: "Dogrywka 2" }
];

export default function XGUserData() {
    const [userdata, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [xgResult, setXgResult] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        location_x: 105,
        location_y: 40,
        period: 1,
        play_pattern: "Regular Play",
        shot_type: "Open Play",
        shot_body_part: "Right Foot",
        shot_technique: "Normal",
        position: "Center Forward",
        under_pressure: false,
        shot_first_time: false,
        shot_deflected: false,
        shot_aerial_won: false,
        defenders_in_shooting_range: 1,
        gk_in_shooting_range: true,
        non_offside_teammates: 4
    });

    useEffect(() => {
        fetch('http://localhost:8000/api/user_xg_data')
            .then(res => res.json())
            .then(dane => setUserData(dane))
            .catch(err => console.error("Błąd pobierania danych użytkownika:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: type === 'checkbox' ? checked : value };

            if (name === 'shot_type' && value === 'Penalty') {
                next.location_x = 108;
                next.location_y = 40;
                next.defenders_in_shooting_range = 0;
                next.gk_in_shooting_range = true;
                next.under_pressure = false;
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setXgResult(null);

        const payload = {
            location: [parseFloat(formData.location_x), parseFloat(formData.location_y)],
            period: parseInt(formData.period, 10),
            play_pattern: formData.play_pattern,
            shot_type: formData.shot_type,
            shot_body_part: formData.shot_body_part,
            shot_technique: formData.shot_technique,
            position: formData.position,
            under_pressure: formData.under_pressure,
            shot_first_time: formData.shot_first_time,
            shot_deflected: formData.shot_deflected,
            shot_aerial_won: formData.shot_aerial_won,
            defenders_in_shooting_range: parseInt(formData.defenders_in_shooting_range, 10) || 0,
            gk_in_shooting_range: formData.gk_in_shooting_range,
            non_offside_teammates: parseInt(formData.non_offside_teammates, 10) || 0
        };

        try {
            const res = await fetch('http://localhost:3000/api/xg/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Błąd serwera NestJS');
            }

            const result = await res.json();
            setXgResult(result.xg);
        } catch (err) {
            console.error("Błąd obliczania xG:", err);
            setError(err.message || "Wystąpił błąd podczas obliczania xG.");
        } finally {
            setLoading(false);
        }
    };

    const selectStyle = {
        width: '100%',
        padding: '10px',
        boxSizing: 'border-box',
        marginBottom: '15px',
        borderRadius: '8px',
        border: 'none',
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#333'
    };
    const inputStyle = { ...selectStyle };
    const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' };
    const checkboxStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer', fontSize: '14px' };
    const boxStyle = { background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '15px' };
    const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '15px' };

    const renderSelect = (label, name, options) => (
        <>
            <label style={labelStyle}>{label}</label>
            <select name={name} value={formData[name]} onChange={handleChange} style={selectStyle}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </>
    );

    const renderCheckbox = (label, name) => (
        <label style={checkboxStyle}>
            <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} />
            {label}
        </label>
    );

    return (
        <div style={divStyle}>
            <h2 style={titleStyle}>Wylicz xG z własnych danych</h2>

            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '15px', textAlign: 'left' }}>
                <form onSubmit={handleSubmit}>
                    <div style={grid2}>
                        <div>
                            <label style={labelStyle}>Pozycja X (0 - 120, bramka = 120)</label>
                            <input type="number" name="location_x" min="0" max="120" step="0.1"
                                   value={formData.location_x} onChange={handleChange} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Pozycja Y (0 - 80, środek = 40)</label>
                            <input type="number" name="location_y" min="0" max="80" step="0.1"
                                   value={formData.location_y} onChange={handleChange} style={inputStyle} required />
                        </div>
                    </div>

                    <div style={boxStyle}>
                        <div style={grid2}>
                            <div>
                                <label style={labelStyle}>Obrońcy między strzelcem a bramką</label>
                                <input type="number" name="defenders_in_shooting_range" min="0" max="10"
                                       value={formData.defenders_in_shooting_range} onChange={handleChange} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Koledzy z drużyny (bez spalonego)</label>
                                <input type="number" name="non_offside_teammates" min="0" max="10"
                                       value={formData.non_offside_teammates} onChange={handleChange} style={inputStyle} required />
                            </div>
                        </div>
                        {renderCheckbox("Bramkarz na linii strzału (między strzelcem a słupkami)", "gk_in_shooting_range")}
                    </div>

                    <label style={labelStyle}>Część meczu (Period)</label>
                    <select name="period" value={formData.period} onChange={handleChange} style={selectStyle}>
                        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>

                    {renderSelect("Typ akcji (Play Pattern)", "play_pattern", PLAY_PATTERNS)}
                    {renderSelect("Rodzaj strzału (Shot Type)", "shot_type", SHOT_TYPES)}
                    {renderSelect("Część ciała (Body Part)", "shot_body_part", BODY_PARTS)}
                    {renderSelect("Technika (Technique)", "shot_technique", TECHNIQUES)}
                    {renderSelect("Pozycja zawodnika (Position)", "position", POSITIONS)}

                    <div style={{ margin: '15px 0' }}>
                        {renderCheckbox("Pod presją obrońcy (Under Pressure)", "under_pressure")}
                        {renderCheckbox("Strzał z pierwszej piłki (First Time)", "shot_first_time")}
                        {renderCheckbox("Rykoszet (Deflected)", "shot_deflected")}
                        {renderCheckbox("Wygrany pojedynek powietrzny (Aerial Won)", "shot_aerial_won")}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '14px', backgroundColor: '#2ecc71', color: 'white',
                            border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 'bold', fontSize: '18px', marginTop: '10px'
                        }}
                    >
                        {loading ? "Obliczanie..." : "Wylicz xG"}
                    </button>
                </form>

                {error && (
                    <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(231, 76, 60, 0.3)', color: '#ffcdd2' }}>
                        <strong>Błąd:</strong> {error}
                    </div>
                )}

                {xgResult !== null && (
                    <div style={{ marginTop: '25px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Wynik xG</h3>
                        <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '5px 0', color: '#2ecc71' }}>{xgResult}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
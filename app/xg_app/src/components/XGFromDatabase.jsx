import React, { useState, useEffect } from "react";
import { divStyle, titleStyle } from "../styles";

const API = "http://localhost:8000/api";

function Pitch({ shots, selectedId, onSelect, detail }) {
    const line = { stroke: "rgba(255,255,255,0.85)", strokeWidth: 0.3, fill: "none" };
    const sel = detail && detail.location ? detail.location : null;

    return (
        <svg viewBox="58 -2 64 84" style={{ width: "100%", maxWidth: "560px", background: "#2e7d32", borderRadius: "10px" }}>
            <rect x="60" y="0" width="60" height="80" {...line} />
            <path d="M60 30 A10 10 0 0 1 60 50" {...line} />
            <rect x="102" y="18" width="18" height="44" {...line} />
            <rect x="114" y="30" width="6" height="20" {...line} />
            <rect x="120" y="36" width="1.5" height="8" style={{ fill: "white" }} />
            <circle cx="108" cy="40" r="0.4" fill="white" />
            <path d="M102 32 A10 10 0 0 0 102 48" {...line} />

            {sel && (
                <polygon
                    points={`${sel[0]},${sel[1]} 120,36 120,44`}
                    fill="rgba(255,235,59,0.25)"
                    stroke="rgba(255,235,59,0.8)"
                    strokeWidth="0.2"
                />
            )}

            {shots.map((s) => (
                <circle
                    key={s.id}
                    cx={s.location[0]}
                    cy={s.location[1]}
                    r={0.7 + s.xg * 3.5}
                    fill="rgba(255,255,255,0.55)"
                    stroke={s.id === selectedId ? "#ffeb3b" : "rgba(0,0,0,0.5)"}
                    strokeWidth={s.id === selectedId ? 0.5 : 0.15}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelect(s.id)}
                >
                    <title>{`xG: ${s.xg}`}</title>
                </circle>
            ))}

            {detail && detail.freeze_frame.map((p, i) => {
                const isKeeper = p.position && p.position.name === "Goalkeeper";
                const color = p.teammate ? "#42a5f5" : isKeeper ? "#ffa726" : "#ef5350";
                return (
                    <circle key={i} cx={p.location[0]} cy={p.location[1]} r="1.1"
                            fill={color} stroke="white" strokeWidth="0.2">
                        <title>{`${p.player ? p.player.name : ""} (${p.position ? p.position.name : ""})`}</title>
                    </circle>
                );
            })}

            {sel && (
                <circle cx={sel[0]} cy={sel[1]} r="1.3" fill="#ffeb3b" stroke="black" strokeWidth="0.25" />
            )}
        </svg>
    );
}

function Legend() {
    const item = (color, text) => (
        <span style={{ marginRight: "14px", fontSize: "13px", whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: color, marginRight: "5px" }} />
            {text}
        </span>
    );
    return (
        <div style={{ marginTop: "8px", textAlign: "center" }}>
            {item("#ffeb3b", "strzelec")}
            {item("#42a5f5", "koledzy")}
            {item("#ef5350", "rywale")}
            {item("#ffa726", "bramkarz")}
        </div>
    );
}

export default function XGFromDatabase() {
    const [competitions, setCompetitions] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [matches, setMatches] = useState([]);
    const [situations, setSituations] = useState([]);

    const [selectedCompetition, setSelectedCompetition] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedMatch, setSelectedMatch] = useState("");
    const [selectedSituation, setSelectedSituation] = useState("");

    const [xgResult, setXgResult] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [selectedShotId, setSelectedShotId] = useState(null);
    const [shotDetail, setShotDetail] = useState(null);

    useEffect(() => {
        /* fetch(`${API}/competitions`)
            .then(res => res.json())
            .then(data => setCompetitions(data))
            .catch(err => console.error("Błąd pobierania rozgrywek:", err)); */

        fetch(`${API}/situations`)
            .then(res => res.json())
            .then(data => setSituations(data))
            .catch(err => console.error("Błąd pobierania sytuacji:", err));
    }, []);

    /* useEffect(() => {
        if (selectedCompetition) {
            fetch(`${API}/seasons?comp_id=${selectedCompetition}`)
                .then(res => res.json())
                .then(data => setSeasons(data));
        } else {
            setSeasons([]);
            setSelectedSeason("");
        }
    }, [selectedCompetition]);

    useEffect(() => {
        if (selectedSeason) {
            fetch(`${API}/matches?season_id=${selectedSeason}`)
                .then(res => res.json())
                .then(data => setMatches(data));
        } else {
            setMatches([]);
            setSelectedMatch("");
        }
    }, [selectedSeason]); */

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSelectedShotId(null);
        setShotDetail(null);

        const params = new URLSearchParams();
        if (selectedCompetition) params.append("competition", selectedCompetition);
        if (selectedSeason) params.append("season", selectedSeason);
        if (selectedMatch) params.append("match", selectedMatch);
        if (selectedSituation) params.append("situation", selectedSituation);

        try {
            const res = await fetch(`${API}/xg-data?${params}`);
            if (!res.ok) throw new Error(`Serwer zwrócił błąd ${res.status}`);
            const result = await res.json();
            setXgResult(result.data);
            setWarning(result.warning);
        } catch (err) {
            console.error("Błąd podczas pobierania danych xG:", err);
            setError("Nie udało się pobrać danych xG.");
            setXgResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShot = async (id) => {
        setSelectedShotId(id);
        try {
            const res = await fetch(`${API}/shot/${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error();
            setShotDetail(await res.json());
        } catch {
            setShotDetail(null);
        }
    };

    const selectStyle = {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: 'none',
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
    };

    const yesNo = (v) => (v ? "tak" : "nie");

    return (
        <div style={divStyle}>
            <h2 style={titleStyle}>Sprawdź xG z bazy danych</h2>

            <div style={{ maxWidth: '500px', margin: '40px auto', background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '15px' }}>
                <form onSubmit={handleSearch}>
                    { /* <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Rozgrywki</label>
                    * <select style={selectStyle} value={selectedCompetition}
                            onChange={(e) => setSelectedCompetition(e.target.value)}>
                        <option value="">-- Wybierz rozgrywki --</option>
                        {competitions.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Sezon</label>
                    <select style={selectStyle} value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            disabled={!selectedCompetition}>
                        <option value="">-- Wybierz sezon --</option>
                        {seasons.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mecz</label>
                    <select style={selectStyle} value={selectedMatch}
                            onChange={(e) => setSelectedMatch(e.target.value)}
                            disabled={!selectedSeason}>
                        <option value="">-- Wybierz mecz --</option>
                        {matches.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select> */}

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Sytuacja (Play Pattern)</label>
                    <select style={selectStyle} value={selectedSituation}
                            onChange={(e) => setSelectedSituation(e.target.value)}>
                        <option value="">-- Dowolna sytuacja --</option>
                        {situations.map(sit => (
                            <option key={sit.id} value={sit.id}>{sit.name}</option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            marginTop: '10px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27ae60'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2ecc71'}
                    >
                        {loading ? "Szukam..." : "Szukaj xG"}
                    </button>
                </form>

                {error && (
                    <p style={{ marginTop: '20px', color: '#ffcdd2' }}>{error}</p>
                )}

                {warning && (
                    <p style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(255,235,59,0.2)', fontSize: '14px', fontWeight: 'normal' }}>
                        ⚠ {warning}
                    </p>
                )}

                {xgResult && (
                    <div style={{
                        width: '100%',
                        maxWidth: '600px',
                        margin: '25px auto 0',
                        padding: '15px',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <h3 style={{ margin: 0 }}>Wyniki wyszukiwania</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                            Suma xG: {xgResult.total_xg}
                        </p>
                        <p style={{ margin: 0 }}>Liczba strzałów: {xgResult.shot_count}</p>
                    </div>
                )}
            </div>

            {xgResult && xgResult.shots.length > 0 && (
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 400px', maxWidth: '560px' }}>
                        <Pitch
                            shots={xgResult.shots}
                            selectedId={selectedShotId}
                            onSelect={handleSelectShot}
                            detail={shotDetail}
                        />
                        <Legend />
                        <p style={{ fontSize: '13px', fontWeight: 'normal', textAlign: 'center' }}>
                            Kliknij strzał, aby zobaczyć szczegóły i ustawienie zawodników.
                            Wielkość kółka = wartość xG.
                            {xgResult.shot_count > xgResult.shots_shown &&
                                ` Na boisku pokazano ${xgResult.shots_shown} strzałów o najwyższym xG z ${xgResult.shot_count}.`}
                        </p>
                    </div>

                    <div style={{ flex: '1 1 250px', maxWidth: '320px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px', textAlign: 'left' }}>
                        {shotDetail ? (
                            <>
                                <h3 style={{ marginTop: 0 }}>Wybrany strzał</h3>
                                <p style={{ fontSize: '32px', margin: '0 0 10px 0' }}>xG: {shotDetail.xg}</p>
                                <div style={{ fontWeight: 'normal', lineHeight: 1.7 }}>
                                    <div>Pozycja: {shotDetail.position}</div>
                                    <div>Sytuacja: {shotDetail.play_pattern}</div>
                                    <div>Typ: {shotDetail.shot_type}</div>
                                    <div>Część ciała: {shotDetail.body_part}</div>
                                    <div>Technika: {shotDetail.technique}</div>
                                    <div>Pod presją: {yesNo(shotDetail.under_pressure)}</div>
                                    <div>Z pierwszej piłki: {yesNo(shotDetail.first_time)}</div>
                                    <div>Rykoszet: {yesNo(shotDetail.deflected)}</div>
                                    <div>Wygrany pojedynek powietrzny: {yesNo(shotDetail.aerial_won)}</div>
                                    <div>Zawodników w freeze frame: {shotDetail.freeze_frame.length}</div>
                                </div>
                            </>
                        ) : (
                            <p style={{ fontWeight: 'normal' }}>Wybierz strzał na boisku.</p>
                        )}
                    </div>
                </div>
            )}

            {xgResult && xgResult.shots.length === 0 && (
                <p style={{ textAlign: 'center' }}>Brak strzałów dla wybranych filtrów.</p>
            )}
        </div>
    );
}
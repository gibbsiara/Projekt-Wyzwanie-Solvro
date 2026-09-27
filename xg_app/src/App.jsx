import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import StronaGlowna from "./components/StronaGlowna";
import XGFromDatabase from "./components/XGFromDatabase";
import XGUserData from "./components/XGUserData";

export default function App() {
    const [menuItems, setMenuItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/menu')
            .then(res => res.json())
            .then(data => setMenuItems(data))
            .catch(err => console.error("Błąd pobierania menu:", err));
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '10px 18px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#7c5cff',
                    fontWeight: 'bold',
                    backgroundColor: 'transparent',
                    border: '2px solid #7c5cff',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7c5cff';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#7c5cff';
                }}
            >
                ☰ Menu
            </button>

            <div
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 999,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease'
                }}
            />

            <div
                style={{
                    position: 'fixed', top: 90, left: 5, width: '260px', bottom: 90,
                    background: 'linear-gradient(160deg, #6a4bff 0%, #2f6fff 100%)',
                    color: 'white',
                    zIndex: 1000,
                    padding: '25px 20px',
                    boxSizing: 'border-box',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-120%)',
                    opacity: isOpen ? 1 : 0,
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px'
                }}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        Placeholder
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: '#fff',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {menuItems.map((item) => (
                        <li key={item.id} style={{ marginBottom: '15px' }}>
                            <button
                                onClick={() => {
                                    handleNavigation(item.path);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                    color: '#ffffff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    cursor: 'pointer',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                    transition: 'background-color 0.2s ease, transform 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.28)';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                {item.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <div style={{marginTop: '450px', textAlign: 'center'}}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>WAŻNE LINKI</h3>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <a
                        href="https://stadionowioprawcy.net/zamieszki-na-derbach-radomia-u15/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 18px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            backdropFilter: 'blur(5px)',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        <img
                            src="/icons/derby_radomia.png"
                            alt="Logo"
                            style={{ width: '24px', height: '24px' }}
                        />
                    </a>

                    <a
                        href="https://gol24.pl/derby-herbow-z-painta-kibice-ekstraklasy-nie-moga-doczekac-sie-jednego-meczu-radomiaka-z-wieczysta/ar/c2-19137999"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            marginLeft: "10px",
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 18px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            backdropFilter: 'blur(5px)',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        <img
                            src="/icons/derby_painta.png"
                            alt="Logo"
                            style={{ width: '24px', height: '24px' }}
                        />
                    </a>

                    <a
                        href="https://www.tetrycy.com.pl/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            marginLeft: "10px",
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 18px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            backdropFilter: 'blur(5px)',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        <img
                            src="/icons/tetrycy.jpg"
                            alt="Logo"
                            style={{ width: '24px', height: '24px' }}
                        />
                    </a>
                </div>

            </div>

            <main style={{ marginTop: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                <Routes>
                    <Route path="/" element={<StronaGlowna />} />
                    <Route path="/XGFromDatabase" element={<XGFromDatabase />} />
                    <Route path="/XGUserData" element={<XGUserData />} />
                </Routes>
            </main>
        </div>
    );
}
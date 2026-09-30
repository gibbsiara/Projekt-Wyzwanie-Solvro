import React, { useState, useEffect } from "react";
import {divStyle, titleStyle, paragraphTitleStyle, contentStyle, authorStyle} from "../styles";

export default function StronaGlowna() {
    const [data, setData] = useState(null);

    const dataLoadingString = "Ładowanie danych";

    useEffect(() => {
        fetch('http://localhost:8000/api/home-data')
            .then(res => res.json())
            .then(dane => setData(dane));
    }, []);

    return (
        <div style={divStyle}>
            <h2 style={titleStyle}>O projekcie</h2>
            <p style={paragraphTitleStyle}>Czym jest xG?</p>
            {data ? (<p style={contentStyle}>{data.about_xg}</p>) : (
                <p>{dataLoadingString}</p>
            )}

            <p style={paragraphTitleStyle}>O zbiorze danych</p>
            {data ? (<p style={contentStyle}>{data.about_dataset}</p>) : (<p>{dataLoadingString}</p>)}

            <p style={paragraphTitleStyle}>O modelu</p>
            {data ? (<p style={contentStyle}>{data.about_model}</p>) : (<p>{dataLoadingString}</p>)}

            <p style={paragraphTitleStyle}>Autorzy</p>
            <div style={{
                marginTop: '50px',
                display: 'grid',
                gridTemplateColumns: '200px auto 200px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px 38px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    {data ? (<span style={authorStyle}>{data.author1}</span>) : (<span>{dataLoadingString}</span>)}
                </div>

                <span style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
    </span>

                <div style={{ textAlign: 'center' }}>
                    {data ? (<span style={authorStyle}>{data.author2}</span>) : (<span>{dataLoadingString}</span>)}
                </div>

                <a
                    href="https://www.linkedin.com/in/pawe%C5%82-szuber-1a372b3b6/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <img
                        src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg"
                        alt="Logo"
                        style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
                    />
                    <span>Paweł Szuber</span>
                </a>

                <span style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
        LINKEDIN
    </span>

                <a
                    href="https://www.linkedin.com/in/wiktor-krocz-2286693ba/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <img
                        src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg"
                        alt="Logo"
                        style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
                    />
                    <span>Wiktor Krocz</span>
                </a>

                <a
                    href="https://github.com/gibbsiara"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <img
                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                        alt="Logo"
                        style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
                    />
                    <span>gibbsiara</span>
                </a>

                <span style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
        GITHUB
    </span>

                <a
                    href="https://github.com/Kukann25"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <img
                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                        alt="Logo"
                        style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
                    />
                    <span>Kukann25</span>
                </a>
            </div>
        </div>
    );
}
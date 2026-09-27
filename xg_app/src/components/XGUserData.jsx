import React, { useState, useEffect } from "react";
import { divStyle, titleStyle } from "../styles";

export default function XGUserData() {
    const [userdata, setUserData] = useState(null);
    const [inputText, setInputText] = useState("");
    const [responseMessage, setResponseMessage] = useState("");

    useEffect(() => {
        fetch('http://localhost:8000/api/user_xg_data')
            .then(res => res.json())
            .then(dane => setUserData(dane));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!inputText.trim()) return;

        try {
            const res = await fetch('http://localhost:8000/api/send-data', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: inputText})
            });

            const result = await res.json();
            setResponseMessage(result.reply);
            setInputText("");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={divStyle}>
            <h2 style={titleStyle}>Wylicz xG z własnych danych</h2>
            {<p>placeholder</p>}
            <form onSubmit={handleSubmit}>
                <p>Mess</p>
                <div>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Wpisz cokolwiek..."
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: 'none',
                            outline: 'none',
                            width: '200px'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Wyślij
                    </button>
                </div>
                <p style={{ marginTop: '12px', color: '#2ecc71', fontSize: '14px' }}>{responseMessage}</p>
            </form>
        </div>
    );
}
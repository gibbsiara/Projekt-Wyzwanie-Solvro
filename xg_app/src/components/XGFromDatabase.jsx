import React, { useState, useEffect } from "react";
import { divStyle, titleStyle } from "../styles";

export default function XGFromDatabase() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/settings-data')
            .then(res => res.json())
            .then(dane => setData(dane));
    }, []);

    return (
        <div style={divStyle}>
            <h2 style={titleStyle}>Wylicz xG z bazy danych</h2>
            {<p>placeholder</p>}
        </div>
    );
}
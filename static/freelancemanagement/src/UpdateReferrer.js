import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";

export default function UpdateReferrer({ goBack }) {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const r = await invoke("listReferrers");
      setList(r || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => load(), []);

  return (
    <div className="container">
      <h2>Referrer List</h2>

      {list.map(r => (
        <div key={r.id} className="record-box">
          <h4>{r.name}</h4>
          <p>Points: {r.points}</p>
        </div>
      ))}

      <button className="btn_close" onClick={goBack}>Close</button>
    </div>
  );
}

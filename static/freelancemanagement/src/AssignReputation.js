import React, { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";

export default function UpdateReputation({ goBack }) {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const r = await invoke("listReputation");
      setList(r || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => load(), []);

  return (
    <div className="container">
      <h2>Reputation Records</h2>

      {list.map(item => (
        <div key={item.id} className="record-box">
          <h4>ID: {item.freelancerId}</h4>
          <p>Score: {item.score}</p>
          <p>{item.note}</p>
        </div>
      ))}

      <button className="btn_close" onClick={goBack}>Close</button>
    </div>
  );
}

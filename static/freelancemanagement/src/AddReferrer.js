import React, { useState } from "react";
import { invoke } from "@forge/bridge";

export default function AddReferrer({ goBack }) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");

  const submit = async () => {
    try {
      await invoke("addReferrer", { name, points });
      alert("Referrer added");
      goBack();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container">
      <h2>Add Referrer</h2>

      <input className="inputbox" placeholder="Referrer Name" value={name} onChange={e => setName(e.target.value)} />
      <input className="inputbox" placeholder="Points" value={points} onChange={e => setPoints(e.target.value)} />

      <button className="btn_resume" onClick={submit}>Submit</button>
      <button className="btn_close" onClick={goBack}>Close</button>
    </div>
  );
}

import React, { useState } from "react";
import { invoke } from "@forge/bridge";

export default function AddReputation({ goBack }) {
  const [freelancerId, setFreelancerId] = useState("");
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    try {
      await invoke("addReputation", { freelancerId, score, note });
      alert("Reputation added");
      goBack();
    } catch (e) {
      console.error(e);
      alert("Failed");
    }
  };

  return (
    <div className="container">
      <h2>Add Reputation</h2>

      <input className="inputbox" placeholder="Freelancer ID" value={freelancerId} onChange={e => setFreelancerId(e.target.value)} />
      <input className="inputbox" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} />
      <textarea className="inputbox" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />

      <button className="btn_resume" onClick={submit}>Submit</button>
      <button className="btn_close" onClick={goBack}>Close</button>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./ReputationCatalog.css";

export default function ReputationCatalog({ goBackRC }) {
  const [posRange, setPosRange] = useState({ from: 1, to: 10 });
  const [negRange, setNegRange] = useState({ from: 1, to: 10 });

  const [positiveReps, setPositiveReps] = useState([]);
  const [negativeReps, setNegativeReps] = useState([]);

  // -------------------------
  // Load catalog from database on mount
  // -------------------------
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await invoke("reputationcatalog");
        if (res.success && res.catalog) {
          // Separate positive and negative from fetched data
          const pos = res.catalog
            .filter(r => r.positiveId)
            .map(r => ({
              id: r.positiveId,
              description: r.positiveDefinition || "",
              value: r.positiveValue || "",
            }));

          const neg = res.catalog
            .filter(r => r.negativeId)
            .map(r => ({
              id: r.negativeId,
              description: r.negativeDefinition || "",
              value: r.negativeValue || "",
            }));

          setPositiveReps(pos.length ? pos : []);
          setNegativeReps(neg.length ? neg : []);

          // Set ranges if available
          if (res.catalog.length) {
            const posRangeLower = Math.min(...pos.map(r => Number(r.value) || 1));
            const posRangeUpper = Math.max(...pos.map(r => Number(r.value) || 10));
            setPosRange({ from: posRangeLower || 1, to: posRangeUpper || 10 });

            const negRangeLower = Math.min(...neg.map(r => Number(r.value) || 1));
            const negRangeUpper = Math.max(...neg.map(r => Number(r.value) || 10));
            setNegRange({ from: negRangeLower || 1, to: negRangeUpper || 10 });
          }
        }
      } catch (err) {
        console.error("Failed to load reputation catalog:", err);
      }
    };

    loadCatalog();
  }, []);

  // -------------------------
  // Add / Remove reputation items
  // -------------------------
  const addPositive = () =>
    setPositiveReps(prev => [...prev, { id: prev.length + 1, description: "", value: "" }]);
  const removePositive = () => setPositiveReps(prev => prev.slice(0, -1));
  const addNegative = () =>
    setNegativeReps(prev => [...prev, { id: prev.length + 1, description: "", value: "" }]);
  const removeNegative = () => setNegativeReps(prev => prev.slice(0, -1));

  // -------------------------
  // Update functions
  // -------------------------
  const updatePositive = (idx, key, val) =>
    setPositiveReps(prev => prev.map((rep, i) => (i === idx ? { ...rep, [key]: val } : rep)));
  const updateNegative = (idx, key, val) =>
    setNegativeReps(prev => prev.map((rep, i) => (i === idx ? { ...rep, [key]: val } : rep)));

  // -------------------------
  // Submit Catalog
  // -------------------------
  const submit = async () => {
    const payload = {
      positiveReps,
      negativeReps,
      posRange,
      negRange,
    };

    try {
      await invoke("reputationcatalogsave", payload); // save resolver
      alert("Reputation catalog saved successfully!");
      if (goBackRC) goBackRC();
    } catch (err) {
      console.error(err);
      alert("Failed to save catalog");
    }
  };

  return (
    <div className="container">
      <h2>Reputation Catalog</h2>

      {/* ---------------- POSITIVE REPUTATION ---------------- */}
      <div className="rep-section">
        <h3>Positive Reputation Range</h3>
        <input
          type="number"
          value={posRange.from}
          onChange={e => setPosRange({ ...posRange, from: e.target.value })}
          placeholder="From"
        />
        <input
          type="number"
          value={posRange.to}
          onChange={e => setPosRange({ ...posRange, to: e.target.value })}
          placeholder="To"
        />

        {positiveReps.map((rep, idx) => (
          <div key={rep.id} className="rep-item">
            <span>{rep.id}.</span>
            <input
              type="text"
              placeholder="Description"
              value={rep.description}
              onChange={e => updatePositive(idx, "description", e.target.value)}
            />
            <input
              type="number"
              placeholder="Value"
              value={rep.value}
              onChange={e => updatePositive(idx, "value", e.target.value)}
            />
          </div>
        ))}

        <button onClick={addPositive}>+ Add Positive</button>
        <button onClick={removePositive}>- Remove Positive</button>
      </div>

      {/* ---------------- NEGATIVE REPUTATION ---------------- */}
      <div className="rep-section">
        <h3>Negative Reputation Range</h3>
        <input
          type="number"
          value={negRange.from}
          onChange={e => setNegRange({ ...negRange, from: e.target.value })}
          placeholder="From"
        />
        <input
          type="number"
          value={negRange.to}
          onChange={e => setNegRange({ ...negRange, to: e.target.value })}
          placeholder="To"
        />

        {negativeReps.map((rep, idx) => (
          <div key={rep.id} className="rep-item">
            <span>{rep.id}.</span>
            <input
              type="text"
              placeholder="Description"
              value={rep.description}
              onChange={e => updateNegative(idx, "description", e.target.value)}
            />
            <input
              type="number"
              placeholder="Value"
              value={rep.value}
              onChange={e => updateNegative(idx, "value", e.target.value)}
            />
          </div>
        ))}

        <button onClick={addNegative}>+ Add Negative</button>
        <button onClick={removeNegative}>- Remove Negative</button>
      </div>

      {/* ---------------- SUBMIT ---------------- */}
      <div className="submit-div">
        <button className="btn_submit" onClick={submit}>
          Submit Catalog
        </button>
        {goBackRC && (
          <button className="btn_close" onClick={goBackRC}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

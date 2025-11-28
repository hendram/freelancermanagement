import React, { useState } from "react";
import { invoke } from "@forge/bridge";

export default function AddReputation({ goBack, freelancers }) {
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(10);

  const [positiveCatalog, setPositiveCatalog] = useState([
    { id: 1, definition: "", value: 0 },
  ]);
  const [negativeCatalog, setNegativeCatalog] = useState([
    { id: 1, definition: "", value: 0 },
  ]);

  const [selectedFreelancer, setSelectedFreelancer] = useState("");
  const [assignedPositive, setAssignedPositive] = useState([]);
  const [assignedNegative, setAssignedNegative] = useState([]);

  // ---------------------------
  // Catalog manipulation
  // ---------------------------
  const addCatalog = (type) => {
    if (type === "positive") {
      setPositiveCatalog((prev) => [
        ...prev,
        { id: prev.length + 1, definition: "", value: 0 },
      ]);
    } else {
      setNegativeCatalog((prev) => [
        ...prev,
        { id: prev.length + 1, definition: "", value: 0 },
      ]);
    }
  };

  const removeCatalog = (type, id) => {
    if (type === "positive") {
      setPositiveCatalog((prev) => prev.filter((p) => p.id !== id));
    } else {
      setNegativeCatalog((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const updateCatalog = (type, id, key, val) => {
    const updater = (arr) =>
      arr.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    if (type === "positive") setPositiveCatalog(updater(positiveCatalog));
    else setNegativeCatalog(updater(negativeCatalog));
  };

  // ---------------------------
  // Assign reputation to freelancer
  // ---------------------------
  const assignReputation = (type, catalog) => {
    if (!selectedFreelancer) return alert("Select a freelancer first");
    const value = Number(catalog.value);
    if (value < rangeFrom || value > rangeTo) {
      return alert(`Value must be within range ${rangeFrom}-${rangeTo}`);
    }

    const assignedItem = { ...catalog, freelancer: selectedFreelancer };

    if (type === "positive") {
      setAssignedPositive((prev) => [...prev, assignedItem]);
    } else {
      setAssignedNegative((prev) => [...prev, assignedItem]);
    }
  };

  // ---------------------------
  // Submit all data
  // ---------------------------
  const submitAll = async () => {
    try {
      const payload = {
        range: { from: rangeFrom, to: rangeTo },
        positiveCatalog,
        negativeCatalog,
        assignedPositive,
        assignedNegative,
      };
      await invoke("addReputation", payload);
      alert("Reputation submitted successfully!");
      goBack();
    } catch (err) {
      console.error(err);
      alert("Failed to submit reputation");
    }
  };

  return (
    <div className="container">
      <h2>Add Reputation</h2>

      {/* ---------------- Range Inputs ---------------- */}
      <div className="range-inputs">
        <label>
          Range From:
          <input
            type="number"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(Number(e.target.value))}
          />
        </label>
        <label>
          Range To:
          <input
            type="number"
            value={rangeTo}
            onChange={(e) => setRangeTo(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="reputation-panels" style={{ display: "flex", gap: "2rem" }}>
        {/* ---------------- Positive Catalog ---------------- */}
        <div className="catalog">
          <h3>Positive Reputation</h3>
          {positiveCatalog.map((p) => (
            <div key={p.id} className="catalog-item">
              <span>{p.id}.</span>
              <input
                type="text"
                placeholder="Definition"
                value={p.definition}
                onChange={(e) => updateCatalog("positive", p.id, "definition", e.target.value)}
              />
              <input
                type="number"
                placeholder="Value"
                value={p.value}
                onChange={(e) => updateCatalog("positive", p.id, "value", Number(e.target.value))}
              />
              <button onClick={() => addCatalog("positive")}>+</button>
              <button onClick={() => removeCatalog("positive", p.id)}>-</button>
              <button onClick={() => assignReputation("positive", p)}>Assign</button>
            </div>
          ))}
        </div>

        {/* ---------------- Negative Catalog ---------------- */}
        <div className="catalog">
          <h3>Negative Reputation</h3>
          {negativeCatalog.map((n) => (
            <div key={n.id} className="catalog-item">
              <span>{n.id}.</span>
              <input
                type="text"
                placeholder="Definition"
                value={n.definition}
                onChange={(e) => updateCatalog("negative", n.id, "definition", e.target.value)}
              />
              <input
                type="number"
                placeholder="Value"
                value={n.value}
                onChange={(e) => updateCatalog("negative", n.id, "value", Number(e.target.value))}
              />
              <button onClick={() => addCatalog("negative")}>+</button>
              <button onClick={() => removeCatalog("negative", n.id)}>-</button>
              <button onClick={() => assignReputation("negative", n)}>Assign</button>
            </div>
          ))}
        </div>

        {/* ---------------- Freelancer Selection ---------------- */}
        <div className="freelancer-panel">
          <h3>Assign to Freelancer</h3>
          <select
            value={selectedFreelancer}
            onChange={(e) => setSelectedFreelancer(e.target.value)}
          >
            <option value="">-- Select Freelancer --</option>
            {freelancers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <h4>Assigned Positive</h4>
          <ul>
            {assignedPositive.map((p, idx) => (
              <li key={idx}>
                {p.definition} ({p.value})
              </li>
            ))}
          </ul>

          <h4>Assigned Negative</h4>
          <ul>
            {assignedNegative.map((n, idx) => (
              <li key={idx}>
                {n.definition} ({n.value})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={submitAll}>Submit All</button>
        <button onClick={goBack}>Close</button>
      </div>
    </div>
  );
}

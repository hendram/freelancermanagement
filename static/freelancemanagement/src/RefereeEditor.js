// RefereeEditor.js
import React, { useState, useRef, useEffect } from "react";
import "./RefereeEditor.css";

export default function RefereeEditor({ initialReferees = [], onChange }) {
  const [referees, setReferees] = useState(initialReferees);
  const inputRef = useRef(null);

  useEffect(() => {
    setReferees(initialReferees); // 🔥 sync when invitation changes
  }, [initialReferees]);

  useEffect(() => {
    if (onChange) onChange(referees);
  }, [referees]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();

      const [first_name, ...rest] = e.target.value.trim().split(" ");
      const last_name = rest.join(" ");

      setReferees([
        ...referees,
        { first_name, last_name }
      ]);

      e.target.value = "";
    }
  };

  const handleRemove = (idx) => {
    setReferees(referees.filter((_, i) => i !== idx));
  };

  return (
    <div className="referee-editor-container">
      {referees.map((r, idx) => (
        <span
          key={idx}
          className="referee-tag"
          onClick={() => handleRemove(idx)}
        >
          {r.first_name} {r.last_name} &times;
        </span>
      ))}

      <input
        className="referee-input"
        type="text"
        placeholder="Type name and press Enter"
        ref={inputRef}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

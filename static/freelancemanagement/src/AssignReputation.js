import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AssignReputation.css";

export default function AssignReputation({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // LOAD REPUTATION FROM BACKEND (getreputation)
  // -------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const res = await invoke("getreputation");

        if (res.success && res.list) {
          const mapped = res.list.map(r => ({
            resume_id: r.resume_id,
            fullName: r.fullName,
            reputation: r.total_reputation_value || 0,
            posInput: "",
            negInput: ""
          }));

          setRows(mapped);
        }
      } catch (err) {
        console.error("Load reputation failed:", err);
      }

      setLoading(false);
    };

    load();
  }, []);

  // -------------------------------------------------------
  // UPDATE INPUT VALUES
  // -------------------------------------------------------
  const updateInput = (idx, field, value) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  // -------------------------------------------------------
  // RESET INPUTS
  // -------------------------------------------------------
  const reset = () => {
    setRows(prev =>
      prev.map(row => ({
        ...row,
        posInput: "",
        negInput: ""
      }))
    );
  };

  // -------------------------------------------------------
  // SUBMIT TO BACKEND
  // -------------------------------------------------------
  const submit = async () => {
    try {
      for (const r of rows) {
        if (r.posInput === "" && r.negInput === "") {
          continue; // ignore if nothing entered
        }

        await invoke("assignreputation", {
          resume_id: r.resume_id,
          fullName: r.fullName,
          posId: r.posInput === "" ? null : Number(r.posInput),
          negId: r.negInput === "" ? null : Number(r.negInput)
        });
      }

      alert("Reputation updated successfully!");
      if (goBackAR) goBackAR();
    } catch (err) {
      console.error("assignreputation failed:", err);
      alert("Error assigning reputation.");
    }
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  if (loading) return <div>Loading...</div>;

  return (
    <div className="assign-container">
      <h2>Assign Reputation</h2>

      <table className="assign-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Total Reputation</th>
            <th>+ Positive ID</th>
            <th>- Negative ID</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.resume_id}>
              <td>{r.fullName}</td>
              <td>{r.reputation}</td>

              <td>
                <input
                  type="number"
                  value={r.posInput}
                  onChange={e =>
                    updateInput(idx, "posInput", e.target.value)
                  }
                  placeholder="Positive ID"
                />
              </td>

              <td>
                <input
                  type="number"
                  value={r.negInput}
                  onChange={e =>
                    updateInput(idx, "negInput", e.target.value)
                  }
                  placeholder="Negative ID"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="assign-actions">
        <button className="btn-submit" onClick={submit}>Submit</button>
        <button className="btn-reset" onClick={reset}>Reset</button>
        {goBackAR && (
          <button className="btn-close" onClick={goBackAR}>Close</button>
        )}
      </div>
    </div>
  );
}

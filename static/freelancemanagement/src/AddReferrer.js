import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddReferrer.css";

export default function AddReferrer({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await invoke("getuserstories"); // contains fullName, referrers[], userStories[]
        if (res.success && res.list) {
          setRows(res.list.map(r => ({
            resume_id: r.resume_id,
            fullName: r.fullName,
            referrers: r.referrers.length > 0
              ? r.referrers.map(ref => ({
                  referrer: ref.referrer || "",
                  userStories: ref.userStories || [],
                  isFixed: !!ref.referrer // cannot edit if already exists
                }))
              : [{ referrer: "", userStories: [], isFixed: false }],
            userStoriesOptions: r.userStories || [] // select options
          })));
        }
        // Flatten all user stories for select dropdown (optional)
        const allStories = res.list.flatMap(r => r.userStories || []);
        setStories(allStories);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // -------------------------------
  // UPDATE REFERRER OR USER STORIES
  // -------------------------------
  const updateInput = (rowIdx, refIdx, field, value) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === rowIdx
          ? {
              ...row,
              referrers: row.referrers.map((r, j) =>
                j === refIdx ? { ...r, [field]: value } : r
              )
            }
          : row
      )
    );
  };

  // -------------------------------
  // ADD NEW REFERRER ROW
  // -------------------------------
  const addReferrerRow = (rowIdx) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === rowIdx
          ? {
              ...row,
              referrers: [...row.referrers, { referrer: "", userStories: [], isFixed: false }]
            }
          : row
      )
    );
  };

  // -------------------------------
  // RESET & CANCEL
  // -------------------------------
  const reset = () => {
    setRows(prev =>
      prev.map(row => ({
        ...row,
        referrers: row.referrers.filter(r => r.isFixed) // keep only fixed
      }))
    );
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const submit = async () => {
    try {
      for (const r of rows) {
        for (const ref of r.referrers) {
          if (!ref.referrer || !ref.userStories.length) continue; // ignore invalid
          await invoke("addReferrer", {
            resume_id: r.resume_id,
            referrer: ref.referrer,
            userStories: ref.userStories
          });
        }
      }
      alert("Referrers assigned successfully!");
      if (goBackAR) goBackAR();
    } catch (err) {
      console.error("addReferrer failed:", err);
      alert("Error assigning referrers.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="addreferrer-container">
      <h2>Add Referrer</h2>
      <table className="addreferrer-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Referrer</th>
            <th>User Story</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) =>
            row.referrers.map((ref, refIdx) => (
              <tr key={`${row.resume_id}-${refIdx}`}>
                {refIdx === 0 && <td rowSpan={row.referrers.length}>{row.fullName}</td>}

                <td>
                  {ref.isFixed ? (
                    <span>{ref.referrer}</span>
                  ) : (
                    <select
                      value={ref.referrer}
                      onChange={e => updateInput(rowIdx, refIdx, "referrer", e.target.value)}
                    >
                      <option value="">Select Referrer</option>
                      {rows.filter(x => x.resume_id !== row.resume_id).map(x => (
                        <option key={x.resume_id} value={x.fullName}>{x.fullName}</option>
                      ))}
                    </select>
                  )}
                </td>

                <td>
                  {ref.isFixed ? (
                    <span>{ref.userStories.join(", ")}</span>
                  ) : (
                    <select
                      multiple
                      value={ref.userStories}
                      onChange={e =>
                        updateInput(rowIdx, refIdx, "userStories",
                          Array.from(e.target.selectedOptions, o => o.value))
                      }
                    >
                      {row.userStoriesOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.summary}</option>
                      ))}
                    </select>
                  )}
                </td>

                <td>
                  {!ref.isFixed && refIdx === row.referrers.length - 1 && (
                    <button type="button" onClick={() => addReferrerRow(rowIdx)}>+</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="addreferrer-actions">
        <button className="btn-submit" onClick={submit}>Submit</button>
        <button className="btn-reset" onClick={reset}>Cancel</button>
        {goBackAR && <button className="btn-close" onClick={goBackAR}>Close</button>}
      </div>
    </div>
  );
}

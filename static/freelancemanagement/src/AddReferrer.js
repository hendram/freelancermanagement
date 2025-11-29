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
        // Main data (resume + existing referrer + story)
        const res = await invoke("getuserstories");
        if (res.success && res.list) {
          setRows(res.list.map(r => ({
            resume_id: r.resume_id,
            fullName: r.fullName,
            referrers: r.referrers || [{ referrer: "", userStory: "" }] // array of sets
          })));
        }

        // Jira stories
        const storiesRes = await invoke("getUserStoriesList");
        if (storiesRes.success && storiesRes.list) {
          setStories(storiesRes.list);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // -------------------------------
  // UPDATE REFERRER OR USER STORY
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
  // ADD ANOTHER REFERRER
  // -------------------------------
  const addReferrerRow = (rowIdx) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === rowIdx
          ? { ...row, referrers: [...row.referrers, { referrer: "", userStory: "" }] }
          : row
      )
    );
  };

  // -------------------------------
  // RESET
  // -------------------------------
  const reset = () => {
    setRows(prev =>
      prev.map(row => ({
        ...row,
        referrers: [{ referrer: "", userStory: "" }]
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
          if (!ref.referrer && !ref.userStory) continue;

          await invoke("addReferrer", {
            resume_id: r.resume_id,
            referrer: ref.referrer,
            userStory: ref.userStory
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
          {rows.map((row, rowIdx) => (
            row.referrers.map((ref, refIdx) => (
              <tr key={`${row.resume_id}-${refIdx}`}>
                {refIdx === 0 ? (
                  <td rowSpan={row.referrers.length}>{row.fullName}</td>
                ) : null}

                <td>
                  <select
                    value={ref.referrer}
                    onChange={e => updateInput(rowIdx, refIdx, "referrer", e.target.value)}
                  >
                    <option value="">Select Referrer</option>
                    {rows
                      .filter(x => x.resume_id !== row.resume_id)
                      .map(x => (
                        <option key={x.resume_id} value={x.fullName}>{x.fullName}</option>
                      ))}
                  </select>
                </td>

                <td>
                  <select
                    value={ref.userStory}
                    onChange={e => updateInput(rowIdx, refIdx, "userStory", e.target.value)}
                  >
                    <option value="">Select User Story</option>
                    {stories.map(s => (
                      <option key={s.id} value={s.id}>{s.summary}</option>
                    ))}
                  </select>
                </td>

                {/* + button only on last referrer row */}
                <td>
                  {refIdx === row.referrers.length - 1 && (
                    <button type="button" onClick={() => addReferrerRow(rowIdx)}>+</button>
                  )}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>

      <div className="addreferrer-actions">
        <button className="btn-submit" onClick={submit}>Submit</button>
        <button className="btn-reset" onClick={reset}>Reset</button>
        {goBackAR && <button className="btn-close" onClick={goBackAR}>Close</button>}
      </div>
    </div>
  );
}

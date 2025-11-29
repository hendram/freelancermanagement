import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddReferrer.css";

export default function AddReferrer({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await invoke("getuserstories");

        if (!res.success || !res.list) {
          setLoading(false);
          return;
        }

        setRows(
          res.list.map(r => ({
            resume_id: r.resume_id,
            fullName: r.fullName,

            referrers: r.referrers.length
              ? r.referrers.map(ref => ({
                  referrer: `${ref.referrer_first_name || ""} ${
                    ref.referrer_last_name || ""
                  }`.trim(),
                  userStory: ref.userStories?.[0] || "", // fixed: only 1 story per row
                  isFixed: ref.isFixed === true,
                }))
              : [
                  {
                    referrer: "",
                    userStory: "",
                    isFixed: false,
                  }
                ],

            referrerOptions: r.availableReferrers,
            storyOptions: r.availableStories
          }))
        );
      } catch (err) {
        console.error("Failed to load data:", err);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // -------------------------------
  // UPDATE SINGLE FIELD
  // -------------------------------
  const updateInput = (rowIdx, refIdx, field, value) => {
    setRows(prev =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              referrers: row.referrers.map((r, j) =>
                j === refIdx ? { ...r, [field]: value } : r
              ),
            }
      )
    );
  };

  // -------------------------------
  // ADD NEW REFERRER ROW
  // -------------------------------
  const addReferrerRow = rowIdx => {
    setRows(prev =>
      prev.map((row, i) =>
        i === rowIdx
          ? {
              ...row,
              referrers: [
                ...row.referrers,
                { referrer: "", userStory: "", isFixed: false },
              ],
            }
          : row
      )
    );
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const submit = async () => {
    try {
      for (const r of rows) {
        for (const ref of r.referrers) {
          if (!ref.isFixed && ref.referrer && ref.userStory) {
            await invoke("addreferrer", {
              resume_id: r.resume_id,
              referrer: ref.referrer,
              userStories: [ref.userStory], // now single item
            });
          }
        }
      }

      alert("Referrers assigned successfully!");
      goBackAR && goBackAR();
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
                {refIdx === 0 && (
                  <td rowSpan={row.referrers.length}>{row.fullName}</td>
                )}

                {/* ---------------- REFERRER ---------------- */}
                <td>
                  {ref.isFixed ? (
                    <span>{ref.referrer}</span>
                  ) : (
                    <select
                      value={ref.referrer}
                      onChange={e =>
                        updateInput(rowIdx, refIdx, "referrer", e.target.value)
                      }
                    >
                      <option value="">Select Referrer</option>
                      {row.referrerOptions
                        .filter(x => x.resume_id !== row.resume_id)
                        .map(opt => (
                          <option key={opt.resume_id} value={opt.fullName}>
                            {opt.fullName}
                          </option>
                        ))}
                    </select>
                  )}
                </td>

                {/* ---------------- USER STORY (single select) ---------------- */}
                <td>
                  {ref.isFixed ? (
                    <span>{ref.userStory}</span>
                  ) : (
                    <select
                      value={ref.userStory}
                      onChange={e =>
                        updateInput(rowIdx, refIdx, "userStory", e.target.value)
                      }
                    >
                      <option value="">Select Story</option>
                      {row.storyOptions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.summary}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* ---------------- ADD BUTTON ---------------- */}
                <td>
                  {!ref.isFixed &&
                    refIdx === row.referrers.length - 1 && (
                      <button onClick={() => addReferrerRow(rowIdx)}>+</button>
                    )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="addreferrer-actions">
        <button onClick={submit}>Submit</button>
        <button onClick={goBackAR}>Close</button>
      </div>
    </div>
  );
}

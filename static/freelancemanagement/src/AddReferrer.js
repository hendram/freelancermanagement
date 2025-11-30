import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddReferrer.css";

export default function AddReferrer({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: build fullname from parts
  const fullnameFromParts = (first, last) => `${(first||"").trim()} ${(last||"").trim()}`.trim();

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await invoke("getuserstories");
        if (!res || !res.success || !Array.isArray(res.list)) {
          setLoading(false);
          return;
        }

        const mapped = res.list.map(r => {
          // source of select options
          const referrerOptions = Array.isArray(r.availableReferrers) ? r.availableReferrers : (r.referrerOptions || []);
          const storyOptions = Array.isArray(r.availableStories) ? r.availableStories : (r.storyOptions || []);

          // build an expanded list of display rows (one UI row per saved story)
          const expanded = [];

          if (Array.isArray(r.referrers) && r.referrers.length > 0) {
            for (const ref of r.referrers) {
              // tolerate two backend formats:
              //  - { referrer: "Full Name", userStories: [...] }
              //  - { referrer_first_name, referrer_last_name, userStories: [...] }
              const fullRefName =
                typeof ref.referrer === "string" && ref.referrer.trim()
                  ? ref.referrer.trim()
                  : fullnameFromParts(ref.referrer_first_name, ref.referrer_last_name);

              const userStoriesArr = Array.isArray(ref.userStories) ? ref.userStories : (ref.userStories ? [ref.userStories] : []);

              if (userStoriesArr.length === 0) {
                // saved row with no story (unlikely) — show one fixed empty story row
                expanded.push({
                  referrer: fullRefName || "",
                  userStory: "",
                  isFixed: !!fullRefName
                });
              } else {
                // push first row with referrer displayed
                expanded.push({
                  referrer: fullRefName || "",
                  userStory: userStoriesArr[0],
                  isFixed: !!fullRefName
                });
                // push remaining rows with blank referrer cell
                for (let i = 1; i < userStoriesArr.length; i++) {
                  expanded.push({
                    referrer: "", // blank for subsequent story rows
                    userStory: userStoriesArr[i],
                    isFixed: true
                  });
                }
              }
            }
            // After listing existing fixed rows, always add one editable empty row so user can add
            expanded.push({ referrer: "", userStory: "", isFixed: false });
          } else {
            // no existing referrers => start with one editable empty row
            expanded.push({ referrer: "", userStory: "", isFixed: false });
          }

          return {
            resume_id: r.resume_id,
            fullName: r.fullName,
            referrers: expanded,
            referrerOptions,
            storyOptions
          };
        });

        setRows(mapped);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
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
              )
            }
      )
    );
  };

  // -------------------------------
  // ADD NEW EDITABLE ROW (append one)
  // -------------------------------
  const addReferrerRow = (rowIdx) => {
    setRows(prev =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              referrers: [...row.referrers, { referrer: "", userStory: "", isFixed: false }]
            }
      )
    );
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const submit = async () => {
    try {
      for (const r of rows) {
        // group stories by referrer name for this freelancer
        const grouped = {};
        for (const ref of r.referrers) {
          // ignore fixed rows (they're already saved) and empty rows
          if (ref.isFixed) continue;
          const refName = (ref.referrer || "").trim();
          const story = ref.userStory || "";
          if (!refName || !story) continue;
          if (!grouped[refName]) grouped[refName] = [];
          grouped[refName].push(story);
        }

        for (const refName of Object.keys(grouped)) {
          await invoke("addreferrer", {
            resume_id: r.resume_id,
            referrer: refName,
            userStories: grouped[refName]
          });
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

                {/* Referrer column */}
                <td>
                  {ref.isFixed ? (
                    // fixed rows show plain text (first of group shows the name; following rows blank)
                    <span>{ref.referrer}</span>
                  ) : (
                    // editable select — options come from row.referrerOptions
                    <select
                      value={ref.referrer}
                      onChange={e => updateInput(rowIdx, refIdx, "referrer", e.target.value)}
                    >
                      <option value="">Select Referrer</option>
                      {Array.isArray(row.referrerOptions) &&
                        row.referrerOptions
                          .filter(opt => opt.resume_id !== row.resume_id)
                          .map(opt => (
                            <option key={opt.resume_id} value={opt.fullName}>
                              {opt.fullName}
                            </option>
                          ))}
                    </select>
                  )}
                </td>

                {/* User story column (single select) */}
                <td>
                  {ref.isFixed ? (
                    <span>{Array.isArray(ref.userStory) ? ref.userStory.join(", ") : ref.userStory}</span>
                  ) : (
                    <select
                      value={ref.userStory}
                      onChange={e => updateInput(rowIdx, refIdx, "userStory", e.target.value)}
                    >
                      <option value="">Select Story</option>
                      {Array.isArray(row.storyOptions) &&
                        row.storyOptions.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.summary}
                          </option>
                        ))}
                    </select>
                  )}
                </td>

                {/* + button */}
                <td>
                  {/* Always show + on the last row for that resume */
                    refIdx === row.referrers.length - 1 && (
                    <button type="button" onClick={() => addReferrerRow(rowIdx)}>+</button>
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

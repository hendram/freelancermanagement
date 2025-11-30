import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddReferrer.css";

export default function AddReferrer({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fullnameFromParts = (first, last) => `${(first || "").trim()} ${(last || "").trim()}`.trim();

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await invoke("getuserstories");
        console.log("res", res);

        if (!res || !res.success || !Array.isArray(res.list)) {
          setLoading(false);
          return;
        }

        const mapped = res.list.map(r => {
          const referrerOptions = Array.isArray(r.availableReferrers) ? r.availableReferrers : [];
          const storyOptions = Array.isArray(r.availableStories) ? r.availableStories : [];
          const blocks = [];

          // Merge stories by referrer to avoid duplicates
          const grouped = {};
          (r.referrers || []).forEach(ref => {
            const refName = ref.referrer || fullnameFromParts(ref.referrer_first_name, ref.referrer_last_name);
            if (!grouped[refName]) grouped[refName] = [];
            if (Array.isArray(ref.userStories)) {
              grouped[refName].push(...ref.userStories.filter(s => s)); // only non-empty
            }
          });

          // Convert grouped referrers into blocks
          Object.keys(grouped).forEach(refName => {
            const stories = grouped[refName];
            const blockRows = stories.map((story, idx) => ({
              referrer: idx === 0 ? refName : "", // show referrer only on first row
              userStory: story, // just the label string
              isFixed: true
            }));
            blocks.push(blockRows);
          });

          // Always add one editable row at the end
          blocks.push([{ referrer: "", userStory: "", isFixed: false }]);

          return {
            resume_id: r.resume_id,
            fullName: r.fullName,
            blocks,
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
  // UPDATE FIELD
  // -------------------------------
  const updateInput = (rowIdx, blockIdx, cellIdx, field, value) => {
    setRows(prev =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              blocks: row.blocks.map((block, bIdx) =>
                bIdx !== blockIdx
                  ? block
                  : block.map((cell, cIdx) =>
                      cIdx !== cellIdx ? cell : { ...cell, [field]: value }
                    )
              )
            }
      )
    );
  };

// -------------------------------
// ADD ROW TO BLOCK (+ button)
// -------------------------------
const addRowToBlock = (rowIdx, blockIdx) => {
  setRows(prev =>
    prev.map((row, i) =>
      i !== rowIdx
        ? row
        : {
            ...row,
            blocks: row.blocks.map((block, bIdx) =>
              bIdx !== blockIdx
                ? block
                : [
                    ...block,
                    {
                      referrer: "",   // always empty
                      userStory: "",  // empty
                      isFixed: false  // editable
                    }
                  ]
            )
          }
    )
  );
};

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const submit = async () => {
    try {
      for (const row of rows) {
        for (const block of row.blocks) {
          const refName = block[0].referrer?.trim();
          const stories = block.map(c => c.userStory).filter(s => s); // only non-empty

          if (!refName || stories.length === 0) continue;

          await invoke("addreferrer", {
            resume_id: row.resume_id,
            referrer: refName,
            userStories: stories // just array of labels
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
            row.blocks.map((block, blockIdx) =>
              block.map((cell, cellIdx) => (
                <tr key={`${row.resume_id}-${blockIdx}-${cellIdx}`}>
                  {cellIdx === 0 && <td rowSpan={block.length}>{row.fullName}</td>}

{/* Referrer */}
<td>
  {cell.isFixed ? (
    <span>{cell.referrer}</span>
  ) : cellIdx === 0 ? (
    <select
      value={cell.referrer}
      onChange={e => updateInput(rowIdx, blockIdx, cellIdx, "referrer", e.target.value)}
    >
      <option value="">Select Referrer</option>
      {row.referrerOptions
        .filter(opt => opt.resume_id !== row.resume_id)
        .map(opt => (
          <option key={opt.resume_id} value={opt.fullName}>{opt.fullName}</option>
        ))}
    </select>
  ) : (
    <select
      value={cell.referrer}   // new rows also show select
      onChange={e => updateInput(rowIdx, blockIdx, cellIdx, "referrer", e.target.value)}
    >
      <option value="">Select Referrer</option>
      {row.referrerOptions
        .filter(opt => opt.resume_id !== row.resume_id)
        .map(opt => (
          <option key={opt.resume_id} value={opt.fullName}>{opt.fullName}</option>
        ))}
    </select>
  )}
</td>

{/* User Story */}
<td>
  {cell.isFixed ? (
    <span>{cell.userStory}</span>
  ) : (
    <select
      value={cell.userStory || ""}
      onChange={e => updateInput(rowIdx, blockIdx, cellIdx, "userStory", e.target.value)}
      disabled={!cell.referrer}  // disable until this row has a referrer
    >
      <option value="">Select Story</option>
      {row.storyOptions.map(s => (
        <option key={s.label} value={s.label}>{s.label}</option>
      ))}
    </select>
  )}
</td>
                  {/* + Button */}
                  <td>
                    {!cell.isFixed && cellIdx === block.length - 1 && (
                      <button type="button" onClick={() => addRowToBlock(rowIdx, blockIdx)}>
                        +
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )
          )}
        </tbody>
      </table>

      <div className="addreferrer-actions">
        <button onClick={submit}>Submit</button>
        <button onClick={() => goBackAR && goBackAR()}>Close</button>
      </div>
    </div>
  );
}

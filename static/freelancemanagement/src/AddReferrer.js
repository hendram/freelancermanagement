import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddReferrer.css";
import Alert from "./Alert.js";

export default function AddReferrer({ goBackAR }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

const [uialert, setUiAlert] = useState(null);


  const fullnameFromParts = (first, last) =>
    `${(first || "").trim()} ${(last || "").trim()}`.trim();

  // ------------------------------------------------------------
  // LOAD DATA FROM BACKEND
  // ------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await invoke("getuserstories");

        if (!res || !res.success || !Array.isArray(res.list)) {
          setLoading(false);
          return;
        }

        const mapped = res.list.map(r => {
          // ------------------------------
          // FIXED ROWS FROM BACKEND
          // ------------------------------
          const fixedRows = Array.isArray(r.referrers)
            ? r.referrers.map(ref => ({
                referrer: fullnameFromParts(
                  ref.referrer_first_name,
                  ref.referrer_last_name
                ),
                issue_key: ref.issue_key,
                issue_summary: ref.issue_summary,
                isFixed: true
              }))
            : [];

          // New empty row (editable)
          const editableRow = {
            referrer: "",
            issue_key: "",
            issue_summary: "",
            isFixed: false
          };

          return {
            resume_id: r.resume_id,
            fullName: r.fullName,

            referrerOptions: Array.isArray(r.availableReferrers)
              ? r.availableReferrers
              : [],

            issueOptions: (Array.isArray(r.availableStories)
              ? r.availableStories
              : []
            ).map(s => ({
              issue_key: s.issue_key,
              issue_summary: s.issue_summary,
              label: `${s.issue_key} - ${s.issue_summary}`
            })),

            rows: [...fixedRows, editableRow]
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

  // ------------------------------------------------------------
  // UPDATE CELL
  // ------------------------------------------------------------
  const updateInput = (rowIdx, cellIdx, field, value) => {
    setRows(prev =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              rows: row.rows.map((cell, cIdx) =>
                cIdx !== cellIdx ? cell : { ...cell, [field]: value }
              )
            }
      )
    );
  };

  // ------------------------------------------------------------
  // ADD NEW ROW
  // ------------------------------------------------------------
  const addRow = rowIdx => {
    setRows(prev =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              rows: [
                ...row.rows,
                {
                  referrer: "",
                  issue_key: "",
                  issue_summary: "",
                  isFixed: false
                }
              ]
            }
      )
    );
  };

  // ------------------------------------------------------------
  // SUBMIT DATA
  // ------------------------------------------------------------
  const submit = async () => {
    try {
      for (const row of rows) {
        for (const cell of row.rows) {
          if (cell.isFixed) continue;

          const ref = cell.referrer?.trim();
          const key = cell.issue_key?.trim();
          const summary = cell.issue_summary?.trim();

          if (!ref || !key || !summary) continue;

          await invoke("addreferrer", {
            resume_id: row.resume_id,
            referrer: ref,
            issue_key: key,
            issue_summary: summary
          });
        }
      }

setUiAlert({
  type: "success",
  title: "Success",
  message: "Referrers assigned successfully",
});

      goBackAR && goBackAR();
    } catch (err) {
      console.error("addreferrer failed:", err);
setUiAlert({
  type: "error",
  title: "Failed Assign",
  message: "Error assigning referrers",
});

    }
  };

  if (loading) return <div>Loading...</div>;

  // ------------------------------------------------------------
  // FRONTEND RENDER
  // ------------------------------------------------------------
  return (
    <div className="addreferrer-container">
      <table className="addreferrer-table">
        <thead className="thead">
          <tr className="theadtr">
            <th className="trth-fullname">Full Name</th>
            <th className="trth-referrer">Referrer</th>
            <th className="trth-issue">Issue</th>
            <th className="trth-button"></th>
          </tr>
        </thead>

        <tbody className="tbody">
          {rows.map((row, rowIdx) =>
            row.rows.map((cell, cellIdx) => (
              <tr className="tbodytr" key={`${row.resume_id}-${cellIdx}`}>
                {cellIdx === 0 && (
                  <td className="trtd-fullname" rowSpan={row.rows.length}>{row.fullName}</td>
                )}

                {/* Referrer */}
                <td className="trtd-referrer" >
                  {cell.isFixed ? (
                    <span className="trtdreferrer-span">{cell.referrer}</span>
                  ) : (
                    <select className="select"
                      value={cell.referrer}
                      onChange={e =>
                        updateInput(rowIdx, cellIdx, "referrer", e.target.value)
                      }
                    >
                      <option value="">Select Referrer</option>
                      {row.referrerOptions
                        .filter(opt => opt.resume_id !== row.resume_id)
                        .map(opt => (
                          <option key={opt.resume_id} value={opt.fullName}>
                            {opt.fullName}
                          </option>
                        ))}
                    </select>
                  )}
                </td>

                {/* Issue */}
                <td className="trtd-issue">
                  {cell.isFixed ? (
                    <span className="issuekeysummary-span">
                      {cell.issue_key} - {cell.issue_summary}
                    </span>
                  ) : (
                    <select className="select"
                      value={cell.issue_key}
                      disabled={!cell.referrer}
                      onChange={e => {
                        const selected = row.issueOptions.find(
                          x => x.issue_key === e.target.value
                        );
                        if (!selected) return;

                        updateInput(rowIdx, cellIdx, "issue_key", selected.issue_key);
                        updateInput(
                          rowIdx,
                          cellIdx,
                          "issue_summary",
                          selected.issue_summary
                        );
                      }}
                    >
                      <option value="">Select Issue</option>
                      {row.issueOptions.map(s => (
                        <option key={s.issue_key} value={s.issue_key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* Add button */}
                <td className="trtd-button">
                  {!cell.isFixed && cellIdx === row.rows.length - 1 && (
                    <button className="add-btn" type="button" onClick={() => addRow(rowIdx)}>
                      +
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="addreferrer-actions">
        <button className="submit-btn" onClick={submit}>Submit</button>
        <button className="close-btn" onClick={() => goBackAR && goBackAR()}>Close</button>
      </div>
{uialert && (
  <Alert
    type={uialert.type}
    title={uialert.title}
    message={uialert.message}
    onClose={() => setUiAlert(null)}
  />
)}

    </div>
  );
}

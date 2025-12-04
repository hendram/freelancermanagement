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
        console.log("res", res);

        if (res.success && res.list) {
          const mapped = res.list.map(r => ({
            resume_id: r.resume_id,
            fullName: r.fullName,
            reputation: r.total_reputation_value || 0,
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

      <table className="artable">
        <thead className="arthead">
          <tr className="artheadtr">
            <th className="artheadtrthfullname" >Full Name</th>
            <th className="artheadtrthtotalrep">Total Reputation</th>
            <th className="artheadtrthpos">+ Positive ID</th>
            <th className="artheadtrthneg">- Negative ID</th>
          </tr>
        </thead>

        <tbody className="artbody">
          {rows.map((r, idx) => (
            <tr className="artbodytr" key={r.resume_id}>
              <td className="artbodytrtdfullname"> {r.fullName}</td>
              <td className="artbodytrtdreputation">{r.reputation}</td>

              <td className="artbodytrtdposinput">
          <div className="posinput-div" >
                <input
                  className="posinput"
                  type="number"
                  value={r.posInput}
                  onChange={e =>
                    updateInput(idx, "posInput", e.target.value)
                  }
                  placeholder="Pos ID"
                />
           </div>
              </td>

              <td className="artbodytrtdneginput">
              <div className="neginput-div"> 
               <input
                  className="neginput"
                  type="number"
                  value={r.negInput}
                  onChange={e =>
                    updateInput(idx, "negInput", e.target.value)
                  }
                  placeholder="Neg ID"
                />
              </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="arbuttons-div">
        <button className="btn-submitar" onClick={submit}>Submit</button>
        <button className="btn-resetar" onClick={reset}>Reset</button>
        {goBackAR && (
          <button className="btn-closear" onClick={goBackAR}>Close</button>
        )}
      </div>
    </div>
  );
}

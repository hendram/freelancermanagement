import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./ReputationCatalog.css";

export default function ReputationCatalog({ goBackRC }) {
  const [posRange, setPosRange] = useState({ from: 1, to: 10000 });
  const [negRange, setNegRange] = useState({ from: -1, to: -10000 });

  const [positiveReps, setPositiveReps] = useState([]);
  const [negativeReps, setNegativeReps] = useState([]);

  // -------------------------------------------------------
  // LOAD REPUTATION CATALOG FROM DB
  // -------------------------------------------------------
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await invoke("reputationcatalog");

        if (!res.success || !res.catalog) return;

        const catalog = res.catalog;

// Extract positive rows
const pos = catalog
  .filter(r => r.positiveId)
  .map(r => ({
    id: r.positiveId,
    description: r.positiveDefinition || "",
    value: Number(r.positiveValue || 0),
  }))
  .sort((a, b) => a.id - b.id);   // ADD THIS

// Extract negative rows
const neg = catalog
  .filter(r => r.negativeId)
  .map(r => ({
    id: r.negativeId,
    description: r.negativeDefinition || "",
    value: Number(r.negativeValue || 0),
  }))
  .sort((a, b) => a.id - b.id);   // ADD THIS

setPositiveReps(pos);
setNegativeReps(neg);

        // Ranges
        if (catalog.length > 0) {
          // Positive Range
          const pl = catalog[0].rangeLowerpositive;
          const pu = catalog[0].rangeUpperpositive;
          if (pl !== undefined && pu !== undefined)
            setPosRange({ from: Number(pl), to: Number(pu) });

          // Negative Range
          const nl = catalog[0].rangeLowernegative;
          const nu = catalog[0].rangeUppernegative;
          if (nl !== undefined && nu !== undefined)
            setNegRange({ from: Number(nl), to: Number(nu) });
        }
      } catch (err) {
        console.error("Failed to load reputation catalog:", err);
      }
    };

    loadCatalog();
  }, []);

  // -------------------------------------------------------
  // ADD / REMOVE ITEMS
  // -------------------------------------------------------
  const addPositive = () => {
    setPositiveReps(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        description: "",
        value: "",
      },
    ]);
  };

  const removePositive = () =>
    setPositiveReps(prev => prev.slice(0, -1));

  const addNegative = () => {
    setNegativeReps(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        description: "",
        value: "",
      },
    ]);
  };

  const removeNegative = () =>
    setNegativeReps(prev => prev.slice(0, -1));

  // -------------------------------------------------------
  // UPDATE ITEMS
  // -------------------------------------------------------
  const updatePositive = (idx, key, val) =>
    setPositiveReps(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      )
    );

  const updateNegative = (idx, key, val) =>
    setNegativeReps(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      )
    );

  // -------------------------------------------------------
  // SUBMIT TO BACKEND
  // -------------------------------------------------------
  const submit = async () => {
    const payload = {
      positiveReps,
      negativeReps,
      posRange: {
        from: Number(posRange.from),
        to: Number(posRange.to),
      },
      negRange: {
        from: Number(negRange.from),
        to: Number(negRange.to),
      },
    };

    try {
      const res = await invoke("reputationcatalogsave", payload);

      if (res.success) {
        alert("Reputation catalog saved successfully!");
        if (goBackRC) goBackRC();
      } else {
        alert("Failed to save catalog");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save catalog");
    }
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
  <div className="container-rc">
    {/* ---------------- POSITIVE REPUTATION ---------------- */}
    <div className="positive-section">
      <h3>Positive Reputation Range</h3>

      <div className="positiveinputbut-div">
        <label className="definedpositiverangelabel" htmlFor="pos-from">
          Define positive range:
        </label>

        <div className="lowerposnumberinput-div">
          <input
            id="pos-from"
            className="lowerposnumberinput"
            type="number"
            value={posRange.from}
            onChange={e =>
              setPosRange({ ...posRange, from: Number(e.target.value) })
            }
            placeholder="From"
          />
        </div>

        <label className="toposlabel" htmlFor="pos-to">To:</label>

        <div className="higherposnumberinput-div">
          <input
            id="pos-to"
            className="higherposnumberinput"
            type="number"
            value={posRange.to}
            onChange={e =>
              setPosRange({ ...posRange, to: Number(e.target.value) })
            }
            placeholder="To"
          />
        </div>
      </div>

      <div className="descriptionnumberposblock-div">
        {positiveReps.map((rep, idx) => (
          <div key={rep.id} className="descriptionnumberposrow-div">
            <label className="posindexlabel" htmlFor={`pos-desc-${idx}`}>
              {rep.id}.
            </label>

            <div className="descriptionposinput-div">
              <input
                id={`pos-desc-${idx}`}
                className="descriptionposinput"
                type="text"
                value={rep.description}
                placeholder="Description"
                onChange={e =>
                  updatePositive(idx, "description", e.target.value)
                }
              />
            </div>

            <div className="numberposinput-div">
              <input
                className="numberposinput"
                type="number"
                value={rep.value}
                placeholder="Value"
                onChange={e =>
                  updatePositive(idx, "value", Number(e.target.value))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="addremovepositivebut-div">
        <button className="addpositivebut" onClick={addPositive}>
          + Add Positive
        </button>
        <button className="removepositivebut" onClick={removePositive}>
          - Remove Positive
        </button>
      </div>
    </div>

    {/* ---------------- NEGATIVE REPUTATION ---------------- */}
    <div className="negative-section">
      <h3>Negative Reputation Range</h3>

      <div className="negativeinputbut-div">
        <label className="definednegativerangelabel" htmlFor="neg-from">
          Define negative range:
        </label>

        <div className="lowernegnumberinput-div">
          <input
            id="neg-from"
            className="lowernegnumberinput"
            type="number"
            value={negRange.from}
            onChange={e =>
              setNegRange({ ...negRange, from: Number(e.target.value) })
            }
            placeholder="From"
          />
        </div>

        <label className="toneglabel" htmlFor="neg-to">To:</label>

        <div className="highernegnumberinput-div">
          <input
            id="neg-to"
            className="highernegnumberinput"
            type="number"
            value={negRange.to}
            onChange={e =>
              setNegRange({ ...negRange, to: Number(e.target.value) })
            }
            placeholder="To"
          />
        </div>
      </div>

      <div className="descriptionnumbernegblock-div">
        {negativeReps.map((rep, idx) => (
          <div key={rep.id} className="descriptionnumbernegrow-div">
            <label className="negindexlabel" htmlFor={`neg-desc-${idx}`}>
              {rep.id}.
            </label>

            <div className="descriptionneginput-div">
              <input
                id={`neg-desc-${idx}`}
                className="descriptionneginput"
                type="text"
                value={rep.description}
                placeholder="Description"
                onChange={e =>
                  updateNegative(idx, "description", e.target.value)
                }
              />
            </div>

            <div className="numberneginput-div">
              <input
                className="numberneginput"
                type="number"
                value={rep.value}
                placeholder="Value"
                onChange={e =>
                  updateNegative(idx, "value", Number(e.target.value))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="addremovenegativebut-div">
        <button className="addnegativebut" onClick={addNegative}>
          + Add Negative
        </button>
        <button className="removenegativebut" onClick={removeNegative}>
          - Remove Negative
        </button>
      </div>
    </div>

    {/* ---------------- SUBMIT ---------------- */}
    <div className="submitrc-div">
      <button className="btn_submitrc" onClick={submit}>
        Submit Catalog
      </button>
      {goBackRC && (
        <button className="btn_closerc" onClick={goBackRC}>
          Close
        </button>
      )}
    </div>
  </div>
)

}

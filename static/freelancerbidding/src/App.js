import React, { useRef, useEffect, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./App.css";

export default function App() {
  const forceUpdate = useReducer(() => ({}), {})[1];

  // ------------------------------
  // REFS (no useState at all)
  // ------------------------------
  const issue = useRef(null);
  const referByList = useRef([]);
  const referToList = useRef([]);

  const rfpTextReadonly = useRef("");
  const proposalText = useRef("");

  const priceRef = useRef("");
  const priceUnitRef = useRef("");
  const priceTypeRef = useRef("");

  const showProposalBox = useRef(false);

  // ------------------------------
  // LOAD ISSUE + REFER DATA
  // ------------------------------
  useEffect(() => {
    async function load() {
      try {
        const data = await invoke("getcurrentissue", {});

        if (!data?.key) {
          issue.current = null;
          forceUpdate();
          return;
        }

        issue.current = {
          key: data.key,
          summary: data.summary,
          issueType: data.issuetype || data.type || "Task",
          label: data.key,
        };

        // Get refer by & refer to pills
        const refData = await invoke("getrefer", {
          issueKey: data.key,
        });

        referByList.current = refData?.referBy || [];
        referToList.current = refData?.referTo || [];
        rfpTextReadonly.current = refData?.rfp || "";
        proposalText.current = "";

        forceUpdate();
      } catch (e) {
        issue.current = null;
        forceUpdate();
      }
    }

    load();
  }, []);

  // ------------------------------
  // HANDLERS
  // ------------------------------
  const handleAddReferTo = async () => {
    const name = prompt("Enter freelancer name to refer:");
    if (!name) return;

    await invoke("addrefer", {
      issueKey: issue.current.key,
      name,
    });

    referToList.current.push(name);
    forceUpdate();
  };

  const handleSendProposal = async () => {
    const text = proposalText.current.value || "";
    if (!text.trim()) return;

    await invoke("invitation", {
      inviteStatus: "yes",
      proposal: text,
      issueKey: issue.current.key,
    });

    showProposalBox.current = false;
    proposalText.current = "";
    forceUpdate();
  };

  const handlePass = async () => {
    await invoke("invitation", {
      inviteStatus: "pass",
      issueKey: issue.current.key,
    });
    alert("You passed this task.");
  };

  // ------------------------------
  // UI SECTIONS
  // ------------------------------
  const renderPills = (arr) =>
    arr.map((name) => (
      <div key={name} className="pill">
        {name}
      </div>
    ));

  // ------------------------------
  // MAIN UI
  // ------------------------------
  if (!issue.current)
    return <div className="fb-wrapper">Cannot detect issue context.</div>;

  return (
    <div className="fb-wrapper">

      {/* ------------------ HEADER ------------------ */}
      <div className="issue-box">
        <div className="issue-title">
          {issue.current.issueType}: {issue.current.summary}
        </div>

        <div className="issue-label">{issue.current.label}</div>

        <div className="issue-summary">{issue.current.summary}</div>
      </div>

      {/* ------------------ REFER BY ------------------ */}
      <div className="row-block">
        <div className="row-title">Refer by:</div>
        <div className="pill-row">
          {referByList.current.length === 0
            ? "N/A"
            : renderPills(referByList.current)}
        </div>
      </div>

      {/* ------------------ REFER TO ------------------ */}
      <div className="row-block">
        <div className="row-title">Refer To:</div>
        <div className="pill-row">
          {referToList.current.length === 0
            ? "N/A"
            : renderPills(referToList.current)}
        </div>

        <button className="pill-btn add-btn" onClick={handleAddReferTo}>
          + Refer Name
        </button>
      </div>

      {/* ------------------ RFP (READONLY) ------------------ */}
      {rfpTextReadonly.current.trim() !== "" && (
        <div className="row-block">
          <div className="row-title">RFP:</div>
          <textarea
            className="rfp-box"
            readOnly
            value={rfpTextReadonly.current}
          ></textarea>
        </div>
      )}

      {/* ------------------ PROPOSAL (EDITABLE) ------------------ */}
      <div className="row-block">
        <div className="row-title">Proposal:</div>

        {!showProposalBox.current && (
          <button
            className="pill-btn"
            onClick={() => {
              showProposalBox.current = true;
              forceUpdate();
            }}
          >
            Write Proposal
          </button>
        )}

        {showProposalBox.current && (
          <div className="proposal-section">
            <textarea
              ref={proposalText}
              placeholder="Write your proposal..."
              className="proposal-box"
              rows={4}
            ></textarea>

            <div className="proposal-actions">
              <button className="pill-btn" onClick={handleSendProposal}>
                Submit
              </button>

              <button
                className="pill-btn pass-btn"
                onClick={() => {
                  showProposalBox.current = false;
                  proposalText.current = "";
                  forceUpdate();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------ PRICE ROW ------------------ */}
      <div className="row-block">
        <div className="row-title">Price:</div>

        <input type="text" ref={priceRef} className="price-input" placeholder="e.g. 500" />

        <span className="usd-label">USD</span>

        <select ref={priceTypeRef} className="select-box">
          <option value="per/task">per/task</option>
          <option value="per/hour">per/hour</option>
        </select>
      </div>

      {/* ------------------ PASS BUTTON ------------------ */}
      <div className="row-block pass-container">
        <button className="pass-btn final-pass" onClick={handlePass}>
          Pass
        </button>
      </div>
    </div>
  );
}

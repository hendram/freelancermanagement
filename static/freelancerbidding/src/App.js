import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./App.css";

export default function App() {
  const [issue, setIssue] = useState(null);

  const [managerSkills, setManagerSkills] = useState("");
  const [loading, setLoading] = useState(false);

  const [managerResults, setManagerResults] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [error, setError] = useState("");

  const [rfpOpen, setRfpOpen] = useState(null);
  const [rfpMessage, setRfpMessage] = useState("");

  // ---------------------------------------------------
  // 1. AUTO LOAD ISSUE CONTEXT
  // ---------------------------------------------------
  useEffect(() => {
    async function loadIssue() {
      try {
        const data = await invoke("getcurrentissue", {});
        if (!data || !data.key) {
          setError("Cannot detect issue context.");
          return;
        }

        setIssue({
          key: data.key,
          summary: data.summary,
          issueType: data.issuetype || data.type || "Task"
        });
      } catch (err) {
        setError("Failed loading issue.");
      }
    }
    loadIssue();
  }, []);

  // ---------------------------------------------------
  // 2. SEARCH CANDIDATES
  // ---------------------------------------------------
  const searchCandidates = async (skillsInput, setList) => {
    setError("");
    setList([]);

    if (!skillsInput.trim()) {
      setError("Please enter skills to match.");
      return;
    }

    setLoading(true);
    try {
      const res = await invoke("searchskills", { skills: skillsInput });

      if (!res?.success) {
        setError(res?.error || "Search failed.");
        return;
      }

      setList(res.candidates.slice(0, 5));
    } catch (err) {
      setError("Search error.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // COMMON PAYLOAD BUILDER
  // ---------------------------------------------------
  const buildPayload = (candidate, extra = {}) => ({
    freelancerName: candidate.fullName,
    resumeId: candidate.resume_id,
    issueKey: issue?.key,
    issueSummary: issue?.summary,
    issueType: issue?.issueType,
    ...extra
  });

  // ---------------------------------------------------
  // 3. BUTTON ACTIONS
  // ---------------------------------------------------
  const handleInvite = async (c) => {
    try {
      await invoke("invitation", buildPayload(c, { inviteStatus: "yes" }));
      console.log("Invite sent:", c.fullName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRFP = (c) => {
    setRfpOpen(c.resume_id);
    setRfpMessage("");
  };

  const handleRfpSubmit = async (c) => {
    try {
      await invoke(
        "invitation",
        buildPayload(c, {
          inviteStatus: "yes",
          rfpMessage
        })
      );
      setRfpOpen(null);
      setRfpMessage("");
      console.log("RFP sent:", c.fullName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRfpCancel = () => {
    setRfpOpen(null);
    setRfpMessage("");
  };

  const handlePass = (c, setList) => {
    setList((prev) => prev.filter((x) => x.resume_id !== c.resume_id));
  };

  const handleProposal = (c) => {
    console.log("Proposal clicked for:", c.fullName);
  };

  const handleDeal = async (c) => {
    try {
      await invoke(
        "invitation",
        buildPayload(c, {
          deal: "yes"
        })
      );
      console.log("Deal completed with:", c.fullName);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------------
  // 4. RENDER ONE ROW
  // ---------------------------------------------------
  const renderCandidateRow = (c, setList) => (
    <div className="fb-candidate-row" key={c.resume_id}>
      <div className="fb-c-left">
        <span className="fb-c-name">{c.fullName}</span>

        <div className="fb-c-actions">
          <button className="fb-pill-btn invite-btn" onClick={() => handleInvite(c)}>
            Invite
          </button>

          <button className="fb-pill-btn rfp-btn" onClick={() => handleRFP(c)}>
            RFP
          </button>

          <button className="fb-pill-btn pass-btn" onClick={() => handlePass(c, setList)}>
            Pass
          </button>

          <button className="fb-pill-btn proposal-btn" onClick={() => handleProposal(c)}>
            Proposal
          </button>

          {c.price && (
            <button className="fb-pill-btn deal-btn" onClick={() => handleDeal(c)}>
              Deal
            </button>
          )}
        </div>

        {rfpOpen === c.resume_id && (
          <div className="fb-rfp-box">
            <textarea
              value={rfpMessage}
              onChange={(e) => setRfpMessage(e.target.value)}
              placeholder="Enter your RFP message..."
              rows={3}
            />
            <div className="fb-rfp-actions">
              <button className="fb-pill-btn rfp-btn" onClick={() => handleRfpSubmit(c)}>
                Submit
              </button>
              <button className="fb-pill-btn pass-btn" onClick={handleRfpCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fb-c-right">
        Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
        <br />
        Score: {c.score ?? "-"}
      </div>
    </div>
  );

  // ---------------------------------------------------
  // 5. MAIN RENDER
  // ---------------------------------------------------
  return (
    <div className="fb-wrapper">
      {issue && (
        <div className="fb-issue-row">
          <div className="fb-issue-left">
            <div className="fb-issue-key">{issue.key}</div>
            <div className="fb-issue-summary">{issue.summary}</div>
          </div>
        </div>
      )}

      {error && <div className="fb-error">{error}</div>}

      <div className="fb-manager-search">
        <label>Search skills:</label>
        <input
          type="text"
          value={managerSkills}
          onChange={(e) => setManagerSkills(e.target.value)}
          placeholder="e.g. react, api"
        />
        <button
          className="fb-pill-btn"
          onClick={() => searchCandidates(managerSkills, setManagerResults)}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Manager search results */}
      {managerResults.length > 0 &&
        managerResults.map((c) => renderCandidateRow(c, setManagerResults))}

      {/* Original candidates */}
      {candidates.length > 0 &&
        candidates.map((c) => renderCandidateRow(c, setCandidates))}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./App.css";

export default function App() {
  const [issue, setIssue] = useState(null);
  const [skills, setSkills] = useState("");          // original input
  const [managerSkills, setManagerSkills] = useState(""); // new manager input
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [managerResults, setManagerResults] = useState([]); // results for manager search
  const [error, setError] = useState("");

  // -----------------------------
  // 1) AUTO-FETCH ISSUE DATA FROM CONTEXT
  // -----------------------------
  useEffect(() => {
    async function loadIssue() {
      try {
        const data = await invoke("getcurrentissue", {});
        if (!data || !data.key) {
          setError("Cannot detect issue context.");
          return;
        }
        setIssue(data); // { key, summary }
      } catch (err) {
        console.error(err);
        setError("Failed loading issue.");
      }
    }
    loadIssue();
  }, []);

  // -----------------------------
  // 2) SEARCH
  // -----------------------------
  const searchCandidates = async (inputSkills, setResultFn) => {
    setError("");
    setResultFn([]);

    if (!inputSkills.trim()) {
      setError("Please enter skills to match.");
      return;
    }

    setLoading(true);
    try {
      const payload = { skills: inputSkills };
      const res = await invoke("findcandidates", payload);

      if (!res?.success) {
        setError(res?.error || "Search failed.");
        return;
      }

      setResultFn(res.candidates.slice(0, 5));
    } catch (err) {
      setError("Search error.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 3) CANDIDATE ACTION HANDLERS
  // -----------------------------
  const handleInvite = (candidate) => console.log(`Inviting: ${candidate.fullName}`);
  const handleRFP = (candidate) => console.log(`RFP: ${candidate.fullName}`);
  const handlePass = (candidate) => console.log(`Passing: ${candidate.fullName}`);
  const handleProposal = (candidate) => console.log(`Proposal: ${candidate.fullName}`);
  const handleDeal = (candidate) => console.log(`Deal: ${candidate.fullName}`);

  // -----------------------------
  // 4) RENDER
  // -----------------------------
  return (
    <div className="fb-wrapper">
      {/* USER STORY */}
      {issue && (
        <div className="fb-issue-row">
          <div className="fb-issue-left">
            <div className="fb-issue-key">{issue.key}</div>
            <div className="fb-issue-summary">{issue.summary}</div>
          </div>
        </div>
      )}

      {error && <div className="fb-error">{error}</div>}

      {/* MANAGER SEARCH INPUT */}
      <div className="fb-manager-search">
        <label htmlFor="manager-skills">Search skills:</label>
        <input
          id="manager-skills"
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

      {/* MANAGER SEARCH RESULTS */}
      {managerResults.length > 0 && (
        <div className="fb-candidate-block">
          {managerResults.map((c) => (
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
                  <button className="fb-pill-btn pass-btn" onClick={() => handlePass(c)}>
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
              </div>
              <div className="fb-c-right">
                Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
                <br />
                Score: {c.score ?? "-"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORIGINAL SKILLS INPUT (if you still want to keep it) */}
      {issue && (
        <div className="fb-issue-row fb-original-search">
          <input
            className="fb-skill-input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Required skills (e.g. react, api)"
          />
          <button
            className="fb-pill-btn"
            onClick={() => searchCandidates(skills, setCandidates)}
            disabled={loading}
          >
            {loading ? "Searching…" : "Submit"}
          </button>
        </div>
      )}

      {/* ORIGINAL CANDIDATES LIST */}
      {candidates.length > 0 && (
        <div className="fb-candidate-block">
          {candidates.map((c) => (
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
                  <button className="fb-pill-btn pass-btn" onClick={() => handlePass(c)}>
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
              </div>
              <div className="fb-c-right">
                Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
                <br />
                Score: {c.score ?? "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

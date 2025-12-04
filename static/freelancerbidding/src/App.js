import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./App.css";

export default function App() {
  const [issue, setIssue] = useState(null);
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
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
  const search = async () => {
    setError("");
    setCandidates([]);

    if (!skills.trim()) {
      setError("Please enter skills to match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        skills,
      };
      const res = await invoke("findcandidates", payload);

      if (!res?.success) {
        setError(res?.error || "Search failed.");
        return;
      }

      setCandidates(res.candidates.slice(0, 5));
    } catch (err) {
      setError("Search error.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 3) CANDIDATE ACTION HANDLERS (New Placeholder Functions)
  // -----------------------------

  const handleInvite = (candidate) => {
    console.log(`Inviting freelancer: ${candidate.fullName}`);
    // **TODO: Implement Forge invoke call to send invitation**
  };

  const handleRFP = (candidate) => {
    console.log(`Sending RFP to: ${candidate.fullName}`);
    // **TODO: Implement Forge invoke call for Request for Proposal**
  };

  const handlePass = (candidate) => {
    console.log(`Passing on candidate: ${candidate.fullName}`);
    // **TODO: Implement logic to mark candidate as 'Passed'**
  };

  const handleProposal = (candidate) => {
    console.log(`Viewing proposal for: ${candidate.fullName}`);
    // **TODO: Implement logic to open/view the candidate's proposal**
  };

  const handleDeal = (candidate) => {
    console.log(`Making a deal with: ${candidate.fullName}`);
    // **TODO: Implement Forge invoke call to finalize the deal**
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="fb-wrapper">
      {/* TOP: ISSUE ROW */}
      {issue && (
        <div className="fb-issue-row">
          <div className="fb-issue-left">
            <div className="fb-issue-key">{issue.key}</div>
            <div className="fb-issue-summary">{issue.summary}</div>
          </div>

          <div className="fb-issue-right">
            <input
              className="fb-skill-input"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Required skills (e.g. react, api)"
            />

            <button className="fb-submit-btn" onClick={search} disabled={loading}>
              {loading ? "Searching…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="fb-error">{error}</div>}

      {/* CANDIDATES LIST */}
      {candidates.length > 0 && (
        <div className="fb-candidate-block">
          {candidates.map((c, i) => (
            <div className="fb-candidate-row" key={c.resume_id}>
              {/* UPDATED: Added action buttons next to the candidate name */}
              <div className="fb-c-left">
                <span className="fb-c-name">{c.fullName}</span>
                <div className="fb-c-actions">
                  <button className="fb-action-btn invite-btn" onClick={() => handleInvite(c)}>
                    Invite
                  </button>
                  <button className="fb-action-btn rfp-btn" onClick={() => handleRFP(c)}>
                    RFP
                  </button>
                  <button className="fb-action-btn pass-btn" onClick={() => handlePass(c)}>
                    Pass
                  </button>
                  <button className="fb-action-btn proposal-btn" onClick={() => handleProposal(c)}>
                    Proposal
                  </button>
                  <button className="fb-action-btn deal-btn" onClick={() => handleDeal(c)}>
                    Deal
                  </button>
                </div>
              </div>
              {/* END OF UPDATED SECTION */}
              
              <div className="fb-c-right">
                <div className="fb-c-meta">
                  Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
                  <br />
                  Score: {c.score ?? "-"}
                </div>

                <button
                  className="fb-open-resume"
                  onClick={() => window.open(`/resumes/${c.resume_id}`, "_blank")}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


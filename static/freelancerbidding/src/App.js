import React, { useRef, useState } from "react";
import { invoke } from "@forge/bridge";
import "./App.css";

export default function App() {
  const issueRef = useRef(null);
  const managerSkillsRef = useRef(null);
  const managerResultsRef = useRef([]);
  const loadingRef = useRef(false);
  const errorRef = useRef("");
  const rfpOpenRef = useRef(null);
  const rfpMessageRef = useRef("");
const proposalOpenRef = useRef(null);
const proposalContentRef = useRef("");

  const [, forceUpdate] = useState({}); // to force rerender

  // -----------------------------
  // 1. Load issue context
  // -----------------------------
  React.useEffect(() => {
    async function loadIssue() {
      try {
        const data = await invoke("getcurrentissue", {});
        if (!data || !data.key) {
          errorRef.current = "Cannot detect issue context.";
          forceUpdate({});
          return;
        }

        issueRef.current = {
          key: data.key,
          summary: data.summary,
          issueType: data.issuetype || data.type || "Task",
        };
        forceUpdate({});
      } catch (err) {
        errorRef.current = "Failed loading issue.";
        console.error(err);
        forceUpdate({});
      }
    }
    loadIssue();
  }, []);

  // -----------------------------
  // 2. Search manager candidates
  // -----------------------------
  const searchCandidates = async () => {
    errorRef.current = "";
    managerResultsRef.current = [];
    forceUpdate({});

    const skillsInput = managerSkillsRef.current.value.trim();
    if (!skillsInput) {
      errorRef.current = "Please enter skills to match.";
      forceUpdate({});
      return;
    }

    loadingRef.current = true;
    forceUpdate({});
    try {
      const res = await invoke("searchskills", { skills: skillsInput });
      if (!res?.success) {
        errorRef.current = res?.error || "Search failed.";
      } else {
        managerResultsRef.current = res.candidates.slice(0, 5);
      }
    } catch (err) {
      console.error(err);
      errorRef.current = "Search error.";
    } finally {
      loadingRef.current = false;
      forceUpdate({});
    }
  };

  // -----------------------------
  // 3. Build payload
  // -----------------------------
  const buildPayload = (candidate, extra = {}) => ({
    freelancerName: candidate.fullName,
    resumeId: candidate.resume_id,
    issueKey: issueRef.current?.key,
    issueSummary: issueRef.current?.summary,
    issueType: issueRef.current?.issueType,
    ...extra,
  });

  // -----------------------------
  // 4. Action handlers
  // -----------------------------
  const handleInvite = async (c) => {
    try {
      await invoke("invitation", buildPayload(c, { inviteStatus: "yes" }));
      console.log("Invite sent:", c.fullName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRFP = (c) => {
    rfpOpenRef.current = c.resume_id;
    rfpMessageRef.current = "";
    forceUpdate({});
  };

  const handleRfpSubmit = async (c) => {
    try {
      await invoke(
        "invitation",
        buildPayload(c, { inviteStatus: "yes", rfpMessage: rfpMessageRef.current })
      );
      rfpOpenRef.current = null;
      rfpMessageRef.current = "";
      console.log("RFP sent:", c.fullName);
      forceUpdate({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleRfpCancel = () => {
    rfpOpenRef.current = null;
    rfpMessageRef.current = "";
    forceUpdate({});
  };

  const handlePass = (c) => {
    managerResultsRef.current = managerResultsRef.current.filter(
      (x) => x.resume_id !== c.resume_id
    );
    forceUpdate({});
  };

const handleProposal = async (c) => {
  try {
    // fetch all RFP proposals for this candidate
    const res = await invoke("getrfppropmanager", {
      issueId: issueRef.current?.key, // or .id depending on backend
      resumeId: c.resume_id,
    });

    if (!res?.success) {
      console.error("Failed fetching proposals:", res?.error);
      return;
    }

    // Build combined text: RFP1, Proposal1, RFP2, Proposal2, ...
    let combinedText = "";
    res.data.forEach((item, idx) => {
      const rfpLines = Array.isArray(item.rfp) ? item.rfp.join("\n") : item.rfp || "";
      const proposalLines = Array.isArray(item.proposals) ? item.proposals.join("\n") : item.proposals || "";
      combinedText += `RFP ${idx + 1}:\n${rfpLines}\nProposal ${idx + 1}:\n${proposalLines}\n\n`;
    });

    proposalContentRef.current = combinedText.trim();
    proposalOpenRef.current = c.resume_id;
    forceUpdate({});
  } catch (err) {
    console.error("Error fetching proposals:", err);
  }
};


  const handleDeal = async (c) => {
    try {
      await invoke("invitation", buildPayload(c, { deal: "yes" }));
      console.log("Deal completed with:", c.fullName);
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // 5. Render candidate row
  // -----------------------------
  const renderCandidateRow = (c) => (
    <div className="fbcandidate-container" key={c.resume_id}>
      <div className="fbfullname-div">
        <span className="fbfullname-span">{c.fullName}</span>
  <div className="fbskills-div">
    <span className="fbskills-span">
    Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
        </span>
       </div>    
   </div>
       
        <div className="fbbuttons-container">
          <button
            className="fbinvite-btn"
            onClick={() => handleInvite(c)}
          >
            Invite
          </button>
          <button
            className="fbrfp-btn"
            onClick={() => handleRFP(c)}
          >
            RFP
          </button>
          <button  className="fbproposal-btn"
            onClick={() => handleProposal(c)}
          >
            Proposal
          </button>
  <button  className="fbpass-btn" onClick={() => handlePass(c)}  >
            Pass
          </button>
                
  {c.price && (
            <button
              className="fbdeal-btn"
              onClick={() => handleDeal(c)}
            >
              Deal
            </button>
          )}
        </div>

{proposalOpenRef.current === c.resume_id && (
  <div className="fbopenproposal-div">
    <textarea
      className="fbproposaltextarea"
      ref={(el) => (proposalContentRef.currentEl = el)}
      defaultValue={proposalContentRef.current}
      readOnly
      rows={6}
    />
    <div className="fbproposal-closebtn">
      <button
        className="fbclose-btn"
        onClick={() => {
          proposalOpenRef.current = null;
          proposalContentRef.current = "";
          forceUpdate({});
        }}
      >
        Close
      </button>
    </div>
  </div>
)}


        {rfpOpenRef.current === c.resume_id && (
          <div className="fbopenrfp-div">
            <textarea
              className="fbrfptextarea"
              ref={(el) => (rfpMessageRef.currentEl = el)}
              defaultValue={rfpMessageRef.current}
              onChange={(e) => (rfpMessageRef.current = e.target.value)}
              placeholder="Enter your RFP message..."
              rows={3}
            />
            <div className="fbrfp-submitbtn">
              <button
                className="fbsubmit-btn"
                onClick={() => {
                  rfpMessageRef.current =
                    rfpMessageRef.currentEl?.value || "";
                  handleRfpSubmit(c);
                }}
              >
                Submit
              </button>
              <button
                className="fbcancel-btn"
                onClick={handleRfpCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    
  );

  // -----------------------------
  // 6. Render main
  // -----------------------------
  return (
    <div className="fb-container">
      {issueRef.current && (
        <div className="fbissue-container">
            <span className="fbissuekey-span">{issueRef.current.key}</span>
            <span className="fbissuesummary-span">{issueRef.current.summary}</span>
        </div>
      )}

      {errorRef.current && <div className="fberror">{errorRef.current}</div>}

      <div className="fbmanager-search">
        <label>Search skills:</label>
        <input
          className="fbskills-input"
          type="text"
          placeholder="e.g. react, api"
          ref={managerSkillsRef}
        />
        <button
          className="fbsearch-btn"
          onClick={searchCandidates}
          disabled={loadingRef.current}
        >
          {loadingRef.current ? "Searching…" : "Search"}
        </button>
      </div>

      {managerResultsRef.current.length > 0 &&
        managerResultsRef.current.map(renderCandidateRow)}
    </div>
  );
}

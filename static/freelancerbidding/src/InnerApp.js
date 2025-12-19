import React, { useRef, useState } from "react";
import { invoke } from "@forge/bridge";
import "./InnerApp.css";

export default function InnerApp({ setIssueKey }) {
  const issueRef = useRef(null);
  const managerSkillsRef = useRef(null);
  const managerResultsRef = useRef([]);
  const loadingRef = useRef(false);
  const errorRef = useRef("");
  const rfpOpenRef = useRef(null);
  const rfpMessageRef = useRef("");
  const proposalOpenRef = useRef(null);
  const proposalContentRef = useRef("");

  const priceRefs = useRef({});

  const [, forceUpdate] = useState({}); // force rerender

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

      // 🔥 ISSUE CHANGED → RESET EVERYTHING
  
      issueRef.current = {
        key: data.key,
        summary: data.summary,
        issueType: data.issuetype || data.type || "Task",
      };

     setIssueKey(data.key);
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

  if (!issueRef.current?.key) {
    errorRef.current = "No Jira issue detected. Please open an issue first.";
    forceUpdate({});
    return;
  }

  const skillsInput = managerSkillsRef.current.value.trim();
  if (!skillsInput) {
    errorRef.current = "Please enter skills to match.";
    forceUpdate({});
    return;
  }

  loadingRef.current = true;
  forceUpdate({});

  try {
    const res = await invoke("searchskills", {
      skills: skillsInput,
      issueKey: issueRef.current.key, // make sure issueKey is passed
    });
    console.log("res", res);

    if (!res?.success) {
      errorRef.current = res?.error || "Search failed.";
    } else {
      // Remove duplicates
      const map = {};
      res.candidates.forEach((c) => {
        const key = c.resume_id + "_" + issueRef.current.key;
        if (!map[key]) map[key] = c;
      });
      managerResultsRef.current = Object.values(map);
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
    first_name: candidate.first_name,
    last_name: candidate.last_name,
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
      const price = (priceRefs.current[c.resume_id] || "").trim();
      await invoke("invitation", buildPayload(c, { inviteStatus: "yes", price }));
      console.log("Invite sent with price:", price, c.first_name, c.last_name);
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
        const price = (priceRefs.current[c.resume_id] || "").trim();
      await invoke(
        "invitation",
        buildPayload(c, {
          inviteStatus: "yes",
          rfpMessage: rfpMessageRef.current,
          price,
        })
      );
      rfpOpenRef.current = null;
      rfpMessageRef.current = "";
      console.log("RFP sent with price:", price, c.first_name, c.last_name);
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

  const handleProposal = async (c) => {
    try {
      const res = await invoke("getrfppropmanager", {
        issueId: issueRef.current?.key,
        resumeId: c.resume_id,
      });

      console.log("resproposal", res);

      if (!res?.success) {
        console.error("Failed fetching proposals:", res?.error);
        return;
      }

      let combinedText = "";
      res.data.forEach((item, idx) => {
        const rfpLines = Array.isArray(item.rfp)
          ? item.rfp.join("\n")
          : item.rfp || "";
        const proposalLines = Array.isArray(item.proposals)
          ? item.proposals.join("\n")
          : item.proposals || "";
        combinedText += `RFP ${idx + 1}:\n${rfpLines}\nProposal ${
          idx + 1
        }:\n${proposalLines}\n\n`;
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
   const price = (priceRefs.current[c.resume_id] || "").trim();
      await invoke("invitation", buildPayload(c, { deal: "yes", price }));
      console.log("Deal completed with price:", price, c.first_name, c.last_name);
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
        <span className="fbfullname-span">
          {c.first_name} {c.last_name}
        </span>
        <div className="fbskills-div">
          <span className="fbskills-span">
            Skills: {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
          </span>
        </div>
      </div>

      <div className="fbbuttons-container">
        <div className="fbprice-div">
          <label className="fbprice-label">Price:</label>

{c.deal === "yes" ? (
  <div className="fbprice-locked">
    {c.price}
  </div>
) : (
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  className="fbprice-input"
  defaultValue={c.price ?? ""}
  placeholder="Enter price"
  onChange={(e) => {
    const v = e.target.value.replace(/\D/g, "");
    e.target.value = v;
    priceRefs.current[c.resume_id] = v;
  }}
/>

)}

          <span className="fbcurrency-span">USD</span>
        </div>

        <button className="fbinvite-btn" onClick={() => handleInvite(c)}>
          Invite
        </button>

        <button className="fbrfp-btn" onClick={() => handleRFP(c)}>
          RFP
        </button>

        <button className="fbproposal-btn" onClick={() => handleProposal(c)}>
          Proposal
        </button>

        {c.price && (
          <button className="fbdeal-btn" onClick={() => handleDeal(c)}>
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
            rows={8}
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
            placeholder="Enter your RFP message..."
            rows={8}
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
            <button className="fbcancel-btn" onClick={handleRfpCancel}>
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
 <div
    className={
      managerResultsRef.current.length > 0
        ? "fb-container-after-search"
        : "fb-container-before-search"
    }
  >
      {issueRef.current && (
        <div className="fbissue-container">
          <span className="fbissuekey-span">{issueRef.current.key}</span>
          <span className="fbissuesummary-span">
            {issueRef.current.summary}
          </span>
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

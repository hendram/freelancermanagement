import React, { useRef, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./MyInvitation.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function MyInvitation({ goBackMI }) {
  const forceUpdate = useForceUpdate();

  // ------------------------------
  // REFS
  // ------------------------------
  const emailRef = useRef("");
  const invitationsRef = useRef([]);
  const verifiedRef = useRef(false);
  const loadingRef = useRef(false);
  const errorRef = useRef(null);

  // Used for new proposal and price inputs (one per invitation)
  const newProposalRefs = useRef({});
  const priceRefs = useRef({});
  const priceUnitRefs = useRef({});

  const priceUnits = [
    "per/hour",
    "per/day",
    "per/week",
    "per/month",
    "per/task",
    "per/bug",
    "per/userstory",
  ];

  // --------------------------
  // SUBMIT EMAIL
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingRef.current = true;
    errorRef.current = null;
    invitationsRef.current = [];
    verifiedRef.current = false;
    forceUpdate();

    const email = emailRef.current.value.trim();
    if (!email) {
      errorRef.current = "Please enter your email.";
      loadingRef.current = false;
      forceUpdate();
      return;
    }

    try {
      const resumeCheck = await invoke("checkresumebyemail", { email });
      if (!resumeCheck?.exists) {
        errorRef.current = "No resume found for this email.";
        loadingRef.current = false;
        forceUpdate();
        return;
      }

      const res = await invoke("getinvitations", {
        resumeId: resumeCheck.resumeId,
      });
           console.log("res", res);   
         
      if (res?.success && Array.isArray(res.data)) {
        invitationsRef.current = res.data;
        verifiedRef.current = true;
      } else {
        errorRef.current = "Failed to fetch invitations.";
      }
    } catch (err) {
      errorRef.current = "Unexpected error occurred.";
    } finally {
      loadingRef.current = false;
      forceUpdate();
    }
  };

  const handleReset = () => {
    emailRef.current.value = "";
    invitationsRef.current = [];
    verifiedRef.current = false;
    errorRef.current = null;
    forceUpdate();
  };

  // --------------------------
  // SUBMIT PRICE + NEW PROPOSAL
  // --------------------------
  const handleSubmitProposal = async (inv) => {
    const newProposal = newProposalRefs.current[inv.id]?.value.trim() || "";
    const price = priceRefs.current[inv.id]?.value.trim() || "";
    const priceUnit = priceUnitRefs.current[inv.id]?.value || "per/task";

    try {
      await invoke("sendpriceproposal", {
        issueId: inv.issue_id,
        resumeId: inv.resume_id,
        newProposal,
        price,
        priceUnit,

        // NEW >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        referrers: Array.isArray(inv.referrers) ? inv.referrers : [],
        referees: Array.isArray(inv.referees) ? inv.referees : []
        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      });

      alert("Submitted.");
    } catch (err) {
      alert("Failed to submit.");
    }
  };

  // ---------------------------
  // EMAIL INPUT SCREEN
  // ---------------------------
  if (!verifiedRef.current) {
    return (
      <div className="email-verification">
        <h2>Enter your email to access invitations</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            ref={emailRef}
            required
          />

          <button type="submit" disabled={loadingRef.current}>
            {loadingRef.current ? "Verifying..." : "Submit"}
          </button>

          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </form>

        {errorRef.current && <p className="error">{errorRef.current}</p>}

        <button className="back-btn" onClick={goBackMI}>
          Back
        </button>
      </div>
    );
  }

  // ---------------------------
  // INVITATIONS
  // ---------------------------
  return (
    <div className="myinvitation-container">
      {invitationsRef.current.length === 0 && <div>No invitations found.</div>}

      {invitationsRef.current.map((inv) => {
        // Normalize arrays
        const rfpArr = Array.isArray(inv.rfp) ? inv.rfp : [];
        const proposalsArr = Array.isArray(inv.proposals)
          ? inv.proposals
          : [];

        // Build interleaved RFP + Proposal text
        const interleaved = [];
        const max = Math.max(rfpArr.length, proposalsArr.length);

        for (let i = 0; i < max; i++) {
          if (rfpArr[i]) interleaved.push(rfpArr[i]);
          if (proposalsArr[i]) interleaved.push(proposalsArr[i]);
        }

        const combinedText = interleaved.join("\n");

        return (
          <div key={inv.id} className="invitation-block">
            {/* Issue header */}
            <div className="issue-container">
              <div className="issuetype-div">
                <span className="issuetype-span">{inv.issue_type}</span>
              </div>
              <div className="issuekey-div">
                <span className="issuekey-span">{inv.issue_key}</span>
              </div>
              <div className="issuesummary-div">
                <span className="issuesummary-span">{inv.issue_summary}</span>
              </div>
            </div>

            {/* RFP + PROPOSAL (readonly combined) */}
            <div className="rfp-block">
              <label className="rfp-label">RFP + Your Proposals:</label>
              <textarea
                className="rfp-textarea"
                defaultValue={combinedText}
                rows="6"
                readOnly
              />
            </div>

            {/* NEW PROPOSAL */}
            <div className="proposal-block">
              <label className="proposal-label">New Proposal:</label>
              <textarea
                className="proposal-textarea"
                ref={(el) => (newProposalRefs.current[inv.id] = el)}
                placeholder="Write your new proposal..."
                rows="4"
              />
            </div>

            {/* PRICE */}
            <div className="price-div">
              <span className="price-span">Price:</span>

              <input
                className="price-amount"
                type="text"
                defaultValue={inv.price || ""}
                placeholder="500"
                ref={(el) => (priceRefs.current[inv.id] = el)}
              />

              <span className="currency-span">USD</span>

              <select
                defaultValue={inv.price_unit || "per/task"}
                ref={(el) => (priceUnitRefs.current[inv.id] = el)}
              >
                {priceUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="actions">
              <button
                className="submit-btn"
                onClick={() => handleSubmitProposal(inv)}
              >
                Submit
              </button>
              <button className="pass-btn">Pass</button>
              <button className="back-btn" onClick={goBackMI}>
                Back
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

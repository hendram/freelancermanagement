import React, { useRef, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./MyInvitation.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function MyInvitation({ goBackMI }) {
  const forceUpdate = useForceUpdate();

  const emailRef = useRef("");
  const invitationsRef = useRef([]);
  const verifiedRef = useRef(false);
  const loadingRef = useRef(false);
  const errorRef = useRef(null);

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

  // -----------------------------------------
  // EMAIL SUBMIT (THE ONLY ENTRY POINT)
  // -----------------------------------------
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
      // First: verify the email → get resume ID
      const resumeCheck = await invoke("checkresumebyemail", { email });
   console.log("resumeCheck", resumeCheck);
      if (!resumeCheck?.exists || !resumeCheck.resumeId) {
        errorRef.current = "No resume found for this email.";
        loadingRef.current = false;
        forceUpdate();
        return;
      }

      // Second: load invitations
      const inv = await invoke("getinvitations", {
        resumeId: resumeCheck.resumeId,
      });

      console.log("inv", inv);
      invitationsRef.current = Array.isArray(inv?.data) ? inv.data : [];
      verifiedRef.current = true;
       
    } catch (err) {
      errorRef.current = "Unexpected server error.";
    }

    loadingRef.current = false;
    forceUpdate();
  };

  // Reset form
  const handleReset = () => {
    emailRef.current.value = "";
    invitationsRef.current = [];
    verifiedRef.current = false;
    errorRef.current = null;
    forceUpdate();
  };

  // -----------------------------------------
  // SUBMIT PROPOSAL
  // -----------------------------------------
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
        referrers: Array.isArray(inv.referrers) ? inv.referrers : [],
        referees: Array.isArray(inv.referees) ? inv.referees : []
      });

      alert("Submitted.");
    } catch (err) {
      alert("Failed to submit.");
    }
  };

  // -----------------------------------------
  // EMAIL PAGE
  // -----------------------------------------
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

  // -----------------------------------------
  // INVITATION PAGE
  // -----------------------------------------
  return (
    <div className="myinvitation-container">

      {invitationsRef.current.length === 0 && (
        <div>No invitations found.</div>
      )}

      {invitationsRef.current.map((inv) => {


        const rfpArr = Array.isArray(inv.rfp) ? inv.rfp : [];
        const proposalsArr = Array.isArray(inv.proposals) ? inv.proposals : [];

        const interleaved = [];
        const max = Math.max(rfpArr.length, proposalsArr.length);
        for (let i = 0; i < max; i++) {
          if (rfpArr[i]) interleaved.push(rfpArr[i]);
          if (proposalsArr[i]) interleaved.push(proposalsArr[i]);
        }

        const combinedText = interleaved.join("\n");

        return (
          <div key={inv.id} className="invitation-block">

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

        <div className="refer-block">
          <div className="referrer-div">
  <span className="referrer-span">Refer By:</span>
  {Array.isArray(inv.referrers) && inv.referrers.length > 0 ? (
    inv.referrers.map((r, idx) => (
      <div key={idx}>
        {r.referrer_first_name} {r.referrer_last_name}
      </div>
    ))
  ) : (
    <div>—</div>
  )}
</div>

<div className="referree-div">
  <span className="referree-span">Refer To:</span>
  {Array.isArray(inv.referees) && inv.referees.length > 0 ? (
    inv.referees.map((r, idx) => (
      <div key={idx}>
        {r.referrer_first_name} {r.referrer_last_name}
      </div>
    ))
  ) : (
    <div>—</div>
  )}
</div>
 </div>    

            <div className="rfp-block">
              <label className="rfp-label">RFP + Your Proposals:</label>
              <textarea
                className="rfp-textarea"
                defaultValue={combinedText}
                rows="6"
                readOnly
              />
            </div>

            <div className="proposal-block">
              <label className="proposal-label">New Proposal:</label>
              <textarea
                className="proposal-textarea"
                ref={(el) => (newProposalRefs.current[inv.id] = el)}
                placeholder="Write your new proposal..."
                rows="4"
              />
            </div>

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

            <div className="actions">
              <button
                className="submit-btn"
                onClick={() => handleSubmitProposal(inv)}
              >
                Submit
              </button>
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

import React, { useRef, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./MyInvitation.css";
import RefereeEditor from "./RefereeEditor";

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

  const submitStatusRef = useRef({}); // { [inv.id]: "idle" | "submitting" | "submitted" }

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("email");
    if (input) input.value = "";
  });

  // -----------------------------------------
  // EMAIL SUBMIT
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
      const resumeCheck = await invoke("checkresumebyemail", { email });
      console.log("resumeCheck", resumeCheck);

      if (!resumeCheck?.exists || !resumeCheck.resumeId) {
        errorRef.current = "No resume found for this email.";
        loadingRef.current = false;
        forceUpdate();
        return;
      }

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

  const handleReset = () => {
    emailRef.current.value = "";
    invitationsRef.current = [];
    verifiedRef.current = false;
    errorRef.current = null;
    forceUpdate();
  };

  // -----------------------------------------
  // SUBMIT PROPOSAL (LOCKED IF DEAL = YES)
  // -----------------------------------------
  const handleSubmitProposal = async (inv) => {
    if (inv.deal === "yes") return; // HARD LOCK

    submitStatusRef.current[inv.id] = "submitting";
    forceUpdate();

    const newProposal =
      newProposalRefs.current[inv.id]?.value.trim() || "";
    const price =
      priceRefs.current[inv.id]?.value.trim() || "";

    try {
      await invoke("sendpriceproposal", {
        issueId: inv.issue_id,
        resumeId: inv.resume_id,
        newProposal,
        price,
        referrers: Array.isArray(inv.referrers) ? inv.referrers : [],
        referees: inv.refereesEdited
          ? inv.refereesEdited
          : Array.isArray(inv.referees)
          ? inv.referees
          : [],
      });

      submitStatusRef.current[inv.id] = "submitted";
      forceUpdate();

      setTimeout(() => {
        submitStatusRef.current[inv.id] = "idle";
        forceUpdate();
      }, 1500);
    } catch (err) {
      alert("Failed to submit.");
      submitStatusRef.current[inv.id] = "idle";
      forceUpdate();
    }
  };

  // -----------------------------------------
  // EMAIL PAGE
  // -----------------------------------------
  if (!verifiedRef.current) {
    return (
      <div className="email-verification">
        <label className="emaillabel" htmlFor="email">
          Please enter your email to access invitations:
        </label>

        <div className="email-div">
          <input
            id="email"
            className="email"
            type="email"
            placeholder="you@example.com"
            ref={emailRef}
            required
          />
        </div>

        <div className="ebuttons-btn">
          <button
            className="elogin-btn"
            onClick={(e) => handleSubmit(e)}
            disabled={loadingRef.current}
          >
            {loadingRef.current ? "Verifying..." : "Submit"}
          </button>
          <button className="ereset-btn" onClick={handleReset}>
            Reset
          </button>
          <button className="eback-btn" onClick={goBackMI}>
            Back
          </button>
        </div>

        {errorRef.current && <p className="error">{errorRef.current}</p>}
      </div>
    );
  }

  // -----------------------------------------
  // INVITATION PAGE
  // -----------------------------------------
  return (
    <div className="myinvitation-container">
      {invitationsRef.current.length === 0 && (
        <div className="noinvitation-div">No invitations found.</div>
      )}

      {invitationsRef.current.map((inv) => {
        const hasNegotiation =
          Array.isArray(inv.negotiation) && inv.negotiation.length > 0;

        const dealLocked = inv.deal === "yes";

        return (
          <div key={inv.id} className="invitation-block">
            <div className="issue-container">
              <div className="issuetype-div">
                <span className="issuetype-span">{inv.issue_type}</span>
              </div>

              <div className="issuekeysummary-div">
                <div className="issuekey-div">{inv.issue_key}</div>
                <div className="issuesummary-div">{inv.issue_summary}</div>
              </div>
            </div>

            {/* ---------------- RFP HISTORY ---------------- */}
            {hasNegotiation && (
              <div className="rfp-block">
                <label className="rfp-label">RFP:</label>
                 <div className="rfptextarea-div">
                <textarea
                  className="rfp-textarea"
  value={
    (() => {
      let rfpCount = 0;
      let proposalCount = 0;

      return inv.negotiation
        .map((round) => {
          const rfps = round.rfp.map((r) => {
            rfpCount++;
            return `RFP${rfpCount}: ${r}`;
          });

          const proposals = round.proposals.map((p) => {
            proposalCount++;
            return `Proposal${proposalCount}: ${p}`;
          });

          return [...rfps, ...proposals].join("\n");
        })
        .join("\n\n\n");
    })()   
  }

                  rows="8"
                  readOnly
                />
  </div>
              </div>
            )}

            {/* ---------------- NEW PROPOSAL ---------------- */}
            {!dealLocked && hasNegotiation && (
              <div className="proposal-block">
                <label className="proposal-label">New Proposal:</label>
                   <div className="proposaltextarea-div">
                   <textarea
                  className="proposal-textarea"
                  ref={(el) => (newProposalRefs.current[inv.id] = el)}
                  placeholder="Write your new proposal..."
                  rows="4"
                />
              </div>
              </div>
            )}

            {/* ---------------- PRICE ---------------- */}
            <div className="price-div">
              <label className="price-label">Price:</label>

              {dealLocked ? (
                <div className="price-locked">
                  {inv.price} USD
                </div>
              ) : (
               <div className="priceinput-div">
                <input
                  className="priceinput"
                  type="number"
                  defaultValue={inv.price || ""}
                  placeholder="100"
                  ref={(el) => (priceRefs.current[inv.id] = el)}
                />
                </div>
              )}
            </div>

            {/* ---------------- ACTIONS ---------------- */}
            <div className="actions">
              <button
                className="submitinvite-btn"
                disabled={dealLocked}
                onClick={() => handleSubmitProposal(inv)}
              >
                {dealLocked
                  ? "Deal Locked"
                  : submitStatusRef.current[inv.id] === "submitting"
                  ? "Submitting..."
                  : submitStatusRef.current[inv.id] === "submitted"
                  ? "Submitted"
                  : "Submit"}
              </button>

              <button className="backinvite-btn" onClick={goBackMI}>
                Back
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

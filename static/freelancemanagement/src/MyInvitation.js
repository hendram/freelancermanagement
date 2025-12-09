import React, { useRef, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./MyInvitation.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function MyInvitation({ goBackMI }) {
  const forceUpdate = useForceUpdate();

  // Refs instead of state
  const emailRef = useRef("");
  const invitationsRef = useRef([]);
  const verifiedRef = useRef(false);
  const loadingRef = useRef(false);
  const errorRef = useRef(null);

  const priceUnits = [
    "per/hour",
    "per/day",
    "per/week",
    "per/month",
    "per/task",
    "per/bug",
    "per/userstory",
  ];

  // -------------------------
  // SUBMIT EMAIL
  // -------------------------
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

      if (res?.success && Array.isArray(res.data)) {
        invitationsRef.current = res.data;
        verifiedRef.current = true;
      } else {
        errorRef.current = res?.error || "Failed to fetch invitations.";
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

  // -------------------------
  // EMAIL INPUT SCREEN
  // -------------------------
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

  // -------------------------
  // INVITATIONS VIEW
  // -------------------------
  return (
    <div className="myinvitation-container">
      {invitationsRef.current.length === 0 && <div>No invitations found.</div>}

      {invitationsRef.current.map((data) => {
        const referrerNames = Array.isArray(data.referrers)
          ? data.referrers.map((r) => r.name).join(", ")
          : "";
        const refereeNames = Array.isArray(data.referees)
          ? data.referees.map((r) => r.name).join(", ")
          : "";

        const showRfpProposal =
          (Array.isArray(data.rfp) && data.rfp.length > 0) ||
          (Array.isArray(data.proposals) && data.proposals.length > 0);

        return (
          <div key={data.id} className="myinvitation-container">
            {/* LABEL */}
            <div className="issue-container">
              <div className="issuetype-div">
                <span className="issuetype-span">{data.issue_type}</span>
              </div>
              <div className="issuekey-div">
                <span className="issuekey-span">{data.issue_key}</span>
              </div>
              <div className="issuesummary-div">
                <span className="issuesummary-span">{data.issue_summary}</span>
              </div>
            </div>

            {/* REFERRER */}
            <div className="refer-container">
              <div className="referby-div">
                <b>Refer by:</b> {referrerNames}
              </div>
              <div className="referto-div">
                <b>Refer To:</b> {refereeNames}
              </div>
            </div>

            {/* PROPOSAL */}
            {showRfpProposal && (
              <div className="rfpproposal-div">
                {Array.isArray(data.rfp) && data.rfp.length > 0 && (
                  <div className="rfp-div">
                    <label className="rfp-label">Rfp:</label>
                    <textarea
                      className="rfp-textarea"
                      defaultValue={data.rfp.join(", ")}
                      rows="4"
                    />
                  </div>
                )}
                {Array.isArray(data.proposals) && data.proposals.length > 0 && (
                  <div className="proposal-div">
                    <label className="proposal-label">Proposal:</label>
                    <textarea
                      className="proposal-textarea"
                      defaultValue={data.proposals.join(", ")}
                      rows="4"
                    />
                  </div>
                )}
              </div>
            )}

            {/* PRICE */}
            <div className="price-div">
              <span className="price-span">Price: </span>
              <div className="priceinput-div">
                <input
                  className="price-amount"
                  type="text"
                  defaultValue={data.price || ""}
                  placeholder="e.g. 500"
                />
                <span className="currency-span">USD</span>
                <select defaultValue={data.price_unit || "per/task"}>
                  {priceUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <hr />

            {/* PASS BUTTON */}
            <div className="passbackbutton-div">
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

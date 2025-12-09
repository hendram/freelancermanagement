import React, { useRef, useReducer } from "react";
import { invoke } from "@forge/bridge";
import "./MyInvitation.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function MyInvitation({ goBackMI }) {
  const forceUpdate = useForceUpdate();

  // Using refs instead of useState
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
    <div className="invitation-container">
      {invitationsRef.current.length === 0 && (
        <div>No invitations found.</div>
      )}

      {invitationsRef.current.map((data) => (
        <div key={data.id} className="my-invitation-card">
          {/* TITLE */}
          <div className="row title-row">
            <h2>
              {data.issue_type || "Task"}: {data.issue_summary || "No Summary"}
            </h2>
          </div>
          <hr />

          {/* LABEL */}
          <div className="row label-row">
            <span className="task-key">
              <b>Task Label:</b> {data.issue_key || "N/A"}
            </span>
            <p className="task-summary">
              {data.issue_summary || "No Summary"}
            </p>
          </div>
          <hr />

          {/* REFERRER */}
          <div className="row refer-row">
            <div className="refer-item">
              <b>Refer by:</b> {data.referrer_name || "N/A"}
            </div>
            <div className="refer-item">
              <b>Refer To:</b> {data.referee_name || "N/A"}
            </div>
          </div>
          <hr />

          {/* PROPOSAL */}
          {data.proposals != null && (
            <>
              <div className="row proposal-row">
                <label>Proposal:</label>
                <textarea defaultValue={data.proposals} rows="4"></textarea>
              </div>
              <hr />
            </>
          )}

          {/* PRICE */}
          <div className="row price-row">
            <label>
              <b>Price:</b>
            </label>
            <div className="price-inputs">
              <input
                type="text"
                defaultValue={data.price || ""}
                className="price-amount"
                placeholder="e.g. 500"
              />

              <span className="currency">USD</span>

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
          <div className="row pass-row flex-end">
            <button className="pass-btn">Pass</button>
          </div>
        </div>
      ))}

      <button onClick={handleReset} className="reset-btn">
        Change Email
      </button>

      <button className="back-btn" onClick={goBackMI}>
        Back
      </button>
    </div>
  );
}

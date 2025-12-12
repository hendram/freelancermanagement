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
  // SUBMIT PROPOSAL
  // -----------------------------------------
  const handleSubmitProposal = async (inv) => {
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

        {errorRef.current && (
          <p className="error">{errorRef.current}</p>
        )}

        <button className="back-btn" onClick={goBackMI}>
          Back
        </button>
      </div>
    );
  }

  // ======================================================
  //            GROUP BY issue_id  (ONE BLOCK)
  // ======================================================
  const grouped = {};

  for (const row of invitationsRef.current) {
    if (!grouped[row.issue_id]) {
      grouped[row.issue_id] = {
        ...row,
        _rfp: [],
        _proposals: [],
      };
    }

    if (Array.isArray(row.rfp)) grouped[row.issue_id]._rfp.push(...row.rfp);
    if (Array.isArray(row.proposals))
      grouped[row.issue_id]._proposals.push(...row.proposals);

    if (
      row.rfp_prop_id &&
      (!grouped[row.issue_id].rfp_prop_id ||
        row.rfp_prop_id > grouped[row.issue_id].rfp_prop_id)
    ) {
      grouped[row.issue_id].rfp_prop_id = row.rfp_prop_id;
      grouped[row.issue_id].price = row.price;
    }
  }

  const issueBlocks = Object.values(grouped);

  // -----------------------------------------
  // INVITATION PAGE
  // -----------------------------------------
  return (
    <div className="myinvitation-container">
      {issueBlocks.length === 0 && (
        <div className="noinvitation-div">No invitations found.</div>
      )}

      {issueBlocks.map((inv) => {
        const interleaved = [];
        const max = Math.max(inv._rfp.length, inv._proposals.length);

        for (let i = 0; i < max; i++) {
          if (inv._rfp[i]) interleaved.push(inv._rfp[i]);
          if (inv._proposals[i]) interleaved.push(inv._proposals[i]);
        }

        const combinedText = interleaved.join("\n");

        return (
          <div key={inv.id} className="invitation-block">
            <div className="issue-container">
              <div className="issuetype-div">{inv.issue_type}</div>

              <div className="issuekeysummary-div">
                <div className="issuekey-div">{inv.issue_key}</div>
                <div className="issuesummary-div">{inv.issue_summary}</div>
              </div>
            </div>

            <div className="refer-block">
              <div className="referrer-div">
                <div className="referby-div">Refer By:</div>
                {Array.isArray(inv.referrers) &&
                inv.referrers.length > 0 ? (
                  inv.referrers.map((r, idx) => (
                    <div className="referrername-div" key={idx}>
                      {r.referrer_first_name} {r.referrer_last_name}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>

              <div className="referree-div">
                <div className="referto-div">Refer To:</div>

                <RefereeEditor
                  initialReferees={
                    Array.isArray(inv.referees)
                      ? inv.referees.map(
                          (r) =>
                            `${r.referrer_first_name} ${r.referrer_last_name}`
                        )
                      : []
                  }
                  onChange={(newReferees) => {
                    inv.refereesEdited = newReferees;
                  }}
                />
              </div>
            </div>

            <div className="rfp-block">
              <label className="rfp-label">RFP:</label>
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

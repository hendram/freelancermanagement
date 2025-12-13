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

  // ======================================================
  //            GROUP BY issue_id  (ONE BLOCK)
  // ======================================================
// ======================================================
//        GROUP BY issue_id — ALWAYS PICK LATEST ROW
// ======================================================
const grouped = {};

console.log("🔍 Grouping invitations");

for (const row of invitationsRef.current) {
  console.log("Row:", row);

  const id = row.issue_id;

  // Skip rows with null invite_status (invalid garbage history)
  if (!row.invite_status) {
    console.log("⛔ Skipping null invite_status row:", row);
    continue;
  }

  // If first row for this issue_id → assign
  if (!grouped[id]) {
    grouped[id] = {
      ...row,
      latest_created_at: row.created_at,
      _rfp: Array.isArray(row.rfp) ? [...row.rfp] : [],
      _proposals: Array.isArray(row.proposals) ? [...row.proposals] : [],
    };
    continue;
  }

  // Pick the MOST RECENT row as the "real" data
  if (row.created_at > grouped[id].latest_created_at) {
    console.log("📌 Newer row found for issue:", id);

    grouped[id] = {
      ...row,
      latest_created_at: row.created_at,
      _rfp: grouped[id]._rfp,
      _proposals: grouped[id]._proposals,
    };
  }

  // Always merge RFP + proposals
  if (Array.isArray(row.rfp)) grouped[id]._rfp.push(...row.rfp);
  if (Array.isArray(row.proposals)) grouped[id]._proposals.push(...row.proposals);
}

const issueBlocks = Object.values(grouped);

console.log("📦 Final grouped blocks:", issueBlocks);

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
              <div className="issuetype-div">
               <span className="issuetype-span">{inv.issue_type}</span></div>

              <div className="issuekeysummary-div">
                <div className="issuekey-div">{inv.issue_key}</div>
                <div className="issuesummary-div">{inv.issue_summary}</div>
              </div>
            </div>

            <div className="refer-block">
              <div className="referrer-div">
                <div className="referby-div">Refer By:</div>
              <div className="referrernameblock-div" > 
               {Array.isArray(inv.referrers) &&
                inv.referrers.length > 0 ? (
                  inv.referrers.map((r, idx) => (
                    <div className="referrername-div" key={idx}>
                      {r.referrer_first_name} {r.referrer_last_name}
                    </div>
                  ))
                 
                ) : (
                  <div>""</div>
                )}
                 </div>
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
               <div className="rfplabel-div">
              <label className="rfp-label" htmlFor="rfp-textarea">RFP:</label>
                 </div>
               <div className="rfptextarea-div">
               <textarea
                id="rfp-textarea"
                className="rfp-textarea"
                defaultValue={combinedText}
                rows="6"
                readOnly
              />
               </div>
            </div>

            <div className="proposal-block">
             <div className="proposallabel-div">
              <label className="proposal-label" htmlFor="proposal-textarea">New Proposal:</label>
              </div>
              <div className="proposaltextarea-div">
              <textarea
                id="proposal-textarea"
                className="proposal-textarea"
                ref={(el) => (newProposalRefs.current[inv.id] = el)}
                placeholder="Write your new proposal..."
                rows="4"
              />
               </div>
            </div>

            <div className="price-div">
             <div className="pricelabel-div"> 
             <label className="price-label" htmlFor="priceinput" >Price:</label>
              </div>
               <div className="priceinput-div">
              <input
                id="priceinput"
                className="priceinput"
                type="number"
                defaultValue={inv.price || ""}
                placeholder="100"
                ref={(el) => (priceRefs.current[inv.id] = el)}
              />
              </div>
              <span className="currency-span">USD</span>
            </div>

            <div className="actions">
              <button
                className="submitinvite-btn"
                onClick={() => handleSubmitProposal(inv)}
              >
                Submit
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

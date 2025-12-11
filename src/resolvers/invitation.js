// src/resolvers/invitation.js
export default async function invitation({ payload, sql }) {
  // make inviteStatus mutable because RFP forces invite = "yes"
   console.log("payload", payload);

  let {
    issueType,
    issueKey,
    issueSummary,
    first_name,
    last_name,
    resumeId,
    inviteStatus,
    price,
    deal,
    rfpMessage // manager-provided RFP (may be empty/undefined)
  } = payload;

  if (!first_name) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  const hasRfp = rfpMessage && String(rfpMessage).trim() !== "";
  if (hasRfp) inviteStatus = "yes"; // sending RFP implies invite

  try {
    // ---------- ensure issue exists ----------
    let finalIssueId;
    const existingIssue = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (existingIssue.rows.length > 0) {
      finalIssueId = existingIssue.rows[0].id;
    } else {
      await sql
        .prepare(`INSERT INTO issues (issue_type, issue_key, issue_summary) VALUES (?, ?, ?)`)
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      const reselect = await sql
        .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
        .bindParams(issueKey)
        .execute();
      finalIssueId = reselect.rows[0].id;
    }

    // ---------- find latest invitation row for this issue+freelancer ----------
    const latestInvRes = await sql
      .prepare(`
        SELECT *
        FROM myinvitation
        WHERE issue_id = ? AND (resume_id = ?)
        ORDER BY id DESC
        LIMIT 1
      `)
      .bindParams(finalIssueId, resumeId || null)
      .execute();
   
    console.log("latestInvRes", latestInvRes);

    const latestInvite = latestInvRes.rows[0] || null;
    const finalPrice = inviteStatus === "yes" ? (price || null) : null;
    const finalDeal = inviteStatus === "yes" ? (deal || null) : null;

    // ---------- handle RFP (manager) ----------
    // If hasRfp: either append to latest rfp row (if proposals IS NULL) OR create new rfp_proposals + new myinvitation row.
    let createdRfpPropId = null;
    if (hasRfp) {
      const rfpText = String(rfpMessage).trim();

      if (latestInvite && latestInvite.rfp_prop_id) {
        // load the rfp_proposals row pointed by latestInvite
        const cur = await sql
          .prepare(`SELECT id, rfp_message, proposals FROM rfp_proposals WHERE id = ?`)
          .bindParams(latestInvite.rfp_prop_id)
          .execute();

        if (cur.rows.length === 0) {
          // pointer broken: treat as no existing row -> create new rfp_proposals + myinvitation row
          await sql
            .prepare(`INSERT INTO rfp_proposals (rfp_message, proposals) VALUES (?, NULL)`)
            .bindParams(rfpText)
            .execute();

          const fetchNew = await sql.prepare(`SELECT id FROM rfp_proposals ORDER BY id DESC LIMIT 1`).execute();
          createdRfpPropId = fetchNew.rows[0].id;

          // create a new myinvitation row referencing this new rfp row
          await sql
            .prepare(`
              INSERT INTO myinvitation (issue_id, resume_id, first_name, last_name, invite_status, price, deal, rfp_prop_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bindParams(finalIssueId, resumeId || null, first_name, last_name, "yes", finalPrice, finalDeal, createdRfpPropId)
            .execute();
        } else {
          const row = cur.rows[0];
          // If latest row has NO proposals yet -> concatenate RFP into that row's rfp_message (no new invitation)
          if (row.proposals === null) {
            const newRfpMsg = row.rfp_message
              ? row.rfp_message + "\n---\n" + rfpText
              : rfpText;

            await sql
              .prepare(`UPDATE rfp_proposals SET rfp_message = ? WHERE id = ?`)
              .bindParams(newRfpMsg, row.id)
              .execute();

            createdRfpPropId = row.id;
            // keep invitation rows as-is (they already reference this row)
          } else {
            // latest rfp row already has proposals -> create new rfp_proposals row + new myinvitation row
            await sql
              .prepare(`INSERT INTO rfp_proposals (rfp_message, proposals) VALUES (?, NULL)`)
              .bindParams(rfpText)
              .execute();

            const fetchNew = await sql.prepare(`SELECT id FROM rfp_proposals ORDER BY id DESC LIMIT 1`).execute();
            createdRfpPropId = fetchNew.rows[0].id;

            await sql
              .prepare(`
                INSERT INTO myinvitation (issue_id, resume_id, first_name, last_name, invite_status, price, deal, rfp_prop_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `)
              .bindParams(finalIssueId, resumeId || null, first_name, last_name, "yes", finalPrice, finalDeal, createdRfpPropId)
              .execute();
          }
        }
      } else {
        // No latest invite or no pointer: create first rfp_proposals row and create new myinvitation row referencing it
        await sql
          .prepare(`INSERT INTO rfp_proposals (rfp_message, proposals) VALUES (?, NULL)`)
          .bindParams(rfpText)
          .execute();

        const fetchNew = await sql.prepare(`SELECT id FROM rfp_proposals ORDER BY id DESC LIMIT 1`).execute();
        createdRfpPropId = fetchNew.rows[0].id;

        await sql
          .prepare(`
            INSERT INTO myinvitation (issue_id, resume_id, first_name, last_name, invite_status, price, deal, rfp_prop_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bindParams(finalIssueId, resumeId || null, first_name, last_name, "yes", finalPrice, finalDeal, createdRfpPropId)
          .execute();
      }
    } // end hasRfp

    // ---------- manager did not send RFP: just update or insert invitation row ----------
    if (!hasRfp) {
      if (latestInvite) {
        await sql
          .prepare(`UPDATE myinvitation SET invite_status = ?, price = ?, deal = ? WHERE id = ?`)
          .bindParams(inviteStatus, finalPrice, finalDeal, latestInvite.id)
          .execute();
      } else {
        await sql
          .prepare(`
            INSERT INTO myinvitation (issue_id, resume_id, first_name, last_name, invite_status, price, deal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bindParams(finalIssueId, resumeId || null, first_name, last_name, inviteStatus, finalPrice, finalDeal)
          .execute();
      }
    }

    return { success: true, issueId: finalIssueId, createdRfpPropId: createdRfpPropId || null };
  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e);
    return { success: false, error: e.message || String(e) };
  }
}

import crypto from "crypto";

export default async function invitation({ payload, sql }) {
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
    rfpMessage
  } = payload;

  if (!first_name) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  const hasRfp = rfpMessage && String(rfpMessage).trim() !== "";
  if (hasRfp) inviteStatus = "yes";

  try {
    /* ---------------- ensure issue exists ---------------- */
    let issueId;
    const issueRes = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (issueRes.rows.length) {
      issueId = issueRes.rows[0].id;
    } else {
      await sql
        .prepare(
          `INSERT INTO issues (issue_type, issue_key, issue_summary)
           VALUES (?, ?, ?)`
        )
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      const reselect = await sql
        .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
        .bindParams(issueKey)
        .execute();

      issueId = reselect.rows[0].id;
    }

    /* ---------------- load or create invitation ---------------- */
    const invRes = await sql
      .prepare(`
        SELECT *
        FROM myinvitation
        WHERE issue_id = ? AND resume_id = ?
        LIMIT 1
      `)
      .bindParams(issueId, resumeId)
      .execute();

    let invitationRow = invRes.rows[0] || null;
    let rfpPropId;

    if (!invitationRow) {
      // first time → create thread
      rfpPropId = crypto.randomUUID();

      await sql
        .prepare(`
          INSERT INTO myinvitation
          (issue_id, resume_id, first_name, last_name, invite_status, price, deal, rfp_prop_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          issueId,
          resumeId,
          first_name,
          last_name,
          inviteStatus,
          inviteStatus === "yes" ? price || null : null,
          inviteStatus === "yes" ? deal || null : null,
          rfpPropId
        )
        .execute();
    } else {
      rfpPropId = invitationRow.rfp_prop_id;

      await sql
        .prepare(`
          UPDATE myinvitation
          SET invite_status = ?, price = ?, deal = ?
          WHERE id = ?
        `)
        .bindParams(
          inviteStatus,
          inviteStatus === "yes" ? price || null : null,
          inviteStatus === "yes" ? deal || null : null,
          invitationRow.id
        )
        .execute();
    }

    /* ---------------- append RFP message ---------------- */
    if (hasRfp) {
      await sql
        .prepare(`
          INSERT INTO rfp_proposals
          (rfp_prop_id, rfp_message, proposal )
          VALUES (?, ?, NULL)
        `)
        .bindParams(
          rfpPropId,
          String(rfpMessage).trim()
        )
        .execute();
    }

    return {
      success: true,
      issueId,
      rfpPropId
    };
  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e);
    return { success: false, error: e.message || String(e) };
  }
}

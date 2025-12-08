export default async function invitation({ payload, sql }) {
  const {
    issueType,
    issueKey,
    issueSummary,
    freelancerName,
    resumeId,
    inviteStatus,
    rfpMessage,
    proposals,
    price,
    deal
  } = payload;

  if (!freelancerName) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  try {
    let finalIssueId = null;

    // ----------------------------- CHECK ISSUE ------------------------------
    const existingIssue = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (existingIssue.rows.length > 0) {
      finalIssueId = existingIssue.rows[0].id;
    } else {
      const inserted = await sql
        .prepare(`
          INSERT INTO issues (issue_type, issue_key, issue_summary)
          VALUES (?, ?, ?)
        `)
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      finalIssueId = inserted.lastInsertId;
     console.log("finalIssueIdinsert", finalIssueId);
    }

    // ----------------------------- CHECK INVITE -----------------------------
    const existingInvite = await sql
      .prepare(`
        SELECT id FROM myinvitation
        WHERE issue_id = ? AND freelancer_name = ?
      `)
      .bindParams(finalIssueId, freelancerName)
      .execute();

    const inviteRows = existingInvite.rows;
    console.log("inviteRowsmyinvitationfound", inviteRows);

    // ----------------------------- UPDATE -----------------------------
    if (inviteRows.length > 0) {
      const inviteId = inviteRows[0].id;

      await sql
        .prepare(`
          UPDATE myinvitation
          SET invite_status = ?, rfp_message = ?, proposals = ?, price = ?, deal = ?
          WHERE id = ?
        `)
        .bindParams(
          inviteStatus || null,
          rfpMessage || null,
          proposals || null,
          price || null,
          deal || null,
          inviteId
        )
        .execute();
    }

    // ----------------------------- INSERT -----------------------------
    else {
      await sql
        .prepare(`
          INSERT INTO myinvitation
          (issue_id, resume_id, freelancer_name, invite_status, rfp_message, proposals, price, deal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          finalIssueId,
          resumeId || null,
          freelancerName,
          inviteStatus || null,
          rfpMessage || null,
          proposals || null,
          price || null,
          deal || null
        )
        .execute();
    }

    return { success: true, issueId: finalIssueId };

  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e.stack);
    return { success: false, error: e.message };
  }
}

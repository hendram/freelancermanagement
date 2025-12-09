export default async function invitation({ payload, sql }) {
  const {
    issueType,
    issueKey,
    issueSummary,
    freelancerName,
    resumeId,
    inviteStatus,
    price,
    deal
  } = payload;

  if (!freelancerName) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  try {
    let finalIssueId = null;

    // ---------- CHECK ISSUE ----------
    const existingIssue = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (existingIssue.rows.length > 0) {
      finalIssueId = existingIssue.rows[0].id;
    } else {
      // Insert issue
      await sql
        .prepare(`
          INSERT INTO issues (issue_type, issue_key, issue_summary)
          VALUES (?, ?, ?)
        `)
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      // SELECT AGAIN because Forge SQL has no lastInsertId
      const reselect = await sql
        .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
        .bindParams(issueKey)
        .execute();

      finalIssueId = reselect.rows[0].id;
    }

    // ---------- CHECK INVITATION ----------
    const existingInvite = await sql
      .prepare(`
        SELECT id FROM myinvitation
        WHERE issue_id = ? AND freelancer_name = ?
      `)
      .bindParams(finalIssueId, freelancerName)
      .execute();

    const invite = existingInvite.rows[0];

    const finalPrice = inviteStatus === "yes" ? price || null : null;
    const finalDeal  = inviteStatus === "yes" ? deal  || null : null;

    // ---------- UPDATE ----------
    if (invite) {
      await sql
        .prepare(`
          UPDATE myinvitation
          SET invite_status = ?, price = ?, deal = ?
          WHERE id = ?
        `)
        .bindParams(inviteStatus, finalPrice, finalDeal, invite.id)
        .execute();
    }

    // ---------- INSERT ----------
    else {
      await sql
        .prepare(`
          INSERT INTO myinvitation
            (issue_id, resume_id, freelancer_name, invite_status, price, deal)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          finalIssueId,
          resumeId || null,
          freelancerName,
          inviteStatus,
          finalPrice,
          finalDeal
        )
        .execute();
    }

    return { success: true, issueId: finalIssueId };

  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e);
    return { success: false, error: e.message };
  }
}

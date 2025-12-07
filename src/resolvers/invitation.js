// resolvers/invitation.js
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

    // ----------------------------------------------------------
    // ALWAYS check DB first for issue_key (ignore frontend issueId)
    // ----------------------------------------------------------
    const existingIssue = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    console.log("existingIssue", existingIssue);

    if (existingIssue && existingIssue.id) {
      // Found existing issue row
      finalIssueId = existingIssue.id;
    } else {
      // Insert new issue row
      const inserted = await sql
        .prepare(`
          INSERT INTO issues (issue_type, issue_key, issue_summary)
          VALUES (?, ?, ?)
        `)
        .bindParams(issueType, issueKey, issueSummary)
        .execute();
       
      console.log("inserted", inserted);
      finalIssueId = inserted.lastInsertId;
      console.log("finalIssueId", finalIssueId);

    }

    if (!finalIssueId) {
      throw new Error("Could not resolve issue ID");
    }

    // ----------------------------------------------------------
    // Check if freelancer already has negotiation for this issue
    // ----------------------------------------------------------
    const existingInvite = await sql
      .prepare(`
        SELECT id FROM myinvitation
        WHERE issue_id = ? AND freelancer_name = ?
      `)
      .bindParams(finalIssueId, freelancerName)
      .execute();
     console.log("existinginvite", existingInvite);

    // ----------------------------------------------------------
    // Update path
    // ----------------------------------------------------------
    if (existingInvite && existingInvite.id) {
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
          existingInvite.id
        )
        .execute();
    }
    // ----------------------------------------------------------
    // Insert path
    // ----------------------------------------------------------
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

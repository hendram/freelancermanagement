// src/resolvers/getrfppropmanager.js
export default async function getrfppropmanager({ payload, sql }) {
  const { resumeId, issueId: issueKey } = payload; // issueId from frontend is actually issueKey

  if (!resumeId || !issueKey) {
    return { success: false, error: "resumeId and issueKey are required" };
  }

  try {
    // 1) Get all issue_id for this freelancer
    const invIssues = await sql
      .prepare(
        `
        SELECT DISTINCT issue_id
        FROM myinvitation
        WHERE resume_id = ?
      `
      )
      .bindParams(resumeId)
      .execute();

    console.log("invIssues", invIssues);

    if (!invIssues.rows.length) {
      return { success: true, data: [] };
    }

    // 2) From these issue_id values, find the one whose issue_key matches
    const issueIds = invIssues.rows.map(r => r.issue_id);

    const placeholders = issueIds.map(() => "?").join(",");

    const issueLookup = await sql
      .prepare(
        `
        SELECT id 
        FROM issues
        WHERE issue_key = ? 
          AND id IN (${placeholders})
        LIMIT 1
      `
      )
      .bindParams(issueKey, ...issueIds)
      .execute();

    console.log("issueLookup", issueLookup);

    if (!issueLookup.rows.length) {
      return { success: true, data: [] };
    }

    const realIssueId = issueLookup.rows[0].id;

    // 3) Now get rfp_prop_id linked to this resume_id + realIssueId
    const invs = await sql
      .prepare(
        `
        SELECT rfp_prop_id 
        FROM myinvitation
        WHERE resume_id = ? 
          AND issue_id = ? 
          AND rfp_prop_id IS NOT NULL
        ORDER BY id ASC
      `
      )
      .bindParams(resumeId, realIssueId)
      .execute();

    console.log("invsgetrfpprop", invs);

    if (!invs.rows.length) {
      return { success: true, data: [] };
    }

    const out = [];

    for (const inv of invs.rows) {
      const rfpRows = await sql
        .prepare(
          `
          SELECT rfp_message, proposals
          FROM rfp_proposals
          WHERE rfp_prop_id = ?
        `
        )
        .bindParams(inv.rfp_prop_id)
        .execute();

      console.log("rfpRows", rfpRows);

      if (rfpRows.rows.length > 0) {
        const row = rfpRows.rows[0];
        out.push({
          rfp: row.rfp_message ? row.rfp_message.split(/\r?\n/) : [],
          proposals: row.proposals ? row.proposals.split(/\r?\n/) : [],
        });
      }
    }

    return { success: true, data: out };
  } catch (err) {
    console.error("ERROR getrfppropmanager:", err);
    return { success: false, error: err.message || String(err) };
  }
}

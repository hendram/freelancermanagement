// src/resolvers/getrfppropmanager.js
export default async function getrfppropmanager({ payload, sql }) {
  const { resumeId, issueId } = payload;

  if (!resumeId || !issueId) {
    return { success: false, error: "resumeId and issueId are required" };
  }

  try {
    // 1. Find all invitations for this candidate and issue that have an rfp_prop_id
    const invs = await sql
      .prepare(
        `
        SELECT rfp_prop_id 
        FROM myinvitation
        WHERE resume_id = ? AND issue_id = ? AND rfp_prop_id IS NOT NULL
        ORDER BY id ASC
      `
      )
      .bindParams(resumeId, issueId)
      .execute();

    if (!invs.rows.length) {
      return { success: true, data: [] }; // no RFP/proposals
    }

    const out = [];

    for (const inv of invs.rows) {
      const rfpRows = await sql
        .prepare(
          `
          SELECT rfp_message, proposals
          FROM rfp_proposals
          WHERE id = ?
        `
        )
        .bindParams(inv.rfp_prop_id)
        .execute();

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

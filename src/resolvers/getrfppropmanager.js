export default async function getrfppropmanager({ payload, sql }) {
  const { resumeId, issueId: issueKey } = payload;

  if (!resumeId || !issueKey) {
    return { success: false, error: "resumeId and issueKey are required" };
  }

  try {
    // 1️⃣ resolve issue_id from issue_key
    const issueRes = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ? LIMIT 1`)
      .bindParams(issueKey)
      .execute();

    if (!issueRes.rows.length) {
      return { success: true, data: [] };
    }

    const issueId = issueRes.rows[0].id;

    // 2️⃣ resolve rfp_prop_id from invitation
    const invRes = await sql
      .prepare(`
        SELECT rfp_prop_id
        FROM myinvitation
        WHERE resume_id = ?
          AND issue_id = ?
          AND rfp_prop_id IS NOT NULL
        LIMIT 1
      `)
      .bindParams(resumeId, issueId)
      .execute();

    if (!invRes.rows.length) {
      return { success: true, data: [] };
    }

    const rfpPropId = invRes.rows[0].rfp_prop_id;

    // 3️⃣ load ALL negotiation rows
    const rfpRows = await sql
      .prepare(`
        SELECT round_no, rfp_message, proposals
        FROM rfp_proposals
        WHERE rfp_prop_id = ?
        ORDER BY round_no ASC
      `)
      .bindParams(rfpPropId)
      .execute();

    const negotiation = rfpRows.rows.map(row => ({
      round_no: row.round_no,
      rfp: row.rfp_message
        ? row.rfp_message.split(/\r?\n/).filter(Boolean)
        : [],
      proposals: row.proposals
        ? row.proposals.split(/\r?\n/).filter(Boolean)
        : [],
    }));

    return { success: true, data: negotiation };
  } catch (err) {
    console.error("ERROR getrfppropmanager:", err);
    return { success: false, error: err.message || String(err) };
  }
}

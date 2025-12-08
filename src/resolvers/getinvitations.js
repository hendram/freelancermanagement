export default async function getinvitations({ payload, sql }) {
  const { resumeId } = payload;

  if (!resumeId) return { success: false, error: "resumeId is required" };

  try {
    // Join myinvitation with issues to get full issue info
    const result = await sql
      .prepare(`
        SELECT
          mi.id,
          i.issue_type,
          i.issue_key,
          i.issue_summary,
          mi.freelancer_name,
          mi.referrer_name,
          mi.referee_name,
          mi.invite_status,
          mi.rfp_message AS rfp,
          mi.proposals,
          mi.price,
          mi.price_unit,
          mi.deal
        FROM myinvitation mi
        INNER JOIN issues i ON mi.issue_id = i.id
        WHERE mi.resume_id = ?
        ORDER BY mi.id DESC
      `)
      .bindParams(resumeId)
      .execute();

   console.log("result", result);
    return { success: true, data: result.rows };
  } catch (e) {
    console.error("SQL ERROR (getInvitations):", e.stack);
    return { success: false, error: e.message };
  }
}

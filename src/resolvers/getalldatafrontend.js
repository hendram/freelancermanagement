export default async function getalldatafrontend({ sql }) {
  try {

    const result = await sql
      .prepare(`
        SELECT
          r.id           AS resume_id,
          r.photo_base64,              -- ✅ ADDED
          r.first_name,
          r.last_name,
          r.skills,

          i.id           AS issue_id,
          i.issue_key,
          i.issue_summary,

          mi.invite_status,
          mi.deal

        FROM resumes r

        LEFT JOIN myinvitation mi
          ON mi.resume_id = r.id
         AND mi.invite_status = 'yes'

        LEFT JOIN issues i
          ON i.id = mi.issue_id

        ORDER BY r.created_at DESC
      `)
      .execute();


    const map = {};

    for (const row of result.rows) {
      if (!map[row.resume_id]) {
        map[row.resume_id] = {
          resume_id: row.resume_id,
          photo_base64: row.photo_base64,   // ✅ ADDED
          first_name: row.first_name,
          last_name: row.last_name,
          skills: row.skills,
          issues: []
        };
      }

      if (row.issue_id) {
        map[row.resume_id].issues.push({
          issue_key: row.issue_key,
          summary: row.issue_summary,
          invite_status: row.invite_status,
          deal: row.deal
        });
      }
    }

    const out = Object.values(map);

    return out;

  } catch (err) {
    console.error("❌ getalldatafrontend ERROR:", err);
    throw err;
  }
}

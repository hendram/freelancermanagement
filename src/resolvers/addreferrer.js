export default async function addreferrer({ payload, sql }) {
  try {
    const { resume_id, referrer, issue_key, issue_summary } = payload;

    if (!resume_id || !referrer || !issue_key || !issue_summary) {
      return { success: false, error: "Missing data" };
    }

    // Load owner resume
    const resumeRow = await sql.prepare(
      `SELECT first_name, last_name 
       FROM resumes 
       WHERE id = ?
       LIMIT 1`
    )
    .bindParams(resume_id)
    .execute();

    if (!resumeRow.rows.length) {
      return { success: false, error: "resume_id not found" };
    }

    const owner_first = resumeRow.rows[0].first_name || "";
    const owner_last  = resumeRow.rows[0].last_name || "";

    // Split referrer fullName
    const parts = referrer.trim().split(" ");
    const ref_first = parts[0] || "";
    const ref_last  = parts.slice(1).join(" ") || "";

    // Duplicate check (FIXED)
    const existing = await sql.prepare(`
      SELECT 1
      FROM referrers
      WHERE resume_id = ?
        AND referrer_first_name = ?
        AND referrer_last_name = ?
        AND issue_key = ?
      LIMIT 1
    `)
    .bindParams(
      resume_id,
      ref_first,
      ref_last,
      issue_key
    )
    .execute();

    console.log("existing:", existing.rows);

    if (!existing.rows.length) {
      await sql.prepare(`
        INSERT INTO referrers (
          resume_id, first_name, last_name,
          referrer_first_name, referrer_last_name,
          issue_key, issue_summary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bindParams(
        resume_id,
        owner_first,
        owner_last,
        ref_first,
        ref_last,
        issue_key,
        issue_summary
      )
      .execute();
    }

    return { success: true };

  } catch (err) {
    console.error("addreferrer error:", err.stack);
    return { success: false, error: "SQL error while adding referrer" };
  }
}

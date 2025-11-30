export default async function addreferrer({ payload, sql }) {
  try {
    const { resume_id, referrer, userStories } = payload;

    if (!resume_id || !referrer || !userStories?.length) {
      return { success: false, error: "Missing data" };
    }

    const resumeRow = await sql.prepare(
      `SELECT first_name, last_name FROM resumes WHERE id = ? LIMIT 1`
    ).bindParams(resume_id).execute();

    if (!resumeRow.rows.length) {
      return { success: false, error: "resume_id not found" };
    }

    const first_name = resumeRow.rows[0].first_name || "";
    const last_name  = resumeRow.rows[0].last_name || "";

    const parts = referrer.trim().split(" ");
    const ref_first_name = parts[0] || "";
    const ref_last_name  = parts.slice(1).join(" ") || "";

    for (const story of userStories) {
      const existing = await sql.prepare(`
        SELECT 1 FROM referrers
        WHERE resume_id = ?
          AND first_name = ?
          AND last_name = ?
          AND referrer_first_name = ?
          AND referrer_last_name = ?
          AND user_story = ?
        LIMIT 1
      `)
      .bindParams(
        resume_id,
        first_name,
        last_name,
        ref_first_name,
        ref_last_name,
        story
      )
      .execute();

      if (existing.rows.length === 0) {
        await sql.prepare(`
          INSERT INTO referrers (
            resume_id, first_name, last_name,
            referrer_first_name, referrer_last_name, user_story
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          resume_id,
          first_name,
          last_name,
          ref_first_name,
          ref_last_name,
          story
        )
        .execute();
      }
    }

    return { success: true };

  } catch (err) {
    console.error("addreferrer error:", err.stack);
    return { success: false, error: "SQL error while adding referrer" };
  }
}

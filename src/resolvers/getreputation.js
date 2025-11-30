export default async function getreputation({ sql }) {
  try {
    const resumeResult = await sql.prepare(`
      SELECT id AS resume_id, first_name, last_name
      FROM resumes
      ORDER BY first_name ASC, last_name ASC
    `).execute();

    const resumeRows = resumeResult.rows || [];
    const validResumeIds = new Set(resumeRows.map(r => r.resume_id));

    const repResult = await sql.prepare(`
      SELECT resume_id, total_reputation_value
      FROM assignreputation
    `).execute();

    const repMap = {};
    repResult.rows.forEach(r => {
      if (validResumeIds.has(r.resume_id)) {
        repMap[r.resume_id] = r.total_reputation_value;
      }
    });

    const finalList = resumeRows.map(r => ({
      resume_id: r.resume_id,
      fullName: `${r.first_name} ${r.last_name}`.trim(),
      total_reputation_value: repMap[r.resume_id] || 0
    }));

    return { success: true, list: finalList };

  } catch (err) {
    console.error("getreputation failed:", err.stack);
    return { success: false, error: "SQL select error" };
  }
}

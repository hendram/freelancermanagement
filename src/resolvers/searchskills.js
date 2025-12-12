// resolvers/searchskills.js
export default async function searchskills({ payload, sql }) {
  const { skills } = payload;

  if (!skills || !skills.trim()) {
    return { success: false, error: "No skills provided" };
  }

  const skillQuery = skills.toLowerCase().replace(/\s+/g, '');
  console.log(">>> searchskills normalized =", skillQuery);

  try {
    //-------------------------------------
    // 1. BASIC SKILL SEARCH (NO JOIN)
    //-------------------------------------
    const baseQuery = `
      SELECT id AS resume_id, first_name, last_name, skills
      FROM resumes
      WHERE REPLACE(LOWER(skills), ' ', '') LIKE ?
      LIMIT 20
    `;

    const baseResult = await sql
      .prepare(baseQuery)
      .bindParams(`%${skillQuery}%`)
      .execute();

    const rows = Array.isArray(baseResult.rows) ? baseResult.rows : [];

    //-------------------------------------
    // 2. FOR EACH RESUME → GET LATEST INVITATION
    //-------------------------------------
    const candidates = [];

    for (const row of rows) {
      const resumeId = row.resume_id;

      const invQuery = `
        SELECT price, invite_status, deal, created_at
        FROM myinvitation
        WHERE resume_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;

        console.log("invQuerysearchskills", invQuery);

      const invResult = await sql
        .prepare(invQuery)
        .bindParams(resumeId)
        .execute();

      const inv = invResult.rows?.[0] || {};

      // Clean skills
      const cleanedSkills = typeof row.skills === "string"
        ? row.skills.replace(/[\[\]"]/g, "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      candidates.push({
        resume_id: resumeId,
        first_name: row.first_name,
        last_name: row.last_name,
        skills: cleanedSkills,

        // latest invitation
        price: inv.price || null,
        deal: inv.deal || null,
        invited: inv.invite_status === "yes",
        created_at: inv.created_at || null
      });
    }

    console.log("candidates", candidates);
    return { success: true, candidates };

  } catch (e) {
    console.error(">>> SQL ERROR (searchskills):", e.stack);
    return { success: false, error: e.message };
  }
}

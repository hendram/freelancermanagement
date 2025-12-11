// resolvers/searchskills.js
export default async function searchskills({ payload, sql }) {
  const { skills } = payload;

  if (!skills || !skills.trim()) {
    console.log(">>> searchskills: No skills provided");
    return { success: false, error: "No skills provided" };
  }

  // normalize search term
  const skillQuery = skills.toLowerCase().replace(/\s+/g, '');
  console.log(">>> searchskills: normalized skillQuery =", skillQuery);

  try {
    // 1. Search resumes by skills, join with invitation for price
    const query = `
      SELECT 
        r.id AS resume_id,
        r.first_name,
        r.last_name,
        r.skills,
        i.price
      FROM resumes r
      LEFT JOIN invitation i
        ON i.resume_id = r.id AND i.invite_status = 'yes'
      WHERE REPLACE(LOWER(r.skills), ' ', '') LIKE ?
      LIMIT 20
    `;
    console.log(">>> searchskills: SQL Query =", query);

    const result = await sql
      .prepare(query)
      .bindParams(`%${skillQuery}%`)
      .execute();

    console.log(">>> searchskills: raw result =", result);

    const rows = Array.isArray(result.rows) ? result.rows : [];
    console.log(">>> searchskills: rows length =", rows.length);

    const candidates = rows.map(r => {
      let cleanedSkills = [];

      if (typeof r.skills === "string") {
        cleanedSkills = r.skills
          .replace(/[\[\]\"]/g, "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
      }

      return {
        resume_id: r.resume_id,
        first_name: r.first_name,
        last_name: r.last_name,
        skills: cleanedSkills,
        price: r.price || null,
      };
    });

    console.log(">>> searchskills: candidates =", candidates);

    return { success: true, candidates };

  } catch (e) {
    console.error(">>> SQL ERROR (searchskills):", e.stack);
    return { success: false, error: e.message };
  }
}

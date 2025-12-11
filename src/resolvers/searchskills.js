// resolvers/searchskills.js
export default async function searchskills({ payload, sql }) {
  const { skills } = payload;

  if (!skills || !skills.trim()) {
    return { success: false, error: "No skills provided" };
  }

  // normalize search term
  const skillQuery = skills.toLowerCase().replace(/\s+/g, '');

  try {
    const result = await sql
      .prepare(`
        SELECT 
          id AS resume_id,
          first_name,
          last_name,
          skills
        FROM resumes
        WHERE REPLACE(LOWER(skills), ' ', '') LIKE ?
        LIMIT 20
      `)
      .bindParams(`%${skillQuery}%`)
      .execute();

    console.log(">>> search result:", result);

    const rows = Array.isArray(result.rows) ? result.rows : [];

    const candidates = rows.map(r => {
      // Clean skill text into array
      let cleanedSkills = [];

      if (typeof r.skills === "string") {
        cleanedSkills = r.skills
          .replace(/[\[\]\"]/g, "")     // remove JSON brackets/quotes
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
      }

      return {
        resume_id: r.resume_id,
        first_name: r.first_name,
        last_name: r.last_name, 
        skills: cleanedSkills
      };
    });

    return { success: true, candidates };

  } catch (e) {
    console.error(">>> SQL ERROR (searchskills):", e.stack);
    return { success: false, error: e.message };
  }
}

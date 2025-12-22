// src/resolvers/findcandidates.js
export default async function findcandidates({ payload, sql }) {
  try {
    const { skills } = payload;

    if (!skills || !skills.toString().trim()) {
      return { success: false, error: "Missing skills input." };
    }

    // normalize tokens
    const inputTokens = skills
      .toString()
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (inputTokens.length === 0) {
      return { success: false, error: "No valid skills provided." };
    }


    // --- fetch resumes using same pattern as your other resolvers ---
    const resumeQuery = await sql.prepare(`
      SELECT
        id,
        first_name,
        last_name,
        skills
      FROM resumes
    `).execute();

    const resumes = resumeQuery.rows || [];

    // score resumes
    const candidates = resumes.map(r => {
      const stored = (r.skills || "").toString().toLowerCase();
      let score = 0;
      for (const t of inputTokens) {
        if (stored.includes(t)) score += 1;
      }

      const skillsArr = stored.length ? stored.split(",").map(s => s.trim()).filter(Boolean) : [];

      return {
        resume_id: r.id,
        fullName: `${(r.first_name || "").trim()} ${(r.last_name || "").trim()}`.trim(),
        skills: skillsArr,
        score
      };
    });

    // filter and sort
    const filtered = candidates
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);

    return { success: true, candidates: filtered };
  } catch (err) {
    console.error("findcandidates error:", err && err.stack ? err.stack : err);
    return { success: false, error: "SQL error while finding candidates" };
  }
}


// resolvers/searchskills.js
import api, { route } from "@forge/api";

export default async function searchskills({ payload, sql }) {
  const { skills, issueKey } = payload;
  console.log("payloadissue", payload);

  if (!skills || !skills.trim()) {
    return { success: false, error: "No skills provided" };
  }
  if (!issueKey) {
    return { success: false, error: "No Jira issue key provided" };
  }

  const skillQuery = skills.toLowerCase().replace(/\s+/g, "");
  console.log(">>> searchskills normalized =", skillQuery);

  try {
    //-------------------------------------
    // 1. FETCH JIRA ISSUE VIA FORGE API
    //-------------------------------------
  const res = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`
    );

    if (!res.ok) {
      return { success: false, error: `Jira API error: ${res.status}` };
    }
   

    const jiraIssue = await res.json();
   console.log("jiraIssue", jiraIssue);

    // === Adjust this field ID to your Jira's Story Points custom field ===
    const storyPoints = jiraIssue.fields.customfield_10016 || 0;

    // Extract priority
    const priorityMap = { "Lowest": 10, "Low": 20, "Medium": 30, "High": 40, "Highest": 50 };
    const priorityName = jiraIssue.fields.priority?.name || "Medium";
    const priorityPoints = priorityMap[priorityName] || 30;

    // Minimum points required to handle the issue
    const minimumRequiredScore = storyPoints > 0 ? storyPoints * 10 : priorityPoints;

    console.log(">>> Jira storyPoints:", storyPoints);
    console.log(">>> Jira priority:", priorityName, "points:", priorityPoints);
    console.log(">>> minimumRequiredScore:", minimumRequiredScore);

    //-------------------------------------
    // 2. BASIC SKILL SEARCH
    //-------------------------------------
    const baseQuery = `
      SELECT id AS resume_id, first_name, last_name, skills
      FROM resumes
      WHERE REPLACE(LOWER(skills), ' ', '') LIKE ?
      LIMIT 50
    `;
    const baseResult = await sql.prepare(baseQuery).bindParams(`%${skillQuery}%`).execute();
    const rows = Array.isArray(baseResult.rows) ? baseResult.rows : [];
    const candidates = [];

    //-------------------------------------
    // 3. ENRICH EACH CANDIDATE
    //-------------------------------------
    for (const row of rows) {
      const resumeId = row.resume_id;

      // Experience
      const expQuery = `SELECT working_period FROM experiences WHERE resume_id = ?`;
      const expResult = await sql.prepare(expQuery).bindParams(resumeId).execute();
      let totalYears = 0;
      for (const exp of expResult.rows || []) {
        if (!exp.working_period) continue;
        const match = exp.working_period.match(/(\d{4})\s*-\s*(\d{4})/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = parseInt(match[2], 10);
          if (end > start) totalYears += (end - start);
        }
      }
      const experienceScore = totalYears * 10;

      // Reputation
      const repQuery = `SELECT total_reputation_value FROM assignreputation WHERE resume_id = ? LIMIT 1`;
      const repResult = await sql.prepare(repQuery).bindParams(resumeId).execute();
      const reputationScore = repResult.rows?.[0]?.total_reputation_value || 0;

      const totalScore = experienceScore + reputationScore;

      // Filter by minimum required score
      if (totalScore < minimumRequiredScore) continue;

      // Latest invitation
      const invQuery = `
        SELECT price, invite_status, deal, created_at
        FROM myinvitation
        WHERE resume_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const invResult = await sql.prepare(invQuery).bindParams(resumeId).execute();
      const inv = invResult.rows?.[0] || {};

      const cleanedSkills = typeof row.skills === "string"
        ? row.skills.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(Boolean)
        : [];

      candidates.push({
        resume_id: resumeId,
        first_name: row.first_name,
        last_name: row.last_name,
        skills: cleanedSkills,
        years_experience: totalYears,
        reputation: reputationScore,
        total_score: totalScore,
        maxStoryPoints: Math.floor(totalScore / 10),
        price: inv.price || null,
        deal: inv.deal || null,
        invited: inv.invite_status === "yes",
        created_at: inv.created_at || null
      });
    }

    //-------------------------------------
    // 4. SORT + LIMIT
    //-------------------------------------
    const topCandidates = candidates
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 5);

    console.log(">>> topCandidates", topCandidates);
    return { success: true, candidates: topCandidates };

  } catch (e) {
    console.error(">>> ERROR (searchskills):", e.stack);
    return { success: false, error: e.message };
  }
}

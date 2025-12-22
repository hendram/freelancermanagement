// resolvers/searchskills.js
import api, { route } from "@forge/api";

export default async function searchskills({ payload, sql }) {
  const { skills, issueKey } = payload;

  if (!skills || !skills.trim()) {
    return { success: false, error: "No skills provided" };
  }
  if (!issueKey) {
    return { success: false, error: "No Jira issue key provided" };
  }

  const skillQuery = skills.toLowerCase().replace(/\s+/g, "");

  try {
    //-------------------------------------
    // 1. FETCH JIRA FIELDS (DYNAMIC)
    //-------------------------------------
    const fieldsRes = await api.asApp().requestJira(
      route`/rest/api/3/field`
    );

    if (!fieldsRes.ok) {
      return { success: false, error: "Failed to fetch Jira fields" };
    }

    const fields = await fieldsRes.json();

    const storyPointsField = fields.find(
      f => f.name === "Story Points"
    );

    if (!storyPointsField) {
      return { success: false, error: "Story Points field not found" };
    }

    const storyPointsFieldId = storyPointsField.id;

    //-------------------------------------
    // 2. FETCH JIRA ISSUE
    //-------------------------------------
    const res = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`
    );

    if (!res.ok) {
      return { success: false, error: `Jira API error: ${res.status}` };
    }

    const jiraIssue = await res.json();

    const storyPoints = jiraIssue.fields?.[storyPointsFieldId] || 0;

    const priorityMap = {
      "Lowest": 10,
      "Low": 20,
      "Medium": 30,
      "High": 40,
      "Highest": 50
    };

    const priorityName = jiraIssue.fields.priority?.name || "Medium";
    const priorityPoints = priorityMap[priorityName] || 30;

    const minimumRequiredScore =
      storyPoints > 0 ? storyPoints * 10 : priorityPoints;


    //-------------------------------------
    // 3. RESOLVE issue_key → issue_id
    //-------------------------------------
    const issueRow = await sql.prepare(`
      SELECT id
      FROM issues
      WHERE issue_key = ?
      LIMIT 1
    `).bindParams(issueKey).execute();

    const issueId = issueRow.rows?.[0]?.id || null;

    //-------------------------------------
    // 4. BASIC SKILL SEARCH
    //-------------------------------------
    const baseQuery = `
      SELECT id AS resume_id, first_name, last_name, skills
      FROM resumes
      WHERE REPLACE(LOWER(skills), ' ', '') LIKE ?
      LIMIT 50
    `;
    const baseResult = await sql
      .prepare(baseQuery)
      .bindParams(`%${skillQuery}%`)
      .execute();

    const rows = Array.isArray(baseResult.rows) ? baseResult.rows : [];
    const candidates = [];

    //-------------------------------------
    // 5. ENRICH EACH CANDIDATE
    //-------------------------------------
    for (const row of rows) {
      const resumeId = row.resume_id;

      const expQuery = `
        SELECT working_period
        FROM experiences
        WHERE resume_id = ?
      `;
      const expResult = await sql
        .prepare(expQuery)
        .bindParams(resumeId)
        .execute();

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

      const repQuery = `
        SELECT total_reputation_value
        FROM assignreputation
        WHERE resume_id = ?
        LIMIT 1
      `;
      const repResult = await sql
        .prepare(repQuery)
        .bindParams(resumeId)
        .execute();

      const reputationScore =
        repResult.rows?.[0]?.total_reputation_value || 0;

      const totalScore = experienceScore + reputationScore;

      if (totalScore < minimumRequiredScore) continue;

      //-------------------------------------
      // 6. ISSUE-SCOPED INVITATION LOOKUP
      //-------------------------------------
      let inv = null;

      if (issueId) {
        const invQuery = `
          SELECT price, invite_status, deal, created_at
          FROM myinvitation
          WHERE resume_id = ?
            AND issue_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `;

        const invResult = await sql
          .prepare(invQuery)
          .bindParams(resumeId, issueId)
          .execute();

        inv = invResult.rows?.[0] || null;
      }

      const cleanedSkills =
        typeof row.skills === "string"
          ? row.skills
              .replace(/[\[\]"]/g, "")
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
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
        price: inv ? inv.price : null,
        deal: inv ? inv.deal : null,
        invited: inv ? inv.invite_status === "yes" : false,
        created_at: inv ? inv.created_at : null
      });
    }

    //-------------------------------------
    // 7. SORT + LIMIT
    //-------------------------------------
    const topCandidates = candidates
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 5);

    return { success: true, candidates: topCandidates };

  } catch (e) {
    console.error(">>> ERROR (searchskills):", e.stack);
    return { success: false, error: e.message };
  }
}

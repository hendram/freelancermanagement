export default async function getuserstories({ sql, api, route }) {
  try {
    // -----------------------------
    // 1. Load resumes
    // -----------------------------
    const resumesRes = await sql.prepare(`
      SELECT id, first_name, last_name
      FROM resumes
    `).execute();

    const resumes = resumesRes.rows.map(r => {
      const first = (r.first_name ?? "").trim();
      const last = (r.last_name ?? "").trim();
      return {
        resume_id: r.id,
        first_name: first,
        last_name: last,
        fullName: `${first} ${last}`.trim()
      };
    });

    // Build a quick lookup for resumes (if needed)
    const resumeMap = {};
    for (const r of resumes) resumeMap[r.resume_id] = r;

    // -----------------------------
    // 2. Load referrers (NEW FIELDS)
    // -----------------------------
    const refRes = await sql.prepare(`
      SELECT resume_id, referrer_first_name, referrer_last_name,
             issue_key, issue_summary
      FROM referrers
    `).execute();

    const refMap = {};
    for (const row of refRes.rows) {
      const rid = row.resume_id;
      if (!refMap[rid]) refMap[rid] = [];

      refMap[rid].push({
        referrer_first_name: (row.referrer_first_name ?? "").trim(),
        referrer_last_name: (row.referrer_last_name ?? "").trim(),
        issue_key: row.issue_key ?? "",
        issue_summary: row.issue_summary ?? "",
        isFixed: true
      });
    }

    // -----------------------------
    // 3. Load Jira issues
    // -----------------------------
    const jqlBody = {
      jql: `issuetype in ("Story", "Task", "Sub-task", "Bug") AND status != "Done"`,
      fields: ["summary"],
      maxResults: 1000
    };

    const jiraResp = await api.asApp().requestJira(
      route`/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jqlBody)
      }
    );

    if (!jiraResp.ok) throw new Error("Jira error " + jiraResp.status);

    const jiraJson = await jiraResp.json();
    const availableStories = jiraJson.issues.map(i => ({
      issue_key: i.key,
      issue_summary: i.fields.summary
    }));

    // -----------------------------
    // 4. Final output
    // -----------------------------
    const finalList = resumes.map(r => ({
      resume_id: r.resume_id,
      first_name: r.first_name,
      last_name: r.last_name,
      fullName: r.fullName,

      // fixed referrers for this resume (with separate first/last names)
      referrers: refMap[r.resume_id] ?? [],

      // available referrers = other resumes (not this one), include first/last
      availableReferrers: resumes
        .filter(other => other.resume_id !== r.resume_id)
        .map(other => ({
          resume_id: other.resume_id,
          first_name: other.first_name,
          last_name: other.last_name,
          fullName: other.fullName
        })),

      // jira issues
      availableStories
    }));

    return { success: true, list: finalList };

  } catch (err) {
    console.error("getuserstories error:", err);
    return { success: false, error: "Failed to fetch stories" };
  }
}

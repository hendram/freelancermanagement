export default async function getuserstories({ sql, api, route }) {
  try {
    const resumesRes = await sql.prepare(
      `SELECT id, first_name, last_name FROM resumes`
    ).execute();

    const resumes = resumesRes.rows.map(r => ({
      resume_id: r.id,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      fullName: `${(r.first_name ?? "").trim()} ${(r.last_name ?? "").trim()}`.trim()
    }));

    const refRes = await sql.prepare(`
      SELECT resume_id, referrer_first_name, referrer_last_name, user_story
      FROM referrers
    `).execute();

    const refMap = {};
    for (const row of refRes.rows) {
      if (!refMap[row.resume_id]) refMap[row.resume_id] = [];

      refMap[row.resume_id].push({
        referrer_first_name: row.referrer_first_name ?? "",
        referrer_last_name: row.referrer_last_name ?? "",
        rawStory: row.user_story || "",
        isFixed: true
      });
    }

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
    const allStories = jiraJson.issues.map(i => ({
      label: `${i.key} ${i.fields.summary}`
    }));

    const finalList = resumes.map(r => ({
      resume_id: r.resume_id,
      fullName: r.fullName,
      referrers: (refMap[r.resume_id] || []).map(e => ({
        referrer: `${e.referrer_first_name} ${e.referrer_last_name}`.trim(),
        userStories: e.rawStory ? [e.rawStory] : [],
        isFixed: true
      })),
      availableReferrers: resumes.map(re => ({
        fullName: re.fullName,
        resume_id: re.resume_id
      })),
      availableStories: allStories
    }));

    return { success: true, list: finalList };

  } catch (err) {
    console.error("getuserstories error:", err);
    return { success: false, error: "Failed to fetch user stories" };
  }
}

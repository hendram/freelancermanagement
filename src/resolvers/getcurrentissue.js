// resolvers/getcurrentissue.js
import api, { route } from "@forge/api";

export default async function getcurrentissue({ context }) {
  try {
    const issue = context?.extension?.issue;
    console.log("issue", issue);

    if (!issue?.key) {
      return { success: false, error: "Issue context not found" };
    }

    // Fetch full issue details from Jira
    const res = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issue.key}`
    );
    
    console.log("res", res);
    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: "Jira API failed: " + txt };
    }

    const data = await res.json();
    console.log("data", data);

    return {
      success: true,
      key: data.key,
      summary: data.fields.summary,
      project: data.fields.project?.key,
      issueType: data.fields.issuetype?.name
    };

  } catch (e) {
    console.error(">>> getcurrentissue ERROR:", e.stack);
    return { success: false, error: e.message };
  }
}

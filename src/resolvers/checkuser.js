import api, { route } from '@forge/api';

export default async function checkuser(req) {
    const { accountId } = req.context; // jira identifies user automatically

    const res = await api.asApp().requestJira(
      route`/rest/api/3/user/groups?accountId=${accountId}`
    );
    const groups = await res.json();
    console.log("groups", groups);
    const isManager = groups.some(g => g.name === "org-admins");
    console.log("isManager", isManager); 
    return { role: isManager ? "manager" : "user" };
  
};

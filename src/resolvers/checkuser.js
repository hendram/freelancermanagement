import api, { route } from '@forge/api';

export default async function checkuser(req) {
  const { accountId } = req.context;


  const res = await api.asUser().requestJira(
     route`/rest/api/3/user/groups?accountId=${accountId}`
  );
  const groups = await res.json();

  const isManager = groups.some(g => g.name === "org-admins");

  return { role: isManager ? "manager" : "user" };
}

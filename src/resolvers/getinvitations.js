// src/resolvers/getinvitations.js
export default async function getinvitations({ payload, sql }) {
  const { resumeId, fullName } = payload;

  if (!resumeId && !fullName) {
    return { success: false, error: "resumeId or fullName is required" };
  }

  // Utility: split fullName into first + last (first token -> first_name, rest -> last_name)
  function splitFullName(name) {
    if (!name) return { first: "", last: "" };
    const parts = name.trim().split(/\s+/);
    const first = parts.shift() || "";
    const last = parts.length ? parts.join(" ") : "";
    return { first, last };
  }

  try {
    // load invitations (same as you already had)
    if (!resumeId) {
      // try to resolve resumeId from fullName if you need it for invitations query
      const { first: fFirst, last: fLast } = splitFullName(fullName);
      const resumeRow = await sql
        .prepare(`SELECT id FROM resumes WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?)) AND LOWER(TRIM(last_name)) = LOWER(TRIM(?)) LIMIT 1`)
        .bindParams(fFirst, fLast)
        .execute();

      if (resumeRow.rows.length === 0) {
        return { success: true, data: [] }; // no resume found for that fullName
      }
      // set resumeId for invitations query below
      payload.resumeId = resumeId = resumeRow.rows[0].id;
    }

    const invs = await sql.prepare(`
      SELECT 
        mi.id AS invitation_id,
        mi.freelancer_name,
        mi.invite_status,
        mi.price,
        mi.deal,
        i.issue_type,
        i.issue_key,
        i.issue_summary,
        mi.created_at
      FROM myinvitation mi
      JOIN issues i ON mi.issue_id = i.id
      WHERE mi.resume_id = ?
      ORDER BY mi.id DESC
    `).bindParams(resumeId).execute();

    // Determine target name to search referrers/referees
    let targetFirst = "", targetLast = "";
    if (fullName) {
      const s = splitFullName(fullName);
      targetFirst = s.first;
      targetLast = s.last;
    } else {
      // fallback: use freelancer_name from first invitation row if available
      const sample = invs.rows[0];
      if (sample && sample.freelancer_name) {
        const s = splitFullName(sample.freelancer_name);
        targetFirst = s.first;
        targetLast = s.last;
      } else {
        // if still unknown, nothing to search
        targetFirst = "";
        targetLast = "";
      }
    }

    // Normalize and query: who referred TARGET (others referred TARGET)
    // rows where first_name/last_name == target -> referrer_* columns contain the who referred them
    const referrers = [];
    const referees = [];

    if (targetFirst || targetLast) {
      const refsWhoReferredTarget = await sql.prepare(`
        SELECT
          referrer_first_name AS ref_first,
          referrer_last_name  AS ref_last,
          user_story,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
      `).bindParams(targetFirst, targetLast).execute();

      for (const r of refsWhoReferredTarget.rows) {
        // only include non-empty referrer names
        if ((r.ref_first || "").trim()) {
          referrers.push({
            first_name: r.ref_first || "",
            last_name: r.ref_last || "",
            user_story: r.user_story || "",
            created_at: r.created_at
          });
        }
      }

      // Query for who TARGET referred to (rows where referrer_first_name/referrer_last_name == target)
      const refsTargetDidRefer = await sql.prepare(`
        SELECT
          first_name  AS refed_first,
          last_name   AS refed_last,
          user_story,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(referrer_first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(referrer_last_name))  = LOWER(TRIM(?))
      `).bindParams(targetFirst, targetLast).execute();

      for (const r of refsTargetDidRefer.rows) {
        if ((r.refed_first || r.refed_last || "").trim()) {
          referees.push({
            first_name: r.refed_first || "",
            last_name: r.refed_last || "",
            user_story: r.user_story || "",
            created_at: r.created_at
          });
        }
      }
    }

    // build response per-invitation, but re-use the same referrers/referees arrays
    const out = invs.rows.map(inv => {
      const invited = inv.invite_status === "yes";
      return {
        id: inv.invitation_id,
        freelancer_name: inv.freelancer_name,
        invite_status: inv.invite_status,
        issue_type: invited ? inv.issue_type : null,
        issue_key: invited ? inv.issue_key : null,
        issue_summary: invited ? inv.issue_summary : null,
        price: invited ? inv.price : null,
        deal: invited ? inv.deal : null,
        rfp: [],
        proposals: [],
        referrers,   // people who referred TARGET
        referees,    // people TARGET referred to
        created_at: inv.created_at
      };
    });

    return { success: true, data: out };
  } catch (err) {
    console.error("ERROR getinvitations (ref logic):", err);
    return { success: false, error: err.message || String(err) };
  }
}

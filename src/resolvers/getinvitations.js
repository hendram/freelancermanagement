// src/resolvers/getinvitations.js
export default async function getinvitations({ payload, sql }) {
  const { resumeId, fullName } = payload;

  if (!resumeId && !fullName) {
    return { success: false, error: "resumeId or fullName is required" };
  }

  function splitFullName(name) {
    if (!name) return { first: "", last: "" };
    const parts = name.trim().split(/\s+/);
    const first = parts.shift() || "";
    const last = parts.length ? parts.join(" ") : "";
    return { first, last };
  }

  try {
    // ------------------------------------
    // Resolve resumeId from fullName
    // ------------------------------------
    if (!resumeId) {
      const { first: fFirst, last: fLast } = splitFullName(fullName);
      const resumeRow = await sql
        .prepare(`
          SELECT id FROM resumes 
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
            AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
          LIMIT 1
        `)
        .bindParams(fFirst, fLast)
        .execute();

      if (resumeRow.rows.length === 0) {
        return { success: true, data: [] };
      }

      payload.resumeId = resumeId = resumeRow.rows[0].id;
    }

    // ------------------------------------
    // Load Invitations
    // ------------------------------------
    const invs = await sql
      .prepare(
        `
      SELECT 
        mi.id AS invitation_id,
        mi.freelancer_name,
        mi.invite_status,
        mi.price,
        mi.deal,
        mi.rfp_prop_id,
        i.issue_type,
        i.issue_key,
        i.issue_summary,
        mi.created_at
      FROM myinvitation mi
      JOIN issues i ON mi.issue_id = i.id
      WHERE mi.resume_id = ?
      ORDER BY mi.id DESC
    `
      )
      .bindParams(resumeId)
      .execute();

    // ------------------------------------
    // Determine target person for referrers/referees
    // ------------------------------------
    let targetFirst = "",
      targetLast = "";

    if (fullName) {
      const s = splitFullName(fullName);
      targetFirst = s.first;
      targetLast = s.last;
    } else {
      const sample = invs.rows[0];
      if (sample?.freelancer_name) {
        const s = splitFullName(sample.freelancer_name);
        targetFirst = s.first;
        targetLast = s.last;
      }
    }

    const referrers = [];
    const referees = [];

    // ------------------------------------
    // Load Referrers + Referees
    // ------------------------------------
    if (targetFirst || targetLast) {
      const refsWhoReferredTarget = await sql
        .prepare(
          `
        SELECT
          referrer_first_name AS ref_first,
          referrer_last_name  AS ref_last,
          user_story,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
      `
        )
        .bindParams(targetFirst, targetLast)
        .execute();

      for (const r of refsWhoReferredTarget.rows) {
        if ((r.ref_first || "").trim()) {
          referrers.push({
            first_name: r.ref_first || "",
            last_name: r.ref_last || "",
            user_story: r.user_story || "",
            created_at: r.created_at,
          });
        }
      }

      const refsTargetDidRefer = await sql
        .prepare(
          `
        SELECT
          first_name  AS refed_first,
          last_name   AS refed_last,
          user_story,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(referrer_first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(referrer_last_name))  = LOWER(TRIM(?))
      `
        )
        .bindParams(targetFirst, targetLast)
        .execute();

      for (const r of refsTargetDidRefer.rows) {
        if ((r.refed_first || r.refed_last || "").trim()) {
          referees.push({
            first_name: r.refed_first || "",
            last_name: r.refed_last || "",
            user_story: r.user_story || "",
            created_at: r.created_at,
          });
        }
      }
    }

    // ------------------------------------
    // Build output list
    // ------------------------------------
    const out = [];

    for (const inv of invs.rows) {
      const invited = inv.invite_status === "yes";

      // ------------------------------------------------------------
      // FIXED BLOCK: Load RFP + PROPOSALS from rfp_proposals table
      // ------------------------------------------------------------
      let rfp = [];
      let proposals = [];

      if (inv.rfp_prop_id) {
        const rfpRows = await sql
          .prepare(
            `
            SELECT rfp_message, proposals
            FROM rfp_proposals
            WHERE id = ?
          `
          )
          .bindParams(inv.rfp_prop_id)
          .execute();

        if (rfpRows.rows.length > 0) {
          const row = rfpRows.rows[0];

          rfp = row.rfp_message ? row.rfp_message.split(/\r?\n/) : [];
          proposals = row.proposals ? row.proposals.split(/\r?\n/) : [];
        }
      }

      // ------------------------------------------------------------

      out.push({
        id: inv.invitation_id,
        freelancer_name: inv.freelancer_name,
        invite_status: inv.invite_status,
        issue_type: invited ? inv.issue_type : null,
        issue_key: invited ? inv.issue_key : null,
        issue_summary: invited ? inv.issue_summary : null,
        price: invited ? inv.price : null,
        deal: invited ? inv.deal : null,

        rfp,
        proposals,

        referrers,
        referees,

        created_at: inv.created_at,
      });
    }

    return { success: true, data: out };
  } catch (err) {
    console.error("ERROR getinvitations (ref logic):", err);
    return { success: false, error: err.message || String(err) };
  }
}

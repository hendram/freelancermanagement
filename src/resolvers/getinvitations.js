// src/resolvers/getinvitations.js
export default async function getinvitations({ payload, sql }) {
  const { resumeId, fullName } = payload;

  console.log("▶ getinvitations() INPUT payload =", payload);

  if (!resumeId && !fullName) {
    console.log("❌ Missing resumeId and fullName");
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
      console.log("🔎 splitFullName(fullName) =", { fFirst, fLast });

      const resumeRow = await sql
        .prepare(`
          SELECT id FROM resumes 
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
            AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
          LIMIT 1
        `)
        .bindParams(fFirst, fLast)
        .execute();

      console.log("📄 resumeRow =", resumeRow.rows);

      if (resumeRow.rows.length === 0) {
        console.log("⚠ No resume found for fullname");
        return { success: true, data: [] };
      }

      payload.resumeId = resumeRow.rows[0].id;
      console.log("✅ Resolved resumeId =", payload.resumeId);
    }

    // ------------------------------------
    // Load Invitations
    // ------------------------------------
    const invs = await sql
      .prepare(
        `
      SELECT 
        mi.id AS invitation_id,
        mi.issue_id,
        mi.resume_id,
        mi.first_name,
        mi.last_name,
        mi.invite_status,
        mi.price,
        mi.deal,
        mi.rfp_prop_id,
        mi.created_at,
        i.issue_type,
        i.issue_key,
        i.issue_summary
      FROM myinvitation mi
      JOIN issues i ON mi.issue_id = i.id
      WHERE mi.resume_id = ?
      ORDER BY mi.id DESC
    `
      )
      .bindParams(payload.resumeId)
      .execute();

    console.log("📦 Invitations loaded:", invs.rows.length);

    // ------------------------------------
    // TARGET PERSON NAME (the one searched)
    // ------------------------------------
    let targetFirst = "";
    let targetLast = "";

    if (fullName) {
      const s = splitFullName(fullName);
      targetFirst = s.first;
      targetLast = s.last;
      console.log("🎯 target via fullName =", { targetFirst, targetLast });
    } else {
      const sample = invs.rows[0];
      if (sample?.first_name) {
        const s = splitFullName(`${sample.first_name} ${sample.last_name || ""}`);
        targetFirst = s.first;
        targetLast = s.last;
      }
      console.log("🎯 target via sample invitation =", {
        targetFirst,
        targetLast
      });
    }

    const referrers = [];
    const referees = [];

    if (targetFirst || targetLast) {
      // --------------------------------------------
      // People who referred THIS TARGET PERSON
      // --------------------------------------------
      const refsWhoReferredTarget = await sql
        .prepare(
          `
        SELECT
          referrer_first_name AS ref_first,
          referrer_last_name  AS ref_last,
          issue_key,
          issue_summary,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
      `
        )
        .bindParams(targetFirst, targetLast)
        .execute();

      console.log("📘 refsWhoReferredTarget =", refsWhoReferredTarget.rows.length);

      for (const r of refsWhoReferredTarget.rows) {
        referrers.push({
          referrer_first_name: r.ref_first || "",
          referrer_last_name: r.ref_last || "",
          issue_key: r.issue_key || "",
          issue_summary: r.issue_summary || "",
          isFixed: true,
          created_at: r.created_at
        });
      }

      // --------------------------------------------
      // TARGET PERSON referred OTHER people
      // --------------------------------------------
      const refsTargetDidRefer = await sql
        .prepare(
          `
        SELECT
          first_name  AS refed_first,
          last_name   AS refed_last,
          issue_key,
          issue_summary,
          created_at
        FROM referrers
        WHERE LOWER(TRIM(referrer_first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(referrer_last_name))  = LOWER(TRIM(?))
      `
        )
        .bindParams(targetFirst, targetLast)
        .execute();

      console.log("📙 refsTargetDidRefer =", refsTargetDidRefer.rows.length);

      for (const r of refsTargetDidRefer.rows) {
        referees.push({
          referrer_first_name: r.refed_first || "",
          referrer_last_name: r.refed_last || "",
          issue_key: r.issue_key || "",
          issue_summary: r.issue_summary || "",
          isFixed: true,
          created_at: r.created_at
        });
      }
    }

    // ------------------------------------
    // Build output list
    // ------------------------------------
    const out = [];

    for (const inv of invs.rows) {
      const invited = inv.invite_status === "yes";

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

        console.log(`📄 RFP for invitation ${inv.invitation_id}:`, rfpRows.rows.length);

        if (rfpRows.rows.length > 0) {
          const row = rfpRows.rows[0];
          rfp = row.rfp_message ? row.rfp_message.split(/\r?\n/) : [];
          proposals = row.proposals ? row.proposals.split(/\r?\n/) : [];
        }
      }

      const record = {
        id: inv.invitation_id,
        resume_id: inv.resume_id,

        first_name: inv.first_name,
        last_name: inv.last_name,

        invite_status: inv.invite_status,

        issue_id: inv.issue_id,
        issue_type: invited ? inv.issue_type : null,
        issue_key: invited ? inv.issue_key : null,
        issue_summary: invited ? inv.issue_summary : null,

        price: invited ? inv.price : null,
        deal: invited ? inv.deal : null,

        rfp,
        proposals,

        referrers,
        referees,

        created_at: inv.created_at
      };

      console.log("📤 Output invitation record =", record);

      out.push(record);
    }

    console.log("✅ FINAL OUTPUT count =", out.length);
    return { success: true, data: out };

  } catch (err) {
    console.error("❌ ERROR getinvitations:", err);
    return { success: false, error: err.message || String(err) };
  }
}

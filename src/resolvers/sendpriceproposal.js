// src/resolvers/sendpriceproposal.js
export default async function sendpriceproposal({ payload, sql }) {

  const {
    issueId,
    resumeId,
    newProposal,
    price,
    referrers = [],
    referees = []
  } = payload;

  if (!issueId) return { success: false, error: "Missing issueId" };
  if (!resumeId) return { success: false, error: "Missing resumeId" };

  try {
    //
    // ---------------------------------------------------
    // 1) Find latest myinvitation row
    // ---------------------------------------------------

    const invRes = await sql
      .prepare(`
        SELECT 
          mi.id, 
          mi.rfp_prop_id, 
          mi.first_name, 
          mi.last_name,
          i.issue_key,
          i.issue_summary
        FROM myinvitation mi
        JOIN issues i ON mi.issue_id = i.id
        WHERE mi.issue_id = ? AND mi.resume_id = ?
        ORDER BY mi.id 
        LIMIT 1
      `)
      .bindParams(issueId, resumeId)
      .execute();


    if (invRes.rows.length === 0)
      return { success: false, error: "Invitation not found" };

    const invite = invRes.rows[0];

    //
    // ---------------------------------------------------
    // 2) Update proposal ONLY if newProposal exists
    // ---------------------------------------------------
    if (newProposal && String(newProposal).trim() !== "") {
      if (!invite.rfp_prop_id) {
        return {
          success: false,
          error: "No RFP exists; manager must send RFP first."
        };
      }

 
const rfpRes = await sql
  .prepare(`
    SELECT id, proposals
    FROM rfp_proposals
    WHERE rfp_prop_id = ?
    ORDER BY round_no DESC
    LIMIT 1
  `)
  .bindParams(invite.rfp_prop_id)
  .execute();


      if (rfpRes.rows.length === 0)
        return { success: false, error: "RFP row missing" };
   
      const rfpRow = rfpRes.rows[0];
      const trimmed = String(newProposal).trim();


      if (!rfpRow.proposals || String(rfpRow.proposals).trim() === "") {
        await sql
          .prepare(`UPDATE rfp_proposals SET proposals = ? WHERE id = ?`)
          .bindParams(trimmed, rfpRow.id)
          .execute();
      } else {
        await sql
          .prepare(
            `UPDATE rfp_proposals
             SET proposals = CONCAT(COALESCE(proposals,''), '\n', ?)
             WHERE id = ?`
          )
          .bindParams(trimmed, rfpRow.id)
          .execute();
      }
    } else {
      console.log(">>> DEBUG: No newProposal submitted, skipping RFP update");
    }

    //
    // ---------------------------------------------------
    // 3) Update price (always)
    // ---------------------------------------------------

    await sql
      .prepare(
        `UPDATE myinvitation
         SET price = ?
         WHERE id = ?`
      )
      .bindParams(price || null, invite.id)
      .execute();

    //
    // ---------------------------------------------------
    // 4) REFERRERS TABLE LOGIC
    // ---------------------------------------------------

    const referrerFirst = invite.first_name || "";
    const referrerLast = invite.last_name || "";

    const issueKey = invite.issue_key || "";
    const issueSummary = invite.issue_summary || "";

    if (Array.isArray(referees) && referees.length > 0) {
      for (const full of referees) {

        if (typeof full !== "string") {
          continue;
        }

        const clean = full.trim();
        if (!clean) {
          continue;
        }

        const parts = clean.split(/\s+/);
        const first = parts.shift() || "";
        const last = parts.join(" ") || "";

        const found = await sql
          .prepare(
            `SELECT id AS resume_id, first_name, last_name
             FROM resumes
             WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
               AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
             LIMIT 1`
          )
          .bindParams(first, last)
          .execute();

        if (found.rows.length === 0) {
          continue;
        }

        const target = found.rows[0];

        await sql
          .prepare(
            `
            INSERT INTO referrers (
              resume_id,
              first_name,
              last_name,
              referrer_first_name,
              referrer_last_name,
              issue_key,
              issue_summary
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `
          )
          .bindParams(
            target.resume_id,
            target.first_name || "",
            target.last_name || "",
            referrerFirst,
            referrerLast,
            issueKey,
            issueSummary
          )
          .execute();
      }
    }

    //
    // ---------------------------------------------------
    // DONE
    // ---------------------------------------------------

    return { success: true, rfpPropId: invite.rfp_prop_id || null };
  } catch (e) {
    console.error(">>> SQL ERROR (sendpriceproposal):", e);
    return { success: false, error: e.message || String(e) };
  }
}

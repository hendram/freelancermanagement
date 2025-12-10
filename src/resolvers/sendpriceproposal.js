// src/resolvers/sendpriceproposal.js
export default async function sendpriceproposal({ payload, sql }) {
  console.log(">>> DEBUG: Incoming payload:", JSON.stringify(payload, null, 2));

  const {
    issueId,
    resumeId,
    newProposal,
    price,
    priceUnit,

    referrers = [],
    referees = []
  } = payload;

  if (!issueId) return { success: false, error: "Missing issueId" };
  if (!resumeId) return { success: false, error: "Missing resumeId" };
  if (!newProposal || !String(newProposal).trim())
    return { success: false, error: "Empty proposal" };

  try {
    //
    // ---------------------------------------------------
    // 1) Find latest myinvitation row
    // ---------------------------------------------------
    console.log(">>> DEBUG: Fetching invitation for:", { issueId, resumeId });

    const invRes = await sql
      .prepare(`
        SELECT id, rfp_prop_id, first_name, last_name
        FROM myinvitation
        WHERE issue_id = ? AND resume_id = ?
        ORDER BY id DESC
        LIMIT 1
      `)
      .bindParams(issueId, resumeId)
      .execute();

    console.log(">>> DEBUG: Invitation result:", invRes.rows);

    if (invRes.rows.length === 0)
      return { success: false, error: "Invitation not found" };

    const invite = invRes.rows[0];

    //
    // ---------------------------------------------------
    // 2) Enforce RFP exists
    // ---------------------------------------------------
    if (!invite.rfp_prop_id) {
      console.log(">>> DEBUG: No RFP found on myinvitation row");
      return {
        success: false,
        error: "No RFP exists; manager must send RFP first."
      };
    }

    //
    // ---------------------------------------------------
    // 3) Load RFP row
    // ---------------------------------------------------
    console.log(">>> DEBUG: Loading RFP row for id:", invite.rfp_prop_id);

    const rfpRes = await sql
      .prepare(`SELECT id, proposals FROM rfp_proposals WHERE id = ?`)
      .bindParams(invite.rfp_prop_id)
      .execute();

    console.log(">>> DEBUG: RFP row:", rfpRes.rows);

    if (rfpRes.rows.length === 0)
      return { success: false, error: "RFP row missing" };

    const rfpRow = rfpRes.rows[0];
    const trimmed = String(newProposal).trim();

    //
    // ---------------------------------------------------
    // 4) Append proposal
    // ---------------------------------------------------
    console.log(">>> DEBUG: Appending proposal text");

    if (!rfpRow.proposals || String(rfpRow.proposals).trim() === "") {
      console.log(">>> DEBUG: Writing first proposal");
      await sql
        .prepare(`UPDATE rfp_proposals SET proposals = ? WHERE id = ?`)
        .bindParams(trimmed, rfpRow.id)
        .execute();
    } else {
      console.log(">>> DEBUG: Appending proposal to existing");
      await sql
        .prepare(
          `UPDATE rfp_proposals
           SET proposals = CONCAT(COALESCE(proposals,''), '\n', ?)
           WHERE id = ?`
        )
        .bindParams(trimmed, rfpRow.id)
        .execute();
    }

    //
    // ---------------------------------------------------
    // 5) Update price + price_unit
    // ---------------------------------------------------
    console.log(">>> DEBUG: Updating price:", { price, priceUnit });

    await sql
      .prepare(
        `UPDATE myinvitation
         SET price = ?, price_unit = ?
         WHERE id = ?`
      )
      .bindParams(price || null, priceUnit || null, invite.id)
      .execute();

    //
    // ---------------------------------------------------
    // 6) REFERRERS TABLE LOGIC
    // ---------------------------------------------------
    console.log(">>> DEBUG: Processing referees[]:", referees);

    const referrerFirst = invite.first_name || "";
    const referrerLast = invite.last_name || "";
    const userStory = `${invite.issue_key || ""} ${invite.issue_summary || ""}`.trim();

    if (Array.isArray(referees) && referees.length > 0) {
      for (const full of referees) {
        console.log(">>> DEBUG: Handling referee name:", full);

        if (!full || !String(full).trim()) {
          console.log(">>> DEBUG: Skipped empty name");
          continue;
        }

        const clean = full.trim();
        const parts = clean.split(/\s+/);
        const first = parts.shift() || "";
        const last = parts.join(" ") || "";

        console.log(">>> DEBUG: Resolving referee:", { first, last });

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

        console.log(">>> DEBUG: Resume lookup result:", found.rows);

        if (found.rows.length === 0) {
          console.log(">>> DEBUG: No resume match found, skipping");
          continue;
        }

        const target = found.rows[0];

        console.log(">>> DEBUG: Inserting into referrers table:", {
          referee_resume_id: target.resume_id,
          referee_name: `${target.first_name} ${target.last_name}`,
          referrer: `${referrerFirst} ${referrerLast}`,
          userStory
        });

        await sql
          .prepare(
            `
            INSERT INTO referrers (
              resume_id,
              first_name,
              last_name,
              referrer_first_name,
              referrer_last_name,
              user_story
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `
          )
          .bindParams(
            target.resume_id,
            target.first_name || "",
            target.last_name || "",
            referrerFirst,
            referrerLast,
            userStory
          )
          .execute();
      }
    }

    //
    // ---------------------------------------------------
    // DONE
    // ---------------------------------------------------
    console.log(">>> DEBUG: Finished sendpriceproposal OK");

    return { success: true, rfpPropId: rfpRow.id };
  } catch (e) {
    console.error(">>> SQL ERROR (sendpriceproposal):", e);
    return { success: false, error: e.message || String(e) };
  }
}

// src/resolvers/sendpriceproposal.js
export default async function sendpriceproposal({ payload, sql }) {
  const {
    issueId,
    resumeId,
    freelancerFullName,
    newProposal,
    price,
    priceUnit,
    referToNames
  } = payload;

  if (!issueId)  return { success: false, error: "Missing issueId" };
  if (!resumeId) return { success: false, error: "Missing resumeId" };

  try {
    // -------------------------------------------------------
    // 1) Find invitation
    // -------------------------------------------------------
    const inviteRes = await sql
      .prepare(`
        SELECT id, rfp_prop_id
        FROM myinvitation
        WHERE issue_id = ? AND resume_id = ?
      `)
      .bindParams(issueId, resumeId)
      .execute();

    if (inviteRes.rows.length === 0)
      return { success: false, error: "Invitation not found." };

    const invite = inviteRes.rows[0];

    // -------------------------------------------------------
    // 2) Find the latest RFP row for this invitation
    // -------------------------------------------------------
    const rfpRows = await sql
      .prepare(`
        SELECT id, proposals
        FROM rfp_proposals
        WHERE id = ?
      `)
      .bindParams(invite.rfp_prop_id)
      .execute();

    if (rfpRows.rows.length === 0)
      return { success: false, error: "No RFP exists yet. Manager must send RFP first." };

    const rfp = rfpRows.rows[0];
    const rfpPropId = rfp.id;

    // -------------------------------------------------------
    // 3) Append proposal to the existing proposals column
    // -------------------------------------------------------
    if (newProposal && newProposal.trim() !== "") {
      await sql
        .prepare(`
          UPDATE rfp_proposals
          SET proposals = COALESCE(proposals, '') || '\n' || ?
          WHERE id = ?
        `)
        .bindParams(newProposal.trim(), rfpPropId)
        .execute();
    }

    // -------------------------------------------------------
    // 4) Update price + price_unit on myinvitation
    // -------------------------------------------------------
    await sql
      .prepare(`
        UPDATE myinvitation
        SET price = ?, price_unit = ?
        WHERE id = ?
      `)
      .bindParams(price || null, priceUnit || null, invite.id)
      .execute();

    // -------------------------------------------------------
    // 5) REFER-TO LOGIC (names → resume_ids)
    // -------------------------------------------------------
    if (Array.isArray(referToNames)) {
      for (const full of referToNames) {
        if (!full) continue;

        // find resume_id by full name
        const findRes = await sql
          .prepare(`
            SELECT resume_id
            FROM resumes
            WHERE full_name = ?
          `)
          .bindParams(full.trim())
          .execute();

        if (findRes.rows.length === 0) continue;

        const refereeResumeId = findRes.rows[0].resume_id;

        // insert mapping
        await sql
          .prepare(`
            INSERT INTO refer_map (
              referrer_resume_id,
              referee_resume_id,
              referrer_name,
              referee_name
            )
            VALUES (?, ?, ?, ?)
          `)
          .bindParams(
            resumeId,
            refereeResumeId,
            freelancerFullName.trim(),
            full.trim()
          )
          .execute();
      }
    }

    return { success: true, rfpPropId };
  } catch (e) {
    console.error(">>> SQL ERROR (sendpriceproposal):", e);
    return { success: false, error: e.message || String(e) };
  }
}

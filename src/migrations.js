// src/resolvers/invitation.js
export default async function invitation({ payload, sql }) {
  const {
    issueType,
    issueKey,
    issueSummary,
    freelancerName,
    resumeId,
    inviteStatus,
    price,
    deal,
    rfpMessage   // can be undefined or empty string
  } = payload;

  if (!freelancerName) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  try {
    let finalIssueId;

    // ---------- CHECK ISSUE ----------
    const existingIssue = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (existingIssue.rows.length > 0) {
      finalIssueId = existingIssue.rows[0].id;
    } else {
      await sql
        .prepare(`
          INSERT INTO issues (issue_type, issue_key, issue_summary)
          VALUES (?, ?, ?)
        `)
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      const reselect = await sql
        .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
        .bindParams(issueKey)
        .execute();

      finalIssueId = reselect.rows[0].id;
    }

    // ---------- CHECK INVITATION (also get rfp_prop_id if exists) ----------
    const existingInviteRes = await sql
      .prepare(`
        SELECT id, rfp_prop_id FROM myinvitation
        WHERE issue_id = ? AND freelancer_name = ?
      `)
      .bindParams(finalIssueId, freelancerName)
      .execute();

    const invite = existingInviteRes.rows[0];

    const finalPrice = inviteStatus === "yes" ? price || null : null;
    const finalDeal  = inviteStatus === "yes" ? deal  || null : null;

    // ---------- If rfpMessage provided (non-empty), handle rfp_proposals table ----------
    // We'll only insert/update rfp_proposals when rfpMessage is non-empty.
    let createdRfpPropId = null;
    const hasRfp = rfpMessage && String(rfpMessage).trim() !== "";

    if (hasRfp) {
      if (invite && invite.rfp_prop_id) {
        // update existing rfp_proposals row
        await sql
          .prepare(`
            UPDATE rfp_proposals
            SET rfp_message = ?
            WHERE id = ?
          `)
          .bindParams(rfpMessage, invite.rfp_prop_id)
          .execute();

        createdRfpPropId = invite.rfp_prop_id;
      } else {
        // insert new rfp_proposals row then capture its id
        await sql
          .prepare(`
            INSERT INTO rfp_proposals (rfp_message, proposals)
            VALUES (?, ?)
          `)
          .bindParams(rfpMessage, null)
          .execute();

        // Forge SQL doesn't provide lastInsertId; select the last inserted id
        // (ordering by id desc). This is the pragmatic approach used elsewhere.
        const fetchRfpId = await sql
          .prepare(`SELECT id FROM rfp_proposals ORDER BY id DESC LIMIT 1`)
          .execute();

        if (fetchRfpId.rows.length > 0) {
          createdRfpPropId = fetchRfpId.rows[0].id;
        } else {
          // defensive: if we couldn't retrieve id, throw to surface issue
          throw new Error("Failed to retrieve inserted rfp_proposals id");
        }

        // If we have an existing invite (but it lacked rfp_prop_id), attach it
        if (invite) {
          await sql
            .prepare(`UPDATE myinvitation SET rfp_prop_id = ? WHERE id = ?`)
            .bindParams(createdRfpPropId, invite.id)
            .execute();
        }
      }
    }

    // ---------- UPDATE EXISTING INVITATION ----------
    if (invite) {
      // update invite_status/price/deal always
      await sql
        .prepare(`
          UPDATE myinvitation
          SET invite_status = ?, price = ?, deal = ?
          WHERE id = ?
        `)
        .bindParams(inviteStatus, finalPrice, finalDeal, invite.id)
        .execute();

      // if we created a new rfp_proposals row and invite didn't previously have one,
      // we already attached it above. No further action needed.
    }

    // ---------- INSERT NEW INVITATION ----------
    else {
      if (hasRfp && createdRfpPropId) {
        // insert including rfp_prop_id
        await sql
          .prepare(`
            INSERT INTO myinvitation
              (issue_id, resume_id, freelancer_name, invite_status, price, deal, rfp_prop_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bindParams(
            finalIssueId,
            resumeId || null,
            freelancerName,
            inviteStatus,
            finalPrice,
            finalDeal,
            createdRfpPropId
          )
          .execute();
      } else {
        // insert without rfp_prop_id
        await sql
          .prepare(`
            INSERT INTO myinvitation
              (issue_id, resume_id, freelancer_name, invite_status, price, deal)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bindParams(
            finalIssueId,
            resumeId || null,
            freelancerName,
            inviteStatus,
            finalPrice,
            finalDeal
          )
          .execute();
      }
    }

    return { success: true, issueId: finalIssueId };
  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e);
    return { success: false, error: e.message || String(e) };
  }
}

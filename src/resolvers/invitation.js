import crypto from "crypto";

export default async function invitation({ payload, sql }) {

  let {
    issueType,
    issueKey,
    issueSummary,
    first_name,
    last_name,
    resumeId,
    inviteStatus,
    price,
    deal,
    rfpMessage
  } = payload;

  if (!first_name) return { success: false, error: "Freelancer name is required" };
  if (!issueKey) return { success: false, error: "Issue key is required" };
  if (!issueSummary) return { success: false, error: "Issue summary is required" };
  if (!issueType) return { success: false, error: "Issue type is required" };

  const hasRfp = rfpMessage && String(rfpMessage).trim() !== "";
  if (hasRfp) inviteStatus = "yes";

  try {
    /* ---------------- ensure issue exists ---------------- */
    let issueId;
    const issueRes = await sql
      .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
      .bindParams(issueKey)
      .execute();

    if (issueRes.rows.length) {
      issueId = issueRes.rows[0].id;
    } else {
      await sql
        .prepare(
          `INSERT INTO issues (issue_type, issue_key, issue_summary)
           VALUES (?, ?, ?)`
        )
        .bindParams(issueType, issueKey, issueSummary)
        .execute();

      const reselect = await sql
        .prepare(`SELECT id FROM issues WHERE issue_key = ?`)
        .bindParams(issueKey)
        .execute();

      issueId = reselect.rows[0].id;
    }

    /* ---------------- load invitation ---------------- */
    const invRes = await sql
      .prepare(`
        SELECT *
        FROM myinvitation
        WHERE issue_id = ? AND resume_id = ?
        LIMIT 1
      `)
      .bindParams(issueId, resumeId)
      .execute();

    const invitationRow = invRes.rows[0] || null;
    let rfpPropId;

    /* ---------------- HARD LOCK: DEAL FINALIZED ---------------- */
    if (invitationRow && invitationRow.deal === "yes") {
      if (deal === "yes") {
        return {
          success: true,
          issueId,
          rfpPropId: invitationRow.rfp_prop_id
        };
      }

      return {
        success: false,
        error: "Deal already finalized. No further changes allowed."
      };
    }

    /* ---------------- CREATE OR UPDATE INVITATION ---------------- */
    if (!invitationRow) {
      // CREATE
      rfpPropId = crypto.randomUUID();

      await sql
        .prepare(`
          INSERT INTO myinvitation
          (issue_id, resume_id, first_name, last_name, invite_status, price, deal, rfp_prop_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          issueId,
          resumeId,
          first_name,
          last_name,
          inviteStatus ?? null,
          price ?? null,
          deal === "yes" ? "yes" : null,
          rfpPropId
        )
        .execute();
    } else {
      // UPDATE
      rfpPropId = invitationRow.rfp_prop_id;

      if (deal === "yes") {
        // FINALIZE DEAL ONLY
        await sql
          .prepare(`
            UPDATE myinvitation
            SET deal = 'yes'
            WHERE id = ?
          `)
          .bindParams(invitationRow.id)
          .execute();
      } else {
        // NORMAL UPDATE (NO WIPE)
        await sql
          .prepare(`
            UPDATE myinvitation
            SET
              invite_status = COALESCE(?, invite_status),
              price         = COALESCE(?, price)
            WHERE id = ?
          `)
          .bindParams(
            inviteStatus ?? null,
            price ?? null,
            invitationRow.id
          )
          .execute();
      }
    }

    /* ---------------- append RFP message ---------------- */
    if (hasRfp) {
      const openRes = await sql
        .prepare(`
          SELECT id, round_no, rfp_message
          FROM rfp_proposals
          WHERE rfp_prop_id = ?
            AND proposals IS NULL
          ORDER BY round_no DESC
          LIMIT 1
        `)
        .bindParams(rfpPropId)
        .execute();

      if (openRes.rows.length) {
        const row = openRes.rows[0];
        const newMessage = row.rfp_message
          ? row.rfp_message + "\n\n" + String(rfpMessage).trim()
          : String(rfpMessage).trim();

        await sql
          .prepare(`
            UPDATE rfp_proposals
            SET rfp_message = ?
            WHERE id = ?
          `)
          .bindParams(newMessage, row.id)
          .execute();
      } else {
        const roundRes = await sql
          .prepare(`
            SELECT COALESCE(MAX(round_no), 0) AS max_round
            FROM rfp_proposals
            WHERE rfp_prop_id = ?
          `)
          .bindParams(rfpPropId)
          .execute();

        const nextRound = (roundRes.rows[0]?.max_round || 0) + 1;

        await sql
          .prepare(`
            INSERT INTO rfp_proposals
            (rfp_prop_id, round_no, rfp_message, proposals)
            VALUES (?, ?, ?, NULL)
          `)
          .bindParams(
            rfpPropId,
            nextRound,
            String(rfpMessage).trim()
          )
          .execute();
      }
    }

    return {
      success: true,
      issueId,
      rfpPropId
    };
  } catch (e) {
    console.error(">>> SQL ERROR (invitation):", e);
    return { success: false, error: e.message || String(e) };
  }
}

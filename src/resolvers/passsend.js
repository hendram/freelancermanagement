// resolvers/passsend.js
export default async function passsend({ payload, sql }) {
  const {
    issueId,
    issueKey,
    resumeId, // current freelancer (the one being passed)
    referees = [], // [{ first_name, last_name }] ← frontend sends ONLY this
  } = payload;

  console.log("payload passsend", payload);

/* -----------------------------
   1. Get rfp_prop_id, deal, issue_summary
----------------------------- */
const invRes = await sql
  .prepare(`
    SELECT
      mi.rfp_prop_id,
      mi.deal,
      i.issue_summary
    FROM myinvitation mi
    JOIN issues i ON i.id = mi.issue_id
    WHERE mi.issue_id = ? AND mi.resume_id = ?
  `)
  .bindParams(issueId, resumeId)
  .execute();

if (invRes.rows.length === 0) {
  return { success: true };
}

if (invRes.rows[0].deal === "yes") {
  throw new Error("Cannot pass when deal is already yes");
}

const rfpPropId   = invRes.rows[0].rfp_prop_id;
const issueSummary = invRes.rows[0].issue_summary;

  /* -----------------------------
     2. Delete negotiations
  ----------------------------- */
  await sql
    .prepare(`
      DELETE FROM rfp_proposals
      WHERE rfp_prop_id = ?
    `)
    .bindParams(rfpPropId)
    .execute();

  /* -----------------------------
     3. Delete invitation
  ----------------------------- */
  await sql
    .prepare(`
      DELETE FROM myinvitation
      WHERE issue_id = ? AND resume_id = ?
    `)
    .bindParams(issueId, resumeId)
    .execute();

  /* -----------------------------
     3.1 Load freelancer full name
  ----------------------------- */
  const freelancerRes = await sql
    .prepare(`
      SELECT first_name, last_name
      FROM resumes
      WHERE id = ?
    `)
    .bindParams(resumeId)
    .execute();

  if (freelancerRes.rows.length === 0) {
    throw new Error("Freelancer resume not found");
  }

  const freelancerFirstName = freelancerRes.rows[0].first_name;
  const freelancerLastName  = freelancerRes.rows[0].last_name;

  /* -----------------------------
     4. Resolve REFEREE resume_id
     (CRITICAL FIX)
  ----------------------------- */
  const resolvedReferees = [];

  for (const r of referees) {
    const res = await sql
      .prepare(`
        SELECT id
        FROM resumes
        WHERE first_name = ? AND last_name = ?
        LIMIT 1
      `)
      .bindParams(r.first_name, r.last_name)
      .execute();

    if (res.rows.length === 0) {
      // skip silently or throw — your choice
      console.warn(
        "Referee resume not found:",
        r.first_name,
        r.last_name
      );
      continue;
    }

    resolvedReferees.push({
      resume_id: res.rows[0].id,
      first_name: r.first_name,
      last_name: r.last_name
    });
  }

  /* -----------------------------
     5. Sync REFERRERS table
  ----------------------------- */
  const refereeKeySet = new Set(
    resolvedReferees.map(r => `${r.first_name}::${r.last_name}`)
  );

  const deletePlaceholders =
    refereeKeySet.size > 0
      ? [...refereeKeySet].map(() => "?").join(",")
      : "''";

  /* ---- delete removed referees ---- */
  await sql
    .prepare(`
      DELETE FROM referrers
      WHERE
        referrer_first_name = ?
        AND referrer_last_name = ?
        AND issue_key = ?
        AND CONCAT(first_name, '::', last_name) NOT IN (${deletePlaceholders})
    `)
    .bindParams(
      freelancerFirstName,
      freelancerLastName,
      issueKey,
      ...refereeKeySet
    )
    .execute();

  /* ---- insert missing referees ---- */
  for (const r of resolvedReferees) {
    const exists = await sql
      .prepare(`
        SELECT 1
        FROM referrers
        WHERE
          first_name = ?
          AND last_name = ?
          AND referrer_first_name = ?
          AND referrer_last_name = ?
          AND issue_key = ?
        LIMIT 1
      `)
      .bindParams(
        r.first_name,
        r.last_name,
        freelancerFirstName,
        freelancerLastName,
        issueKey
      )
      .execute();

    if (exists.rows.length === 0) {
      await sql
        .prepare(`
          INSERT INTO referrers
            (resume_id, first_name, last_name,
             referrer_first_name, referrer_last_name,
             issue_key, issue_summary)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bindParams(
          r.resume_id,
          r.first_name,
          r.last_name,
          freelancerFirstName,
          freelancerLastName,
          issueKey,
          issueSummary
        )
        .execute();
    }
  }

  /* -----------------------------
     6. Reward ONLY ONE referee (+5)
  ----------------------------- */
  for (const r of resolvedReferees) {
    const rep = await sql
      .prepare(`
        SELECT total_reputation_value
        FROM assignreputation
        WHERE resume_id = ?
      `)
      .bindParams(r.resume_id)
      .execute();

    if (
      rep.rows.length > 0 &&
      Number(rep.rows[0].total_reputation_value) >= 0
    ) {
      await sql
        .prepare(`
          UPDATE assignreputation
          SET total_reputation_value = total_reputation_value + 5
          WHERE resume_id = ?
        `)
        .bindParams(r.resume_id)
        .execute();

      break; // reward ONLY ONE
    }
  }

  return { success: true };
}

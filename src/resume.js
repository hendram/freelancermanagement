import Resolver from '@forge/resolver';
import { sql } from '@forge/sql';
import crypto from 'crypto';
import { route } from "@forge/api";

const resolver = new Resolver();

resolver.define('addresume', async ({ payload }) => {
  const { bio, experience, skills } = payload;

  const resumeId = crypto.randomUUID();

  try {
    // INSERT BIO
    await sql.prepare(`
      INSERT INTO resumes
      (id, first_name, last_name, date_of_birth, place_of_birth, address,
       religion, contact, email, nationality, github, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bindParams(
      resumeId,
      bio.firstName,
      bio.lastName,
      bio.dateOfBirth,
      bio.placeOfBirth,
      bio.address,
      bio.religion,
      bio.contact,
      bio.email,
      bio.nationality,
      bio.github,
      skills
    )
    .execute();

    // INSERT EXPERIENCE ROWS
    for (const exp of experience) {
      await sql.prepare(`
        INSERT INTO experiences
        (id, resume_id, company, position, working_period, job_description)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bindParams(
        crypto.randomUUID(),
        resumeId,
        exp.company,
        exp.position,
        exp.workingPeriod,
        exp.jobDescription
      )
      .execute();
    }

    return { success: true, resumeId };

  } catch (e) {
    console.error(">>> SQL ERROR (addresume):", e.stack);
    return { success: false, error: e.message };
  }
});

resolver.define('updateresume', async () => {
  try {
    // 1) Total count for dropdown options
    const countQuery = await sql.prepare(`
      SELECT COUNT(*) AS total
      FROM resumes
    `).execute();

    const totalCount = countQuery.rows?.[0]?.total || 0;

    // 2) Fetch first 10 resumes (initial load)
    const resumeQuery = await sql.prepare(`
      SELECT
        id,
        first_name,
        last_name,
        date_of_birth,
        place_of_birth,
        address,
        religion,
        contact,
        email,
        nationality,
        github,
        skills,
        created_at
      FROM resumes
      ORDER BY created_at DESC
      LIMIT 10
    `).execute();

    const resumes = resumeQuery.rows || [];
    const finalList = [];

    // 3) Build final resume list with experiences included
    for (const r of resumes) {
      const expQuery = await sql.prepare(`
        SELECT
          id,
          company,
          position,
          working_period,
          job_description,
          created_at
        FROM experiences
        WHERE resume_id = ?
        ORDER BY created_at DESC
      `)
      .bindParams(r.id)
      .execute();

      finalList.push({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        dateOfBirth: r.date_of_birth,
        placeOfBirth: r.place_of_birth,
        address: r.address,
        religion: r.religion,
        contact: r.contact,
        email: r.email,
        nationality: r.nationality,
        github: r.github,
        skills: r.skills,
        createdAt: r.created_at,
        experiences: expQuery.rows || []
      });
    }

    // 4) Final output
    return {
      totalCount,
      resumes: finalList
    };

  } catch (err) {
    console.error(">>> SQL ERROR STACK (updateresume):", err.stack);
    return {
      totalCount: 0,
      resumes: []
    };
  }
});

resolver.define('updateaction', async (req) => {
  try {
    const data = req.payload;

    const {
      id,
      firstName,
      lastName,
      dateOfBirth,
      placeOfBirth,
      address,
      religion,
      contact,
      email,
      nationality,
      github,
      skills
    } = data;

    // 1) Update the resume
    const updateQuery = await sql.prepare(`
      UPDATE resumes
      SET
        first_name = ?,
        last_name = ?,
        date_of_birth = ?,
        place_of_birth = ?,
        address = ?,
        religion = ?,
        contact = ?,
        email = ?,
        nationality = ?,
        github = ?,
        skills = ?
      WHERE id = ?
      RETURNING
        id,
        first_name,
        last_name,
        date_of_birth,
        place_of_birth,
        address,
        religion,
        contact,
        email,
        nationality,
        github,
        skills,
        created_at
    `)
    .bindParams(
      firstName,
      lastName,
      dateOfBirth,
      placeOfBirth,
      address,
      religion,
      contact,
      email,
      nationality,
      github,
      skills,
      id
    )
    .execute();

    const updatedResume = updateQuery.rows?.[0] || null;

    // 2) Fetch experiences too (same as updateresume structure)
    let experiences = [];
    if (updatedResume) {
      const expQuery = await sql.prepare(`
        SELECT
          id,
          company,
          position,
          working_period,
          job_description,
          created_at
        FROM experiences
        WHERE resume_id = ?
        ORDER BY created_at DESC
      `)
      .bindParams(updatedResume.id)
      .execute();

      experiences = expQuery.rows || [];
    }

    // 3) Return final object (same style as updateresume)
    return {
      success: true,
      resume: {
        ...updatedResume,
        experiences
      }
    };

  } catch (err) {
    console.error(">>> SQL ERROR STACK (updateaction):", err.stack);
    return {
      success: false,
      resume: null
    };
  }
});


resolver.define('deleteresume', async ({ payload }) => {
  const { id } = payload;

  if (!id) {
    return { success: false, error: "Missing resume ID" };
  }

  try {
    // Delete experiences first
    await sql.prepare(`
      DELETE FROM experiences
      WHERE resume_id = ?
    `)
    .bindParams(id)
    .execute();

    // Delete resume
    await sql.prepare(`
      DELETE FROM resumes
      WHERE id = ?
    `)
    .bindParams(id)
    .execute();

    return { success: true };
  } catch (err) {
    console.error("Delete resume failed:", err.stack);
    return { success: false, error: "SQL delete error" };
  }
});

resolver.define('reputationcatalog', async () => {
  try {
    const result = await sql.prepare(`
      SELECT
        id,
        range_lowerpositive,
        range_upperpositive,
        positive_id,
        positive_definition,
        positive_value,
        range_lowernegative,
        range_uppernegative,
        negative_id,
        negative_definition,
        negative_value
      FROM reputationcatalog
      ORDER BY id ASC
    `).execute();

    const catalog = (result.rows || []).map(row => ({
      id: row.id,
      rangeLowerpositive: row.range_lowerpositive,
      rangeUpperpositive: row.range_upperpositive,
      positiveId: row.positive_id,
      positiveDefinition: row.positive_definition,
      positiveValue: row.positive_value,
      rangeLowernegative: row.range_lowernegative,
      rangeUppernegative: row.range_uppernegative,
      negativeId: row.negative_id,
      negativeDefinition: row.negative_definition,
      negativeValue: row.negative_value
    }));

    return { success: true, catalog };

  } catch (err) {
    console.error("Failed to fetch reputation catalog:", err.stack);
    return { success: false, error: "SQL select error" };
  }
});

resolver.define('reputationcatalogsave', async ({ payload }) => {
  const { positiveReps = [], negativeReps = [], posRange = {}, negRange = {} } = payload;

  try {
    // CLEAR TABLE
    await sql.prepare(`DELETE FROM reputationcatalog`).execute();

    const count = Math.max(positiveReps.length, negativeReps.length);

    for (let i = 0; i < count; i++) {
      const pos = positiveReps[i] || {};
      const neg = negativeReps[i] || {};

      await sql.prepare(`
        INSERT INTO reputationcatalog (
          range_lowerpositive,
          range_upperpositive,
          positive_id,
          positive_definition,
          positive_value,
          range_lowernegative,
          range_uppernegative,
          negative_id,
          negative_definition,
          negative_value
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bindParams(
        posRange.from || null,
        posRange.to || null,
        pos.id || null,
        pos.description || null,
        pos.value || null,
        negRange.from || null,
        negRange.to || null,
        neg.id || null,
        neg.description || null,
        neg.value || null
      )
      .execute();
    }

    return { success: true };

  } catch (err) {
    console.error("Failed to save reputation catalog:", err.stack);
    return { success: false, error: "SQL insert error" };
  }
});

resolver.define('getreputation', async () => {
  try {
    // 1) Fetch all active freelancers (works reliably)
    const resumeResult = await sql.prepare(`
      SELECT id AS resume_id, first_name, last_name
      FROM resumes
      ORDER BY first_name ASC, last_name ASC
    `).execute();

    const resumeRows = resumeResult.rows || [];

    // Fast lookup for valid resumes
    const validResumeIds = new Set(resumeRows.map(r => r.resume_id));

    // 2) Fetch all reputation entries (raw)
    const repResult = await sql.prepare(`
      SELECT resume_id, total_reputation_value
      FROM assignreputation
    `).execute();

    const repRows = repResult.rows || [];

    // 3) Build repMap but only for VALID resume ids
    const repMap = {};
    repRows.forEach(r => {
      if (validResumeIds.has(r.resume_id)) {
        repMap[r.resume_id] = r.total_reputation_value;
      }
    });

    // 4) Final combined list (every resume is shown)
    const finalList = resumeRows.map(r => ({
      resume_id: r.resume_id,
      fullName: `${r.first_name} ${r.last_name}`.trim(),
      total_reputation_value: repMap[r.resume_id] || 0
    }));

    console.log("finalList", finalList);
    return { success: true, list: finalList };

  } catch (err) {
    console.error("getreputation failed:", err.stack);
    return { success: false, error: "SQL select error" };
  }
});


resolver.define('assignreputation', async ({ payload }) => {
  try {
    const { resume_id, fullName, posId, negId } = payload;

    if (!resume_id || !fullName) {
      return { success: false, error: "Missing resume_id or fullName" };
    }

    // Split fullName → store always for audit/history
    const parts = fullName.trim().split(" ");
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    // ----------- Get positive value -----------
    let positiveValue = 0;
    if (posId && posId > 0) {
      const posResult = await sql.prepare(
        `SELECT positive_value FROM reputationcatalog WHERE positive_id = ?`
      ).bindParams(posId).execute();

      if (posResult.rows.length > 0) {
        positiveValue = posResult.rows[0].positive_value || 0;
      }
    }

    // ----------- Get negative value -----------
    let negativeValue = 0;
    if (negId && negId > 0) {  // <-- only apply if negative
      const negResult = await sql.prepare(
        `SELECT negative_value FROM reputationcatalog WHERE negative_id = ?`
      ).bindParams(negId).execute();

      if (negResult.rows.length > 0) {
        negativeValue = negResult.rows[0].negative_value || 0; // already negative
      }
    }

    // ----------- Check existing reputation row -----------
    const checkResult = await sql.prepare(
      `SELECT id, total_reputation_value FROM assignreputation WHERE resume_id = ? LIMIT 1`
    ).bindParams(resume_id).execute();

    console.log("checkResult", checkResult);
    // ----------- Calculate new total -----------
    let newTotal = positiveValue + negativeValue; // just add, negative works automatically

    if (checkResult.rows.length > 0) {
      const existingId = checkResult.rows[0].id;
      const currentValue = checkResult.rows[0].total_reputation_value || 0;

      newTotal = currentValue + positiveValue + negativeValue;
      console.log("newTotal", newTotal);
      // ----------- Update existing row -----------
  await sql.prepare(
  `UPDATE assignreputation
   SET total_reputation_value = ?, first_name = ?, last_name = ?
   WHERE id = ?`
   ).bindParams(newTotal, first_name, last_name, existingId).execute();

  } 
    // ----------- Insert new row -----------
    else {
      await sql.prepare(
        `INSERT INTO assignreputation (
          resume_id,
          first_name,
          last_name,
          total_reputation_value
        ) VALUES (?, ?, ?, ?)`
      ).bindParams(resume_id, first_name, last_name, newTotal).execute();
    }

    return {
      success: true,
      resume_id,
      first_name,
      last_name,
      appliedPositive: positiveValue,
      appliedNegative: negativeValue,
      finalTotal: newTotal
    };

  } catch (err) {
    console.error("assignreputation error:", err.stack);
    return { success: false, error: "SQL error while assigning reputation" };
  }
});

resolver.define("getuserstories", async () => {
  try {
    console.log("getuserstories: start");

    // --------------------------------------
    // 1. Load all freelancers (resumes)
    // --------------------------------------
    const resumesRes = await sql.prepare(
      `SELECT id, first_name, last_name FROM resumes`
    ).execute();

    const resumes = resumesRes.rows.map(r => ({
      resume_id: r.id,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      fullName: `${(r.first_name ?? "").trim()} ${(r.last_name ?? "").trim()}`.trim()
    }));

    console.log("resumes count =", resumes.length);


    // --------------------------------------
    // 2. Load all referrer rows
    // --------------------------------------
    const refRes = await sql.prepare(
      `SELECT resume_id, referrer_first_name, referrer_last_name, user_story
       FROM referrers`
    ).execute();

    console.log("referrers rows =", refRes.rows.length);

    const refMap = {};
    for (const row of refRes.rows) {
      if (!refMap[row.resume_id]) refMap[row.resume_id] = [];

      refMap[row.resume_id].push({
        referrer_first_name: row.referrer_first_name ?? "",
        referrer_last_name: row.referrer_last_name ?? "",
        userStories: row.user_story ? [row.user_story] : [],
        isFixed: true // existing entries cannot be changed
      });
    }


    // --------------------------------------
    // 3. Fetch Jira user stories via Forge route
    // --------------------------------------
    const jiraResp = await api.asApp().requestJira(
      route`/rest/api/3/search?jql=status!="Done"&fields=summary`
    );

    if (!jiraResp.ok) {
      console.error("Jira request failed:", jiraResp.status, await jiraResp.text());
      return { success: false, error: "Jira API failed" };
    }

    const jiraJson = await jiraResp.json();

    const allStories =
      jiraJson.issues?.map(i => ({
        id: i.key,
        summary: i.fields.summary
      })) || [];

    console.log("jira stories count =", allStories.length);


    // --------------------------------------
    // 4. Build final output
    // --------------------------------------
    const finalList = resumes.map(resume => {
      const existing = refMap[resume.resume_id] || [];

      const referrers =
        existing.length > 0
          ? existing
          : [{
              referrer_first_name: "",
              referrer_last_name: "",
              userStories: [],
              isFixed: false // new row, editable
            }];

      return {
        resume_id: resume.resume_id,
        first_name: resume.first_name,
        last_name: resume.last_name,
        fullName: resume.fullName,

        referrers,
        availableReferrers: resumes,
        availableStories: allStories
      };
    });

    console.log("final count =", finalList.length);

    return { success: true, list: finalList };

  } catch (err) {
    console.error("getuserstories error:", err);
    return { success: false, error: "Failed to fetch user stories" };
  }
});

export const handler = resolver.getDefinitions();

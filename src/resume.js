import Resolver from '@forge/resolver';
import { sql } from '@forge/sql';
import crypto from 'crypto';

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
    const result = await sql.query(`
      SELECT *
      FROM reputationcatalog
      ORDER BY id ASC
    `);

    const catalog = result.map(row => ({
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


export const handler = resolver.getDefinitions();

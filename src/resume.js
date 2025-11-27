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

// REQUIRED EXPORT FOR FORGE
export const handler = resolver.getDefinitions();

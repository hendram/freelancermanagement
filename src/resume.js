import Resolver from '@forge/resolver';
import { sql } from '@forge/sql';
import crypto from 'crypto';

const resolver = new Resolver();

/**
 * ADD RESUME
 * --------------------------------
 * Accepts:
 *  fullName, dateOfBirth, placeOfBirth, address, religion,
 *  contact, email, nationality, github,
 *  skills,
 *  experiences: [ { company, position, workingPeriod, jobDescription } ]
 */
resolver.define('addresume', async ({ payload }) => {
  const {
    fullName, dateOfBirth, placeOfBirth, address, religion,
    contact, email, nationality, github,
    skills,
    experiences    // array of experience objects
  } = payload;

  const resumeId = crypto.randomUUID();

  try {
    // INSERT MAIN BIO ROW
    await sql.prepare(`
      INSERT INTO resumes
      (id, full_name, date_of_birth, place_of_birth, address, religion,
       contact, email, nationality, github, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bindParams(
      resumeId,
      fullName,
      dateOfBirth,
      placeOfBirth,
      address,
      religion,
      contact,
      email,
      nationality,
      github,
      skills
    )
    .execute();

    // INSERT ALL EXPERIENCE ROWS
    for (const exp of experiences) {
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



/**
 * FETCH LAST 10 RESUMES + EXPERIENCES
 * ------------------------------------
 */
resolver.define('updateresume', async () => {
  try {
    const resumeQuery = await sql.prepare(`
      SELECT
        id,
        full_name,
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
        fullName: r.full_name,
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

    return finalList;

  } catch (err) {
    console.error(">>> SQL ERROR STACK (updateresume):", err.stack);
    return [];
  }
});


// REQUIRED EXPORT FOR FORGE
export const handler = resolver.getDefinitions();

// resolvers/addresume.js
import crypto from "crypto";

export default async function addresume({ payload, sql }) {
  const { bio, experience, skills } = payload;
  const resumeId = crypto.randomUUID();

  try {
    // Insert resume bio
    await sql
      .prepare(`
        INSERT INTO resumes
        (id, photo_base64, first_name, last_name, date_of_birth, place_of_birth,
         address, religion, contact, email, nationality, github, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bindParams(
        resumeId,
        bio.photoBase64 || null,
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

    // Insert experience rows
    for (const exp of experience) {
      await sql
        .prepare(`
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
}

// resolvers/updateaction.js
export default async function updateaction({ payload, sql }) {
  const { id, bio, experience, skills } = payload;

  try {
    // 1. Update resume bio
    await sql.prepare(`
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
    `)
    .bindParams(
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
      skills,
      id
    )
    .execute();

    // 2. Remove old experiences
    await sql.prepare(`
      DELETE FROM experiences
      WHERE resume_id = ?
    `)
    .bindParams(id)
    .execute();

    // 3. Insert updated experiences
    for (const exp of experience) {
      await sql.prepare(`
        INSERT INTO experiences
        (id, resume_id, company, position, working_period, job_description)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bindParams(
        crypto.randomUUID(),
        id,
        exp.company,
        exp.position,
        exp.workingPeriod,
        exp.jobDescription
      )
      .execute();
    }

    return { success: true };

  } catch (err) {
    console.error(">>> SQL ERROR STACK (updateaction):", err.stack);
    return { success: false };
  }
}

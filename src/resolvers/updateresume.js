// resolvers/updateresume.js
export default async function updateresume({ sql }) {
  try {
    // Count total resumes
    const countQuery = await sql.prepare(`
      SELECT COUNT(*) AS total
      FROM resumes
    `).execute();

    const totalCount = countQuery.rows?.[0]?.total || 0;

    // Fetch the latest 10 resumes
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

    // Attach experience rows to each resume
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
}

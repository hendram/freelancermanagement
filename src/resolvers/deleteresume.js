export default async function deleteresume({ payload, sql }) {
  const { id } = payload;

  if (!id) {
    return { success: false, error: "Missing resume ID" };
  }

  try {
    await sql.prepare(`
      DELETE FROM experiences
      WHERE resume_id = ?
    `)
    .bindParams(id)
    .execute();

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
}

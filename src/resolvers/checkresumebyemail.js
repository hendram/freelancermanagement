export default async function checkresumebyemail({ payload, sql }) {
  const { email } = payload;

  if (!email) return { success: false, error: "Email is required" };

  try {
    const result = await sql
      .prepare(`SELECT id FROM resumes WHERE email = ?`)
      .bindParams(email)
      .execute();

    if (result.rows.length > 0) {
      return { success: true, exists: true, resumeId: result.rows[0].id };
    } else {
      return { success: true, exists: false };
    }
  } catch (e) {
    console.error("SQL ERROR (checkResumeByEmail):", e.stack);
    return { success: false, error: e.message };
  }
}

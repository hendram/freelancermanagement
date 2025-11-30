export default async function assignreputation({ payload, sql }) {
  try {
    const { resume_id, fullName, posId, negId } = payload;

    if (!resume_id || !fullName) {
      return { success: false, error: "Missing resume_id or fullName" };
    }

    const parts = fullName.trim().split(" ");
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    let positiveValue = 0;
    if (posId && posId > 0) {
      const pos = await sql.prepare(
        `SELECT positive_value FROM reputationcatalog WHERE positive_id = ?`
      ).bindParams(posId).execute();

      if (pos.rows.length > 0) {
        positiveValue = pos.rows[0].positive_value || 0;
      }
    }

    let negativeValue = 0;
    if (negId && negId > 0) {
      const neg = await sql.prepare(
        `SELECT negative_value FROM reputationcatalog WHERE negative_id = ?`
      ).bindParams(negId).execute();

      if (neg.rows.length > 0) {
        negativeValue = neg.rows[0].negative_value || 0;
      }
    }

    const existing = await sql.prepare(
      `SELECT id, total_reputation_value FROM assignreputation WHERE resume_id = ? LIMIT 1`
    ).bindParams(resume_id).execute();

    let newTotal = positiveValue + negativeValue;

    if (existing.rows.length > 0) {
      newTotal = existing.rows[0].total_reputation_value + newTotal;

      await sql.prepare(`
        UPDATE assignreputation
        SET total_reputation_value = ?, first_name = ?, last_name = ?
        WHERE id = ?
      `).bindParams(newTotal, first_name, last_name, existing.rows[0].id).execute();

    } else {
      await sql.prepare(`
        INSERT INTO assignreputation (
          resume_id, first_name, last_name, total_reputation_value
        ) VALUES (?, ?, ?, ?)
      `).bindParams(resume_id, first_name, last_name, newTotal).execute();
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
}

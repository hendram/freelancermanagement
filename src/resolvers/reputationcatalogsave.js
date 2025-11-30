export default async function reputationcatalogsave({ payload, sql }) {
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
}

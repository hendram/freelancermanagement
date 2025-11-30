export default async function reputationcatalog({ payload, sql }) {
  try {
    const result = await sql.prepare(`
      SELECT
        id,
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
      FROM reputationcatalog
      ORDER BY id ASC
    `).execute();

    const catalog = (result.rows || []).map(row => ({
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
}

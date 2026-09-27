export async function collectPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  maxRows = 10000,
  pageSize = 500,
): Promise<{ rows: T[]; truncated: boolean }> {
  if (maxRows < 1 || pageSize < 1) throw new Error("分页参数必须大于零");
  const rows: T[] = [];
  while (rows.length <= maxRows) {
    const amount = Math.min(pageSize, maxRows + 1 - rows.length);
    const page = await fetchPage(rows.length, rows.length + amount - 1);
    rows.push(...page);
    if (page.length < amount) break;
  }
  return { rows: rows.slice(0, maxRows), truncated: rows.length > maxRows };
}

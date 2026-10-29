const PAGE_SIZE = 1000;

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => any;
  };
};

/**
 * Load every row from a table. Supabase caps a single request at 1,000.
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  client: QueryClient,
  table: string,
  columns = "*",
  orderBy = "created_at",
  apply?: (query: any) => any
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    let query = client.from(table).select(columns);
    if (apply) query = apply(query);
    const { data, error } = await query
      .order(orderBy, { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data || []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export const DINER_STAGES = [
  'storefront_view',
  'item_add',
  'checkout_start',
  'order_created',
];

export function funnelCounts(rows: { reached: number; count: number }[]) {
  return DINER_STAGES.map((event, index) => {
    const count = rows
      .filter((r) => r.reached > index)
      .reduce((sum, r) => sum + r.count, 0);
    const previous =
      index === 0
        ? count
        : rows
            .filter((r) => r.reached >= index)
            .reduce((sum, r) => sum + r.count, 0);
    return {
      event,
      count,
      fromPrevious: previous ? (count / previous) * 100 : null,
    };
  });
}

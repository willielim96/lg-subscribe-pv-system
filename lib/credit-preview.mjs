const malaysiaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' });
function dayNumber(date) {
  const parts = malaysiaDay.formatToParts(date);
  const part = type => Number(parts.find(p => p.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day')) / 86400000;
}
export function creditWaitDays(keyedAt, today = new Date()) {
  if (!keyedAt || !Number.isFinite(Date.parse(keyedAt))) return null;
  return Math.max(0, dayNumber(today) - dayNumber(new Date(keyedAt)));
}
export function compareCreditAge(a, b) {
  const timestamp = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : Infinity;
  return (timestamp(a.created_at) - timestamp(b.created_at)) || a.order_number.localeCompare(b.order_number);
}
export function pvWithoutCredit(total, creditPV) {
  return Math.round((total - creditPV) * 100) / 100;
}

export function monthlyAgentPV(orders, agent, month) {
  const result = { total: 0, credit: 0 };
  if (!month) return result;
  for (const order of orders) {
    if (order.agent !== agent || order.cancelled || !order.installed_on?.startsWith(month + '-')) continue;
    const pv = Number(order.pv);
    result.total += pv;
    if (order.is_credit) result.credit += pv;
  }
  return result;
}

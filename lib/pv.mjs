export function calculatePV({ sale_type, manual_pv, monthly_fee, years, offer, category, installed_on }) {
  if (!installed_on) return 0;
  if (sale_type === 'cash') return Number(manual_pv || 0);
  const fee = Number(monthly_fee) - (offer === 'bundle' ? 10 : 0);
  const bonus = category === 'Water purifier' && installed_on <= '2026-12-31' ? 300 : 0;
  return Math.round((fee * (Number(years) === 5 ? 17 : 20) + bonus) * 100) / 100;
}

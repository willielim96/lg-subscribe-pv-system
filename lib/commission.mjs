const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const bonusTiers = [[22100, .12], [17000, .10], [10200, .08], [5100, .06], [0, .05]];
const allowanceTiers = [[30000, 4000], [20000, 3000], [15000, 2500], [12000, 1500], [8500, 1000], [5000, 800], [0, 0]];

export function calculateCommission(orders, agent, month) {
  const eligible = orders.filter(order => order.agent === agent && !order.cancelled && order.installed_on?.startsWith(month));
  const totalPV = eligible.reduce((sum, order) => sum + Number(order.pv), 0);
  const subscribePV = eligible.filter(order => order.sale_type === 'subscribe').reduce((sum, order) => sum + Number(order.pv), 0);
  const cashOrders = eligible.filter(order => order.sale_type === 'cash');
  const missingCashPrices = cashOrders.filter(order => !(Number(order.cash_price) > 0)).length;
  const cashBase = cashOrders.reduce((sum, order) => sum + Number(order.cash_price || 0), 0);
  const bonusRate = bonusTiers.find(([minimum]) => totalPV >= minimum)[1];
  const allowance = allowanceTiers.find(([minimum]) => totalPV >= minimum)[1];
  const supportActive = month >= '2026-10' && month <= '2026-12';
  const support = supportActive ? totalPV >= 15000 ? 1000 : totalPV >= 7500 ? 500 : 0 : 0;
  // Owner rule 2026-11-14: full 15% basic commission, no 70% / 30% split or deferred payment.
  const basic = round(subscribePV * .15);
  const cash = round(cashBase * .13);
  const bonus = round(totalPV * bonusRate);
  return { totalPV, subscribePV, bonusRate, basic, cash, bonus, allowance, support, missingCashPrices, total: round(basic + cash + bonus + allowance + support) };
}

import { calculateCommission } from '../lib/commission.mjs';
import type { Order } from '../lib/orders';

const money = (value: number) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CommissionSummary({ orders, agent, month, loaded }: { orders: Order[]; agent: string; month: string; loaded: boolean }) {
  if (!loaded) return <section className="panel">正在读取佣金资料…</section>;
  const result = calculateCommission(orders, agent, month);
  const [year, monthNumber] = month.split('-').map(Number);
  const payout = `${monthNumber === 12 ? year + 1 : year}-${String(monthNumber === 12 ? 1 : monthNumber + 1).padStart(2, '0')}`;
  const items = [
    ['Subscribe 当月基本佣金', 'Subscribe PV × 15% × 70%', result.basic],
    ['Cash Buy 佣金', '产品原价 × 13% · 一次过', result.cash],
    ['Performance Bonus', `总 PV × ${result.bonusRate * 100}%`, result.bonus],
    ['Allowance', '按当月总 PV 等级', result.allowance],
    ['Support Fund', '2026 年 10–12 月适用', result.support],
  ] as const;
  return <section className="panel commission">
    <h2>{month} 佣金明细</h2>
    <p>出薪月份 {payout} · 总业绩 {result.totalPV.toLocaleString('en-MY')} PV</p>
    {items.map(([label, formula, amount]) => <div className="commission-row" key={label}><div><strong>{label}</strong><p>{formula}</p></div><b>{money(amount)}</b></div>)}
    <div className="commission-row"><strong>{result.missingCashPrices ? '已知金额小计' : '预计出薪总额'}</strong><h2>{money(result.total)}</h2></div>
    {result.missingCashPrices > 0 && <p role="alert">有 {result.missingCashPrices} 张 Cash Buy 订单缺少产品原价，请修改订单补填后查看完整佣金。</p>}
    <small>按安装月份计算，取消订单会重算。各项金额四舍五入至两位小数。此处显示预计佣金。</small>
  </section>;
}

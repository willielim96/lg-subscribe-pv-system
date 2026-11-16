import { agents, fmt, type Order } from '../lib/orders';
import { monthlyAgentPV, pvWithoutCredit } from '../lib/credit-preview.mjs';
import styles from './agent-pv-comparison.module.css';

const goals = [15000, 22100];

export function AgentPVComparison({ orders, month, loaded }: { orders: Order[]; month: string; loaded: boolean }) {
  return <section className={`panel ${styles.panel}`}>
    <h2>Agent PV 对比</h2>
    {!month ? <p>请选择月份。</p> : !loaded ? <p>业绩资料尚未载入。</p> : <>
      <p className="muted">{month} · 目标差距按目前 Approved 计算</p>
      <div className={styles.cards}>
        {Object.entries(agents).map(([agent, name]) => {
          const { total, credit } = monthlyAgentPV(orders, agent, month);
          const approved = pvWithoutCredit(total, credit);
          return <article key={agent}>
            <h3>{name}</h3>
            <p><strong>目前 Approved：{fmt(approved)} PV</strong></p>
            <p>等待 Credit：{fmt(credit)} PV · 含 Credit：{fmt(total)} PV</p>
            {goals.map(goal => {
              const difference = pvWithoutCredit(goal, approved);
              const result = difference > 0 ? '还差 ' + fmt(difference) + ' PV'
                : difference < 0 ? '超出 ' + fmt(-difference) + ' PV' : '刚好达标';
              return <p key={goal}>{fmt(goal)} PV 目标 · <strong>{result}</strong></p>;
            })}
          </article>;
        })}
      </div>
    </>}
  </section>;
}

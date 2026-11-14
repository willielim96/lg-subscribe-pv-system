'use client';
import { useState } from 'react';
import { WhatsAppButton } from './whatsapp-button';
import { agents, fmt, type Order } from '../lib/orders';
import { filterOrders, orderStatus } from '../lib/order-search.mjs';

const statusLabels: Record<string, string> = { pending: 'Pending', installed: 'Installed', cancelled: '已取消' };
const blank = { text: '', agent: '', status: '', dateField: 'keyed', from: '', to: '' };

export function OrderSearch({ orders, loaded }: { orders: Order[]; loaded: boolean }) {
  const [filters, setFilters] = useState(blank);
  const set = (key: keyof typeof blank, value: string) => setFilters({ ...filters, [key]: value });
  const results = filterOrders(orders, filters) as Order[];
  const totalPV = results.reduce((sum, o) => sum + Number(o.pv), 0);

  if (!loaded) return <section className="panel">正在读取订单…</section>;
  return <section className="panel order-search">
    <h2>订单查询 · Search</h2>
    <input aria-label="搜索订单" placeholder="搜索姓名 / 电话 / Order Number" value={filters.text} onChange={e => set('text', e.target.value)} />
    <div className="filters">
      <label>Agent<select value={filters.agent} onChange={e => set('agent', e.target.value)}><option value="">全部 Agent</option>
        {Object.entries(agents).map(([id, name]) => <option key={id} value={id}>{name} · {id}</option>)}</select></label>
      <label>状态<select value={filters.status} onChange={e => set('status', e.target.value)}><option value="">全部</option>
        <option value="pending">Pending</option><option value="installed">Installed</option><option value="cancelled">已取消</option></select></label>
      <label>日期类型<select value={filters.dateField} onChange={e => set('dateField', e.target.value)}><option value="keyed">Key in 日期</option><option value="installed">安装日期</option></select></label>
      <label>从<input type="date" value={filters.from} onChange={e => set('from', e.target.value)} /></label>
      <label>到<input type="date" value={filters.to} onChange={e => set('to', e.target.value)} /></label>
    </div>
    <div className="search-summary"><span>找到 {results.length} 张订单 · {fmt(totalPV)} PV</span>
      <span><button className="secondary" type="button" onClick={() => setFilters(blank)}>清除筛选</button></span></div>
    <div className="orderlist">{!results.length ? <p className="empty">没有符合的订单</p> : results.map(o => <article className="order" key={o.id}>
      <div className="orderhead"><strong>{o.customer}</strong><b>{fmt(Number(o.pv))} PV</b></div>
      <p>{o.order_number} · {o.category} {o.model} · {statusLabels[orderStatus(o)]}{o.installed_on ? ' · 安装 ' + o.installed_on : ''}</p>
      {o.notes && <p className="note">备注：{o.notes}</p>}
      <small>{agents[o.agent] || o.agent} · Key in {new Date(o.created_at).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</small>
      <div className="actions"><WhatsAppButton phone={o.phone} /></div>
    </article>)}</div>
  </section>;
}

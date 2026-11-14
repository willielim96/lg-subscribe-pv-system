'use client';
import { useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppButton } from './whatsapp-button';
import { agents, fmt, type Order } from '../lib/orders';
import { buildCustomers, phoneConflicts, priceDetails, searchCustomers } from '../lib/customers.mjs';
import { useCustomerMerges } from '../hooks/use-customer-merges';

type Customer = {
  key: string; name: string; phone: string; names: string[]; orders: Order[];
  totalOrders: number; pendingOrders: number; installedOrders: number; cancelledOrders: number;
  installedPV: number; contractValue: number; firstOrderDate: string | null;
};
type Price = { cash: boolean; original: number | null; actual: number | null; promoPrice: number | null; promoMonths: number; total: number };

const offerNames: Record<string, string> = { normal: 'Normal', half: '首 9 个月半价', special: 'Special Price', bundle: 'Existing + New / New + New' };
const money = (value: number | null) => (value === null ? '—' : 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const day = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : '—');

export function CustomerDatabase({ orders, loaded, db }: { orders: Order[]; loaded: boolean; db: SupabaseClient | null }) {
  const merges = useCustomerMerges(db);
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const customers = useMemo(() => buildCustomers(orders, merges.active) as Customer[], [orders, merges.active]);
  const conflicts = useMemo(() => phoneConflicts(customers) as Customer[][], [customers]);
  const visible = searchCustomers(customers, query) as Customer[];
  const open = customers.find(c => c.key === openKey) || null;

  async function mergeInto(target: Customer, other: Customer) {
    const ok = window.confirm('确认把「' + other.name + ' · ' + (other.phone || '无电话') + '」合并到「' + target.name + '」？\n订单、PV 和佣金不会改变，之后可以恢复。');
    if (ok && await merges.merge(other.orders[0].id, target.orders[0].id)) setOpenKey(target.key);
  }

  if (!loaded) return <section className="panel">正在读取顾客资料…</section>;
  if (open) return <CustomerDetail customer={open} customers={customers} merges={merges} onBack={() => setOpenKey(null)} onMerge={other => void mergeInto(open, other)} orders={orders} />;

  return <section className="panel customers">
    <h2>Customers · 顾客资料库</h2>
    <p className="muted">自动从订单整理，共 {customers.length} 位顾客。相同姓名 + 相同电话才算同一位。</p>
    <input aria-label="搜索顾客" placeholder="搜索姓名 / 电话 / Order Number" value={query} onChange={e => setQuery(e.target.value)} />
    {conflicts.length > 0 && <div className="notice" role="alert">
      <strong>请确认：以下电话号码被不同姓名使用</strong>
      {conflicts.map(list => <p key={list[0].key}>{list[0].phone}：{list.map(c => c.name).join(' / ')}
        {list.map(c => <button key={c.key} className="secondary" onClick={() => setOpenKey(c.key)}>查看 {c.name}</button>)}</p>)}
      <small>系统不会自动合并。如果是同一位顾客，请打开顾客详情手动合并。</small>
    </div>}
    <div className="customer-list">
      {!visible.length ? <p className="empty">找不到顾客</p> : visible.map(c => <article className="order customer-row" key={c.key}>
        <div className="orderhead"><button className="link" onClick={() => setOpenKey(c.key)}>{c.name}</button><b>{fmt(c.installedPV)} PV</b></div>
        <p>{c.phone || '无电话号码'} · 订单 {c.totalOrders} · 已安装 {c.installedOrders}</p>
        <div className="actions"><WhatsAppButton phone={c.phone} /><button className="secondary" onClick={() => setOpenKey(c.key)}>购买历史</button></div>
      </article>)}
    </div>
  </section>;
}

function CustomerDetail({ customer: c, customers, merges, onBack, onMerge, orders }: {
  customer: Customer; customers: Customer[]; merges: ReturnType<typeof useCustomerMerges>; onBack: () => void; onMerge: (other: Customer) => void; orders: Order[];
}) {
  const [mergeKey, setMergeKey] = useState('');
  const others = customers.filter(o => o.key !== c.key);
  const orderIds = new Set(c.orders.map(o => o.id));
  const name = (id: string) => orders.find(o => o.id === id)?.customer || '已删除订单';
  const history = merges.merges.filter(m => orderIds.has(m.into_order_id) || orderIds.has(m.from_order_id));
  const facts: [string, string][] = [
    ['电话', c.phone || '—'], ['第一张订单', day(c.firstOrderDate)], ['订单总数', String(c.totalOrders)],
    ['Pending', String(c.pendingOrders)], ['已安装', String(c.installedOrders)], ['已安装 PV', fmt(c.installedPV)], ['合约总值', money(c.contractValue)],
  ];

  return <section className="panel customers">
    <button className="secondary" onClick={onBack}>← 返回顾客列表</button>
    <div className="orderhead customer-title"><h2>{c.name}</h2><WhatsAppButton phone={c.phone} /></div>
    {c.names.length > 1 && <p className="muted">合并的名字：{c.names.join(' / ')}</p>}
    <div className="facts">{facts.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    {c.cancelledOrders > 0 && <p className="muted">另有 {c.cancelledOrders} 张已取消订单（不计入统计）。</p>}

    <h3>Purchase History · 购买历史</h3>
    {c.orders.map(o => <PurchaseRow key={o.id} order={o} />)}

    {merges.available && <div className="merge">
      <h3>合并顾客</h3>
      <p className="muted">只在确定是同一位顾客时使用。合并不会改动订单，可以随时恢复。</p>
      <div className="pair"><select aria-label="选择要合并的顾客" value={mergeKey} onChange={e => setMergeKey(e.target.value)}>
        <option value="">选择顾客…</option>
        {others.map(o => <option key={o.key} value={o.key}>{o.name} · {o.phone || '无电话'} · {o.totalOrders} 单</option>)}
      </select><button disabled={!mergeKey} onClick={() => { const other = others.find(o => o.key === mergeKey); if (other) onMerge(other); }}>合并到这位顾客</button></div>
      {merges.message && <p className="message">{merges.message}</p>}
      {history.length > 0 && <><h3>修改记录</h3>{history.map(m => <p className="merge-log" key={m.id}>
        {day(m.created_at)} · 「{name(m.from_order_id)}」合并到「{name(m.into_order_id)}」{m.undone_at ? ' · 已于 ' + day(m.undone_at) + ' 恢复' : ''}
        {!m.undone_at && <button className="secondary" onClick={() => { if (window.confirm('恢复这次合并？两位顾客会重新分开。')) void merges.undo(m.id); }}>恢复</button>}
      </p>)}</>}
    </div>}
  </section>;
}

function PurchaseRow({ order: o }: { order: Order }) {
  const p = priceDetails(o) as Price;
  const rows: [string, string][] = p.cash
    ? [['购买方式', 'Cash Buy · 一次性付款'], ['产品价钱', money(p.total)]]
    : [
      ['原价月费', money(p.original)], ['实际月费', money(p.actual)], ['优惠', offerNames[o.offer] || o.offer],
      ['优惠期间月费', p.promoPrice === null ? '—' : money(p.promoPrice)], ['优惠月数', p.promoMonths ? p.promoMonths + ' 个月' : '—'],
      ['合约', o.years + ' Years'], ['合约总付款', money(p.total)],
    ];
  const status = o.cancelled ? '已取消' : o.installed_on ? 'Installed' : 'Pending';
  return <article className={'order purchase' + (o.cancelled ? ' cancelled' : '')}>
    <div className="orderhead"><strong>{o.order_number}</strong><b>{fmt(Number(o.pv))} PV</b></div>
    <p>{o.category}{o.model ? ' · ' + o.model : ''} · {status}{o.installed_on ? ' · 安装 ' + o.installed_on : ''}</p>
    <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {o.notes && <p className="note">备注：{o.notes}</p>}
    <small>{agents[o.agent] || o.agent} · {o.agent}</small>
  </article>;
}

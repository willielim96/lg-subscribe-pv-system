'use client';
import { useState } from 'react';
import { CommissionSummary } from './commission-summary';
import { WhatsAppButton } from './whatsapp-button';
import { calculatePV } from '../lib/pv.mjs';
import { agents, categories, empty, fmt } from '../lib/orders';
import { usePVTracker } from '../hooks/use-pv-tracker';
import { LoginForm } from './login-form';
export function PVDashboard() {
  const tracker = usePVTracker();
  const [view, setView] = useState('orders');
  const { db, ready, signedIn, email, setEmail, password, setPassword, form, setForm, editing, setEditing, month, setMonth, agent, setAgent, tab, setTab, message, setMessage, busy, setBusy, loaded, installed, total, waiting, visible, refresh, save, toggle } = tracker;
  if (!ready) return <main><p>Loading…</p></main>;
  if (!db) return <main className="login"><span className="brand">LG / PV TRACKER</span><h1>准备连接云端</h1><p>页面已准备好。请配置 Supabase 环境变量、执行数据库 migration，并创建管理员账号。</p><p>连接完成后即可登录录入订单。</p><small>当前没有保存任何顾客资料。</small></main>;
  if (!signedIn) return <LoginForm {...tracker} />;

  return <main>
    <header><div><span className="brand">LG / PV TRACKER</span><h1>业绩总览<span className="dot">.</span></h1><p>记录订单，掌握每月进度。</p></div><button className="secondary" onClick={async () => { const { error } = await db.auth.signOut(); if (error) setMessage(error.message); }}>退出登录</button></header>
    <div className="toolbar"><select aria-label="Agent" value={agent} onChange={e => setAgent(e.target.value)}>{Object.entries(agents).map(([id, name]) => <option key={id} value={id}>{name} · {id}</option>)}</select><input aria-label="业绩月份" type="month" value={month} onChange={e => setMonth(e.target.value)} /><button className="secondary" onClick={() => void refresh()}>刷新</button></div>
    <nav className="view-tabs"><button onClick={() => setView('orders')} className={view === 'orders' ? '' : 'secondary'}>Orders / PV</button><button onClick={() => setView('commission')} className={view === 'commission' ? '' : 'secondary'}>Commission</button></nav>
    {view === 'commission' ? <CommissionSummary orders={tracker.orders} agent={agent} month={month} loaded={loaded} /> : <>
    <section className="stats"><article className="hero"><small>MONTHLY PERFORMANCE</small><h2>{loaded ? fmt(total) : '—'} <span>PV</span></h2><p>{month} · {agents[agent]}</p></article><article><small>已安装订单</small><h2>{loaded ? installed.length : '—'}</h2><p>计入当前月份</p></article><article><small>Waiting List</small><h2>{loaded ? waiting.length : '—'}</h2><p>等待安装 · 暂不计分</p></article></section>
    <section className="targets">{[15000, 22100].map(goal => <article key={goal}><div><strong>{fmt(goal)} PV 目标</strong><span>{loaded ? total >= goal ? '已达标 ✓' : `还差 ${fmt(goal - total)}` : '加载中'}</span></div><progress max={goal} value={total} /></article>)}</section>
    <p className="message" role="status">{message}</p>
    <div className="workspace"><section className="panel"><h2>{editing ? '修改订单' : '新增订单'}</h2><p className="muted">一张 Order Number 对应一台产品</p><form onSubmit={save}>
      <label>顾客姓名<input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} /></label>
      <div className="pair"><label>电话<input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label>Order Number<input required value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} /></label></div>
      <label>Agent<select value={form.agent} onChange={e => setForm({ ...form, agent: e.target.value })}>{Object.entries(agents).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <div className="pair"><label>产品<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>型号<input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></label></div>
      <label>购买方式<select value={form.sale_type} onChange={e => setForm({ ...form, sale_type: e.target.value })}><option value="subscribe">Subscribe</option><option value="cash">Cash Buy</option></select></label>
      {form.sale_type === 'cash' ? <><label>手填 PV<input type="number" min="0" step="0.01" required value={form.manual_pv} onChange={e => setForm({ ...form, manual_pv: Number(e.target.value) })} /></label><label>Cash Buy original price RM<input required type="number" min="0.01" step="0.01" value={form.cash_price} onChange={e => setForm({ ...form, cash_price: e.target.value === '' ? '' : Number(e.target.value) })} /></label></> : <>
        <div className="pair"><label>合约<select value={form.years} onChange={e => setForm({ ...form, years: Number(e.target.value) })}><option value={5}>5 年 × 17</option><option value={7}>7 年 × 20</option></select></label><label>{form.offer === 'special' ? '优惠后月费 RM' : '正常月费 RM'}<input required type="number" min={form.offer === 'bundle' ? 10 : 0} step="0.01" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value === '' ? '' : Number(e.target.value) })} /></label></div>
        <label>优惠<select value={form.offer} onChange={e => setForm({ ...form, offer: e.target.value })}><option value="normal">Normal price</option><option value="half">首 9 个月半价 · PV 用正常月费</option><option value="special">Special price</option><option value="bundle">Existing + New / New + New · 减 RM10</option></select></label></>}
      <label>安装日期 · 留空为 Waiting List<input type="date" value={form.installed_on} onChange={e => setForm({ ...form, installed_on: e.target.value })} /></label>
      <div className="estimate">本单计分 <strong>{fmt(calculatePV(form))} PV</strong></div><button disabled={busy}>{busy ? '保存中…' : editing ? '保存修改' : '保存订单'}</button>{editing && <button className="secondary" type="button" onClick={() => { setEditing(null); setForm(empty); }}>取消修改</button>}
    </form></section>
      <section className="panel"><nav>{[['orders', '本月已安装'], ['waiting', 'Waiting List'], ['cancelled', '已取消']].map(([key, label]) => <button key={key} className={tab === key ? 'selected' : 'secondary'} onClick={() => setTab(key)}>{label}</button>)}</nav><div className="orderlist">{!loaded ? <p className="empty">正在读取云端订单…</p> : !visible.length ? <div className="empty"><h3>这里还没有订单</h3><p>新增第一张订单，开始记录业绩。</p></div> : visible.map(o => <article className="order" key={o.id}><div className="orderhead"><strong>{o.customer}</strong><b>{fmt(Number(o.pv))} PV</b></div><p>{o.order_number} · {o.category} {o.model}</p><small>{o.installed_on ? `Installed · ${o.installed_on}` : 'Pending · Waiting List'} · Key in {new Date(o.created_at).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</small><div className="actions"><WhatsAppButton phone={o.phone} />{o.phone && <a href={`tel:${o.phone.replace(/[^+\d]/g, '')}`}>联系顾客</a>}{!o.cancelled && <button className="secondary" disabled={busy} onClick={() => { const { id, pv, cancelled, created_at, ...values } = o; setForm({ ...values, installed_on: o.installed_on || '' }); setEditing(id); }}>修改 / 安装</button>}<button className="secondary" disabled={busy} onClick={() => void toggle(o)}>{o.cancelled ? '恢复' : '取消订单'}</button></div></article>)}</div></section></div>
    </>}
    <footer>LG PV Tracker · 第一阶段 / 订单与计分</footer>
  </main>;
}

'use client';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { empty, monthNow, type Order } from '../lib/orders';
import { compareCreditAge } from '../lib/credit-preview.mjs';
import { fromOrderRow, toOrderRow } from '../lib/order-mapping.mjs';
export function usePVTracker() {
  const [db, setDb] = useState<SupabaseClient | null>(null);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [month, setMonth] = useState(monthNow);
  const [agent, setAgent] = useState('LGM121099');
  const [tab, setTab] = useState('orders');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) { setReady(true); return; }
    setDb(client);
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session); setReady(true);
      if (!session) { setOrders([]); setLoaded(false); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function refresh(client = db) {
    if (!client) return;
    const rows: Order[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false }).order('id').range(from, from + 999);
      if (error) { setMessage(error.message); setLoaded(false); return; }
      rows.push(...data.map(fromOrderRow) as Order[]);
      if (data.length < 1000) break;
    }
    setOrders(rows); setLoaded(true);
  }
  useEffect(() => { if (signedIn && db) void refresh(db); }, [signedIn, db]); // Refresh after authentication.

  const active = orders.filter(o => !o.cancelled && o.agent === agent);
  const installed = active.filter(o => o.installed_on?.startsWith(month));
  const total = installed.reduce((sum, o) => sum + Number(o.pv), 0);
  const waiting = active.filter(o => !o.installed_on);
  const creditPV = installed.reduce((sum, order) => sum + (order.is_credit ? Number(order.pv) : 0), 0);
  const credit = active.filter(o => o.is_credit).sort(compareCreditAge);
  const visible = tab === 'credit' ? credit : tab === 'waiting' ? waiting.filter(o => !o.is_credit) : tab === 'cancelled' ? orders.filter(o => o.cancelled && !o.permanently_cancelled && o.agent === agent) : installed.filter(o => !o.is_credit);

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!db) return;
    setBusy(true); setMessage('');
    const payload = toOrderRow(form);
    const { error } = editing ? await db.from('orders').update(payload).eq('id', editing) : await db.from('orders').insert(payload);
    if (error) setMessage(error.code === '23505' ? 'Order Number 已存在，请勿重复输入。' : error.message);
    else {
      const wasCredit = orders.some(order => order.id === editing && order.is_credit);
      if (form.is_credit || wasCredit) {
        setAgent(form.agent);
        setTab(form.is_credit ? 'credit' : form.installed_on ? 'orders' : 'waiting');
        if (!form.is_credit && form.installed_on) setMonth(form.installed_on.slice(0, 7));
      }
      setMessage('订单已保存到云端。'); setForm(empty); setEditing(null); await refresh();
    }
    setBusy(false);
  }
  async function approveCredit(order: Order) {
    if (!db || busy || order.cancelled || !order.is_credit) return;
    setBusy(true);
    setMessage('');
    const { data, error } = await db.from('orders').update({ is_credit: false })
      .eq('id', order.id).is('removed_at', null).eq('is_credit', true).select('installation_date').single();
    if (error) setMessage(error.message);
    else {
      await refresh();
      setAgent(order.agent);
      setTab(data?.installation_date ? 'orders' : 'waiting');
      if (data?.installation_date) setMonth(data.installation_date.slice(0, 7));
    }
    setBusy(false);
  }

  async function permanentlyCancel(order: Order) {
    if (!db || busy || !order.cancelled || order.permanently_cancelled) return;
    if (!window.confirm('确定永久取消订单 ' + order.order_number + '？之后无法恢复。')) return;

    setBusy(true);
    setMessage('');
    try {
      const { error } = await db.from('orders')
        .update({ permanently_cancelled_at: new Date().toISOString() })
        .eq('id', order.id).not('removed_at', 'is', null)
        .is('permanently_cancelled_at', null).select('id').single();
      if (error) setMessage('无法永久取消，请刷新后再试。');
      else {
        setMessage('订单已永久取消。');
        await refresh();
      }
    } catch {
      setMessage('无法确认结果，请刷新订单列表。');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(o: Order, rejectCredit = false) {
    if (!db || busy || (rejectCredit && (o.cancelled || !o.is_credit)) || (!rejectCredit && !window.confirm(o.cancelled ? '恢复这张订单？' : '取消这张订单？该订单的 PV 会从原月份移除。'))) return;
    setBusy(true);
    const { error } = await db.from('orders').update({ removed_at: o.cancelled ? null : new Date().toISOString() }).eq('id', o.id);
    if (error) setMessage(error.message);
    else {
      await refresh();
      if (rejectCredit) setTab('cancelled');
    }
    setBusy(false);
  }


  return { orders, db, ready, signedIn, email, setEmail, password, setPassword, form, setForm, editing, setEditing, month, setMonth, agent, setAgent, tab, setTab, message, setMessage, busy, setBusy, loaded, installed, total, waiting, creditCount: credit.length, creditPV, visible, refresh, save, toggle, approveCredit, permanentlyCancel };
}

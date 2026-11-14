'use client';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { empty, monthNow, type Order } from '../lib/orders';
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
  const visible = tab === 'waiting' ? waiting : tab === 'cancelled' ? orders.filter(o => o.cancelled && o.agent === agent) : installed;

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!db) return;
    setBusy(true); setMessage('');
    const payload = toOrderRow(form);
    const { error } = editing ? await db.from('orders').update(payload).eq('id', editing) : await db.from('orders').insert(payload);
    if (error) setMessage(error.code === '23505' ? 'Order Number 已存在，请勿重复输入。' : error.message);
    else { setMessage('订单已保存到云端。'); setForm(empty); setEditing(null); await refresh(); }
    setBusy(false);
  }
  async function toggle(o: Order) {
    if (!db || !window.confirm(o.cancelled ? '恢复这张订单？' : '取消这张订单？该订单的 PV 会从原月份移除。')) return;
    setBusy(true);
    const { error } = await db.from('orders').update({ removed_at: o.cancelled ? null : new Date().toISOString() }).eq('id', o.id);
    if (error) setMessage(error.message); else await refresh();
    setBusy(false);
  }


  return { orders, db, ready, signedIn, email, setEmail, password, setPassword, form, setForm, editing, setEditing, month, setMonth, agent, setAgent, tab, setTab, message, setMessage, busy, setBusy, loaded, installed, total, waiting, visible, refresh, save, toggle };
}

'use client';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CustomerMerge = { id: number; from_order_id: string; into_order_id: string; created_at: string; undone_at: string | null };

// Merges only record which customers belong together; orders are never edited, so undo is lossless.
export function useCustomerMerges(db: SupabaseClient | null) {
  const [merges, setMerges] = useState<CustomerMerge[]>([]);
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    if (!db) return;
    const { data, error } = await db.from('customer_merges').select('*').order('created_at', { ascending: false });
    // shortcut: until the customer_merges migration is applied, the list works and merging is hidden.
    if (error) { setAvailable(false); return; }
    setMerges(data as CustomerMerge[]); setAvailable(true);
  }
  useEffect(() => { void load(); }, [db]); // Reload when the signed-in client is ready.

  async function run(action: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await action;
    setMessage(error ? error.message : '');
    await load();
    return !error;
  }
  const merge = (fromOrderId: string, intoOrderId: string) =>
    run(db!.from('customer_merges').insert({ from_order_id: fromOrderId, into_order_id: intoOrderId }));
  const undo = (id: number) => run(db!.from('customer_merges').update({ undone_at: new Date().toISOString() }).eq('id', id));

  return { merges, active: merges.filter(m => !m.undone_at), available, message, merge, undo };
}

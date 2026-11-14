import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterOrders, ordersCsv } from '../lib/order-search.mjs';

const base = { id: '1', customer: 'TAN AH KOW', phone: '0123456789', order_number: 'LG-1001', agent: 'A', category: 'Washer', model: '',
  sale_type: 'subscribe', years: 5, monthly_fee: 100, original_fee: '', offer: 'half', cash_price: 0, installed_on: '2026-11-10',
  cancelled: false, pv: 1700, notes: '', created_at: '2026-11-01T02:00:00Z' };
const orders = [
  base,
  { ...base, id: '2', customer: 'LIM MEI LING', phone: '+65 9123 4567', order_number: 'LG-1002', agent: 'B', installed_on: null, pv: 0, created_at: '2026-10-05T02:00:00Z' },
  { ...base, id: '3', customer: 'ALI', order_number: 'LG-1003', cancelled: true, pv: 0, created_at: '2026-11-20T02:00:00Z' },
];
const ids = list => list.map(o => o.id).join(',');

test('text search by partial name, phone and order number', () => {
  assert.equal(ids(filterOrders(orders, { text: 'mei' })), '2');
  assert.equal(ids(filterOrders(orders, { text: '9123' })), '2');
  assert.equal(ids(filterOrders(orders, { text: '1003' })), '3');
  assert.equal(ids(filterOrders(orders, {})), '1,2,3');
});

test('agent, status and date filters', () => {
  assert.equal(ids(filterOrders(orders, { agent: 'B' })), '2');
  assert.equal(ids(filterOrders(orders, { status: 'pending' })), '2');
  assert.equal(ids(filterOrders(orders, { status: 'installed' })), '1');
  assert.equal(ids(filterOrders(orders, { status: 'cancelled' })), '3');
  assert.equal(ids(filterOrders(orders, { dateField: 'keyed', from: '2026-11-01', to: '2026-11-30' })), '1,3');
  assert.equal(ids(filterOrders(orders, { dateField: 'installed', from: '2026-11-01' })), '1,3');
  assert.equal(ids(filterOrders(orders, { dateField: 'installed', to: '2026-11-05' })), '');
});

test('CSV export: BOM, quoting, formula guard, contract total', () => {
  const csv = ordersCsv([{ ...base, customer: '=HYPERLINK("x")', notes: 'a, "b"' }], { A: 'WILLIE' });
  assert.ok(csv.startsWith('﻿Order Number,'));
  const line = csv.split('\r\n')[1];
  assert.ok(line.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(line.includes('"a, ""b"""'));
  assert.ok(line.includes(',5550,'));
});

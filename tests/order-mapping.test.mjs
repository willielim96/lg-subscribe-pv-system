import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOrderRow, fromOrderRow } from '../lib/order-mapping.mjs';
const form = { customer: ' Test ', phone: '', order_number: ' abc ', agent: 'LGM121099', category: 'Water purifier', model: '', sale_type: 'subscribe', years: 7, monthly_fee: 70, offer: 'bundle', manual_pv: 0, installed_on: '2026-11-14' };
test('writes database names and valid installed status', () => {
  const row = toOrderRow(form);
  assert.equal(row.agent_code, form.agent);
  assert.equal(row.customer_name, 'Test');
  assert.equal(row.order_number, 'ABC');
  assert.equal(row.status, 'Installed');
  assert.equal('agent' in row, false);
  assert.equal(fromOrderRow(row).pv, 1500);
});
test('pending, cancellation and cash preserve scoring', () => {
  assert.equal(toOrderRow({...form, installed_on: ''}).installation_date, null);
  assert.equal(fromOrderRow({...toOrderRow(form), removed_at: '2026-11-14'}).pv, 0);
  assert.equal(fromOrderRow(toOrderRow({...form, sale_type: 'cash', manual_pv: 800})).pv, 800);
});
test('notes and special original price round-trip', () => {
  const special = toOrderRow({ ...form, offer: 'special', monthly_fee: 60, original_fee: 90, notes: '  call after 6pm ' });
  assert.equal(special.original_monthly_fee, 90);
  assert.equal(special.notes, 'call after 6pm');
  const back = fromOrderRow(special);
  assert.deepEqual([back.original_fee, back.notes, back.monthly_fee], [90, 'call after 6pm', 60]);
  assert.equal(toOrderRow({ ...form, original_fee: 90 }).original_monthly_fee, null);
  assert.equal(toOrderRow({ ...form, notes: '   ' }).notes, null);
  assert.deepEqual([fromOrderRow({ ...special, original_monthly_fee: null, notes: null }).original_fee, fromOrderRow({ ...special, notes: null }).notes], ['', '']);
});

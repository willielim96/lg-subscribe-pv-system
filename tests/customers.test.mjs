import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomers, phoneConflicts, priceDetails, searchCustomers } from '../lib/customers.mjs';

let n = 0;
const order = values => ({ id: 'o' + (++n), customer: 'TAN AH KOW', phone: '0123456789', order_number: 'N' + n, sale_type: 'subscribe',
  years: 5, monthly_fee: 100, offer: 'normal', cash_price: 0, installed_on: '2026-11-01', cancelled: false, pv: 1000, created_at: '2026-11-0' + (n % 9 + 1), ...values });

test('same name + same phone (any format) is one customer', () => {
  const list = buildCustomers([order(), order({ phone: '+60 12-345 6789', customer: ' tan  ah kow ' })]);
  assert.equal(list.length, 1);
  assert.equal(list[0].totalOrders, 2);
});

test('same name + different phone, and missing phones, stay separate', () => {
  assert.equal(buildCustomers([order(), order({ phone: '0191234567' })]).length, 2);
  assert.equal(buildCustomers([order({ phone: '' }), order({ phone: '' })]).length, 2);
});

test('different names on one phone are flagged, not merged', () => {
  const list = buildCustomers([order(), order({ customer: 'LIM MEI LING' })]);
  assert.equal(list.length, 2);
  assert.equal(phoneConflicts(list).length, 1);
});

test('Singapore numbers normalise with and without +65', () => {
  assert.equal(buildCustomers([order({ phone: '+65 9123 4567' }), order({ phone: '91234567' })]).length, 1);
});

test('stats follow install and cancel status', () => {
  const [c] = buildCustomers([order({ pv: 2000 }), order({ installed_on: null, pv: 0 }), order({ cancelled: true, pv: 0 })]);
  assert.deepEqual([c.totalOrders, c.installedOrders, c.pendingOrders, c.cancelledOrders, c.installedPV], [2, 1, 1, 1, 2000]);
  assert.equal(c.contractValue, 12000);
});

test('contract totals', () => {
  assert.equal(priceDetails(order({ offer: 'half' })).total, 5550);
  assert.equal(priceDetails(order({ offer: 'half', years: 7 })).total, 7950);
  assert.equal(priceDetails(order({ offer: 'bundle' })).total, 5400);
  assert.equal(priceDetails(order({ offer: 'special', monthly_fee: 80 })).total, 4800);
  assert.equal(priceDetails(order({ offer: 'normal', years: 7 })).total, 8400);
  const cash = priceDetails(order({ sale_type: 'cash', cash_price: 3999 }));
  assert.equal(cash.total, 3999);
  assert.equal(cash.actual, null);
});

test('manual merge joins customers, undo by removing it, orders untouched', () => {
  const a = order(), b = order({ customer: 'LIM MEI LING' });
  const merged = buildCustomers([a, b], [{ from_order_id: b.id, into_order_id: a.id }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].orders.length, 2);
  assert.equal(phoneConflicts(merged).length, 0);
  assert.equal(buildCustomers([a, b], []).length, 2);
});

test('merged customer keeps the target name even when the merged-in order is newer', () => {
  const a = order({ customer: 'TAN AH KOW', created_at: '2026-10-01' });
  const b = order({ customer: 'TAN A KOW', created_at: '2026-11-30' });
  const [merged] = buildCustomers([a, b], [{ from_order_id: b.id, into_order_id: a.id }]);
  assert.equal(merged.name, 'TAN AH KOW');
});

test('special price shows the recorded original price', () => {
  assert.equal(priceDetails(order({ offer: 'special', monthly_fee: 80, original_fee: 120 })).original, 120);
  assert.equal(priceDetails(order({ offer: 'special', monthly_fee: 80, original_fee: '' })).original, null);
});

test('Existing + New pays RM10 less every month', () => {
  const p = priceDetails(order({ offer: 'bundle', monthly_fee: 100, years: 7 }));
  assert.deepEqual([p.actual, p.total], [90, 7560]);
});

test('partial search by name, phone and order number', () => {
  const list = buildCustomers([order({ order_number: 'LG-778899' }), order({ customer: 'LIM MEI LING', phone: '0191112222' })]);
  assert.equal(searchCustomers(list, 'ah k').length, 1);
  assert.equal(searchCustomers(list, '7788').length, 1);
  assert.equal(searchCustomers(list, '019-111').length, 1);
  assert.equal(searchCustomers(list, '60191112222').length, 1);
  assert.equal(searchCustomers(list, '').length, 2);
});

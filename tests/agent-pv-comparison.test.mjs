import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthlyAgentPV, pvWithoutCredit } from '../lib/credit-preview.mjs';

test('agent comparisons include only non-cancelled installations in the selected month', () => {
  const order = { agent: 'A', pv: 14000, installed_on: '2026-11-01' };
  const orders = [order, { ...order, pv: 1600, is_credit: true },
    { ...order, agent: 'B', pv: 12000 }, { ...order, cancelled: true },
    { ...order, installed_on: null }, { ...order, installed_on: '2026-12-01' }];
  const a = monthlyAgentPV(orders, 'A', '2026-11');
  assert.deepEqual(a, { total: 15600, credit: 1600 });
  assert.equal(pvWithoutCredit(a.total, a.credit), 14000);
  assert.deepEqual(monthlyAgentPV(orders, 'B', '2026-11'), { total: 12000, credit: 0 });
});

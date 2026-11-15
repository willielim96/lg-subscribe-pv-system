import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creditWaitDays, compareCreditAge, pvWithoutCredit } from '../lib/credit-preview.mjs';
test('Credit follows Malaysia calendar days and oldest key-in first', () => {
 const now = new Date('2026-11-14T16:01:00Z');
 const older = {created_at:'2026-11-14T15:59:00Z',order_number:'A'};
 const newer = {created_at:'2026-11-14T16:00:00Z',order_number:'B'};
 assert.equal(creditWaitDays(older.created_at,now),1);
 assert.equal(creditWaitDays(newer.created_at,now),0);
 assert.equal(creditWaitDays(null,now),null);
 assert.deepEqual([newer,older].sort(compareCreditAge),[older,newer]);
 assert.equal(pvWithoutCredit(15122,8662),6460);
});

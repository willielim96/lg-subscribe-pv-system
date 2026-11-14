import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappUrl } from '../lib/whatsapp.mjs';

test('Malaysian local and international formats open the same chat', () => {
  for (const phone of ['012-345 6789', '+60 12-3456789', '60123456789', '0060123456789']) {
    assert.equal(whatsappUrl(phone), 'https://wa.me/60123456789');
  }
});
test('preserves foreign country codes and rejects unusable values', () => {
  assert.equal(whatsappUrl('+65 8123 4567'), 'https://wa.me/6581234567');
  for (const phone of ['', '123', 'call me', '0123456789 / 0191234567']) assert.equal(whatsappUrl(phone), null);
});

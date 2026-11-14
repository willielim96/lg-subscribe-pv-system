import { normalizePhone } from './whatsapp.mjs';

const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const nameKey = name => String(name || '').trim().replace(/\s+/g, ' ').toUpperCase();

// Same name + same normalised phone = one customer. Orders without a usable phone are never auto-merged.
export function customerKey(order) {
  const phone = normalizePhone(order.phone);
  return phone ? 'p:' + phone + '|' + nameKey(order.customer) : 'o:' + order.id;
}

export const contractMonths = order => (Number(order.years) === 5 ? 60 : 84);

// What the customer pays. PV and commission keep their own rules in pv.mjs / commission.mjs.
export function priceDetails(order) {
  if (order.sale_type === 'cash') {
    return { cash: true, original: null, actual: null, promoPrice: null, promoMonths: 0, total: round(Number(order.cash_price || 0)) };
  }
  const fee = Number(order.monthly_fee || 0);
  const months = contractMonths(order);
  if (order.offer === 'half') {
    const promoMonths = Math.min(9, months);
    return { cash: false, original: fee, actual: fee, promoPrice: round(fee / 2), promoMonths, total: round(promoMonths * fee / 2 + (months - promoMonths) * fee) };
  }
  if (order.offer === 'bundle') {
    const actual = Math.max(fee - 10, 0);
    return { cash: false, original: fee, actual, promoPrice: actual, promoMonths: months, total: round(actual * months) };
  }
  // Special price: monthly fee is the discounted fee; the original price is optional (older orders lack it).
  if (order.offer === 'special') {
    const original = order.original_fee === '' || order.original_fee == null ? null : Number(order.original_fee);
    return { cash: false, original, actual: fee, promoPrice: fee, promoMonths: months, total: round(fee * months) };
  }
  return { cash: false, original: fee, actual: fee, promoPrice: null, promoMonths: 0, total: round(fee * months) };
}

// merges: active rows of { from_order_id, into_order_id }; each moves the "from" customer into the "into" customer.
export function buildCustomers(orders, merges = []) {
  const orderKey = new Map(orders.map(order => [order.id, customerKey(order)]));
  const target = new Map();
  for (const merge of merges) {
    const from = orderKey.get(merge.from_order_id), into = orderKey.get(merge.into_order_id);
    if (from && into && from !== into) target.set(from, into);
  }
  const resolve = key => {
    const seen = new Set([key]);
    while (target.has(key) && !seen.has(target.get(key))) { key = target.get(key); seen.add(key); }
    return key;
  };
  const groups = new Map();
  for (const order of orders) {
    const key = resolve(orderKey.get(order.id));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(order);
  }
  return [...groups].map(([key, list]) => summarise(key, list, orderKey)).sort((a, b) => a.name.localeCompare(b.name));
}

function summarise(key, list, orderKey) {
  const orders = [...list].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const active = orders.filter(order => !order.cancelled);
  const installed = active.filter(order => order.installed_on);
  // Name and phone come from the customer that others were merged into, never from a merged-in order.
  const own = orders.filter(order => orderKey.get(order.id) === key);
  const named = own.find(order => !order.cancelled) || own[0] || active[0] || orders[0];
  return {
    key, name: named.customer, phone: named.phone || '', orders,
    names: [...new Set(orders.map(order => order.customer))],
    totalOrders: active.length, pendingOrders: active.length - installed.length,
    installedOrders: installed.length, cancelledOrders: orders.length - active.length,
    installedPV: round(installed.reduce((sum, order) => sum + Number(order.pv), 0)),
    contractValue: round(active.reduce((sum, order) => sum + priceDetails(order).total, 0)),
    firstOrderDate: orders.length ? orders[orders.length - 1].created_at : null,
  };
}

// Same phone under different names: shown for the owner to confirm, never merged automatically.
export function phoneConflicts(customers) {
  const byPhone = new Map();
  for (const customer of customers) {
    const phone = normalizePhone(customer.phone);
    if (!phone) continue;
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone).push(customer);
  }
  return [...byPhone.values()].filter(list => list.length > 1);
}

export function searchCustomers(customers, query) {
  const text = nameKey(query);
  if (!text) return customers;
  const digits = text.replace(/\D/g, '');
  return customers.filter(customer => customer.orders.some(order =>
    nameKey(order.customer).includes(text)
    || String(order.order_number).toUpperCase().includes(text)
    || (digits.length >= 3 && (String(order.phone || '').replace(/\D/g, '').includes(digits) || (normalizePhone(order.phone) || '').includes(digits)))));
}

import { normalizePhone } from './whatsapp.mjs';
import { priceDetails } from './customers.mjs';

const klDay = value => (value ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(value)) : '');
const upper = value => String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();

export const orderStatus = order => (order.cancelled ? 'cancelled' : order.installed_on ? 'installed' : 'pending');

// filters: { text, agent, status, dateField: 'keyed' | 'installed', from, to } - empty values mean "all".
export function filterOrders(orders, filters) {
  const text = upper(filters.text);
  const digits = text.replace(/\D/g, '');
  return orders.filter(order => {
    if (filters.agent && order.agent !== filters.agent) return false;
    if (filters.status && orderStatus(order) !== filters.status) return false;
    if (filters.from || filters.to) {
      const day = filters.dateField === 'installed' ? order.installed_on || '' : klDay(order.created_at);
      if (!day || (filters.from && day < filters.from) || (filters.to && day > filters.to)) return false;
    }
    if (!text) return true;
    return upper(order.customer).includes(text) || upper(order.order_number).includes(text)
      || (digits.length >= 3 && (String(order.phone || '').replace(/\D/g, '').includes(digits) || (normalizePhone(order.phone) || '').includes(digits)));
  });
}

const statusNames = { pending: 'Pending', installed: 'Installed', cancelled: 'Cancelled' };
const offerNames = { normal: 'Normal', half: 'First 9 months 50%', special: 'Special Price', bundle: 'Existing + New / New + New' };

// Spreadsheet cells that start with these characters can run as formulas in Excel.
const cell = value => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

// CSV with a UTF-8 BOM so Excel opens Chinese text correctly.
export function ordersCsv(orders, agentNames) {
  const header = ['Order Number', 'Customer', 'Phone', 'Agent Code', 'Agent Name', 'Category', 'Model', 'Type', 'Contract Years',
    'Original Monthly Fee', 'Actual Monthly Fee', 'Offer', 'Cash Price', 'Status', 'Installation Date', 'Key-in Date', 'PV', 'Contract Total', 'Notes'];
  const rows = orders.map(order => {
    const price = priceDetails(order);
    return [order.order_number, order.customer, order.phone, order.agent, agentNames[order.agent] || '', order.category, order.model,
      order.sale_type === 'cash' ? 'Cash Buy' : 'Subscribe', order.sale_type === 'cash' ? '' : order.years,
      price.original ?? '', price.actual ?? '', order.sale_type === 'cash' ? '' : offerNames[order.offer] || order.offer,
      order.sale_type === 'cash' ? order.cash_price : '', statusNames[orderStatus(order)], order.installed_on || '', klDay(order.created_at),
      order.pv, price.total, order.notes || ''];
  });
  return '﻿' + [header, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

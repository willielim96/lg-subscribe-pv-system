import { normalizePhone } from './whatsapp.mjs';

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

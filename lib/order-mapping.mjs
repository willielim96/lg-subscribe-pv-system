import { calculatePV } from './pv.mjs';

const offers = { normal: 'Normal', half: 'Limited 50% off', special: 'Special price offer', bundle: 'Existing + New / New + New' };

export function toOrderRow(form) {
  return {
    customer_name: form.customer.trim(), customer_phone: form.phone,
    order_number: form.order_number.trim().toUpperCase(), agent_code: form.agent,
    category: form.category, product_model: form.model,
    order_type: form.sale_type === 'cash' ? 'Cash Buy' : 'Subscribe',
    contract_years: form.years, normal_monthly_fee: Number(form.monthly_fee),
    offer_type: offers[form.offer], cash_buy_pv: form.manual_pv, cash_price: Number(form.cash_price || 0),
    status: form.installed_on ? 'Installed' : 'Pending',
    installation_date: form.installed_on || null,
  };
}

export function fromOrderRow(row) {
  const order = {
    id: row.id, customer: row.customer_name, phone: row.customer_phone || '',
    order_number: row.order_number, agent: row.agent_code,
    category: row.category, model: row.product_model || '',
    sale_type: row.order_type === 'Cash Buy' ? 'cash' : 'subscribe',
    years: row.contract_years ?? 7, monthly_fee: Number(row.normal_monthly_fee ?? 0),
    offer: Object.keys(offers).find(key => offers[key] === row.offer_type) || 'normal',
    manual_pv: Number(row.cash_buy_pv ?? 0), cash_price: Number(row.cash_price ?? 0),
    installed_on: row.installation_date, cancelled: !!row.removed_at,
    created_at: row.keyed_at || row.created_at,
  };
  return { ...order, pv: order.cancelled ? 0 : calculatePV(order) };
}

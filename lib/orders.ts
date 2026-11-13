export const agents: Record<string, string> = { LGM121099: 'WILLIE LIM', LGM214656: 'LIEU WEI TIAN' };
export const categories = ['Water purifier', 'Air purifier', 'Washer', 'Dryer', 'WashTower', 'TV', 'Fridge', 'Air conditioner', 'Dishwasher', 'Styler'];
export const empty = { customer: '', phone: '', order_number: '', agent: 'LGM121099', category: 'Water purifier', model: '', sale_type: 'subscribe', years: 7, monthly_fee: 70, offer: 'normal', manual_pv: 0, installed_on: '' };
export type Order = Omit<typeof empty, 'installed_on'> & { installed_on: string | null; id: string; pv: number; cancelled: boolean; created_at: string };
export const monthNow = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
};
export const fmt = (n: number) => n.toLocaleString('en-MY', { maximumFractionDigits: 2 });


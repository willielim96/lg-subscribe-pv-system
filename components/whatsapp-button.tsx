import { whatsappUrl } from '../lib/whatsapp.mjs';

export function WhatsAppButton({ phone }: { phone: string }) {
  const href = whatsappUrl(phone);
  if (!href) return null;
  return <a className="whatsapp-button" href={href} target="_blank" rel="noopener noreferrer">WhatsApp</a>;
}

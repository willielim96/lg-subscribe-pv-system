// International digits for Malaysian (+60) and Singapore (+65) numbers; null when unusable.
export function normalizePhone(phone) {
  const input = String(phone || '').trim();
  if (!input || !/^[+\d\s().-]+$/.test(input)) return null;
  let number = input.replace(/\D/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  else if (number.startsWith('0')) number = '60' + number.slice(1);
  // Singapore local numbers are 8 digits starting with 6, 8 or 9 and have no trunk 0.
  else if (!input.startsWith('+') && /^[689]\d{7}$/.test(number)) number = '65' + number;
  return /^[1-9]\d{7,14}$/.test(number) ? number : null;
}

export function whatsappUrl(phone) {
  const number = normalizePhone(phone);
  return number ? 'https://wa.me/' + number : null;
}

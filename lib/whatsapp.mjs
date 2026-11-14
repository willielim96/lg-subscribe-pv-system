export function whatsappUrl(phone) {
  const input = phone.trim();
  if (!/^[+\d\s().-]+$/.test(input)) return null;
  let number = input.replace(/\D/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  else if (number.startsWith('0')) number = `60${number.slice(1)}`;
  if (!/^[1-9]\d{7,14}$/.test(number)) return null;
  return `https://wa.me/${number}`;
}

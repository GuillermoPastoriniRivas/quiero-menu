function argentineNational(digits: string): string {
  let d = digits;
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9') && d.length > 10) d = d.slice(1);
  d = d.replace(/^0+/, '');
  for (const areaLength of [2, 3, 4]) {
    if (d.length === 12 && d.slice(areaLength, areaLength + 2) === '15') {
      d = d.slice(0, areaLength) + d.slice(areaLength + 2);
      break;
    }
  }
  return d;
}

export function toWhatsAppNumber(
  phone: string | null | undefined,
): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  const national = argentineNational(digits);
  if (national.length === 10) return `549${national}`;

  const international = digits.replace(/^0+/, '');
  if (international.length >= 11 && international.length <= 15) {
    return international;
  }
  return null;
}

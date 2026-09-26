/**
 * Telefonos moviles argentinos para el checkout.
 *
 * Regla (ENACOM + FAQ de WhatsApp): el numero nacional tiene 10 digitos
 * (area sin 0 + abonado); con el 9 de celular entre el 54 y el area da el
 * formato de WhatsApp de 13 digitos: 549XXXXXXXXXX.
 *
 * El usuario puede escribir el area con el 0 (011), el 15 de celular
 * (prefijo de discado local, no forma parte del numero), el prefixo 54
 * alto, o pegar el numero ya en formato internacional (+549...): aca se
 * limpia todo eso antes de validar o enviar.
 */

/**
 * Deja el numero en nacional sin 0 ni 15 (10 digitos si esta completo).
 * Tolera prefijos 54/9, 0 inicial y 15 intermedio.
 */
export function arPhoneToNational(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  // celular en formato internacional lleva 9 tras el 54; por dentro es ruido
  if (d.startsWith("9") && d.length > 10) d = d.slice(1);
  d = d.replace(/^0+/, "");
  // el 15 es prefijo de discado local: si quedo justo despues del area,
  // sobra y hay que extraerlo. Probamos largos de area 2 (AMBA), 3 y 4.
  for (const al of [2, 3, 4]) {
    if (d.length === 12 && d.slice(al, al + 2) === "15") {
      d = d.slice(0, al) + d.slice(al + 2);
      break;
    }
  }
  return d;
}

/**
 * Muestra lo que va tipeando el usuario en formato "11 1234-5678" /
 * "351 123-4567". No agrega separadores sueltos al final: asi borrar nunca
 * queda trabado (el formato reintroduciria el espacio/guion que se quita).
 * El split por area es heuristico: 11 es la unica de 2 digitos; para el
 * resto asumimos 3 (las de 4 muestran mal el guion pero los digitos no se
 * pierden).
 */
const THREE_DIGIT_AREAS = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263", "264", "266",
  "280", "291", "294", "297", "298", "299", "336", "341", "342", "343", "345", "348",
  "351", "353", "358", "362", "364", "370", "376", "379", "380", "381", "383", "385",
  "387", "388",
]);

function areaLength(national: string): number {
  if (national.startsWith("11")) return 2;
  if (THREE_DIGIT_AREAS.has(national.slice(0, 3))) return 3;
  return 4;
}

export function formatArPhone(value: string): string {
  const d = arPhoneToNational(value).slice(0, 10);
  if (!d) return "";
  const area = areaLength(d);
  if (d.length <= area) return d;
  const local = d.slice(area);
  const split = 10 - area - 4;
  const head = local.slice(0, split);
  const tail = local.slice(split);
  return `${d.slice(0, area)} ${head}${tail ? `-${tail}` : ""}`;
}

/** Formato WhatsApp (549 + 10) o null si el input no esta completo. */
export function arPhoneToWhatsApp(value: string): string | null {
  const d = arPhoneToNational(value);
  return d.length === 10 ? `549${d}` : null;
}

export function toWhatsAppNumber(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const argentine = arPhoneToWhatsApp(digits);
  if (argentine) return argentine;
  const international = digits.replace(/^0+/, "");
  return international.length >= 11 && international.length <= 15 ? international : null;
}

export function whatsAppLink(value: string | null | undefined, text?: string): string {
  const number = toWhatsAppNumber(value) ?? "";
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}

export function formatWhatsAppDisplay(number: string): string {
  if (number.startsWith("549") && number.length === 13) {
    return `+54 9 ${formatArPhone(number.slice(3))}`;
  }
  return `+${number}`;
}

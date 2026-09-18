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
export function formatArPhone(value: string): string {
  const d = arPhoneToNational(value).slice(0, 10);
  if (!d) return "";
  let out = d;
  if (d.startsWith("11")) {
    out = d.slice(0, 2);
    if (d.length > 2) out += " " + d.slice(2, 6);
    if (d.length > 6) out += "-" + d.slice(6);
    return out;
  }
  if (d.length > 3) out = d.slice(0, 3) + " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6);
  return out;
}

/** Formato WhatsApp (549 + 10) o null si el input no esta completo. */
export function arPhoneToWhatsApp(value: string): string | null {
  const d = arPhoneToNational(value);
  return d.length === 10 ? `549${d}` : null;
}

import { baseLayout } from './base-layout.js';

export function claimApprovedTemplate(
  userName: string,
  restaurantName: string,
  setPasswordUrl: string,
): string {
  return baseLayout(`
    <h1>${restaurantName} ya es tuyo</h1>
    <p>Hola ${userName}, verificamos que sos del local y te creamos la cuenta. Tu menú ya estaba publicado; ahora lo manejás vos desde el celular.</p>
    <div class="btn-container">
      <a href="${setPasswordUrl}" class="btn">Crear mi contraseña</a>
    </div>
    <div class="highlight">
      <p>Este enlace expira en 7 días.</p>
    </div>
    <p style="font-size: 13px; color: #71717a;">Con tu cuenta podés editar el menú, ver los pedidos y las estadísticas. Es gratis.</p>
  `);
}

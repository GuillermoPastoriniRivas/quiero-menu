import { baseLayout } from './base-layout.js';

export function invitationTemplate(
  restaurantName: string,
  acceptUrl: string,
  expiresInDays: number,
): string {
  return baseLayout(`
    <h1>Tu local ${restaurantName} ya está listo</h1>
    <p>Te armamos ${restaurantName} en quiero.menu con el menú, las fotos y los datos del local. Entrá con tu cuenta de Google y queda a tu nombre: desde ahí lo editás, recibís pedidos y ves quién lo visita.</p>
    <div class="btn-container">
      <a href="${acceptUrl}" class="btn">Quedarme con mi local</a>
    </div>
    <div class="highlight">
      <p>Este enlace es personal, se usa una sola vez y vence en ${expiresInDays} días.</p>
    </div>
    <p style="font-size: 13px; color: #71717a;">Si no esperabas este email, podés ignorarlo.</p>
  `);
}

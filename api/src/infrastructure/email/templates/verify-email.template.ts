import { baseLayout } from './base-layout.js';

export function verifyEmailTemplate(userName: string, verifyUrl: string): string {
  return baseLayout(`
    <h1>Verificá tu email</h1>
    <p>Hola ${userName}, hacé clic en el botón de abajo para confirmar tu dirección de email.</p>
    <div class="btn-container">
      <a href="${verifyUrl}" class="btn">Verificar email</a>
    </div>
    <div class="highlight">
      <p>Este enlace expira en 24 horas.</p>
    </div>
    <p style="font-size: 13px; color: #71717a;">Si no creaste una cuenta en quiero-menu, podés ignorar este email.</p>
  `);
}

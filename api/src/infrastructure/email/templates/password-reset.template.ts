import { baseLayout } from './base-layout.js';

export function passwordResetTemplate(userName: string, resetUrl: string): string {
  return baseLayout(`
    <h1>Restablecé tu contraseña</h1>
    <p>Hola ${userName}, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <div class="btn-container">
      <a href="${resetUrl}" class="btn">Restablecer contraseña</a>
    </div>
    <div class="highlight">
      <p>Este enlace expira en 30 minutos.</p>
    </div>
    <p style="font-size: 13px; color: #71717a;">Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no será modificada.</p>
  `);
}

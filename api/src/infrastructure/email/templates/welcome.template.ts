import { baseLayout } from './base-layout.js';

export function welcomeTemplate(userName: string, restaurantName: string, loginUrl: string): string {
  return baseLayout(`
    <h1>Bienvenido a quiero-menu, ${userName}!</h1>
    <p>Tu cuenta y tu restaurante <strong>${restaurantName}</strong> ya están listos.</p>
    <p>Con quiero-menu vas a poder crear tu menú digital, recibir pedidos online y gestionar tu negocio desde un solo lugar.</p>
    <div class="btn-container">
      <a href="${loginUrl}" class="btn">Ir al panel</a>
    </div>
    <hr class="divider">
    <p style="font-size: 13px; color: #71717a;">Si tenés alguna pregunta, respondé a este email y te ayudamos.</p>
  `);
}

import { baseLayout } from './base-layout.js';

export function newOrderTemplate(
  ownerName: string,
  orderCode: string,
  customerName: string,
  itemsSummary: string,
  total: number,
  currency: string,
  deliveryLabel: string,
  dashboardUrl: string,
): string {
  return baseLayout(`
    <h1>Nuevo pedido #${orderCode}</h1>
    <p>Hola ${ownerName}, entró un pedido nuevo. No lo dejes pasar.</p>
    <div class="highlight">
      <p><strong>Cliente:</strong> ${customerName}</p>
      <p><strong>Pedido:</strong> ${itemsSummary}</p>
      <p><strong>Total:</strong> ${currency} ${total.toLocaleString()}</p>
      <p><strong>Entrega:</strong> ${deliveryLabel}</p>
    </div>
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn">Ver el pedido en el panel</a>
    </div>
    <hr class="divider">
    <p style="font-size: 13px; color: #71717a;">Recibís este email porque tenés activados los avisos de pedidos por email en quiero.menu. Podés apagarlos desde Ajustes &gt; Notificaciones.</p>
  `);
}

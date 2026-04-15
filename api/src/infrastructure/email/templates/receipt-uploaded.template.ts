import { baseLayout } from './base-layout.js';

export function receiptUploadedTemplate(
  ownerName: string,
  orderCode: string,
  customerName: string,
  total: number,
  currency: string,
  receiptUrl: string,
  dashboardUrl: string,
): string {
  return baseLayout(`
    <h1>Nuevo comprobante de pago</h1>
    <p>Hola ${ownerName}, el cliente <strong>${customerName}</strong> subió un comprobante de transferencia para el pedido <strong>#${orderCode}</strong>.</p>
    <div class="highlight">
      <p><strong>Total del pedido:</strong> ${currency} ${total.toLocaleString()}</p>
    </div>
    <p>Revisá el comprobante y confirmá el pedido desde tu panel.</p>
    <div class="btn-container">
      <a href="${receiptUrl}" class="btn" style="margin-right: 8px;">Ver comprobante</a>
    </div>
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn" style="background-color: #18181b;">Ir al panel</a>
    </div>
    <hr class="divider">
    <p style="font-size: 13px; color: #71717a;">Este email se envió automáticamente porque un cliente subió un comprobante de pago en tu tienda.</p>
  `);
}

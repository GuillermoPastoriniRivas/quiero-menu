export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name: string,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
    /** Avisos de pedidos nuevos por email. Activo por defecto. */
    public readonly notifyEmail: boolean = true,
    /** Avisos de pedidos nuevos por WhatsApp. Solo Pro. Apagado por defecto. */
    public readonly notifyWhatsapp: boolean = false,
  ) {}
}

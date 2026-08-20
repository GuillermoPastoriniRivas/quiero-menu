export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'En tiempo real',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'bar_chart' },
      { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
    ],
  },
  {
    label: 'Mi negocio',
    items: [
      { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
      { href: '/coupons', label: 'Cupones', icon: 'confirmation_number' },
      { href: '/customers', label: 'Clientes', icon: 'group' },
      { href: '/analytics', label: 'Análisis', icon: 'insights' },
      { href: '/business/data', label: 'Datos del restaurante', icon: 'store' },
      { href: '/business/payments', label: 'Pagos', icon: 'payments' },
      { href: '/business/zones', label: 'Zonas de delivery', icon: 'local_shipping' },
      { href: '/business/hours', label: 'Horarios', icon: 'schedule' },
    ],
  },
  {
    label: 'Diseño',
    items: [
      { href: '/apariencia', label: 'Apariencia', icon: 'palette' },
      { href: '/publicar', label: 'Compartir', icon: 'share' },
    ],
  },
];

export const MOBILE_PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'bar_chart' },
  { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
  { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
];
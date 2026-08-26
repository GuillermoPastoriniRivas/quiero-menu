export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * IA del panel: un tema = una pantalla.
 * - Operación: lo que se mira todos los días
 * - Carta: lo que se vende y cómo se promociona
 * - Menú público: diseño y distribución del storefront
 * - Negocio: números y clientes
 * Ajustes vive aparte como item único al pie de la nav (config set-and-forget).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operación',
    items: [
      { href: '/dashboard', label: 'Hoy', icon: 'today' },
      { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
    ],
  },
  {
    label: 'Carta',
    items: [
      { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
      { href: '/promos', label: 'Promociones', icon: 'confirmation_number' },
    ],
  },
  {
    label: 'Menú público',
    items: [
      { href: '/mi-menu', label: 'Mi menú', icon: 'storefront' },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/analytics', label: 'Análisis', icon: 'insights' },
      { href: '/customers', label: 'Clientes', icon: 'group' },
    ],
  },
];

export const NAV_SETTINGS_ITEM: NavItem = {
  href: '/settings',
  label: 'Ajustes',
  icon: 'settings',
};

export const MOBILE_PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'today' },
  { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
  { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
];

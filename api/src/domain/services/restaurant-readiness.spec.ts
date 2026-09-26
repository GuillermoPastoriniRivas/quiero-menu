import {
  ACTIVATION_STEPS,
  LISTING_STEPS,
  countOpenDays,
  evaluateReadiness,
  paymentsReady,
  summarizeReadiness,
  type ReadinessRestaurant,
} from './restaurant-readiness.js';
import { toWhatsAppNumber } from './whatsapp-number.js';

describe('toWhatsAppNumber', () => {
  it.each([
    ['343 412-3456', '5493434123456'],
    ['0343 15 412-3456', '5493434123456'],
    ['+54 9 343 412 3456', '5493434123456'],
    ['11 5555-1234', '5491155551234'],
    ['011 15 5555-1234', '5491155551234'],
    ['+598 99 123 456', '59899123456'],
    ['+57 300 123 4567', '573001234567'],
  ])('normaliza %s a %s', (input, expected) => {
    expect(toWhatsAppNumber(input)).toBe(expected);
  });

  it.each(['', '   ', '15 412-3456', '4123456', 'sin telefono'])(
    'rechaza %p',
    (input) => {
      expect(toWhatsAppNumber(input)).toBeNull();
    },
  );
});

describe('paymentsReady', () => {
  it('exige algún medio activo', () => {
    expect(
      paymentsReady({
        cashEnabled: false,
        cardEnabled: false,
        transferEnabled: false,
      }),
    ).toBe(false);
  });

  it('acepta efectivo solo', () => {
    expect(
      paymentsReady({
        cashEnabled: true,
        cardEnabled: false,
        transferEnabled: false,
      }),
    ).toBe(true);
  });

  it('rechaza transferencia activa sin alias ni CBU aunque haya efectivo', () => {
    expect(
      paymentsReady({
        cashEnabled: true,
        cardEnabled: true,
        transferEnabled: true,
      }),
    ).toBe(false);
  });

  it('acepta transferencia con alias', () => {
    expect(
      paymentsReady({
        cashEnabled: false,
        cardEnabled: false,
        transferEnabled: true,
        transferAlias: 'mi.local.mp',
      }),
    ).toBe(true);
  });
});

describe('countOpenDays', () => {
  it('cuenta días distintos con al menos un rango abierto', () => {
    expect(
      countOpenDays([
        { dayOfWeek: 1, isClosed: false, opensAt: '08:00', closesAt: '12:00' },
        { dayOfWeek: 1, isClosed: false, opensAt: '16:00', closesAt: '20:00' },
        { dayOfWeek: 2, isClosed: true, opensAt: '', closesAt: '' },
        { dayOfWeek: 3, isClosed: false, opensAt: '19:00', closesAt: '23:30' },
      ]),
    ).toBe(2);
  });
});

describe('evaluateReadiness', () => {
  const blank: ReadinessRestaurant = {
    phone: '',
    logoUrl: '',
    bannerUrl: '',
    address: '',
    coordinates: null,
    paymentMethods: {
      cashEnabled: true,
      cardEnabled: true,
      transferEnabled: true,
    },
    photoGallery: [],
    activation: null,
  };

  it('un local recién creado no tiene nada listo', () => {
    const checks = evaluateReadiness({
      restaurant: blank,
      menuItems: 0,
      openDays: 0,
      orders: 0,
    });
    expect(Object.values(checks).every((v) => v === false)).toBe(true);
  });

  it('marca cada paso cuando se cumple su condición', () => {
    const checks = evaluateReadiness({
      restaurant: {
        ...blank,
        phone: '343 412-3456',
        logoUrl: 'https://cdn/logo.webp',
        photoGallery: [{ url: 'https://cdn/a.webp', source: 's3' }],
        address: 'San Martín 123',
        coordinates: { lat: -32.48, lng: -58.23 },
        paymentMethods: {
          cashEnabled: true,
          cardEnabled: false,
          transferEnabled: false,
        },
        activation: { sharedAt: new Date('2026-09-20') },
      },
      menuItems: 12,
      openDays: 6,
      orders: 1,
    });
    expect(checks).toEqual({
      menu: true,
      whatsapp: true,
      hours: true,
      look: true,
      location: true,
      payments: true,
      shared: true,
      firstOrder: true,
    });
  });

  it('el logo solo no alcanza para la imagen del local', () => {
    const checks = evaluateReadiness({
      restaurant: { ...blank, logoUrl: 'https://cdn/logo.webp' },
      menuItems: 0,
      openDays: 0,
      orders: 0,
    });
    expect(checks.look).toBe(false);
  });

  it('la dirección sin coordenadas no alcanza para la ubicación', () => {
    const checks = evaluateReadiness({
      restaurant: { ...blank, address: 'San Martín 123' },
      menuItems: 0,
      openDays: 0,
      orders: 0,
    });
    expect(checks.location).toBe(false);
  });
});

describe('summarizeReadiness', () => {
  it('resume la ficha con el primer paso faltante como siguiente', () => {
    const checks = evaluateReadiness({
      restaurant: {
        phone: '343 412-3456',
        logoUrl: '',
        bannerUrl: '',
        address: '',
        coordinates: null,
        paymentMethods: {
          cashEnabled: true,
          cardEnabled: false,
          transferEnabled: false,
        },
      },
      menuItems: 4,
      openDays: 0,
      orders: 0,
    });
    const listing = summarizeReadiness(checks, LISTING_STEPS);
    expect(listing).toEqual({
      done: 2,
      total: 5,
      percent: 40,
      missing: ['hours', 'look', 'location'],
      next: 'hours',
    });
    const activation = summarizeReadiness(checks, ACTIVATION_STEPS);
    expect(activation.total).toBe(8);
    expect(activation.done).toBe(3);
  });
});

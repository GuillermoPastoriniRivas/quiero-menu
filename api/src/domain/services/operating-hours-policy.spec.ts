import { OperatingHoursPolicy } from './operating-hours-policy.js';
import { Restaurant } from '../entities/restaurant.entity.js';
import { OperatingHours } from '../entities/operating-hours.entity.js';
import { RestaurantStatus } from '../enums/restaurant-status.enum.js';

describe('OperatingHoursPolicy', () => {
  const policy = new OperatingHoursPolicy();

  function makeRestaurant(
    status: RestaurantStatus = RestaurantStatus.ACTIVE,
    timezone = 'America/Argentina/Buenos_Aires',
    openOverride: 'open' | 'closed' | null = null,
  ): Restaurant {
    return new Restaurant(
      'r1',
      'mi-resto',
      'Mi Resto',
      '',
      '',
      '',
      '',
      '',
      'AR',
      null,
      '+5491100000000',
      timezone,
      'ARS',
      status,
      openOverride,
      null,
      null,
      null,
      { cashEnabled: true, cardEnabled: true, transferEnabled: true },
      { primaryColor: '#000000' },
      new Date(),
      new Date(),
    );
  }

  function hours(rows: Partial<OperatingHours>[]): OperatingHours[] {
    return rows.map(
      (h, i) =>
        new OperatingHours(
          String(i),
          'r1',
          h.dayOfWeek ?? 0,
          h.opensAt ?? '09:00',
          h.closesAt ?? '22:00',
          h.isClosed ?? false,
        ),
    );
  }

  // Día local del restaurante (UTC-3): jueves 2026-08-20 14:00 UTC = 11:00 ART
  const thursday11am = new Date('2026-08-20T14:00:00.000Z');
  const thursday23pm = new Date('2026-08-21T02:00:00.000Z'); // 23:00 ART
  const sunday10am = new Date('2026-08-23T13:00:00.000Z'); // 10:00 ART domingo

  it('abre dentro del horario programado (día correcto, mapeo 0=domingo)', () => {
    const result = policy.isOpen(
      makeRestaurant(),
      hours([
        { dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }, // jueves
      ]),
      thursday11am,
    );
    expect(result.isOpen).toBe(true);
    expect(result.dayOfWeek).toBe(4);
    expect(result.localTime).toBe('11:00');
  });

  it('cierra fuera del horario', () => {
    const result = policy.isOpen(
      makeRestaurant(),
      hours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '11:00' }]),
      thursday11am, // 11:00 ART no es < 11:00
    );
    expect(result.isOpen).toBe(false);
  });

  it('cierra cuando el día está marcado como cerrado', () => {
    const result = policy.isOpen(
      makeRestaurant(),
      hours([
        { dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00', isClosed: true },
      ]),
      thursday11am,
    );
    expect(result.isOpen).toBe(false);
  });

  it('soporta horario que cruza la medianoche (20:00 -> 02:00)', () => {
    const rows = hours([{ dayOfWeek: 4, opensAt: '20:00', closesAt: '02:00' }]);
    // Jueves 23:00 ART: dentro
    expect(policy.isOpen(makeRestaurant(), rows, thursday23pm).isOpen).toBe(
      true,
    );
    // Domingo 10:00 ART: fuera
    expect(policy.isOpen(makeRestaurant(), rows, sunday10am).isOpen).toBe(
      false,
    );
  });

  it('el domingo matchea el dayOfWeek 0 (bug histórico)', () => {
    const rows = hours([
      { dayOfWeek: 0, opensAt: '10:00', closesAt: '18:00' }, // domingo
    ]);
    expect(policy.isOpen(makeRestaurant(), rows, sunday10am).isOpen).toBe(true);
  });

  it('override manual: paused cierra aunque el horario diga abierto', () => {
    const result = policy.isOpen(
      makeRestaurant(RestaurantStatus.PAUSED),
      hours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
      thursday11am,
    );
    expect(result.isOpen).toBe(false);
  });

  it('sin horarios configurados queda abierto (compatibilidad)', () => {
    const result = policy.isOpen(makeRestaurant(), [], thursday11am);
    expect(result.isOpen).toBe(true);
  });

  it('usa la timezone del restaurante, no la del cliente', () => {
    // En UTC son las 14:00 del jueves. En Buenos Aires (UTC-3) son las 11:00.
    const rows = hours([{ dayOfWeek: 4, opensAt: '12:00', closesAt: '22:00' }]);
    const inBuenosAires = policy.isOpen(
      makeRestaurant(RestaurantStatus.ACTIVE, 'America/Argentina/Buenos_Aires'),
      rows,
      thursday11am,
    );
    expect(inBuenosAires.isOpen).toBe(false); // 11:00 ART < 12:00

    // En un restaurante en UTC el horario local es 14:00 => abierto.
    const inUtc = policy.isOpen(
      makeRestaurant(RestaurantStatus.ACTIVE, 'UTC'),
      rows,
      thursday11am,
    );
    expect(inUtc.isOpen).toBe(true);
    expect(inUtc.localTime).toBe('14:00');
  });

  it('expone todayHours y closesAtLabel para el panel', () => {
    const result = policy.isOpen(
      makeRestaurant(),
      hours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
      thursday11am,
    );
    expect(result.todayHours?.closesAt).toBe('22:00');
    expect(result.closesAtLabel).toBe('22:00');
  });

  it('override open fuerza abierto aunque el horario diga cerrado', () => {
    const rows = hours([
      { dayOfWeek: 4, opensAt: '20:00', closesAt: '02:00' }, // cierra a las 02:00
    ]);
    const result = policy.isOpen(
      makeRestaurant(
        RestaurantStatus.ACTIVE,
        'America/Argentina/Buenos_Aires',
        'open',
      ),
      rows,
      thursday11am, // 11:00 ART, fuera del horario
    );
    expect(result.isOpen).toBe(true);
  });

  it('override closed fuerza cerrado aunque el horario diga abierto', () => {
    const rows = hours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]);
    const result = policy.isOpen(
      makeRestaurant(
        RestaurantStatus.ACTIVE,
        'America/Argentina/Buenos_Aires',
        'closed',
      ),
      rows,
      thursday11am, // 11:00 ART, dentro del horario
    );
    expect(result.isOpen).toBe(false);
  });

  describe('computeOverride', () => {
    const rows = hours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]);

    it('horario abierto + querer abierto => null (auto)', () => {
      expect(
        policy.computeOverride(makeRestaurant(), rows, thursday11am, true),
      ).toBeNull();
    });

    it('horario cerrado + querer abierto => open (manual)', () => {
      expect(
        policy.computeOverride(makeRestaurant(), rows, sunday10am, true),
      ).toBe('open');
    });

    it('horario abierto + querer cerrado => closed (manual)', () => {
      expect(
        policy.computeOverride(makeRestaurant(), rows, thursday11am, false),
      ).toBe('closed');
    });

    it('horario cerrado + querer cerrado => null (auto)', () => {
      expect(
        policy.computeOverride(makeRestaurant(), rows, sunday10am, false),
      ).toBeNull();
    });
  });
});

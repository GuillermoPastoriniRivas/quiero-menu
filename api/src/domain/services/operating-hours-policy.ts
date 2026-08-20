import { Restaurant } from '../entities/restaurant.entity.js';
import { OperatingHours } from '../entities/operating-hours.entity.js';
import { RestaurantStatus } from '../enums/restaurant-status.enum.js';

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface OpenStatus {
  isOpen: boolean;
  /** Día local del restaurante (0=Domingo..6=Sábado) */
  dayOfWeek: number;
  /** Hora local del restaurante en formato HH:mm */
  localTime: string;
  /** Entrada de horario del día actual, si existe */
  todayHours: OperatingHours | null;
  /** Hora de cierre de hoy (para el panel), si corresponde */
  closesAtLabel: string | null;
}

function getZonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }
  const hour = values.hour === '24' ? '00' : (values.hour ?? '00');
  const minute = values.minute ?? '00';
  return {
    dayOfWeek: WEEKDAYS[values.weekday ?? ''] ?? 0,
    localTime: `${hour}:${minute}`,
  };
}

function isWithin(time: string, opensAt: string, closesAt: string): boolean {
  if (opensAt === closesAt) return true; // 24h
  if (opensAt < closesAt) return time >= opensAt && time < closesAt;
  // Cruza la medianoche: ej. 20:00 -> 02:00
  return time >= opensAt || time < closesAt;
}

/**
 * Regla de negocio central para saber si un restaurante está aceptando
 * pedidos. Fuente de verdad: la timezone del restaurante, no la del cliente
 * ni la del servidor.
 *
 * - `status paused/suspended` => cerrado (sistema).
 * - `openOverride` => override manual: fuerza abierto o cerrado.
 * - Sin override => auto: sigue el horario programado. Sin horarios
 *   configurados => abierto (compatibilidad).
 */
export class OperatingHoursPolicy {
  isOpen(
    restaurant: Restaurant,
    hours: OperatingHours[],
    now: Date,
  ): OpenStatus {
    const today = getZonedParts(now, restaurant.timezone);
    const todayHours = this.findDay(hours, today.dayOfWeek);

    if (
      restaurant.status === RestaurantStatus.PAUSED ||
      restaurant.status === RestaurantStatus.SUSPENDED
    ) {
      return {
        isOpen: false,
        dayOfWeek: today.dayOfWeek,
        localTime: today.localTime,
        todayHours,
        closesAtLabel: null,
      };
    }

    if (restaurant.openOverride === 'open') {
      return {
        isOpen: true,
        dayOfWeek: today.dayOfWeek,
        localTime: today.localTime,
        todayHours,
        closesAtLabel: todayHours?.closesAt ?? null,
      };
    }

    if (restaurant.openOverride === 'closed') {
      return {
        isOpen: false,
        dayOfWeek: today.dayOfWeek,
        localTime: today.localTime,
        todayHours,
        closesAtLabel: null,
      };
    }

    if (hours.length === 0) {
      return {
        isOpen: true,
        dayOfWeek: today.dayOfWeek,
        localTime: today.localTime,
        todayHours: null,
        closesAtLabel: null,
      };
    }

    if (!todayHours || todayHours.isClosed) {
      return {
        isOpen: false,
        dayOfWeek: today.dayOfWeek,
        localTime: today.localTime,
        todayHours: todayHours ?? null,
        closesAtLabel: null,
      };
    }

    const open = isWithin(
      today.localTime,
      todayHours.opensAt,
      todayHours.closesAt,
    );
    return {
      isOpen: open,
      dayOfWeek: today.dayOfWeek,
      localTime: today.localTime,
      todayHours,
      closesAtLabel: todayHours.closesAt,
    };
  }

  /**
   * Calcula el override resultante de querer el toggle en `open`.
   * Si el horario ya da ese resultado, vuelve a null (auto); si no, fuerza
   * el override. Así el horario es el switch automático y el manual solo
   * interviene cuando se aparta del horario.
   */
  computeOverride(
    restaurant: Restaurant,
    hours: OperatingHours[],
    now: Date,
    open: boolean,
  ): 'open' | 'closed' | null {
    const scheduleOpen = this.isScheduleOpen(restaurant, hours, now);
    if (open === scheduleOpen) return null;
    return open ? 'open' : 'closed';
  }

  private isScheduleOpen(
    restaurant: Restaurant,
    hours: OperatingHours[],
    now: Date,
  ): boolean {
    const today = getZonedParts(now, restaurant.timezone);
    if (hours.length === 0) return true;
    const todayHours = this.findDay(hours, today.dayOfWeek);
    if (!todayHours || todayHours.isClosed) return false;
    return isWithin(today.localTime, todayHours.opensAt, todayHours.closesAt);
  }

  private findDay(
    hours: OperatingHours[],
    dayOfWeek: number,
  ): OperatingHours | null {
    return hours.find((h) => h.dayOfWeek === dayOfWeek) ?? null;
  }
}

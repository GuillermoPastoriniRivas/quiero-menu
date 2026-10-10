import { getApiBase } from './storefront-context';

export type BehaviorContext = {
  visitorId: string; sessionId: string; channel: string; firstChannel: string;
  referrerHost?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string;
  device: 'mobile' | 'tablet' | 'desktop'; path: string;
};
type Properties = Record<string, string | number | boolean | undefined>;
type Pending = { endpoint: string; context: BehaviorContext; event: { eventId: string; event: string; occurredAt: string; properties: Properties }; attempts: number };
const PREFIX = 'qm:behavior:';
const DAY = 86_400_000;
const CHANNELS = new Set(['direct', 'qr', 'ig', 'wa', 'dir', 'powered', 'google', 'referral', 'campaign', 'unknown']);
let queue: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let listeners = false;
let lastTimestamp = 0;
const memory = new Map<string, string>();

function read(key: string, session = false): string | null {
  try { return (session ? sessionStorage : localStorage).getItem(key); }
  catch { return memory.get(key) ?? null; }
}
function write(key: string, value: string, session = false): void {
  memory.set(key, value);
  try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* private/blocked storage */ }
}
function json<T>(key: string, session = false): T | undefined {
  try { return JSON.parse(read(key, session) ?? 'null') ?? undefined; } catch { return; }
}

export function behaviorEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return window.self === window.top && read(`${PREFIX}disabled`) !== '1' && navigator.doNotTrack !== '1' && !nav.globalPrivacyControl;
}

export function setBehaviorEnabled(enabled: boolean): void {
  write(`${PREFIX}disabled`, enabled ? '0' : '1');
  if (!enabled) {
    queue = [];
    for (const storage of [localStorage, sessionStorage]) {
      try {
        for (let index = storage.length - 1; index >= 0; index--) {
          const key = storage.key(index);
          if (key?.startsWith(PREFIX) && key !== `${PREFIX}disabled`) storage.removeItem(key);
        }
      } catch { /* blocked storage */ }
    }
    memory.clear();
    memory.set(`${PREFIX}disabled`, '1');
  }
  window.dispatchEvent(new Event('qm:analytics-preference'));
}

function cachedUser(): { restaurantSlug?: string; restaurantId?: string; platformAdmin?: boolean; operating?: boolean; impersonating?: boolean } | undefined {
  return json('user');
}

export function internalViewer(slug?: string): boolean {
  const user = cachedUser();
  return Boolean(user?.platformAdmin || user?.operating || user?.impersonating || (slug && user?.restaurantSlug === slug));
}

export function analyticsPath(path: string): string {
  return path.split('?')[0].replace(/\/(tracking|invitacion|kitchen|delivery)\/[^/]+/g, '/$1/:token').slice(0, 120);
}

function safeTag(value: string | null): string | undefined {
  const tag = value?.replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 80);
  return tag || undefined;
}

function incomingChannel(params: URLSearchParams, referrerHost?: string): string | undefined {
  const ref = params.get('ref');
  if (ref && CHANNELS.has(ref)) return ref;
  if (params.get('utm_source')) return 'campaign';
  if (!referrerHost || referrerHost === window.location.hostname || ['quiero.menu', 'www.quiero.menu'].includes(referrerHost)) return;
  if (/(^|\.)google\.[a-z.]+$/.test(referrerHost)) return 'google';
  if (/(^|\.)(instagram\.com|l\.instagram\.com)$/.test(referrerHost)) return 'ig';
  return 'referral';
}

export function behaviorContext(scope = 'acquisition'): BehaviorContext | undefined {
  if (!behaviorEnabled()) return;
  const now = Date.now();
  let visitor = json<{ id: string; at: number }>(`${PREFIX}visitor`);
  if (!visitor || now - visitor.at > 90 * DAY) {
    visitor = { id: crypto.randomUUID(), at: now };
    write(`${PREFIX}visitor`, JSON.stringify(visitor));
  }
  let session = json<{ id: string; at: number }>(`${PREFIX}session`, true);
  if (!session || now - session.at > 30 * 60_000) session = { id: crypto.randomUUID(), at: now };
  session.at = now;
  write(`${PREFIX}session`, JSON.stringify(session), true);
  let referrerHost: string | undefined;
  try { referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined; } catch { /* invalid referrer */ }
  const params = new URLSearchParams(window.location.search);
  const entry = `${window.location.pathname}${window.location.search}`;
  let touch = json<{ session: string; entry: string; channel: string; referrerHost?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }>(`${PREFIX}touch:${scope}`, true);
  const incoming = incomingChannel(params, referrerHost);
  if (!touch || touch.session !== session.id || (touch.entry !== entry && incoming)) {
    touch = { session: session.id, entry, channel: incoming ?? 'direct', referrerHost,
      utmSource: safeTag(params.get('utm_source')), utmMedium: safeTag(params.get('utm_medium')), utmCampaign: safeTag(params.get('utm_campaign')) };
    write(`${PREFIX}touch:${scope}`, JSON.stringify(touch), true);
  }
  let first = json<{ channel: string; at: number }>(`${PREFIX}first:${scope}`);
  if (!first || now - first.at > 90 * DAY) {
    first = { channel: touch.channel, at: now };
    write(`${PREFIX}first:${scope}`, JSON.stringify(first));
  }
  return { visitorId: visitor.id, sessionId: session.id, channel: touch.channel, firstChannel: first.channel,
    referrerHost: touch.referrerHost, utmSource: touch.utmSource, utmMedium: touch.utmMedium, utmCampaign: touch.utmCampaign,
    device: /ipad|tablet/i.test(navigator.userAgent) ? 'tablet' : /mobi|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop', path: analyticsPath(window.location.pathname) };
}

export function behaviorHeaders(scope = 'acquisition'): Record<string, string> {
  const context = behaviorContext(scope);
  return context ? { 'X-QM-Analytics': JSON.stringify(context) } : {};
}

export function attributedUrl(url: string, channel: 'qr' | 'ig' | 'wa' | 'dir' | 'powered'): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ref=${channel}`;
}

export function searchProperties(query: string): string {
  return /@|https?:|\d{5,}/i.test(query) ? '[redacted]' : query.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 64);
}

export function mirrorAnalytics(event: string): void {
  if (!behaviorEnabled() || typeof window.gtag !== 'function') return;
  window.gtag('event', event, {
    page_location: window.location.origin + analyticsPath(window.location.pathname),
    page_referrer: document.referrer ? (() => { try { return new URL(document.referrer).origin; } catch { return ''; } })() : '',
  });
}

function enqueue(endpoint: string, scope: string, event: string, properties: Properties, once?: string): boolean {
  const context = behaviorContext(scope);
  if (!context) return false;
  if (once) {
    const key = `${PREFIX}once:${context.sessionId}:${scope}:${once}`;
    if (read(key, true)) return false;
    write(key, '1', true);
  }
  lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
  queue.push({ endpoint, context, event: { eventId: crypto.randomUUID(), event, occurredAt: new Date(lastTimestamp).toISOString(), properties }, attempts: 0 });
  if (queue.length > 100) queue.shift();
  if (!listeners) {
    listeners = true;
    window.addEventListener('pagehide', () => flushBehavior(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushBehavior(true); });
  }
  if (!timer) timer = setTimeout(() => flushBehavior(), 1500);
  return true;
}

export function trackPublic(event: string, properties: Properties = {}, once?: string): void {
  if (internalViewer()) return;
  if (enqueue('/behavior/events', 'acquisition', event, properties, once)) mirrorAnalytics(event);
}

export function trackOwner(event: string, properties: Properties = {}, once?: string): void {
  if (!cachedUser()?.restaurantId || internalViewer()) return;
  enqueue('/behavior/owner', 'acquisition', event, properties, once);
}

export function trackStorefront(slug: string, event: string, properties: Properties = {}, once?: string): void {
  if (internalViewer(slug)) return;
  if (!enqueue(`/behavior/storefront/${encodeURIComponent(slug)}`, slug, event, properties, once)) return;
  // Preserve the existing per-local counters while the new stream gathers history.
  const legacy = event === 'storefront_view' ? 'view' : event === 'contact_click' ? `events?type=${properties.contact}` : null;
  if (legacy) {
    const token = read('accessToken');
    void fetch(`${getApiBase()}/storefront/${encodeURIComponent(slug)}/${legacy}`, { method: 'POST', keepalive: true, headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
  }
}

export function trackTracking(token: string, slug: string, event: string, properties: Properties = {}, once?: string): void {
  if (internalViewer(slug)) return;
  enqueue(`/behavior/tracking/${encodeURIComponent(token)}`, slug, event, properties, once);
}

export function flushBehavior(unloading = false): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  if (!behaviorEnabled()) { queue = []; return; }
  const pending = queue;
  queue = [];
  const groups = new Map<string, Pending[]>();
  for (const item of pending) {
    const key = `${item.endpoint}:${JSON.stringify(item.context)}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += 20) {
      const batch = group.slice(i, i + 20);
      const body = JSON.stringify({ context: batch[0].context, events: batch.map((item) => item.event) });
      const url = `${getApiBase()}${batch[0].endpoint}`;
      const token = read('accessToken');
      // Beacon cannot send an Authorization header; authenticated viewers use keepalive fetch.
      if (unloading && !token && navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) continue;
      void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        .then((response) => { if (response.status >= 500 || response.status === 429) throw new Error('retry'); })
        .catch(() => {
          if (unloading || !behaviorEnabled()) return;
          queue.push(...batch.filter((item) => item.attempts++ < 2));
          if (queue.length && !timer) timer = setTimeout(() => flushBehavior(), 5000);
        });
    }
  }
}

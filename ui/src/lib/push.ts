import { getApiBase } from './storefront-context';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getVapidPublicKey(): Promise<string> {
  return fetch(`${getApiBase()}/push/vapid-public-key`)
    .then((res) => res.json())
    .then((data) => data.publicKey);
}

function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription());
}

async function getOrCreateSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  await navigator.serviceWorker.ready;

  const existing = await navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription());
  if (existing) return existing;

  const publicKey = await getVapidPublicKey();
  if (!publicKey) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  return navigator.serviceWorker.ready.then((reg) =>
    reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    } as PushSubscriptionOptionsInit)
  );
}

/** Staff: subscribe for order notifications. Returns true on success. */
export async function subscribeStaffPush(token: string): Promise<boolean> {
  const sub = await getOrCreateSubscription();
  if (!sub) return false;

  const res = await fetch(`${getApiBase()}/push/subscribe-staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  return res.ok;
}

/** Customer (tracking page): subscribe for status updates on an order. */
export async function subscribeOrderPush(slug: string, orderCode: string): Promise<boolean> {
  const sub = await getOrCreateSubscription();
  if (!sub) return false;

  const res = await fetch(`${getApiBase()}/push/subscribe-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderCode, slug, subscription: sub.toJSON() }),
  });
  return res.ok;
}

export async function unsubscribePush(): Promise<void> {
  const sub = await getActivePushSubscription();
  if (!sub) return;

  await fetch(`${getApiBase()}/push/subscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});

  await sub.unsubscribe().catch(() => {});
}

/** True if the browser supports push and we already have permission. */
export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub !== null;
}
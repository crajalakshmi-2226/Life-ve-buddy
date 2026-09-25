/**
 * LifeBuddy Web Push Notification Manager
 * Handles Service Worker PushManager subscriptions, VAPID key conversion,
 * permission lifecycle, and backend communication.
 */

// Convert base64 URL-safe string to Uint8Array for applicationServerKey
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current browser (e.g. Chrome on Android) supports Web Push & Service Workers
 */
export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Retrieve active push subscription from service worker registration
 */
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('Error reading push subscription:', err);
    return null;
  }
}

/**
 * Request notification permission and subscribe to Web Push
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  reason?: string;
}> {
  if (!isWebPushSupported()) {
    return { success: false, reason: 'Push notifications are not supported on this browser or platform.' };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { 
        success: false, 
        reason: permission === 'denied' 
          ? 'Notification permission was denied. Please allow notifications in Chrome Site Settings.' 
          : 'Notification permission was dismissed.' 
      };
    }

    // 2. Fetch VAPID public key from backend
    const vapidRes = await fetch('/api/push/vapid-public-key');
    if (!vapidRes.ok) {
      throw new Error(`Failed to fetch VAPID key: HTTP ${vapidRes.status}`);
    }
    const { publicKey } = await vapidRes.json();
    if (!publicKey) {
      throw new Error('VAPID public key not provided by server.');
    }

    // 3. Register push subscription with the service worker
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // 4. Send subscription to our server so background pushes can be delivered
    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });

    if (!subRes.ok) {
      throw new Error(`Server failed to register subscription: HTTP ${subRes.status}`);
    }

    localStorage.setItem('lifebuddy_push_subscribed', 'true');
    return { success: true, subscription };
  } catch (err: any) {
    console.error('Push notification subscription error:', err);
    return { success: false, reason: err.message || 'Unknown subscription failure' };
  }
}

/**
 * Unsubscribe current device from Web Push
 */
export async function unsubscribeFromPushNotifications(): Promise<{ success: boolean; reason?: string }> {
  if (!isWebPushSupported()) return { success: false, reason: 'Unsupported' };

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      }).catch(e => console.warn('Unsubscribe backend notice:', e));

      await subscription.unsubscribe();
    }
    localStorage.removeItem('lifebuddy_push_subscribed');
    return { success: true };
  } catch (err: any) {
    console.error('Error unsubscribing from push:', err);
    return { success: false, reason: err.message };
  }
}

/**
 * Trigger background push notification from server (immediate or scheduled with delay)
 * Works when app is closed, in background, or in locked phone tray on Android.
 */
export async function triggerBackgroundPush(options: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  delaySeconds?: number;
}): Promise<{ success: boolean; message?: string; scheduled?: boolean }> {
  try {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        url: options.url || '/',
        tag: options.tag || `lifebuddy-${Date.now()}`,
        delaySeconds: options.delaySeconds || 0
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Backend push trigger warning, attempting local service worker notification fallback:', err);
    // Fallback: If network is offline or server unavailable, try SW showNotification directly
    if (isWebPushSupported() && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).showNotification(options.title, {
          body: options.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: options.tag || `lifebuddy-fallback-${Date.now()}`,
          vibrate: [200, 100, 200, 100, 200],
          data: { url: options.url || '/' }
        } as any);
        return { success: true, message: 'Notification dispatched via local Service Worker.' };
      } catch (swErr) {
        console.error('SW fallback also failed:', swErr);
      }
    }
    return { success: false, message: err.message };
  }
}

/**
 * Fetch push service status from server
 */
export async function fetchPushServerStatus(): Promise<{
  subscribersCount: number;
  vapidConfigured: boolean;
  vapidPublicKey?: string;
}> {
  try {
    const res = await fetch('/api/push/status');
    if (!res.ok) throw new Error('Status endpoint failed');
    return await res.json();
  } catch (err) {
    return { subscribersCount: 0, vapidConfigured: false };
  }
}

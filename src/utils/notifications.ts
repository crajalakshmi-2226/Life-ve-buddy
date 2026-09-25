/**
 * LifeBuddy Unified System-Level Notification Engine
 * Integrates Web Notification API + Service Worker + Web Push API + Audio & Vibration
 * Ensures reminders appear on the phone tray / lock screen even when app is in background/closed.
 */

import { playAlertChime } from './audio';
import { triggerBackgroundPush } from './pushManager';

export interface SystemNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  data?: Record<string, any>;
  soundEnabled?: boolean;
  actions?: { action: string; title: string }[];
}

/**
 * Check current notification status
 */
export function getNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestSystemNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'default';
  }
}

/**
 * Send real system-level notification via Service Worker (Android Chrome compliant)
 * Always prioritizes ServiceWorkerRegistration.showNotification() to work on Android.
 */
export async function sendSystemNotification(options: SystemNotificationOptions): Promise<boolean> {
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }

  // Play sound if enabled
  if (options.soundEnabled !== false) {
    try {
      playAlertChime();
    } catch (e) {
      console.debug('Audio chime error:', e);
    }
  }

  // Device vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(options.vibrate || [200, 100, 200, 100, 200]);
    } catch (e) {
      console.debug('Vibrate error:', e);
    }
  }

  const defaultIcon = options.icon || '/pwa-192x192.png';
  const defaultBadge = options.badge || '/pwa-192x192.png';
  const tag = options.tag || `lifebuddy-${Date.now()}`;

  // 1. Mandatory on Android Chrome: Service Worker registration showNotification
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await (reg as any).showNotification(options.title, {
          body: options.body,
          icon: defaultIcon,
          badge: defaultBadge,
          tag,
          vibrate: options.vibrate || [200, 100, 200, 100, 200],
          data: options.data || { url: '/' },
          renotify: true,
          requireInteraction: options.requireInteraction || false,
          actions: options.actions || [
            { action: 'open', title: 'Open LifeBuddy' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        } as any);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification notice:', swErr);
    }
  }

  // 2. Desktop fallback (note: Chrome on Android explicitly forbids `new Notification()` in window context)
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(options.title, {
        body: options.body,
        icon: defaultIcon,
        tag,
        badge: defaultBadge
      });
      return true;
    }
  } catch (winErr) {
    console.debug('Window Notification fallback skipped (expected on Android Chrome):', winErr);
  }

  return false;
}

/**
 * Dispatch background push notification via Server Web Push API
 * This wakes up Android Chrome even when closed or in background!
 */
export async function dispatchBackgroundPushAlert(options: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  delaySeconds?: number;
}): Promise<boolean> {
  const result = await triggerBackgroundPush(options);
  return result.success;
}

/**
 * Send deduplicated reminder: will only trigger once per unique key per date/period
 */
export async function sendDeduplicatedReminder(
  dedupeKey: string,
  options: SystemNotificationOptions
): Promise<boolean> {
  const lastSent = localStorage.getItem(`notif_sent_${dedupeKey}`);
  const todayStr = new Date().toISOString().split('T')[0];
  
  // If already sent today with this specific dedupeKey, skip
  if (lastSent === todayStr) {
    return false;
  }

  const success = await sendSystemNotification(options);
  if (success) {
    localStorage.setItem(`notif_sent_${dedupeKey}`, todayStr);
  }
  return success;
}

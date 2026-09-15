/**
 * LifeBuddy Unified System-Level Notification Engine
 * Integrates Web Notification API + Service Worker + Audio & Vibration
 * Ensures reminders appear on the phone tray / lock screen even when app is in background/closed.
 */

import { playAlertChime } from './audio';

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
 * Send real system-level notification via Service Worker or Web Notification API
 */
export async function sendSystemNotification(options: SystemNotificationOptions): Promise<boolean> {
  const permission = getNotificationPermission();
  
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
      navigator.vibrate(options.vibrate || [200, 100, 200]);
    } catch (e) {
      console.debug('Vibrate error:', e);
    }
  }

  if (permission !== 'granted') {
    return false;
  }

  const defaultIcon = options.icon || '/pwa-192x192.png';
  const defaultBadge = options.badge || '/pwa-192x192.png';
  const tag = options.tag || `lifebuddy-${Date.now()}`;

  // 1. Try Service Worker registration first (works in background & lock screen)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await (reg as any).showNotification(options.title, {
          body: options.body,
          icon: defaultIcon,
          badge: defaultBadge,
          tag,
          vibrate: options.vibrate || [200, 100, 200],
          data: options.data || { url: '/' },
          renotify: true
        });
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification fallback:', swErr);
    }
  }

  // 2. Fallback to standard window Notification
  try {
    new Notification(options.title, {
      body: options.body,
      icon: defaultIcon,
      tag,
      badge: defaultBadge
    });
    return true;
  } catch (winErr) {
    console.warn('Window Notification failed:', winErr);
    return false;
  }
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

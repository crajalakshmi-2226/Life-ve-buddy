/**
 * Client-Side Synchronization with Server-Side Background Scheduler
 * Ensures all reminders are saved persistently on the server and
 * triggered via Web Push at the exact local scheduled time.
 */

import { QuickReminder } from '../types';

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (_e) {
    return 'UTC';
  }
}

/**
 * Fetch all scheduled reminders from the persistent server backend
 */
export async function fetchServerReminders(): Promise<QuickReminder[]> {
  try {
    const res = await fetch('/api/reminders');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reminders || [];
  } catch (err) {
    console.warn('Failed to fetch server reminders, using offline cache:', err);
    const cached = localStorage.getItem('quickReminders');
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Save / schedule a reminder on the persistent server scheduler
 */
export async function saveScheduledReminder(reminder: QuickReminder): Promise<{
  success: boolean;
  reminder?: QuickReminder;
  message?: string;
}> {
  const timezone = reminder.timezone || getUserTimezone();
  
  // Calculate absolute epoch timestamp
  let scheduledTime = reminder.scheduledTime;
  if (!scheduledTime && reminder.remindMeAt) {
    scheduledTime = new Date(reminder.remindMeAt).getTime();
  }
  if (!scheduledTime && reminder.date && reminder.time) {
    scheduledTime = new Date(`${reminder.date}T${reminder.time}`).getTime();
  }

  const payload = {
    id: reminder.id,
    subject: reminder.subject,
    date: reminder.date,
    time: reminder.time,
    remindMeAt: reminder.remindMeAt,
    scheduledTime,
    timezone,
    recurrence: reminder.recurrence || 'none',
    targetUrl: reminder.targetUrl || '/?tab=reminders',
    completed: !!reminder.completed
  };

  try {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      reminder: {
        ...reminder,
        ...data.reminder,
        scheduledTime
      },
      message: data.message
    };
  } catch (err: any) {
    console.warn('Server scheduling warning (offline fallback active):', err);
    return {
      success: false,
      message: err.message,
      reminder: {
        ...reminder,
        scheduledTime
      }
    };
  }
}

/**
 * Delete a scheduled reminder from the server
 */
export async function deleteScheduledReminder(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/reminders/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete reminder from server:', err);
    return false;
  }
}

/**
 * Toggle completed state on server
 */
export async function toggleCompleteScheduledReminder(id: string, completed?: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/reminders/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to toggle complete on server:', err);
    return false;
  }
}

/**
 * Sync entire local reminder list with server database
 */
export async function syncAllWithServer(localReminders: QuickReminder[]): Promise<QuickReminder[]> {
  try {
    const res = await fetch('/api/reminders/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminders: localReminders })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reminders)) {
        return data.reminders.map((r: any) => ({
          id: r.id,
          subject: r.title || r.subject,
          date: r.date,
          time: r.time,
          remindMeAt: r.remindMeAt,
          scheduledTime: r.scheduledTime,
          timezone: r.timezone,
          recurrence: r.recurrence,
          targetUrl: r.targetUrl,
          completed: r.completed,
          notified: r.status === 'sent',
          createdAt: r.createdAt
        }));
      }
    }
  } catch (err) {
    console.warn('Reminders batch sync warning:', err);
  }
  return localReminders;
}

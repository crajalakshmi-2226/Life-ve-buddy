import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data directory exists for persistent storage
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Initialize or load VAPID Keys
const VAPID_FILE = path.join(DATA_DIR, 'vapid-keys.json');
let vapidKeys: { publicKey: string; privateKey: string };

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };
} else if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Failed to read existing VAPID file, generating fresh keys:', err);
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  }
} else {
  // Generate stable VAPID keys and persist them
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
}

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@lifebuddy.app';
webpush.setVapidDetails(vapidSubject, vapidKeys.publicKey, vapidKeys.privateKey);

// 2. Load or initialize push subscriptions
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');
interface PushSubRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
  userAgent?: string;
  createdAt: number;
}

let subscriptions: PushSubRecord[] = [];
if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
  try {
    subscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Failed to parse push subscriptions file:', err);
    subscriptions = [];
  }
}

function persistSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save subscriptions:', err);
  }
}

// 3. Persistent Scheduled Reminders Database
const REMINDERS_FILE = path.join(DATA_DIR, 'scheduled-reminders.json');

export interface ScheduledReminderRecord {
  id: string;
  title: string;
  message: string;
  scheduledTime: number; // UTC Epoch timestamp in milliseconds
  remindMeAt: string; // ISO or local date-time string YYYY-MM-DDTHH:mm
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timezone: string; // e.g. "Asia/Kolkata", "America/New_York"
  recurrence: 'none' | 'daily' | 'weekdays' | 'weekly' | 'hourly';
  targetUrl: string; // e.g. "/?tab=reminders"
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  createdAt: number;
  completed: boolean;
  notifiedAt?: number;
}

let scheduledReminders: ScheduledReminderRecord[] = [];
if (fs.existsSync(REMINDERS_FILE)) {
  try {
    scheduledReminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Failed to parse scheduled reminders file:', err);
    scheduledReminders = [];
  }
}

function persistReminders() {
  try {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(scheduledReminders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save scheduled reminders:', err);
  }
}

// Helper to calculate next recurrence time
function calculateNextRecurrence(currentEpoch: number, recurrence: string): number {
  const d = new Date(currentEpoch);
  if (recurrence === 'hourly') {
    return currentEpoch + 60 * 60 * 1000;
  }
  if (recurrence === 'daily') {
    return currentEpoch + 24 * 60 * 60 * 1000;
  }
  if (recurrence === 'weekdays') {
    d.setDate(d.getDate() + 1);
    // If Saturday, jump to Monday (+2)
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    // If Sunday, jump to Monday (+1)
    else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  if (recurrence === 'weekly') {
    return currentEpoch + 7 * 24 * 60 * 60 * 1000;
  }
  return currentEpoch + 24 * 60 * 60 * 1000;
}

// Middleware
app.use(express.json());

// ============================================================
// WEB PUSH NOTIFICATION DISPATCH ENGINE
// ============================================================

// Helper to send push to all registered devices
async function dispatchPushNotifications(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
}) {
  if (subscriptions.length === 0) {
    console.log('[WebPush] No subscribers registered to receive push notification.');
    return { sentCount: 0, removedExpiredCount: 0 };
  }

  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    tag: payload.tag || `lifebuddy-${Date.now()}`,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    vibrate: payload.vibrate || [200, 100, 200, 100, 200],
    data: {
      url: payload.url || '/',
      timestamp: Date.now()
    }
  });

  const expiredEndpoints: string[] = [];
  let sentCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          stringifiedPayload,
          {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high'
          }
        );
        sentCount++;
      } catch (err: any) {
        // HTTP 404 or 410 indicates the subscription has expired or unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('[WebPush] Subscription expired or removed:', sub.endpoint);
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.warn('[WebPush] Push delivery warning for subscriber:', err.message);
        }
      }
    })
  );

  // Clean up any dead/expired subscriptions
  if (expiredEndpoints.length > 0) {
    subscriptions = subscriptions.filter(s => !expiredEndpoints.includes(s.endpoint));
    persistSubscriptions();
  }

  return { sentCount, removedExpiredCount: expiredEndpoints.length };
}

// ============================================================
// BACKGROUND SCHEDULER ENGINE (Runs continuously on Node Server)
// Checks every 10 seconds for scheduled notifications that have arrived
// ============================================================
async function checkAndDispatchScheduledReminders() {
  const now = Date.now();
  let hasUpdates = false;

  for (const rem of scheduledReminders) {
    if (rem.status === 'pending' && !rem.completed && rem.scheduledTime <= now) {
      console.log(`[Scheduler] ⏰ Firing scheduled reminder: "${rem.title}" (ID: ${rem.id}) at ${new Date(now).toISOString()}`);
      
      // Dispatch Web Push notification through FCM to wake up Android Chrome
      await dispatchPushNotifications({
        title: `🔔 ${rem.title}`,
        body: rem.message || `Reminder for ${rem.date} at ${rem.time}`,
        url: rem.targetUrl || '/?tab=reminders',
        tag: `rem-${rem.id}`
      });

      rem.notifiedAt = now;

      // Check if recurring
      if (rem.recurrence && rem.recurrence !== 'none') {
        const nextTime = calculateNextRecurrence(rem.scheduledTime, rem.recurrence);
        console.log(`[Scheduler] Rescheduling recurring (${rem.recurrence}) reminder "${rem.title}" to ${new Date(nextTime).toISOString()}`);
        rem.scheduledTime = nextTime;
        rem.status = 'pending';
      } else {
        rem.status = 'sent';
      }
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    persistReminders();
  }
}

// Start continuous background scheduler loop (runs every 10s)
const SCHEDULER_INTERVAL_MS = 10000;
setInterval(() => {
  checkAndDispatchScheduledReminders().catch(err => {
    console.error('[Scheduler] Error in checkAndDispatchScheduledReminders:', err);
  });
}, SCHEDULER_INTERVAL_MS);

// Initial check on server boot
checkAndDispatchScheduledReminders().catch(() => {});

// ============================================================
// API ENDPOINTS FOR SCHEDULED REMINDERS
// ============================================================

// List all scheduled reminders
app.get('/api/reminders', (_req, res) => {
  res.json({
    success: true,
    reminders: scheduledReminders
  });
});

// Schedule or update a reminder
app.post('/api/reminders', async (req, res) => {
  const { 
    id, 
    subject, 
    title, 
    message, 
    date, 
    time, 
    remindMeAt, 
    scheduledTime, 
    timezone, 
    recurrence, 
    targetUrl,
    completed
  } = req.body;

  const reminderTitle = title || subject;
  if (!reminderTitle) {
    res.status(400).json({ error: 'Reminder subject/title is required.' });
    return;
  }

  // Calculate epoch scheduledTime if not explicitly provided
  let computedScheduledTime = typeof scheduledTime === 'number' ? scheduledTime : 0;
  if (!computedScheduledTime && remindMeAt) {
    computedScheduledTime = new Date(remindMeAt).getTime();
  }
  if (!computedScheduledTime && date && time) {
    computedScheduledTime = new Date(`${date}T${time}`).getTime();
  }

  if (!computedScheduledTime || isNaN(computedScheduledTime)) {
    res.status(400).json({ error: 'Invalid or missing scheduled timestamp (remindMeAt / scheduledTime).' });
    return;
  }

  const reminderId = id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reminderTimezone = timezone || 'UTC';
  const reminderRecurrence = recurrence || 'none';
  const reminderUrl = targetUrl || '/?tab=reminders';

  const existingIndex = scheduledReminders.findIndex(r => r.id === reminderId);
  const now = Date.now();
  const isPast = computedScheduledTime <= now;

  const record: ScheduledReminderRecord = {
    id: reminderId,
    title: reminderTitle,
    message: message || `Scheduled reminder for ${date || 'today'} at ${time || 'specified time'}`,
    scheduledTime: computedScheduledTime,
    remindMeAt: remindMeAt || new Date(computedScheduledTime).toISOString(),
    date: date || new Date(computedScheduledTime).toISOString().split('T')[0],
    time: time || '12:00',
    timezone: reminderTimezone,
    recurrence: reminderRecurrence,
    targetUrl: reminderUrl,
    status: isPast ? 'sent' : 'pending',
    createdAt: existingIndex >= 0 ? scheduledReminders[existingIndex].createdAt : now,
    completed: !!completed
  };

  if (existingIndex >= 0) {
    scheduledReminders[existingIndex] = record;
  } else {
    scheduledReminders.unshift(record);
  }

  persistReminders();
  console.log(`[Scheduler] Reminder saved: "${record.title}" scheduled for ${new Date(record.scheduledTime).toISOString()} (Timezone: ${record.timezone})`);

  // If already due right now, trigger immediately
  if (isPast && !record.completed) {
    dispatchPushNotifications({
      title: `🔔 ${record.title}`,
      body: record.message,
      url: record.targetUrl,
      tag: `rem-${record.id}`
    }).catch(e => console.warn('[Scheduler] Immediate dispatch notice:', e));
  }

  res.json({
    success: true,
    reminder: record,
    message: `Reminder scheduled successfully on server for ${new Date(record.scheduledTime).toLocaleString()}`
  });
});

// Delete a scheduled reminder
app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = scheduledReminders.length;
  scheduledReminders = scheduledReminders.filter(r => r.id !== id);

  if (scheduledReminders.length !== initialLength) {
    persistReminders();
    console.log(`[Scheduler] Deleted reminder ID: ${id}`);
  }

  res.json({ success: true, count: scheduledReminders.length });
});

// Complete or toggle a reminder
app.post('/api/reminders/:id/complete', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const rem = scheduledReminders.find(r => r.id === id);
  if (rem) {
    rem.completed = completed !== undefined ? !!completed : !rem.completed;
    if (rem.completed) {
      rem.status = 'completed';
    }
    persistReminders();
    res.json({ success: true, reminder: rem });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// Two-way sync endpoint for client reminders
app.post('/api/reminders/sync', (req, res) => {
  const { reminders } = req.body;
  if (!Array.isArray(reminders)) {
    res.status(400).json({ error: 'reminders array required' });
    return;
  }

  // Merge client reminders into server list
  for (const clientRem of reminders) {
    if (!clientRem.id) continue;
    const existingIndex = scheduledReminders.findIndex(r => r.id === clientRem.id);
    const scheduledTime = clientRem.scheduledTime || (clientRem.remindMeAt ? new Date(clientRem.remindMeAt).getTime() : Date.now());

    const record: ScheduledReminderRecord = {
      id: clientRem.id,
      title: clientRem.subject || clientRem.title || 'Scheduled Reminder',
      message: clientRem.message || `Reminder for ${clientRem.date} at ${clientRem.time}`,
      scheduledTime,
      remindMeAt: clientRem.remindMeAt || new Date(scheduledTime).toISOString(),
      date: clientRem.date || new Date(scheduledTime).toISOString().split('T')[0],
      time: clientRem.time || '12:00',
      timezone: clientRem.timezone || 'UTC',
      recurrence: clientRem.recurrence || 'none',
      targetUrl: clientRem.targetUrl || '/?tab=reminders',
      status: clientRem.notified ? 'sent' : (clientRem.status || 'pending'),
      createdAt: clientRem.createdAt || Date.now(),
      completed: !!clientRem.completed
    };

    if (existingIndex >= 0) {
      scheduledReminders[existingIndex] = { ...scheduledReminders[existingIndex], ...record };
    } else {
      scheduledReminders.push(record);
    }
  }

  persistReminders();
  res.json({ success: true, reminders: scheduledReminders });
});

// ============================================================
// WEB PUSH SUBSCRIPTION & TESTING ENDPOINTS
// ============================================================

// Return VAPID Public Key for client subscription
app.get('/api/push/vapid-public-key', (_req, res) => {
  res.json({
    publicKey: vapidKeys.publicKey,
    subject: vapidSubject
  });
});

// Register or update push subscription
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userAgent } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: 'Invalid subscription payload. Must include endpoint and keys.' });
    return;
  }

  const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
  const newRecord: PushSubRecord = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    expirationTime: subscription.expirationTime || null,
    userAgent: userAgent || 'Unknown browser',
    createdAt: Date.now()
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = newRecord;
  } else {
    subscriptions.push(newRecord);
  }

  persistSubscriptions();
  console.log(`[WebPush] Subscribed device (${subscriptions.length} total)`);
  res.json({ success: true, count: subscriptions.length });
});

// Unsubscribe
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: 'Endpoint is required to unsubscribe.' });
    return;
  }

  const initialCount = subscriptions.length;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  if (subscriptions.length !== initialCount) {
    persistSubscriptions();
  }

  console.log(`[WebPush] Unsubscribed device (${subscriptions.length} remaining)`);
  res.json({ success: true, count: subscriptions.length });
});

// Trigger push notification (instant or delayed testing)
app.post('/api/push/send', async (req, res) => {
  const { title, body, url, tag, delaySeconds } = req.body;
  if (!title || !body) {
    res.status(400).json({ error: 'title and body are required.' });
    return;
  }

  const delay = typeof delaySeconds === 'number' && delaySeconds > 0 ? Math.min(delaySeconds, 300) : 0;

  if (delay > 0) {
    console.log(`[WebPush] Scheduled push notification in ${delay}s: "${title}"`);
    setTimeout(async () => {
      console.log(`[WebPush] Firing delayed background push notification: "${title}"`);
      await dispatchPushNotifications({ title, body, url, tag });
    }, delay * 1000);

    res.json({
      success: true,
      scheduled: true,
      delaySeconds: delay,
      message: `Notification will be pushed in ${delay} seconds. You can now close Chrome or lock your phone.`
    });
    return;
  }

  // Immediate dispatch
  const result = await dispatchPushNotifications({ title, body, url, tag });
  res.json({
    success: true,
    scheduled: false,
    ...result,
    message: result.sentCount > 0 
      ? `Push sent to ${result.sentCount} device(s).` 
      : 'No push subscribers found yet. Please allow notifications and click "Subscribe".'
  });
});

// Check status of push service & scheduler
app.get('/api/push/status', (_req, res) => {
  const pendingReminders = scheduledReminders.filter(r => r.status === 'pending' && !r.completed);
  res.json({
    subscribersCount: subscriptions.length,
    vapidConfigured: !!vapidKeys.publicKey,
    vapidPublicKey: vapidKeys.publicKey,
    pendingRemindersCount: pendingReminders.length,
    totalRemindersCount: scheduledReminders.length
  });
});

// ============================================================
// VITE DEV SERVER OR STATIC PRODUCTION SERVING
// ============================================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeBuddy full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

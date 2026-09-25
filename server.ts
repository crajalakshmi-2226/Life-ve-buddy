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

// Middleware
app.use(express.json());

// ============================================================
// WEB PUSH NOTIFICATION API ENDPOINTS
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

// Trigger push notification (instant or delayed)
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

// Check status of push service
app.get('/api/push/status', (_req, res) => {
  res.json({
    subscribersCount: subscriptions.length,
    vapidConfigured: !!vapidKeys.publicKey,
    vapidPublicKey: vapidKeys.publicKey
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

/**
 * Service Worker — PWA + إشعارات
 * - يُرفَع رقم SW_VERSION عند كل نشر مهم (يفرّغ الكاشات القديمة).
 * - عند الاتصال: الشبكة أولاً لـ HTML/JS/CSS/الخطوط (التحديثات تظهر فوراً).
 * - عند الانقطاع: تُستخدم النسخة المخبّأة.
 * - تفعيل الـ worker الجديد اختياري من الواجهة (زر تحديث).
 */
const SW_VERSION = '3';
const CACHE_NAME = 'manahl-badr-shell-v' + SW_VERSION;
const RUNTIME_CACHE = 'manahl-badr-runtime-v' + SW_VERSION;
const NOTIFICATION_CACHE = 'notifications-v1';

const PRECACHE_URLS = ['/', '/index.html', '/manifest.json', '/offline.html'];

// تثبيت: تخزين مسبق للقشرة + بدون تفعيل فوري عند وجود نسخة أقدم (ليعمل زر "تحديث")
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                PRECACHE_URLS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[Service Worker] Precache skip:', url, err && err.message);
                    })
                )
            );
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// تفعيل: حذف كاشات قديمة (أي manahl-badr- غير الحالية) والإشعارات تُبقى عدا الجلسة
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName === NOTIFICATION_CACHE) return Promise.resolve();
                    if (cacheName === CACHE_NAME || cacheName === RUNTIME_CACHE) return Promise.resolve();
                    if (cacheName.indexOf('manahl-badr') === 0) {
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ——— إشعارات (كما في النسخة السابقة) ———
self.addEventListener('push', (event) => {
    let notificationData = {
        title: 'مناحل ريف وصاب',
        body: 'لديك إشعار جديد',
        icon: '/assets/manahel.jpg',
        badge: '/assets/manahel.jpg',
        tag: 'notification',
        requireInteraction: false,
        data: {}
    };
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || notificationData.tag,
                requireInteraction: data.requireInteraction || false,
                data: data.data || {},
                actions: data.actions || []
            };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    event.waitUntil(
        saveNotificationToCache(notificationData).then(() => {
            return self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                tag: notificationData.tag,
                requireInteraction: notificationData.requireInteraction,
                data: notificationData.data,
                actions: notificationData.actions,
                vibrate: [200, 100, 200],
                timestamp: Date.now()
            });
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const notificationData = event.notification.data;
    const urlToOpen = notificationData.url || '/pages/notifications.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', () => {});

async function saveNotificationToCache(notificationData) {
    try {
        const db = await openNotificationDB();
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        await store.add({
            ...notificationData,
            id: Date.now(),
            timestamp: Date.now(),
            read: false
        });
    } catch (error) {
        console.error('[Service Worker] Error saving notification:', error);
    }
}

function openNotificationDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationsDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notifications')) {
                const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('read', 'read', { unique: false });
            }
        };
    });
}

async function getCachedNotifications() {
    try {
        const db = await openNotificationDB();
        const transaction = db.transaction(['notifications'], 'readonly');
        const store = transaction.objectStore('notifications');
        const index = store.index('timestamp');
        const request = index.getAll();
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const notifications = request.result.reverse();
                resolve(new Response(JSON.stringify({
                    success: true,
                    notifications: notifications
                }), { headers: { 'Content-Type': 'application/json' } }));
            };
            request.onerror = () => {
                resolve(new Response(JSON.stringify({ success: true, notifications: [] }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            };
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: true, notifications: [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ——— جلب: الشبكة أولاً ———
function sameOriginRequest(url) {
    try {
        return url.origin === new URL(self.registration.scope).origin;
    } catch (e) {
        return false;
    }
}

function shouldHandleNetworkFirst(request) {
    if (request.method !== 'GET') return false;
    const u = new URL(request.url);
    if (!sameOriginRequest(u)) return false;
    if (u.pathname === '/sw.js') {
        return false;
    }
    if (u.pathname.startsWith('/api/') && u.pathname.indexOf('/api/notifications') === -1) {
        return false;
    }
    const mode = request.mode;
    const dest = request.destination;
    if (mode === 'navigate') return true;
    if (dest === 'document' || dest === 'empty' && request.headers.get('accept') && request.headers.get('accept').indexOf('text/html') >= 0) {
        return true;
    }
    if (['style', 'script', 'font', 'manifest'].indexOf(dest) >= 0) return true;
    if (u.pathname.endsWith('.js') || u.pathname.endsWith('.css') || u.pathname.endsWith('.html')) {
        return true;
    }
    if (u.pathname.startsWith('/assets/') || u.pathname === '/manifest.json') {
        return true;
    }
    return false;
}

async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            try {
                await cache.put(request, response.clone());
            } catch (e) { /* ignore */ }
        }
        return response;
    } catch (e) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate' || request.destination === 'document') {
            const off = await caches.match('/offline.html');
            if (off) return off;
        }
        throw e;
    }
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (!request.url.startsWith('http')) {
        return;
    }

    if (request.url.includes('/api/notifications')) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request).then((response) => {
                    if (response) return response;
                    return getCachedNotifications();
                });
            })
        );
        return;
    }

    if (shouldHandleNetworkFirst(request)) {
        event.respondWith(networkFirst(request));
    }
});
 
/**
 * Service Worker
 * Progressive Web App Service Worker للتخزين المؤقت والعمل بدون إنترنت
 */

const CACHE_NAME = 'manahl-badr-v1';
const STATIC_CACHE_NAME = 'manahl-badr-static-v1';
const DYNAMIC_CACHE_NAME = 'manahl-badr-dynamic-v1';

// الملفات الثابتة للتخزين المؤقت
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/pages/',
    '/assets/css/',
    '/assets/js/',
    '/assets/images/',
    '/assets/icons/',
    '/assets/fonts/',
    '/manifest.json'
];

// إعدادات التخزين المؤقت
const CACHE_CONFIG = {
    static: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
        maxEntries: 100
    },
    dynamic: {
        maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
        maxEntries: 50
    },
    api: {
        maxAge: 5 * 60 * 1000, // 5 دقائق
        maxEntries: 20
    }
};

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // تجاهل الطلبات غير HTTP/HTTPS
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // استراتيجية التخزين المؤقت حسب نوع الطلب
    if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isStaticAsset(url)) {
        event.respondWith(handleStaticRequest(request));
    } else {
        event.respondWith(handleNavigationRequest(request));
    }
});

// التعامل مع طلبات API
async function handleAPIRequest(request) {
    try {
        // محاولة الحصول من التخزين المؤقت أولاً
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.api);
        if (cachedResponse) {
            console.log('📱 Serving API from cache:', request.url);
            return cachedResponse;
        }
        
        // إذا لم يوجد في التخزين المؤقت، جلب من الشبكة
        const networkResponse = await fetch(request);
        
        // تخزين الاستجابة إذا كانت ناجحة
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cacheResponse(request, responseClone, CACHE_CONFIG.api);
            console.log('💾 Cached API response:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ API request failed:', error);
        
        // محاولة الحصول من التخزين المؤقت كـ fallback
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.api);
        if (cachedResponse) {
            console.log('🔄 Serving API from cache (offline):', request.url);
            return cachedResponse;
        }
        
        // إرجاع استجابة خطأ مخصصة
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: 'لا يوجد اتصال بالإنترنت',
                offline: true 
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// التعامل مع طلبات الملفات الثابتة
async function handleStaticRequest(request) {
    try {
        // محاولة الحصول من التخزين المؤقت أولاً
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.static);
        if (cachedResponse) {
            console.log('📦 Serving static from cache:', request.url);
            return cachedResponse;
        }
        
        // جلب من الشبكة
        const networkResponse = await fetch(request);
        
        // تخزين الاستجابة
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cacheResponse(request, responseClone, CACHE_CONFIG.static);
            console.log('💾 Cached static asset:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Static request failed:', error);
        
        // محاولة الحصول من التخزين المؤقت
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.static);
        if (cachedResponse) {
            console.log('🔄 Serving static from cache (offline):', request.url);
            return cachedResponse;
        }
        
        return new Response('المحتوى غير متاح بدون إنترنت', { status: 503 });
    }
}

// التعامل مع طلبات التنقل (Navigation)
async function handleNavigationRequest(request) {
    try {
        // محاولة الحصول من التخزين المؤقت أولاً
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.dynamic);
        if (cachedResponse) {
            console.log('🌐 Serving page from cache:', request.url);
            return cachedResponse;
        }
        
        // جلب من الشبكة
        const networkResponse = await fetch(request);
        
        // تخزين الاستجابة إذا كانت صفحة HTML
        if (networkResponse.ok && isHTMLPage(request)) {
            const responseClone = networkResponse.clone();
            await cacheResponse(request, responseClone, CACHE_CONFIG.dynamic);
            console.log('💾 Cached page:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Navigation request failed:', error);
        
        // محاولة الحصول من التخزين المؤقت
        const cachedResponse = await getCachedResponse(request, CACHE_CONFIG.dynamic);
        if (cachedResponse) {
            console.log('🔄 Serving page from cache (offline):', request.url);
            return cachedResponse;
        }
        
        // إرجاع صفحة الخطأ المخصصة
        return caches.match('/offline.html');
    }
}

// التحقق من نوع الطلب
function isAPIRequest(url) {
    return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isHTMLPage(request) {
    return request.headers.get('accept')?.includes('text/html');
}

// الحصول على استجابة من التخزين المؤقت
async function getCachedResponse(request, config) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // التحقق من صلاحية التخزين المؤقت
        const cachedTime = cachedResponse.headers.get('cached-time');
        if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < config.maxAge) {
                return cachedResponse;
            } else {
                // حذف التخزين المؤقت منتهي الصلاحية
                await cache.delete(request);
            }
        }
    }
    
    return null;
}

// تخزين الاستجابة
async function cacheResponse(request, response, config) {
    const cache = await caches.open(CACHE_NAME);
    
    // إضافة وقت التخزين المؤقت
    const responseToCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
            ...Object.fromEntries(response.headers.entries()),
            'cached-time': Date.now().toString()
        }
    });
    
    await cache.put(request, responseToCache);
    
    // التحقق من عدد الإدخالات وتنظيف القديم
    const keys = await cache.keys();
    if (keys.length > config.maxEntries) {
        const keysToDelete = keys.slice(0, keys.length - config.maxEntries);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
}

// تنظيف التخزين المؤقت
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        updateCache(event.data.url);
    }
    
    if (event.data && event.data.type === 'CACHE_CLEAR') {
        clearCache();
    }
});

// تحديث التخزين المؤقت
async function updateCache(url) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const request = new Request(url);
        const response = await fetch(request);
        
        if (response.ok) {
            await cache.put(request, response);
            console.log('🔄 Updated cache for:', url);
        }
    } catch (error) {
        console.error('❌ Failed to update cache:', error);
    }
}

// مسح التخزين المؤقت
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ Cleared all caches');
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
    }
}

// مزامنة التخزين المؤقت
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// المزامنة في الخلفية
async function doBackgroundSync() {
    try {
        // مزامنة البيانات التي فشلت حفظها أثناء عدم وجود اتصال
        console.log('🔄 Background sync started');
        
        // يمكن إضافة منطق المزامنة هنا
        // مثل مزامنة الطلبات المحفوظة، الإشعارات، إلخ
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// دفع الإشعارات
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'استكشاف',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: '/assets/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('مناحل ريف وصاب', options)
    );
});

// التعامل مع نقرة الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // لا تفعل شيء عند الإغلاق
    } else {
        // فتح التطبيق عند النقر على الإشعار نفسه
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('🚀 Service Worker loaded');

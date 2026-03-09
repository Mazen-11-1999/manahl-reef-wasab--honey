/**
 * Push Notifications Manager
 * إدارة الإشعارات الحقيقية في المتصفح
 */

class PushNotificationManager {
    constructor() {
        this.registration = null;
        this.subscription = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // تهيئة Service Worker وطلب الإذن
    async initialize() {
        if (!this.isSupported) {
            console.warn('Push notifications are not supported in this browser');
            return false;
        }

        try {
            // تسجيل Service Worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[Push Notifications] Service Worker registered');

            // طلب الإذن للإشعارات
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('[Push Notifications] Permission granted');
                await this.subscribe();
                return true;
            } else {
                console.warn('[Push Notifications] Permission denied');
                return false;
            }
        } catch (error) {
            console.error('[Push Notifications] Error initializing:', error);
            return false;
        }
    }

    // الاشتراك في Push Notifications
    async subscribe() {
        try {
            // الحصول على VAPID Public Key من السيرفر
            const publicKey = await this.getVapidPublicKey();
            
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicKey)
            });

            // إرسال الاشتراك للسيرفر
            await this.sendSubscriptionToServer(this.subscription);
            console.log('[Push Notifications] Subscribed successfully');
            return true;
        } catch (error) {
            console.error('[Push Notifications] Error subscribing:', error);
            return false;
        }
    }

    // إلغاء الاشتراك
    async unsubscribe() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                await this.removeSubscriptionFromServer(this.subscription);
                this.subscription = null;
                console.log('[Push Notifications] Unsubscribed successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Push Notifications] Error unsubscribing:', error);
            return false;
        }
    }

    // إرسال الاشتراك للسيرفر (مجاني تماماً)
    async sendSubscriptionToServer(subscription) {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Push Notifications] Subscription sent to server:', data);
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.warn('[Push Notifications] Server response:', errorData);
                // حتى لو فشل، نستمر (للعمل بدون مصادقة)
                return true;
            }
        } catch (error) {
            console.error('[Push Notifications] Error sending subscription:', error);
            // حتى لو فشل، نستمر (للعمل بدون إنترنت)
            return true;
        }
    }

    // إزالة الاشتراك من السيرفر (مجاني تماماً)
    async removeSubscriptionFromServer(subscription) {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ subscription: subscription })
            });
            return true;
        } catch (error) {
            console.error('[Push Notifications] Error removing subscription:', error);
            // حتى لو فشل، نستمر
            return true;
        }
    }

    // تحويل VAPID Key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // الحصول على VAPID Public Key من السيرفر (مجاني تماماً)
    async getVapidPublicKey() {
        try {
            const response = await fetch('/api/notifications/vapid-public-key');
            const data = await response.json();
            
            if (data.success && data.publicKey) {
                return data.publicKey;
            }
            
            throw new Error('فشل الحصول على VAPID key');
        } catch (error) {
            console.error('[Push Notifications] Error getting VAPID key:', error);
            throw error;
        }
    }

    // التحقق من حالة الإشعارات
    async checkPermission() {
        if (!('Notification' in window)) {
            return 'not-supported';
        }
        return Notification.permission;
    }

    // إرسال إشعار محلي (للاختبار)
    showLocalNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: options.icon || '/assets/manahel.jpg',
                badge: options.badge || '/assets/manahel.jpg',
                body: options.body || '',
                tag: options.tag || 'notification',
                requireInteraction: options.requireInteraction || false,
                data: options.data || {},
                vibrate: [200, 100, 200]
            });

            notification.onclick = () => {
                window.focus();
                if (options.url) {
                    window.open(options.url, '_blank');
                }
                notification.close();
            };

            return notification;
        }
        return null;
    }
}

// إنشاء instance عام
window.pushNotificationManager = new PushNotificationManager();

// تهيئة تلقائية عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializePushNotifications();
    });
} else {
    initializePushNotifications();
}

// دالة التهيئة
async function initializePushNotifications() {
    const permission = await window.pushNotificationManager.checkPermission();
    
    if (permission === 'default') {
        // طلب الإذن عند أول زيارة
        console.log('[Push Notifications] Requesting permission...');
    } else if (permission === 'granted') {
        // تهيئة إذا كان الإذن موجود
        await window.pushNotificationManager.initialize();
    }
}


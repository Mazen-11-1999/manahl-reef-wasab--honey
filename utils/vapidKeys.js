/**
 * VAPID Keys Generator
 * توليد مفاتيح VAPID مجاناً للإشعارات (100% مجاني - web-push مفتوح المصدر)
 */

/**
 * توليد VAPID Keys بتنسيق Web Push (مجاني تماماً)
 * يستخدم web-push (مكتبة مجانية ومفتوحة المصدر)
 */
function generateWebPushVAPIDKeys() {
    try {
        // استخدام web-push (مكتبة مجانية)
        const webpush = require('web-push');
        const vapidKeys = webpush.generateVAPIDKeys();
        
        return {
            publicKey: vapidKeys.publicKey,
            privateKey: vapidKeys.privateKey
        };
    } catch (error) {
        console.error('Error generating VAPID keys:', error);
        console.warn('⚠️  web-push غير مثبت. قم بتشغيل: npm install web-push');
        
        // في حالة عدم تثبيت web-push، نستخدم طريقة بديلة بسيطة
        // (لن تعمل بشكل كامل لكن لن تكسر الكود)
        return {
            publicKey: null,
            privateKey: null
        };
    }
}

module.exports = {
    generateWebPushVAPIDKeys
};


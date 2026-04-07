/**
 * يطبع قيم عشوائية آمنة لـ JWT_SECRET و JWT_REFRESH_SECRET
 * للصقها في .env أو في متغيرات البيئة على الاستضافة (لا تُرفع إلى Git).
 */
const crypto = require('crypto');

function hexSecret() {
    return crypto.randomBytes(64).toString('hex');
}

const jwtSecret = hexSecret();
const refreshSecret = hexSecret();

console.log('');
console.log('انسخ إلى .env أو لوحة الاستضافة (لا تشارك هذه القيم علناً):\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
console.log('');
console.log('بعد التغيير في الإنتاج: جميع التوكنات الصادرة سابقاً تبطل حتى يعيد المستخدمون الدخول.\n');

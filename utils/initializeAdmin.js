/**
 * Initialize Admin User
 * تهيئة حساب المشرف الأول — يستخدم متغيرات البيئة فقط (بدون قيم ثابتة في الكود)
 */

const User = require('../models/User');
const config = require('../config/env');

/**
 * إنشاء حساب المشرف الأول إذا لم يكن موجوداً
 * أو تحديث كلمة المرور من الإعدادات إذا طُلب
 */
const initializeAdmin = async () => {
    const ADMIN_USERNAME = config.adminUsername || 'admin';
    const ADMIN_EMAIL = config.adminEmail || 'admin@manahlbadr.com';
    const ADMIN_PASSWORD = config.adminPassword;

    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 6) {
        console.error('❌ ADMIN_PASSWORD مطلوب في .env ويجب أن يكون 6 أحرف على الأقل');
        return;
    }

    try {
        let admin = await User.findOne({ role: 'admin' }).select('+password');

        if (admin) {
            const isPasswordCorrect = await admin.comparePassword(ADMIN_PASSWORD);
            if (!isPasswordCorrect) {
                admin.password = ADMIN_PASSWORD;
                await admin.save();
                console.log('✅ تم تحديث كلمة مرور المشرف من الإعدادات');
            } else {
                console.log('✅ حساب المشرف موجود');
            }
            if (!admin.isActive) {
                admin.isActive = true;
                await admin.save();
                console.log('✅ تم تفعيل حساب المشرف');
            }
            return;
        }

        admin = await User.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            profile: {
                firstName: 'Admin',
                lastName: 'Manager',
                phone: ''
            }
        });

        console.log('✅ تم إنشاء حساب المشرف الأول بنجاح');
        console.log(`📧 البريد: ${admin.email}`);
        console.log(`👤 اسم المستخدم: ${ADMIN_USERNAME}`);
        console.log('⚠️  غيّر كلمة المرور من لوحة التحكم أو عبر .env في الإنتاج');
    } catch (error) {
        console.error('❌ خطأ في إنشاء/تحديث حساب المشرف:', error.message);
        if (error.code === 11000) {
            console.error('⚠️  اسم المستخدم أو البريد مستخدم بالفعل');
            try {
                const existing = await User.findOne({
                    $or: [
                        { username: ADMIN_USERNAME },
                        { email: ADMIN_EMAIL }
                    ]
                }).select('+password');
                if (existing) {
                    existing.password = ADMIN_PASSWORD;
                    existing.role = 'admin';
                    existing.isActive = true;
                    await existing.save();
                    console.log('✅ تم تحديث حساب المشرف الموجود بنجاح');
                }
            } catch (updateError) {
                console.error('❌ فشل تحديث حساب المشرف:', updateError.message);
            }
        }
    }
};

module.exports = initializeAdmin;

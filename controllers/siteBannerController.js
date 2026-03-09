/**
 * Site Banner Controller
 * التحكم بالشريط العلوي المتحرك
 */

const SiteBanner = require('../models/SiteBanner');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على الشريط للعرض العام (بدون مصادقة)
 * يُرجع الشريط النشط فقط
 */
exports.getPublic = catchAsync(async (req, res, next) => {
    let banner = await SiteBanner.findOne({ active: true }).sort({ updatedAt: -1 });
    if (!banner) {
        // لا يوجد شريط نشط - نرجع null حتى لا يعرض العميل شيئاً
        return res.status(200).json({
            success: true,
            banner: null
        });
    }
    res.status(200).json({
        success: true,
        banner: {
            text: banner.text,
            link: banner.link || '',
            speed: banner.speed || 'medium',
            backgroundColor: banner.backgroundColor || ''
        }
    });
});

/**
 * الحصول على إعدادات الشريط (للوحة التحكم)
 */
exports.get = catchAsync(async (req, res, next) => {
    let banner = await SiteBanner.findOne().sort({ updatedAt: -1 });
    if (!banner) {
        banner = await SiteBanner.create({
            text: 'عرض خاص لأصدقاء ريف وصاب — خصم ١٠٪ على أول طلب',
            active: false,
            speed: 'medium'
        });
    }
    res.status(200).json({
        success: true,
        banner: {
            _id: banner._id,
            text: banner.text,
            link: banner.link || '',
            active: banner.active,
            speed: banner.speed || 'medium',
            backgroundColor: banner.backgroundColor || '',
            updatedAt: banner.updatedAt
        }
    });
});

/**
 * تحديث الشريط (للمشرف فقط)
 */
exports.update = catchAsync(async (req, res, next) => {
    const { text, link, active, speed, backgroundColor } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
        return next(new AppError('نص الشريط مطلوب', 400));
    }
    const speedVal = ['slow', 'medium', 'fast'].includes(speed) ? speed : 'medium';
    let banner = await SiteBanner.findOne().sort({ updatedAt: -1 });
    if (!banner) {
        banner = await SiteBanner.create({
            text: text.trim(),
            link: link ? String(link).trim() : '',
            active: active === true || active === 'true',
            speed: speedVal,
            backgroundColor: backgroundColor ? String(backgroundColor).trim() : ''
        });
    } else {
        banner.text = text.trim();
        banner.link = link ? String(link).trim() : '';
        banner.active = active === true || active === 'true';
        banner.speed = speedVal;
        if (backgroundColor !== undefined) banner.backgroundColor = String(backgroundColor).trim();
        await banner.save();
    }
    res.status(200).json({
        success: true,
        message: 'تم تحديث الشريط بنجاح',
        banner: {
            _id: banner._id,
            text: banner.text,
            link: banner.link || '',
            active: banner.active,
            speed: banner.speed,
            backgroundColor: banner.backgroundColor || '',
            updatedAt: banner.updatedAt
        }
    });
});

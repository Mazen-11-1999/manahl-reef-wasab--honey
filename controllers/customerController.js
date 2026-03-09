/**
 * Customer Controller
 * Controller لإدارة العملاء
 */

const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على ملف العميل
 */
exports.getProfile = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id })
        .populate('user', 'username email')
        .populate('wishlist.product', 'name image price');
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    res.status(200).json({
        success: true,
        customer
    });
});

/**
 * رفع صورة الملف الشخصي — تُحفظ في المجلد وتُسجّل في قاعدة البيانات مدى الحياة
 */
exports.uploadAvatar = catchAsync(async (req, res, next) => {
    if (!req.file || !req.file.filename) {
        return next(new AppError('لم يتم اختيار صورة صالحة', 400));
    }
    const avatarUrl = '/uploads/avatars/' + req.file.filename;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { 'profile.avatar': avatarUrl } },
        { new: true }
    );
    if (!user) return next(new AppError('المستخدم غير موجود', 404));

    const customer = await Customer.findOneAndUpdate(
        { user: req.user.id },
        { $set: { 'profile.avatar': avatarUrl } },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'تم حفظ صورة الملف الشخصي بنجاح',
        avatarUrl
    });
});

/**
 * تحديث ملف العميل
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { profile, addresses, preferences } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    if (profile) {
        customer.profile = { ...customer.profile, ...profile };
    }
    
    if (addresses) {
        customer.addresses = addresses;
    }
    
    if (preferences) {
        customer.preferences = customer.preferences || {};
        if (preferences.notifications && typeof preferences.notifications === 'object') {
            customer.preferences.notifications = {
                ...(customer.preferences.notifications || {}),
                ...preferences.notifications
            };
        }
        if (preferences.categories !== undefined) customer.preferences.categories = preferences.categories;
        if (preferences.allergies !== undefined) customer.preferences.allergies = preferences.allergies;
    }
    
    await customer.save();
    
    res.status(200).json({
        success: true,
        message: 'تم تحديث الملف الشخصي بنجاح',
        customer
    });
});

/**
 * الحصول على قائمة الأمنيات
 */
exports.getWishlist = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id })
        .populate('wishlist.product', 'name image price oldPrice stock featured');
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    res.status(200).json({
        success: true,
        wishlist: customer.wishlist
    });
});

/**
 * إضافة منتج لقائمة الأمنيات
 */
exports.addToWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    await customer.addToWishlist(productId);
    
    res.status(200).json({
        success: true,
        message: 'تم إضافة المنتج لقائمة الأمنيات',
        wishlist: customer.wishlist
    });
});

/**
 * إزالة منتج من قائمة الأمنيات
 */
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    await customer.removeFromWishlist(productId);
    
    res.status(200).json({
        success: true,
        message: 'تم إزالة المنتج من قائمة الأمنيات',
        wishlist: customer.wishlist
    });
});

/**
 * الحصول على إحصائيات العميل
 */
exports.getStats = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    res.status(200).json({
        success: true,
        stats: {
            loyalty: customer.loyalty,
            totalOrders: customer.stats.totalOrders,
            totalSpent: customer.stats.totalSpent,
            lastOrderDate: customer.stats.lastOrderDate,
            wishlistCount: customer.wishlist.length
        }
    });
});

// حد أقصى للعملاء في استجابة واحدة
const MAX_CUSTOMERS_LIMIT = 500;

/**
 * الحصول على جميع العملاء (للمشرف) مع عدد الطلبات وشارة المستخدم
 */
exports.getAllCustomers = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20, search, tier } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, MAX_CUSTOMERS_LIMIT);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limitNum;
    
    let query = {};
    
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { 'profile.firstName': { $regex: search, $options: 'i' } },
            { 'profile.lastName': { $regex: search, $options: 'i' } }
        ];
    }
    
    if (tier) {
        query['loyalty.tier'] = tier;
    }
    
    const customers = await Customer.find(query)
        .populate('user', 'username email profile badgeType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    
    const total = await Customer.countDocuments(query);
    const vipCount = await User.countDocuments({ role: 'user', badgeType: 'vip' });
    const premiumCount = await User.countDocuments({ role: 'user', badgeType: 'premium' });
    
    const userIds = customers.map(c => c.user && c.user._id).filter(Boolean);
    const orderCounts = userIds.length ? await Order.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } }
    ]) : [];
    const countByUser = {};
    orderCounts.forEach(o => { countByUser[o._id.toString()] = o.count; });
    
    const customersWithOrderCount = customers.map(c => ({
        ...c,
        orderCount: (c.user && countByUser[c.user._id.toString()]) || 0
    }));
    
    res.status(200).json({
        success: true,
        customers: customersWithOrderCount,
        stats: { totalCustomers: total, vipCount, premiumCount },
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });
});

/**
 * تحديث حالة VIP للعميل (للمشرف)
 */
exports.updateVipStatus = catchAsync(async (req, res, next) => {
    const { customerId } = req.params;
    const { isVip } = req.body;
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    // تحديث tier إلى VIP أو إرجاعه إلى المستوى الطبيعي
    if (isVip) {
        customer.loyalty.tier = 'VIP';
    } else {
        // إرجاع إلى المستوى الطبيعي بناءً على النقاط
        const points = customer.loyalty.points;
        if (points >= 10000) {
            customer.loyalty.tier = 'platinum';
        } else if (points >= 5000) {
            customer.loyalty.tier = 'gold';
        } else if (points >= 2000) {
            customer.loyalty.tier = 'silver';
        } else {
            customer.loyalty.tier = 'bronze';
        }
    }
    
    await customer.save();
    
    res.status(200).json({
        success: true,
        message: isVip ? 'تم تعيين العميل كـ VIP بنجاح' : 'تم إلغاء حالة VIP',
        customer
    });
});

/**
 * تحديث شارة العميل (للمشرف): none | premium (عميل مميز) | vip (VIP مناحل ريف وصاب)
 */
exports.updateBadge = catchAsync(async (req, res, next) => {
    const { customerId } = req.params;
    const { badgeType } = req.body;
    
    if (!badgeType || !['none', 'premium', 'vip'].includes(badgeType)) {
        return next(new AppError('نوع الشارة غير صحيح. القيم: none, premium, vip', 400));
    }
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const user = await User.findByIdAndUpdate(
        customer.user,
        { badgeType },
        { new: true }
    ).select('-password');
    
    if (!user) {
        return next(new AppError('المستخدم غير موجود', 404));
    }
    
    res.status(200).json({
        success: true,
        message: 'تم تحديث الشارة بنجاح',
        badgeType: user.badgeType
    });
});













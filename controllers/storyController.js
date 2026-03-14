/**
 * Story Controller
 * Controller لإدارة الحالات والإعلانات
 */

const path = require('path');
const fs = require('fs');
const Story = require('../models/Story');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على جميع الحالات النشطة
 */
exports.getStories = catchAsync(async (req, res, next) => {
    // التحقق من اتصال قاعدة البيانات
    const db = require('../config/database');
    if (!db.mongoose.connection.readyState || db.mongoose.connection.readyState !== 1) {
        // إرجاع بيانات وهمية إذا لم تتصل قاعدة البيانات
        return res.status(200).json({
            success: true,
            count: 0,
            stories: []
        });
    }

    const stories = await Story.getActiveStories();

    res.status(200).json({
        success: true,
        count: stories.length,
        stories
    });
});

/**
 * الحصول على جميع الإعلانات النشطة
 */
exports.getAds = catchAsync(async (req, res, next) => {
    const { position } = req.query;
    const ads = await Story.getActiveAds(position);

    res.status(200).json({
        success: true,
        count: ads.length,
        ads
    });
});

/**
 * الحصول على حالة/إعلان واحد
 */
exports.getStory = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id)
        .populate('createdBy', 'username')
        .populate('likes.user', 'username')
        .populate('likes.customer', 'profile.firstName profile.lastName')
        .populate('comments.user', 'username')
        .populate('comments.customer', 'profile.firstName profile.lastName');

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    // زيادة عدد المشاهدات
    await story.incrementViews();

    res.status(200).json({
        success: true,
        story
    });
});

/**
 * رفع وسائط (صورة/فيديو) للحالة أو الإعلان — من المعرض أو الكاميرا على الموبايل
 */
exports.uploadStoryMedia = catchAsync(async (req, res, next) => {
    if (!req.file || !req.file.path) {
        return next(new AppError('لم يتم رفع أي ملف', 400));
    }
    const url = '/' + req.file.path.replace(/\\/g, '/');
    res.status(200).json({
        success: true,
        url,
        mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    });
});

/**
 * إنشاء حالة/إعلان جديد (للمشرف)
 */
exports.createStory = catchAsync(async (req, res, next) => {
    const { type, media, caption, position, link, startDate, endDate } = req.body;

    const storyData = {
        type: type || 'story',
        media: {
            type: media.type,
            url: media.url,
            thumbnail: media.thumbnail
        },
        caption,
        createdBy: req.user._id || req.user.id,
        status: 'active'
    };

    if (type === 'ad') {
        storyData.position = position || 'story';
        storyData.link = link;
        if (startDate) storyData.startDate = new Date(startDate);
        if (endDate) storyData.endDate = new Date(endDate);
    }

    const story = new Story(storyData);
    await story.save();

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الحالة/الإعلان بنجاح',
        story
    });
});

/**
 * تحديث حالة/إعلان (للمشرف)
 */
exports.updateStory = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    const { media, caption, status, position, link, startDate, endDate } = req.body;

    if (media) story.media = media;
    if (caption !== undefined) story.caption = caption;
    if (status) story.status = status;
    if (position) story.position = position;
    if (link !== undefined) story.link = link;
    if (startDate) story.startDate = new Date(startDate);
    if (endDate) story.endDate = new Date(endDate);

    await story.save();

    res.status(200).json({
        success: true,
        message: 'تم تحديث الحالة/الإعلان بنجاح',
        story
    });
});

/**
 * حذف حالة/إعلان (للمشرف)
 */
exports.deleteStory = catchAsync(async (req, res, next) => {
    const story = await Story.findByIdAndDelete(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    res.status(200).json({
        success: true,
        message: 'تم حذف الحالة/الإعلان بنجاح'
    });
});

/**
 * إضافة إعجاب
 */
exports.likeStory = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    // الحصول على customer إذا كان موجود
    let customerId = null;
    if (req.user) {
        const customer = await Customer.findOne({ user: req.user.id });
        if (customer) customerId = customer._id;
    }

    await story.addLike(req.user?.id, customerId);

    res.status(200).json({
        success: true,
        message: 'تم إضافة الإعجاب',
        likesCount: story.likes.length
    });
});

/**
 * إزالة إعجاب
 */
exports.unlikeStory = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    // الحصول على customer إذا كان موجود
    let customerId = null;
    if (req.user) {
        const customer = await Customer.findOne({ user: req.user.id });
        if (customer) customerId = customer._id;
    }

    await story.removeLike(req.user?.id, customerId);

    res.status(200).json({
        success: true,
        message: 'تم إزالة الإعجاب',
        likesCount: story.likes.length
    });
});

/**
 * إضافة تعليق
 */
exports.addComment = catchAsync(async (req, res, next) => {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return next(new AppError('نص التعليق مطلوب', 400));
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    // الحصول على customer إذا كان موجود
    let customerId = null;
    if (req.user) {
        const customer = await Customer.findOne({ user: req.user.id });
        if (customer) customerId = customer._id;
    }

    await story.addComment(req.user?.id, customerId, text);

    // إعادة جلب القصة مع التعليقات المحدثة
    await story.populate('comments.user', 'username');
    await story.populate('comments.customer', 'profile.firstName profile.lastName');

    res.status(200).json({
        success: true,
        message: 'تم إضافة التعليق',
        comment: story.comments[story.comments.length - 1]
    });
});

/**
 * حذف تعليق (للمشرف أو صاحب التعليق)
 */
exports.deleteComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;

    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new AppError('الحالة/الإعلان غير موجود', 404));
    }

    const comment = story.comments.id(commentId);
    if (!comment) {
        return next(new AppError('التعليق غير موجود', 404));
    }

    // التحقق من الصلاحيات (المشرف أو صاحب التعليق)
    const isAdmin = req.user?.role === 'admin';
    const isCommentOwner = comment.user?.toString() === req.user?.id?.toString() ||
        comment.customer?.user?.toString() === req.user?.id?.toString();

    if (!isAdmin && !isCommentOwner) {
        return next(new AppError('ليس لديك صلاحية لحذف هذا التعليق', 403));
    }

    await story.removeComment(commentId);

    res.status(200).json({
        success: true,
        message: 'تم حذف التعليق'
    });
});

/**
 * الحصول على جميع الحالات/الإعلانات (للمشرف)
 */
exports.getAllStories = catchAsync(async (req, res, next) => {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const stories = await Story.find(query)
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Story.countDocuments(query);

    res.status(200).json({
        success: true,
        stories,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});










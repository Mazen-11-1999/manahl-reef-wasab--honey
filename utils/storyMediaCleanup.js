/**
 * حذف ملفات وسائط الحالات (صور/فيديو) من القرص أو التخزين السحابي فقط.
 * لا يُستدعى لصور المنتجات أو مسارات أخرى خارج uploads/stories والروابط المرتبطة بالحالات.
 */

const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const cloudStorage = require('../services/cloudStorage');

const STORIES_SUBPATH = '/uploads/stories/';

/**
 * مسار ملف محلي لوسائط حالة من رابط نسبي أو مطلق
 */
function resolveLocalStoryFile(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        let pathname = url;
        if (/^https?:\/\//i.test(url)) {
            pathname = new URL(url).pathname;
        }
        const lower = pathname.toLowerCase();
        if (!lower.includes('/uploads/stories/')) return null;
        const idx = pathname.indexOf(STORIES_SUBPATH);
        if (idx === -1) return null;
        const rel = pathname.slice(idx + 1);
        const full = path.resolve(path.join(__dirname, '..', rel));
        const normStories = path.resolve(path.join(__dirname, '..', 'uploads', 'stories'));
        const relToStories = path.relative(normStories, full);
        if (relToStories.startsWith('..') || path.isAbsolute(relToStories)) return null;
        return full;
    } catch {
        return null;
    }
}

/**
 * استخراج public_id من رابط Cloudinary
 */
function extractCloudinaryPublicId(urlStr) {
    try {
        const u = new URL(urlStr);
        const idx = u.pathname.indexOf('/upload/');
        if (idx === -1) return null;
        let rest = u.pathname.slice(idx + '/upload/'.length);
        const segments = rest.split('/').filter(Boolean);
        let i = 0;
        while (i < segments.length && segments[i].includes(',')) i++;
        if (i < segments.length && /^v\d+$/i.test(segments[i])) i++;
        const idPart = segments.slice(i).join('/');
        if (!idPart) return null;
        return idPart.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
}

/**
 * استخراج مفتاح S3 من الرابط (نمط bucket.s3.region.amazonaws.com/key)
 */
function extractS3Key(urlStr) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) return null;
    try {
        const u = new URL(urlStr);
        const host = u.hostname.toLowerCase();
        const pathname = decodeURIComponent(u.pathname.replace(/^\/+/, ''));

        if (host.startsWith(`${bucket.toLowerCase()}.s3`) || host === `${bucket.toLowerCase()}.s3.amazonaws.com`) {
            return pathname || null;
        }
        const parts = pathname.split('/').filter(Boolean);
        if (parts[0] === bucket) return parts.slice(1).join('/') || null;

        const cdnBase = (process.env.AWS_CDN_URL || '').replace(/\/$/, '');
        if (cdnBase && urlStr.startsWith(cdnBase)) {
            return decodeURIComponent(urlStr.slice(cdnBase.length + 1)) || null;
        }
    } catch {
        return null;
    }
    return null;
}

async function deleteCloudinaryMedia(url) {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) return;

    const ok = await cloudStorage.initCloudStorage();
    if (!ok || cloudStorage.cloudStorageConfig.provider !== 'cloudinary') return;

    const cloudinary = require('cloudinary').v2;
    const resourceType = url.includes('/video/upload/') ? 'video' : 'image';
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true
        });
        logger.info(`🗑️ Cloudinary: تم حذف وسيط الحالة ${publicId}`);
    } catch (err) {
        logger.warn(`تعذر حذف وسيط Cloudinary (${publicId}): ${err.message}`);
    }
}

async function deleteS3OrSdkMedia(url) {
    const key = extractS3Key(url);
    if (!key) return;

    const ok = await cloudStorage.initCloudStorage();
    if (!ok) return;

    try {
        await cloudStorage.deleteFile(key);
        logger.info(`🗑️ S3: تم حذف وسيط الحالة ${key}`);
    } catch (err) {
        logger.warn(`تعذر حذف وسيط S3 (${key}): ${err.message}`);
    }
}

/**
 * حذف ملف واحد من الرابط (محلي ثم سحابي إن وُجد)
 */
async function tryDeleteMediaUrl(url) {
    if (!url || typeof url !== 'string') return;

    const localPath = resolveLocalStoryFile(url);
    if (localPath) {
        try {
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                logger.info(`🗑️ محلي: تم حذف ${localPath}`);
            }
        } catch (err) {
            logger.warn(`تعذر حذف ملف محلي للحالة: ${err.message}`);
        }
        return;
    }

    if (!cloudStorage.cloudStorageConfig.enabled) return;

    if (url.includes('res.cloudinary.com')) {
        await deleteCloudinaryMedia(url);
        return;
    }

    if (url.includes('amazonaws.com') || url.includes('.s3.') || url.includes('cloudflarestorage.com')) {
        await deleteS3OrSdkMedia(url);
    }
}

/**
 * حذف وسائط حالة/إعلان (رئيسية + مصغّرة إن وُجدت)
 * @param {import('mongoose').Document | object} story
 */
async function removeStoryMediaFiles(story) {
    if (!story || !story.media) return;
    const urls = [story.media.url, story.media.thumbnail].filter(Boolean);
    for (const u of urls) {
        await tryDeleteMediaUrl(u);
    }
}

/**
 * حذف الحالات (type: story) المنتهية من قاعدة البيانات وملفاتها فقط.
 * لا يمس المنتجات أو مسارات أخرى.
 */
async function cleanupExpiredStories() {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return;

    const Story = require('../models/Story');
    const now = new Date();

    const expired = await Story.find({
        type: 'story',
        expiresAt: { $lt: now }
    })
        .limit(100)
        .lean(false);

    let removed = 0;
    for (const doc of expired) {
        try {
            await removeStoryMediaFiles(doc);
            await Story.findByIdAndDelete(doc._id);
            removed += 1;
        } catch (err) {
            logger.warn(`فشل تنظيف حالة منتهية ${doc._id}: ${err.message}`);
        }
    }

    if (removed > 0) {
        logger.info(`🧹 تنظيف الحالات المنتهية: حُذف ${removed} سجل ووسائطه`);
    }
}

module.exports = {
    removeStoryMediaFiles,
    cleanupExpiredStories,
    tryDeleteMediaUrl
};

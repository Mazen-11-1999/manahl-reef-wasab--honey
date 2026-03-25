/**
 * Image Processing Utility
 * معالجة وتحسين الصور مع الحفاظ على الجودة العالية
 */

const sharp = require('sharp');
const config = require('../config/env');
const logger = require('./logger');

// إعدادات معالجة الصور
const imageProcessingConfig = {
    enabled: process.env.IMAGE_PROCESSING_ENABLED === 'true',
    
    // إعدادات الجودة
    quality: {
        thumbnail: parseInt(process.env.THUMBNAIL_QUALITY) || 75,
        medium: parseInt(process.env.MEDIUM_QUALITY) || 85,
        large: parseInt(process.env.LARGE_QUALITY) || 90,
        original: parseInt(process.env.ORIGINAL_QUALITY) || 95
    },
    
    // إعدادات الأحجام
    sizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 },
        xlarge: { width: 1920, height: 1920 }
    },
    
    // إعدادات التنسيق
    format: process.env.IMAGE_OUTPUT_FORMAT || 'webp', // webp, jpg, png
    progressive: process.env.IMAGE_PROGRESSIVE === 'true',
    stripMetadata: process.env.IMAGE_STRIP_METADATA === 'true',
    
    // إعدادات الضغط
    compression: {
        enabled: process.env.IMAGE_COMPRESSION_ENABLED === 'true',
        level: parseInt(process.env.IMAGE_COMPRESSION_LEVEL) || 6
    },
    
    // إعدادات التحسين التلقائي
    autoOptimize: {
        enabled: process.env.IMAGE_AUTO_OPTIMIZE === 'true',
        maxFileSize: parseInt(process.env.IMAGE_AUTO_MAX_SIZE) || 2048, // KB
        resizeLargeImages: process.env.IMAGE_AUTO_RESIZE === 'true'
    }
};

/**
 * معالجة الصورة الأساسية
 */
const processImage = async (imageBuffer, options = {}) => {
    if (!imageProcessingConfig.enabled) {
        return { original: imageBuffer };
    }

    try {
        const metadata = await sharp(imageBuffer).metadata();
        const results = {};
        
        // الصورة الأصلية (محسنة)
        results.original = await processOriginal(imageBuffer, options);
        
        // إنشاء أحجام مختلفة
        if (options.createThumbnails !== false) {
            results.thumbnail = await createThumbnail(imageBuffer);
        }
        
        if (options.createSizes !== false) {
            results.small = await createSize(imageBuffer, 'small');
            results.medium = await createSize(imageBuffer, 'medium');
            results.large = await createSize(imageBuffer, 'large');
        }
        
        // معلومات المعالجة
        results.metadata = {
            original: metadata,
            processed: {
                format: imageProcessingConfig.format,
                quality: options.quality || imageProcessingConfig.quality.medium,
                sizes: Object.keys(results).filter(key => key !== 'metadata')
            }
        };
        
        logger.info(`📸 تمت معالجة الصورة: ${Object.keys(results).length} نسخة`);
        
        return results;
    } catch (error) {
        logger.error('❌ خطأ في معالجة الصورة:', error);
        throw error;
    }
};

/**
 * معالجة الصورة الأصلية
 */
const processOriginal = async (imageBuffer, options = {}) => {
    let image = sharp(imageBuffer);
    
    // الحصول على معلومات الصورة
    const metadata = await image.metadata();
    
    // تغيير الحجم إذا كان كبيراً جداً
    if (imageProcessingConfig.autoOptimize.resizeLargeImages) {
        const maxSize = 2048; // 2K resolution
        if (metadata.width > maxSize || metadata.height > maxSize) {
            image = image.resize(maxSize, maxSize, {
                fit: 'inside',
                withoutEnlargement: true
            });
            logger.info(`📏 تم تغيير حجم الصورة: ${metadata.width}x${metadata.height} -> ${maxSize}x${maxSize}`);
        }
    }
    
    // تطبيق التحسينات
    image = applyOptimizations(image, options.quality || imageProcessingConfig.quality.original);
    
    return await image.toBuffer();
};

/**
 * إنشاء صورة مصغرة
 */
const createThumbnail = async (imageBuffer) => {
    const size = imageProcessingConfig.sizes.thumbnail;
    
    let image = sharp(imageBuffer)
        .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
        });
    
    image = applyOptimizations(image, imageProcessingConfig.quality.thumbnail);
    
    return await image.toBuffer();
};

/**
 * إنشاء حجم معين
 */
const createSize = async (imageBuffer, sizeName) => {
    const size = imageProcessingConfig.sizes[sizeName];
    
    let image = sharp(imageBuffer)
        .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true
        });
    
    const quality = imageProcessingConfig.quality[sizeName] || imageProcessingConfig.quality.medium;
    image = applyOptimizations(image, quality);
    
    return await image.toBuffer();
};

/**
 * تطبيق التحسينات على الصورة
 */
const applyOptimizations = (image, quality) => {
    // إزالة البيانات الوصفية
    if (imageProcessingConfig.stripMetadata) {
        image = image.withMetadata(false);
    }
    
    // تطبيق التنسيق
    const format = imageProcessingConfig.format;
    
    if (format === 'webp') {
        image = image.webp({
            quality: quality,
            effort: imageProcessingConfig.compression.level,
            nearLossless: quality >= 90
        });
    } else if (format === 'jpg' || format === 'jpeg') {
        image = image.jpeg({
            quality: quality,
            progressive: imageProcessingConfig.progressive,
            trellisQuantisation: quality >= 85,
            overshootDeringing: quality >= 85,
            optimiseScans: quality >= 85
        });
    } else if (format === 'png') {
        image = image.png({
            compressionLevel: imageProcessingConfig.compression.level,
            progressive: imageProcessingConfig.progressive,
            adaptiveFiltering: quality >= 85
        });
    }
    
    return image;
};

/**
 * التحسين التلقائي للصورة
 */
const autoOptimizeImage = async (imageBuffer) => {
    if (!imageProcessingConfig.autoOptimize.enabled) {
        return imageBuffer;
    }
    
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const fileSizeKB = imageBuffer.length / 1024;
        
        // التحقق من حجم الملف
        if (fileSizeKB <= imageProcessingConfig.autoOptimize.maxFileSize) {
            logger.info(`📸 حجم الصورة مناسب (${fileSizeKB.toFixed(1)} KB) - لا حاجة للتحسين`);
            return imageBuffer;
        }
        
        // تحديد الجودة المثلى بناءً على الحجم
        let optimalQuality = imageProcessingConfig.quality.medium;
        
        if (fileSizeKB > 5000) { // > 5MB
            optimalQuality = imageProcessingConfig.quality.thumbnail;
        } else if (fileSizeKB > 2000) { // > 2MB
            optimalQuality = imageProcessingConfig.quality.small;
        } else if (fileSizeKB > 1000) { // > 1MB
            optimalQuality = imageProcessingConfig.quality.medium;
        } else {
            optimalQuality = imageProcessingConfig.quality.large;
        }
        
        logger.info(`🎯 تحديد الجودة المثلى: ${optimalQuality}% (حجم: ${fileSizeKB.toFixed(1)} KB)`);
        
        // معالجة الصورة بالجودة المثلى
        const processedImage = await processOriginal(imageBuffer, { quality: optimalQuality });
        
        const compressionRatio = ((imageBuffer.length - processedImage.length) / imageBuffer.length * 100).toFixed(1);
        logger.info(`📉 نسبة الضغط: ${compressionRatio}% (${imageBuffer.length} -> ${processedImage.length} bytes)`);
        
        return processedImage;
    } catch (error) {
        logger.error('❌ خطأ في التحسين التلقائي:', error);
        return imageBuffer;
    }
};

/**
 * الحصول على معلومات الصورة
 */
const getImageInfo = async (imageBuffer) => {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const stats = await sharp(imageBuffer).stats();
        
        return {
            format: metadata.format,
            size: {
                width: metadata.width,
                height: metadata.height
            },
            colorSpace: metadata.space,
            channels: metadata.channels,
            density: metadata.density,
            fileSize: imageBuffer.length,
            fileSizeKB: (imageBuffer.length / 1024).toFixed(2),
            hasAlpha: metadata.hasAlpha,
            isAnimated: metadata.pages > 1,
            stats: {
                mean: stats.mean,
                stddev: stats.stdev,
                min: stats.min,
                max: stats.max
            }
        };
    } catch (error) {
        logger.error('❌ خطأ في الحصول على معلومات الصورة:', error);
        throw error;
    }
};

/**
 * التحقق من جودة الصورة
 */
const analyzeImageQuality = async (imageBuffer) => {
    try {
        const info = await getImageInfo(imageBuffer);
        const analysis = {
            score: 0,
            issues: [],
            recommendations: []
        };
        
        // تحليل الحجم
        if (info.size.width < 800 || info.size.height < 800) {
            analysis.issues.push('دقة منخفضة');
            analysis.recommendations.push('استخدم صور بدقة 800x800 أو أعلى');
            analysis.score -= 20;
        }
        
        // تحليل حجم الملف
        if (info.fileSizeKB > 2000) {
            analysis.issues.push('حجم ملف كبير');
            analysis.recommendations.push('ضغط الصورة لتقليل الحجم');
            analysis.score -= 15;
        }
        
        // تحليل التنسيق
        if (info.format === 'png' && info.fileSizeKB > 500) {
            analysis.issues.push('PNG بحجم كبير');
            analysis.recommendations.push('استخدم WebP أو JPEG للصور الكبيرة');
            analysis.score -= 10;
        }
        
        // تحليل الألوان
        if (info.channels < 3) {
            analysis.issues.push('صورة غير ملونة');
            analysis.recommendations.push('استخدم صور ملونة');
            analysis.score -= 5;
        }
        
        // حساب النتيجة النهائية
        analysis.score = Math.max(0, Math.min(100, analysis.score + 50)); // base 50
        
        return analysis;
    } catch (error) {
        logger.error('❌ خطأ في تحليل جودة الصورة:', error);
        throw error;
    }
};

/**
 * إنشاء صورة WebP من أي تنسيق
 */
const convertToWebP = async (imageBuffer, quality = 85) => {
    try {
        const webpBuffer = await sharp(imageBuffer)
            .webp({
                quality: quality,
                effort: 6,
                nearLossless: quality >= 90
            })
            .toBuffer();
        
        return webpBuffer;
    } catch (error) {
        logger.error('❌ خطأ في تحويل الصورة إلى WebP:', error);
        throw error;
    }
};

/**
 * إضافة علامة مائية
 */
const addWatermark = async (imageBuffer, watermarkOptions = {}) => {
    try {
        const {
            text = 'مناحل ريف وصاب',
            position = 'bottom-right',
            opacity = 0.7,
            fontSize = 24,
            color = '#ffffff'
        } = watermarkOptions;
        
        // إنشاء صورة النص
        const textSvg = `
            <svg width="200" height="50">
                <text x="10" y="30" font-family="Arial" font-size="${fontSize}" fill="${color}" opacity="${opacity}">
                    ${text}
                </text>
            </svg>
        `;
        
        const watermarkBuffer = Buffer.from(textSvg);
        
        // إضافة العلامة المائية
        const result = await sharp(imageBuffer)
            .composite([{
                input: watermarkBuffer,
                gravity: position
            }])
            .toBuffer();
        
        return result;
    } catch (error) {
        logger.error('❌ خطأ في إضافة العلامة المائية:', error);
        throw error;
    }
};

module.exports = {
    imageProcessingConfig,
    processImage,
    processOriginal,
    createThumbnail,
    createSize,
    autoOptimizeImage,
    getImageInfo,
    analyzeImageQuality,
    convertToWebP,
    addWatermark
};

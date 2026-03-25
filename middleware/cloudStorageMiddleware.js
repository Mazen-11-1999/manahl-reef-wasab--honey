/**
 * Cloud Storage Middleware
 * Middleware للتعامل مع رفع الملفات للتخزين السحابي
 */

const cloudStorage = require('../services/cloudStorage');
const logger = require('../utils/logger');

/**
 * Middleware لرفع ملف واحد للتخزين السحابي
 */
const uploadSingleToCloud = (fieldName, options = {}) => {
    return async (req, res, next) => {
        try {
            // التحقق من وجود الملف
            if (!req.file) {
                return next();
            }

            // التحقق من تفعيل التخزين السحابي
            if (!cloudStorage.cloudStorageConfig.enabled) {
                // استخدام التخزين المحلي
                return next();
            }

            // رفع الملف للتخزين السحابي
            uploadToCloud(req.file, options)
                .then(result => {
                    // إضافة معلومات الملف للطلب
                    req.cloudFile = result;
                    
                    // حذف الملف المحلي
                    deleteLocalFile(req.file.path);
                    
                    next();
                })
                .catch(error => {
                    logger.error('Cloud Storage upload error:', error);
                    res.status(500).json({
                        success: false,
                        message: 'فشل رفع الملف للتخزين السحابي'
                    });
                });
        } catch (error) {
            logger.error('Cloud Storage middleware error:', error);
            next(error);
        }
    };
};

/**
 * Middleware لرفع ملفات متعددة للتخزين السحابي
 */
const uploadMultipleToCloud = (fieldName, maxCount = 5, options = {}) => {
    return async (req, res, next) => {
        try {
            // التحقق من وجود الملفات
            if (!req.files || !req.files[fieldName]) {
                return next();
            }

            const files = req.files[fieldName];
            
            // التحقق من عدد الملفات
            if (files.length > maxCount) {
                return res.status(400).json({
                    success: false,
                    message: `الحد الأقصى للملفات هو ${maxCount}`
                });
            }

            // التحقق من تفعيل التخزين السحابي
            if (!cloudStorage.cloudStorageConfig.enabled) {
                // استخدام التخزين المحلي
                return next();
            }

            // رفع الملفات للتخزين السحابي
            const uploadPromises = files.map(file => uploadToCloud(file, options));
            
            Promise.all(uploadPromises)
                .then(results => {
                    // إضافة معلومات الملفات للطلب
                    req.cloudFiles = results;
                    
                    // حذف الملفات المحلية
                    files.forEach(file => deleteLocalFile(file.path));
                    
                    next();
                })
                .catch(error => {
                    logger.error('Cloud Storage multiple upload error:', error);
                    res.status(500).json({
                        success: false,
                        message: 'فشل رفع الملفات للتخزين السحابي'
                    });
                });
        } catch (error) {
            logger.error('Cloud Storage multiple middleware error:', error);
            next(error);
        }
    };
};

/**
 * رفع ملف للتخزين السحابي
 */
const uploadToCloud = async (file, options = {}) => {
    try {
        const result = await cloudStorage.uploadFile(file, options);
        
        logger.info(`✅ تم رفع الملف للسحابة: ${result.key}`);
        
        return {
            ...result,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        };
    } catch (error) {
        logger.error('❌ خطأ في رفع الملف للسحابة:', error);
        throw error;
    }
};

/**
 * حذف ملف محلي
 */
const deleteLocalFile = (filePath) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`🗑️ تم حذف الملف المحلي: ${path.basename(filePath)}`);
        }
    } catch (error) {
        logger.error('❌ خطأ في حذف الملف المحلي:', error);
    }
};

/**
 * Middleware للتحقق من حجم الملف
 */
const checkFileSize = (maxSizeMB = 10) => {
    return (req, res, next) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        
        // التحقق من ملف واحد
        if (req.file) {
            if (req.file.size > maxSizeBytes) {
                return res.status(400).json({
                    success: false,
                    message: `حجم الملف كبير جداً. الحد الأقصى هو ${maxSizeMB} MB`
                });
            }
        }
        
        // التحقق من ملفات متعددة
        if (req.files) {
            for (const fieldName in req.files) {
                const files = req.files[fieldName];
                for (const file of files) {
                    if (file.size > maxSizeBytes) {
                        return res.status(400).json({
                            success: false,
                            message: `حجم الملف ${file.originalname} كبير جداً. الحد الأقصى هو ${maxSizeMB} MB`
                        });
                    }
                }
            }
        }
        
        next();
    };
};

/**
 * Middleware للتحقق من نوع الملف
 */
const checkFileType = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
    return (req, res, next) => {
        // التحقق من ملف واحد
        if (req.file) {
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'نوع الملف غير مسموح به'
                });
            }
        }
        
        // التحقق من ملفات متعددة
        if (req.files) {
            for (const fieldName in req.files) {
                const files = req.files[fieldName];
                for (const file of files) {
                    if (!allowedTypes.includes(file.mimetype)) {
                        return res.status(400).json({
                            success: false,
                            message: `نوع الملف ${file.originalname} غير مسموح به`
                        });
                    }
                }
            }
        }
        
        next();
    };
};

/**
 * Middleware لضغط الصور تلقائياً
 */
const autoOptimizeImages = (req, res, next) => {
    // إضافة معلومات الضغط للطلب
    req.imageOptimization = {
        enabled: cloudStorage.cloudStorageConfig.imageOptimization.enabled,
        quality: cloudStorage.cloudStorageConfig.imageOptimization.quality,
        format: cloudStorage.cloudStorageConfig.imageOptimization.format,
        autoOptimize: cloudStorage.cloudStorageConfig.imageOptimization.autoOptimize
    };
    
    next();
};

/**
 * Middleware لإضافة رابط CDN
 */
const addCdnUrl = (req, res, next) => {
    if (cloudStorage.cloudStorageConfig.cdn.enabled) {
        req.cdnUrl = cloudStorage.cloudStorageConfig.cdn.url;
    }
    
    next();
};

/**
 * Middleware للتحقق من صحة التخزين السحابي
 */
const checkCloudStorageHealth = async (req, res, next) => {
    try {
        const health = await cloudStorage.checkCloudStorageHealth();
        
        if (!health.healthy) {
            logger.error('❌ Cloud Storage غير صحي:', health.message);
            
            // في حالة عدم صحة التخزين السحابي، نستخدم التخزين المحلي
            req.useLocalStorage = true;
        }
        
        req.cloudStorageHealth = health;
        next();
    } catch (error) {
        logger.error('❌ خطأ في فحص صحة التخزين السحابي:', error);
        req.useLocalStorage = true;
        next();
    }
};

module.exports = {
    uploadSingleToCloud,
    uploadMultipleToCloud,
    checkFileSize,
    checkFileType,
    autoOptimizeImages,
    addCdnUrl,
    checkCloudStorageHealth
};

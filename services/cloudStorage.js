/**
 * Cloud Storage Service
 * خدمة التخزين السحابي - AWS S3, Google Cloud Storage, Cloudinary
 */

const config = require('../config/env');
const logger = require('../utils/logger');

// إعدادات التخزين السحابي
const cloudStorageConfig = {
    enabled: process.env.CLOUD_STORAGE_ENABLED === 'true',
    provider: process.env.CLOUD_STORAGE_PROVIDER || 'aws-s3', // aws-s3, google-cloud, cloudinary
    
    // AWS S3 Configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || 'manahl-badr-storage',
        cdnUrl: process.env.AWS_CDN_URL || `https://${process.env.AWS_S3_BUCKET || 'manahl-badr-storage'}.s3.amazonaws.com`
    },

    // Google Cloud Storage Configuration
    google: {
        projectId: process.env.GOOGLE_PROJECT_ID,
        keyFilename: process.env.GOOGLE_KEY_FILE,
        bucket: process.env.GOOGLE_BUCKET || 'manahl-badr-storage',
        cdnUrl: process.env.GOOGLE_CDN_URL
    },

    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'manahl-badr'
    },

    // Image Optimization Settings
    imageOptimization: {
        enabled: process.env.IMAGE_OPTIMIZATION_ENABLED === 'true',
        quality: parseInt(process.env.IMAGE_QUALITY) || 85,
        format: process.env.IMAGE_FORMAT || 'webp', // webp, jpg, png
        autoOptimize: process.env.IMAGE_AUTO_OPTIMIZE === 'true',
        compressionLevel: parseInt(process.env.IMAGE_COMPRESSION_LEVEL) || 6,
        progressive: process.env.IMAGE_PROGRESSIVE === 'true',
        stripMetadata: process.env.IMAGE_STRIP_METADATA === 'true'
    },

    // CDN Settings
    cdn: {
        enabled: process.env.CDN_ENABLED === 'true',
        url: process.env.CDN_URL,
        cacheControl: process.env.CDN_CACHE_CONTROL || 'public, max-age=31536000', // 1 year
        gzip: process.env.CDN_GZIP === 'true',
        brotli: process.env.CDN_BROTLI === 'true'
    }
};

let cloudStorageProvider = null;

/**
 * تهيئة مزود التخزين السحابي
 */
const initCloudStorage = async () => {
    if (!cloudStorageConfig.enabled) {
        logger.info('🔄 Cloud Storage غير مفعّل - استخدام التخزين المحلي');
        return false;
    }

    try {
        switch (cloudStorageConfig.provider) {
            case 'aws-s3':
                await initAWS();
                break;
            case 'google-cloud':
                await initGoogleCloud();
                break;
            case 'cloudinary':
                await initCloudinary();
                break;
            default:
                throw new Error(`مزود التخزين غير مدعوم: ${cloudStorageConfig.provider}`);
        }

        logger.info(`✅ تم تهيئة ${cloudStorageConfig.provider} بنجاح`);
        return true;
    } catch (error) {
        logger.error('❌ فشل تهيئة Cloud Storage:', error);
        return false;
    }
};

/**
 * تهيئة AWS S3
 */
const initAWS = async () => {
    const AWS = require('aws-sdk');
    
    AWS.config.update({
        accessKeyId: cloudStorageConfig.aws.accessKeyId,
        secretAccessKey: cloudStorageConfig.aws.secretAccessKey,
        region: cloudStorageConfig.aws.region
    });

    cloudStorageProvider = {
        upload: async (file, options = {}) => {
            const s3 = new AWS.S3();
            
            // ضغط الصور تلقائياً
            let optimizedBuffer = file.buffer;
            if (cloudStorageConfig.imageOptimization.enabled && file.mimetype.startsWith('image/')) {
                optimizedBuffer = await optimizeImage(file.buffer, file.mimetype);
            }

            const params = {
                Bucket: cloudStorageConfig.aws.bucket,
                Key: options.key || generateUniqueFileName(file.originalname),
                Body: optimizedBuffer,
                ContentType: file.mimetype,
                CacheControl: cloudStorageConfig.cdn.cacheControl,
                ACL: 'public-read'
            };

            const result = await s3.upload(params).promise();
            return {
                url: `${cloudStorageConfig.aws.cdnUrl}/${result.Key}`,
                key: result.Key,
                size: optimizedBuffer.length
            };
        },

        delete: async (key) => {
            const s3 = new AWS.S3();
            await s3.deleteObject({
                Bucket: cloudStorageConfig.aws.bucket,
                Key: key
            }).promise();
            return true;
        },

        getUrl: (key) => {
            return `${cloudStorageConfig.aws.cdnUrl}/${key}`;
        }
    };
};

/**
 * تهيئة Google Cloud Storage
 */
const initGoogleCloud = async () => {
    const { Storage } = require('@google-cloud/storage');
    
    const storage = new Storage({
        projectId: cloudStorageConfig.google.projectId,
        keyFilename: cloudStorageConfig.google.keyFilename
    });

    const bucket = storage.bucket(cloudStorageConfig.google.bucket);

    cloudStorageProvider = {
        upload: async (file, options = {}) => {
            // ضغط الصور تلقائياً
            let optimizedBuffer = file.buffer;
            if (cloudStorageConfig.imageOptimization.enabled && file.mimetype.startsWith('image/')) {
                optimizedBuffer = await optimizeImage(file.buffer, file.mimetype);
            }

            const key = options.key || generateUniqueFileName(file.originalname);
            const blob = bucket.file(key);

            await blob.save(optimizedBuffer, {
                metadata: {
                    contentType: file.mimetype,
                    cacheControl: cloudStorageConfig.cdn.cacheControl
                },
                public: true
            });

            return {
                url: `${cloudStorageConfig.google.cdnUrl || `https://storage.googleapis.com/${cloudStorageConfig.google.bucket}`}/${key}`,
                key: key,
                size: optimizedBuffer.length
            };
        },

        delete: async (key) => {
            await bucket.file(key).delete();
            return true;
        },

        getUrl: (key) => {
            return `${cloudStorageConfig.google.cdnUrl || `https://storage.googleapis.com/${cloudStorageConfig.google.bucket}`}/${key}`;
        }
    };
};

/**
 * تهيئة Cloudinary
 */
const initCloudinary = async () => {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
        cloud_name: cloudStorageConfig.cloudinary.cloudName,
        api_key: cloudStorageConfig.cloudinary.apiKey,
        api_secret: cloudStorageConfig.cloudinary.apiSecret
    });

    cloudStorageProvider = {
        upload: async (file, options = {}) => {
            const uploadOptions = {
                folder: cloudStorageConfig.cloudinary.folder,
                resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
                format: cloudStorageConfig.imageOptimization.format,
                quality: cloudStorageConfig.imageOptimization.quality,
                fetch_format: cloudStorageConfig.imageOptimization.format,
                flags: cloudStorageConfig.imageOptimization.progressive ? 'progressive' : undefined,
                use_filename: true,
                unique_filename: true,
                overwrite: false
            };

            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(file.buffer);
            });

            return {
                url: result.secure_url,
                key: result.public_id,
                size: result.bytes
            };
        },

        delete: async (key) => {
            await cloudinary.uploader.destroy(key);
            return true;
        },

        getUrl: (key) => {
            return cloudinary.url(key, {
                secure: true,
                format: cloudStorageConfig.imageOptimization.format,
                quality: cloudStorageConfig.imageOptimization.quality
            });
        }
    };
};

/**
 * ضغط الصور تلقائياً
 */
const optimizeImage = async (buffer, mimetype) => {
    if (!cloudStorageConfig.imageOptimization.enabled) {
        return buffer;
    }

    try {
        const sharp = require('sharp');
        let image = sharp(buffer);

        // تحديد التنسيق
        const format = cloudStorageConfig.imageOptimization.format;
        
        // تطبيق الضغط
        if (format === 'webp') {
            image = image.webp({
                quality: cloudStorageConfig.imageOptimization.quality,
                effort: cloudStorageConfig.imageOptimization.compressionLevel
            });
        } else if (format === 'jpg' || format === 'jpeg') {
            image = image.jpeg({
                quality: cloudStorageConfig.imageOptimization.quality,
                progressive: cloudStorageConfig.imageOptimization.progressive
            });
        } else if (format === 'png') {
            image = image.png({
                compressionLevel: cloudStorageConfig.imageOptimization.compressionLevel,
                progressive: cloudStorageConfig.imageOptimization.progressive
            });
        }

        // إزالة البيانات الوصفية
        if (cloudStorageConfig.imageOptimization.stripMetadata) {
            image = image.withMetadata(false);
        }

        // تغيير الحجم إذا كان كبيراً جداً
        const metadata = await sharp(buffer).metadata();
        if (metadata.width > 2048 || metadata.height > 2048) {
            image = image.resize(2048, 2048, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        const optimizedBuffer = await image.toBuffer();
        
        logger.info(`📸 تم ضغط الصورة: ${buffer.length} -> ${optimizedBuffer.length} bytes (${((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1)}% توفير)`);
        
        return optimizedBuffer;
    } catch (error) {
        logger.error('❌ خطأ في ضغط الصورة:', error);
        return buffer; // إرجاع الصورة الأصلية في حالة الخطأ
    }
};

/**
 * إنشاء اسم فريد للملف
 */
const generateUniqueFileName = (originalName) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = originalName.split('.').pop();
    return `${timestamp}-${random}.${ext}`;
};

/**
 * رفع ملف للتخزين السحابي
 */
const uploadFile = async (file, options = {}) => {
    if (!cloudStorageProvider) {
        throw new Error('Cloud Storage غير مهيأ');
    }

    try {
        const result = await cloudStorageProvider.upload(file, options);
        logger.info(`✅ تم رفع الملف: ${result.key} (${(result.size / 1024).toFixed(2)} KB)`);
        return result;
    } catch (error) {
        logger.error('❌ خطأ في رفع الملف:', error);
        throw error;
    }
};

/**
 * حذف ملف من التخزين السحابي
 */
const deleteFile = async (key) => {
    if (!cloudStorageProvider) {
        throw new Error('Cloud Storage غير مهيأ');
    }

    try {
        await cloudStorageProvider.delete(key);
        logger.info(`✅ تم حذف الملف: ${key}`);
        return true;
    } catch (error) {
        logger.error('❌ خطأ في حذف الملف:', error);
        throw error;
    }
};

/**
 * الحصول على رابط الملف
 */
const getFileUrl = (key) => {
    if (!cloudStorageProvider) {
        throw new Error('Cloud Storage غير مهيأ');
    }

    return cloudStorageProvider.getUrl(key);
};

/**
 * التحقق من صحة التخزين السحابي
 */
const checkCloudStorageHealth = async () => {
    if (!cloudStorageProvider) {
        return { healthy: false, message: 'Cloud Storage غير مهيأ' };
    }

    try {
        // محاولة رفع ملف اختبار
        const testBuffer = Buffer.from('test');
        const testFile = {
            buffer: testBuffer,
            originalname: 'health-check.txt',
            mimetype: 'text/plain'
        };

        const result = await uploadFile(testFile, { key: 'health-check.txt' });
        await deleteFile('health-check.txt');

        return {
            healthy: true,
            provider: cloudStorageConfig.provider,
            message: 'Cloud Storage يعمل بشكل صحيح'
        };
    } catch (error) {
        logger.error('❌ Cloud Storage health check failed:', error);
        return {
            healthy: false,
            provider: cloudStorageConfig.provider,
            error: error.message
        };
    }
};

/**
 * الحصول على إحصائيات التخزين
 */
const getStorageStats = async () => {
    if (!cloudStorageProvider) {
        return { enabled: false };
    }

    try {
        // هذه الإحصائيات تعتمد على المزود
        const stats = {
            enabled: true,
            provider: cloudStorageConfig.provider,
            optimization: cloudStorageConfig.imageOptimization.enabled,
            cdn: cloudStorageConfig.cdn.enabled
        };

        // يمكن إضافة المزيد من الإحصائيات حسب المزود
        return stats;
    } catch (error) {
        logger.error('❌ خطأ في الحصول على إحصائيات التخزين:', error);
        return { enabled: false, error: error.message };
    }
};

// تهيئة Cloud Storage عند تحميل الوحدة
if (cloudStorageConfig.enabled) {
    initCloudStorage().catch(error => {
        logger.error('❌ فشل تهيئة Cloud Storage عند التحميل:', error);
    });
}

module.exports = {
    cloudStorageConfig,
    initCloudStorage,
    uploadFile,
    deleteFile,
    getFileUrl,
    checkCloudStorageHealth,
    getStorageStats,
    optimizeImage
};

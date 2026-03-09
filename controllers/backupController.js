/**
 * Backup Controller
 * Controller لإدارة النسخ الاحتياطية
 */

const backup = require('../utils/backup');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * إنشاء نسخة احتياطية لقاعدة البيانات
 */
exports.createDatabaseBackup = catchAsync(async (req, res, next) => {
    const result = await backup.backupDatabase();
    
    res.status(200).json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية لقاعدة البيانات بنجاح',
        backup: result
    });
});

/**
 * إنشاء نسخة احتياطية للملفات
 */
exports.createFilesBackup = catchAsync(async (req, res, next) => {
    const result = await backup.backupFiles();
    
    res.status(200).json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية للملفات بنجاح',
        backup: result
    });
});

/**
 * إنشاء نسخة احتياطية كاملة
 */
exports.createFullBackup = catchAsync(async (req, res, next) => {
    const result = await backup.backupAll();
    
    res.status(200).json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية الكاملة بنجاح',
        backup: result
    });
});

/**
 * قائمة النسخ الاحتياطية
 */
exports.listBackups = catchAsync(async (req, res, next) => {
    const { type = 'all' } = req.query;
    
    const backups = backup.listBackups(type);
    
    res.status(200).json({
        success: true,
        backups
    });
});

/**
 * استعادة قاعدة البيانات
 */
exports.restoreDatabase = catchAsync(async (req, res, next) => {
    const { filename } = req.body;
    
    if (!filename) {
        return next(new AppError('اسم ملف النسخة الاحتياطية مطلوب', 400));
    }
    
    const result = await backup.restoreDatabase(filename);
    
    res.status(200).json({
        success: true,
        message: 'تم استعادة قاعدة البيانات بنجاح',
        result
    });
});

/**
 * إحصائيات النسخ الاحتياطية
 */
exports.getBackupStats = catchAsync(async (req, res, next) => {
    const stats = backup.getBackupStats();
    
    res.status(200).json({
        success: true,
        stats
    });
});

/**
 * تحميل ملف نسخة احتياطية
 * type: database | files
 */
exports.downloadBackup = catchAsync(async (req, res, next) => {
    const path = require('path');
    const { type, filename } = req.params;
    if (!['database', 'files'].includes(type)) {
        return next(new AppError('نوع غير صالح', 400));
    }
    // منع path traversal
    if (!filename || filename.includes('..') || !filename.endsWith('.tar.gz')) {
        return next(new AppError('اسم الملف غير صالح', 400));
    }
    const dir = type === 'database' ? backup.DB_BACKUP_DIR : backup.FILES_BACKUP_DIR;
    const filePath = path.join(dir, filename);
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
        return next(new AppError('الملف غير موجود', 404));
    }
    res.download(filePath, filename, (err) => {
        if (err) next(err);
    });
});





















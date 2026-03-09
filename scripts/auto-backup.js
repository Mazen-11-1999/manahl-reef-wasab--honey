/**
 * Auto Backup Script
 * Script للنسخ الاحتياطي التلقائي
 * يمكن تشغيله كـ cron job
 */

require('dotenv').config();
const backup = require('../utils/backup');
const logger = require('../utils/logger');

/**
 * النسخ الاحتياطي التلقائي
 */
const runAutoBackup = async () => {
    try {
        logger.info('🔄 Starting automatic backup...');
        
        // النسخ الاحتياطي الكامل
        const result = await backup.backupAll();
        
        logger.info('✅ Automatic backup completed successfully');
        logger.info(`📦 Database backup: ${result.database.filename} (${result.database.sizeMB} MB)`);
        logger.info(`📦 Files backup: ${result.files.filename} (${result.files.sizeMB} MB)`);
        
        process.exit(0);
    } catch (error) {
        logger.error('❌ Automatic backup failed:', error);
        process.exit(1);
    }
};

// تشغيل النسخ الاحتياطي
if (require.main === module) {
    runAutoBackup();
}

module.exports = { runAutoBackup };





















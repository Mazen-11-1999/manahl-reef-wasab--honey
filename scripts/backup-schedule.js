/**
 * Backup Scheduler
 * جدولة النسخ الاحتياطي التلقائي
 */

const cron = require('node-cron');
const backup = require('../utils/backup');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * جدولة النسخ الاحتياطي
 */
const scheduleBackups = () => {
    // نسخة احتياطية يومية لقاعدة البيانات في الساعة 2 صباحاً
    cron.schedule('0 2 * * *', async () => {
        logger.info('🔄 Scheduled daily database backup starting...');
        try {
            await backup.backupDatabase();
            logger.info('✅ Scheduled database backup completed');
        } catch (error) {
            logger.error('❌ Scheduled database backup failed:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Riyadh"
    });

    // نسخة احتياطية أسبوعية كاملة يوم الأحد في الساعة 3 صباحاً
    cron.schedule('0 3 * * 0', async () => {
        logger.info('🔄 Scheduled weekly full backup starting...');
        try {
            await backup.backupAll();
            logger.info('✅ Scheduled weekly backup completed');
        } catch (error) {
            logger.error('❌ Scheduled weekly backup failed:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Riyadh"
    });

    logger.info('✅ Backup scheduler initialized');
    logger.info('📅 Daily database backup: 2:00 AM');
    logger.info('📅 Weekly full backup: Sunday 3:00 AM');
};

module.exports = { scheduleBackups };





















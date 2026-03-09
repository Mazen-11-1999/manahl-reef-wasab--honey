/**
 * Backup Routes
 * Routes لإدارة النسخ الاحتياطية
 */

const express = require('express');
const backupController = require('../controllers/backupController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// جميع الـ routes تتطلب مصادقة و صلاحيات المشرف
router.use(authenticateToken);
router.use(requireAdmin);

// Validation
const restoreValidation = [
    body('filename')
        .trim()
        .notEmpty()
        .withMessage('اسم ملف النسخة الاحتياطية مطلوب')
];

// Routes
router.post('/database', backupController.createDatabaseBackup);
router.post('/files', backupController.createFilesBackup);
router.post('/full', backupController.createFullBackup);
router.get('/list', 
    query('type').optional().isIn(['all', 'database', 'files']),
    validate,
    backupController.listBackups
);
router.post('/restore', restoreValidation, validate, backupController.restoreDatabase);
router.get('/stats', backupController.getBackupStats);
router.get('/download/:type/:filename', backupController.downloadBackup);

module.exports = router;





















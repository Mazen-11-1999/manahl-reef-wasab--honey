/**
 * Site Banner Routes
 * مسارات الشريط العلوي
 */

const express = require('express');
const siteBannerController = require('../controllers/siteBannerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// عرض عام — بدون مصادقة (للصفحة الرئيسية والزوار)
router.get('/public', siteBannerController.getPublic);

// إدارة من لوحة التحكم — تتطلب مصادقة مشرف
router.get('/', authenticateToken, requireAdmin, siteBannerController.get);
router.put('/', authenticateToken, requireAdmin, siteBannerController.update);

module.exports = router;

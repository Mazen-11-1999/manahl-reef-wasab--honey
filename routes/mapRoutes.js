/**
 * Map Routes
 * Routes لجلب بيانات الخريطة
 */

const express = require('express');
const mapController = require('../controllers/mapController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin route only
router.get('/',
    authenticateToken,
    requireAdmin,
    mapController.getMapData
);

module.exports = router;








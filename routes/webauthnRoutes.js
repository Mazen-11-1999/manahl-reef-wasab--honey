/**
 * WebAuthn Routes
 * Routes للمصادقة بالبصمة
 */

const express = require('express');
const webauthnController = require('../controllers/webauthnController');

const router = express.Router();

// Routes
router.post('/register/start', webauthnController.startRegistration);
router.post('/register/complete', webauthnController.completeRegistration);
router.post('/authenticate/start', webauthnController.startAuthentication);
router.post('/authenticate/complete', webauthnController.completeAuthentication);
router.get('/credentials', webauthnController.getCredentials);
router.delete('/credentials/:credentialId', webauthnController.deleteCredential);

module.exports = router;









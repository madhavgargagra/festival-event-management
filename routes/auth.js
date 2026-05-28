// Authentication routes definition
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation, registerValidation } = require('../middleware/validators');
const auth = require('../middleware/auth');

// 1. Post request endpoints for Authentication
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);

// 2. Profile endpoints requiring valid authentication tokens
router.get('/profile', auth, authController.getProfile);
router.get('/logout', authController.logout);

module.exports = router;

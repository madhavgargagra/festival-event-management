// Allocations routes definition
const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Get allocations list (internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), allocationController.getAllocations);

// 2. Create allocation (allowed for Admin & Organizer roles)
router.post('/', auth, roleCheck('Admin', 'Organizer'), allocationController.createAllocation);

module.exports = router;

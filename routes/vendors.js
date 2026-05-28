// Vendors routes definition
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// 1. Get list of vendors (internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), vendorController.getVendors);

// 2. Upload compliance documents (self-service for Vendor role)
router.post('/profile/compliance', auth, roleCheck('Vendor'), upload.single('compliance'), vendorController.uploadComplianceDocs);

// 3. Verify compliance status (restricted to Admin role only)
router.put('/:id/verify', auth, roleCheck('Admin'), vendorController.verifyVendorCompliance);

// 4. Leave evaluation review score rating (restricted to Admin & Organizer roles)
router.put('/:id/evaluate', auth, roleCheck('Admin', 'Organizer'), vendorController.evaluateVendorPerformance);

module.exports = router;

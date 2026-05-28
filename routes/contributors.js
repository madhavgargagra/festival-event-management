// Contributors routes definition
const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// 1. Fetch contributors list (restricted to internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), contributorController.getContributors);

// 2. Fetch contributions (self-filtered for Contributor, full list for Admin/Finance/Organizer)
router.get('/contributions', auth, contributorController.getContributions);

// 3. Post contribution with optional file receipt attachment
router.post('/contributions', auth, roleCheck('Admin', 'Contributor'), upload.single('attachment'), contributorController.createContribution);

module.exports = router;

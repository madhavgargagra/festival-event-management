// Festivals routes definition
const express = require('express');
const router = express.Router();
const festivalController = require('../controllers/festivalController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Read access allowed for all authenticated roles
router.get('/', auth, festivalController.getFestivals);

// 2. Write access restricted to Admin role only
router.post('/', auth, roleCheck('Admin'), festivalController.createFestival);
router.put('/:id', auth, roleCheck('Admin'), festivalController.updateFestival);
router.delete('/:id', auth, roleCheck('Admin'), festivalController.deleteFestival);

module.exports = router;

// Organizers routes definition
const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Fetch organizers list (internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), organizerController.getOrganizers);

// 2. Assign organizer role history mapping (restricted to Admin role)
router.post('/assign-festival', auth, roleCheck('Admin'), organizerController.assignOrganizerToFestival);

// 3. Edit organizer department and role status (restricted to Admin role)
router.put('/:id', auth, roleCheck('Admin'), organizerController.updateOrganizerInfo);

module.exports = router;

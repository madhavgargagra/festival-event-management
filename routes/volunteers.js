// Volunteers routes definition
const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// 1. Fetch volunteers directory (internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), volunteerController.getVolunteers);

// 2. Fetch shift assignments (self-filtered for Volunteer, full list for management)
router.get('/assignments', auth, volunteerController.getVolunteerAssignments);

// 3. Dispatch volunteer assignment to event (restricted to Admin & Organizer)
router.post('/assignments', auth, roleCheck('Admin', 'Organizer'), volunteerController.assignVolunteer);

// 4. Update certification/availability schedule (self-service for Volunteer)
router.post('/profile/certifications', auth, roleCheck('Volunteer'), upload.single('certification'), volunteerController.uploadCertificates);

// 5. Update background check status & feedback score rating (restricted to Admin role)
router.put('/:id/background', auth, roleCheck('Admin'), volunteerController.updateBackgroundStatus);

module.exports = router;

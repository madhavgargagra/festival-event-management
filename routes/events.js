// Events routes definition
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Read endpoints (any authenticated user can view)
router.get('/', auth, eventController.getEvents);

// 2. Write endpoints (restricted to Admin & Organizer roles)
router.post('/', auth, roleCheck('Admin', 'Organizer'), eventController.createEvent);
router.put('/:id', auth, roleCheck('Admin', 'Organizer'), eventController.updateEvent);

// 3. Delete event endpoint (restricted to Admin role only)
router.delete('/:id', auth, roleCheck('Admin'), eventController.deleteEvent);

module.exports = router;

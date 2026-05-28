// Expenses routes definition
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// 1. Get all expenses list (internal management)
router.get('/', auth, roleCheck('Admin', 'Organizer', 'Finance'), expenseController.getExpenses);

// 2. Submit new expense (Organizer, Finance, Admin can write with invoice attachment)
router.post('/', auth, roleCheck('Admin', 'Finance', 'Organizer'), upload.single('invoice'), expenseController.createExpense);

// 3. Edit expense or update approvals status / payments
router.put('/:id', auth, roleCheck('Admin', 'Finance', 'Organizer'), upload.single('invoice'), expenseController.updateExpense);

module.exports = router;

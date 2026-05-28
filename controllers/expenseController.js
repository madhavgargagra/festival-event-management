// Controller managing Expenses and business approval rules
const { Expense, Event, Vendor, Organizer } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all expenses with related Event and Vendor details
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      include: [
        { model: Event, attributes: ['name'] },
        { model: Vendor, attributes: ['name', 'compliance_status'] },
        { model: Organizer, as: 'Approver', attributes: ['name'] },
        { model: Organizer, as: 'Recommender', attributes: ['name'] }
      ]
    });
    return res.status(200).json({ success: true, expenses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Create new expense (checking compliance of vendor)
const createExpense = async (req, res) => {
  const { event_id, vendor_id, description, expense_type, amount, expense_date } = req.body;

  try {
    // Validation: Expense must belong to a valid Event
    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Parent Event not found.' });
    }

    // Validation: Vendors with compliance status = "Flagged" cannot be assigned new expenses
    if (vendor_id) {
      const vendor = await Vendor.findByPk(vendor_id);
      if (vendor && vendor.compliance_status === 'Flagged') {
        return res.status(400).json({
          success: false,
          message: 'Cannot create expense: Selected vendor compliance is FLAGGED.'
        });
      }
    }

    const invoice_path = req.file ? `/uploads/invoices/${req.file.filename}` : null;

    const newExpense = await Expense.create({
      event_id,
      vendor_id: vendor_id || null,
      description,
      expense_type,
      amount,
      expense_date,
      invoice_path,
      payment_status: 'Pending',
      approval_status: 'Pending'
    });

    await logAudit('Expense', newExpense.expense_id, 'CREATE', req, null, newExpense);

    return res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Update expense details (enforcing lock constraints and invoice-for-payment checks)
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { payment_status, approval_status, description, amount, expense_type, expense_date, vendor_id } = req.body;

  try {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    // Business Rule: Approved expenses cannot be edited, only viewed
    const isApproved = expense.approval_status === 'Approved';
    const isAttemptingCoreEdit = description || amount || expense_type || expense_date || vendor_id;
    if (isApproved && isAttemptingCoreEdit) {
      return res.status(400).json({
        success: false,
        message: 'Approved expenses are locked and cannot be edited.'
      });
    }

    // Business Rule: Vendor expenses cannot be marked as paid until invoice uploaded
    const uploadedFile = req.file ? `/uploads/invoices/${req.file.filename}` : null;
    const finalInvoicePath = uploadedFile || expense.invoice_path;

    if (payment_status === 'Paid' && !finalInvoicePath) {
      return res.status(400).json({
        success: false,
        message: 'Expense cannot be marked as PAID without uploading a invoice file.'
      });
    }

    const oldVal = { ...expense.toJSON() };

    const updateData = {};
    if (payment_status) updateData.payment_status = payment_status;
    if (uploadedFile) updateData.invoice_path = uploadedFile;

    // Apply other updates only if the expense is not yet approved
    if (!isApproved) {
      if (description) updateData.description = description;
      if (amount) updateData.amount = amount;
      if (expense_type) updateData.expense_type = expense_type;
      if (expense_date) updateData.expense_date = expense_date;
      if (vendor_id) {
        const vendor = await Vendor.findByPk(vendor_id);
        if (vendor && vendor.compliance_status === 'Flagged') {
          return res.status(400).json({ success: false, message: 'Cannot set vendor: Vendor compliance is FLAGGED.' });
        }
        updateData.vendor_id = vendor_id;
      }
    }

    // Two-level approval logic (Organizer Recommends -> Admin/Finance Approves)
    if (approval_status) {
      if (approval_status === 'Recommended') {
        if (req.user.role !== 'Organizer' && req.user.role !== 'Admin') {
          return res.status(403).json({ success: false, message: 'Only Organizers or Admins can recommend expenses.' });
        }
        updateData.approval_status = 'Recommended';
        updateData.recommended_by = req.user.id;
      } else if (approval_status === 'Approved') {
        if (req.user.role !== 'Finance' && req.user.role !== 'Admin') {
          return res.status(403).json({ success: false, message: 'Only Finance or Admins can approve expenses.' });
        }
        updateData.approval_status = 'Approved';
        updateData.approved_by = req.user.id;
      } else if (approval_status === 'Rejected') {
        updateData.approval_status = 'Rejected';
      }
    }

    await expense.update(updateData);
    await logAudit('Expense', expense.expense_id, 'UPDATE', req, oldVal, expense);

    return res.status(200).json({ success: true, expense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense
};

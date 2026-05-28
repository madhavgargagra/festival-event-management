// Controller managing Contribution Allocations, validation rules, and ACID transaction boundaries
const { ContributionAllocation, Contribution, Event, sequelize } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch allocations with contributions and events
const getAllocations = async (req, res) => {
  try {
    const allocations = await ContributionAllocation.findAll({
      include: [
        { model: Contribution, attributes: ['contribution_id', 'amount', 'contribution_type'] },
        { model: Event, attributes: ['event_id', 'name'] }
      ]
    });
    return res.status(200).json({ success: true, allocations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Allocate a contribution to an event with ACID transaction limit checks
const createAllocation = async (req, res) => {
  const { contribution_id, event_id, allocated_item, allocated_amount } = req.body;

  // Initialize atomic transaction
  const transaction = await sequelize.transaction();

  try {
    // Check if the contribution exists and is Cash
    const contribution = await Contribution.findByPk(contribution_id, { transaction });
    if (!contribution) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Contribution source not found.' });
    }

    const event = await Event.findByPk(event_id, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Destination Event not found.' });
    }

    let status = 'Allocated';

    if (contribution.contribution_type === 'Cash') {
      // Calculate already allocated amount for this contribution inside the transaction
      const existingAllocations = await ContributionAllocation.findAll({
        where: { contribution_id },
        transaction
      });
      
      const totalAllocated = existingAllocations.reduce((sum, alloc) => {
        return sum + parseFloat(alloc.allocated_amount || 0);
      }, 0);

      const availableAmount = parseFloat(contribution.amount) - totalAllocated;

      // Business Rule: Allocation exceeding limit => allocation status = Pending_Review
      if (parseFloat(allocated_amount) > availableAmount) {
        status = 'Pending_Review';
      }
    }

    const newAllocation = await ContributionAllocation.create({
      contribution_id,
      event_id,
      allocated_item: allocated_item || 'Cash Funding',
      allocated_amount: allocated_amount || 0.00,
      allocation_date: new Date().toISOString().split('T')[0],
      status
    }, { transaction });

    await logAudit('ContributionAllocation', newAllocation.allocation_id, 'CREATE', req, null, newAllocation);

    // Commit changes to the database
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: status === 'Pending_Review' 
        ? 'Allocation created but flagged as PENDING REVIEW (Exceeds available amount)'
        : 'Contribution allocated successfully',
      allocation: newAllocation
    });
  } catch (err) {
    // Rollback changes on any query error
    await transaction.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllocations,
  createAllocation
};

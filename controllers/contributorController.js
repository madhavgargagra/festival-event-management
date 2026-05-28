// Controller managing Contributors and Contributions data
const { Contributor, Contribution, Festival, ContributionAllocation, Event } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all contributors (for Admin/Organizer/Finance)
const getContributors = async (req, res) => {
  try {
    const contributors = await Contributor.findAll({
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json({ success: true, contributors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Fetch contributions (role-based: Contributors see their own, Admins see all)
const getContributions = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'Contributor') {
      whereClause.contributor_id = req.user.id;
    }

    const contributions = await Contribution.findAll({
      where: whereClause,
      include: [
        { model: Contributor, attributes: ['name', 'email'] },
        { model: Festival, attributes: ['name'] }
      ],
      order: [['date', 'DESC']]
    });
    return res.status(200).json({ success: true, contributions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Create a contribution (cash, service, or in-kind)
const createContribution = async (req, res) => {
  const { festival_id, amount, contribution_type, description, name, email, phone } = req.body;

  try {
    let contributor_id = null;
    if (req.user.role === 'Contributor') {
      contributor_id = req.user.id;
    } else {
      const contribEmail = email || req.user.email;
      const contribName = name || req.user.name;
      const contribPhone = phone || req.user.phone || null;

      if (contribEmail) {
        let contributor = await Contributor.findOne({ where: { email: contribEmail } });
        if (!contributor) {
          const bcrypt = require('bcrypt');
          const hashedPassword = bcrypt.hashSync('dummy_contrib_pwd_123', 10);
          contributor = await Contributor.create({
            name: contribName,
            email: contribEmail,
            password: hashedPassword,
            phone: contribPhone,
            contributor_type: 'Individual'
          });
        }
        contributor_id = contributor.contributor_id;
      } else {
        contributor_id = req.body.contributor_id || null;
      }
    }
    // Business Rule: Cash contribution must be a positive amount
    if (contribution_type === 'Cash') {
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Cash contributions must be a positive decimal amount.' });
      }
    }

    // Business Rule: In-kind or service contributions must have description
    if ((contribution_type === 'In-Kind' || contribution_type === 'Service') && (!description || description.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'In-kind or service contributions require a description/item specification.'
      });
    }

    // File proof path from upload (optional)
    const attachment_path = req.file ? `/uploads/invoices/${req.file.filename}` : null;

    const { event_id } = req.body;
    let resolvedFestivalId = festival_id || null;

    if (event_id && !resolvedFestivalId) {
      const eventRecord = await Event.findByPk(event_id);
      if (eventRecord) {
        resolvedFestivalId = eventRecord.festival_id;
      }
    }

    const newContribution = await Contribution.create({
      contributor_id,
      festival_id: resolvedFestivalId,
      amount: contribution_type === 'Cash' ? amount : 0.00,
      contribution_type,
      description,
      date: new Date().toISOString().split('T')[0],
      attachment_path
    });

    if (event_id && contribution_type === 'Cash') {
      const newAllocation = await ContributionAllocation.create({
        contribution_id: newContribution.contribution_id,
        event_id: parseInt(event_id),
        allocated_item: 'Direct Event Donation',
        allocated_amount: newContribution.amount,
        allocation_date: newContribution.date,
        status: 'Allocated'
      });
      await logAudit('ContributionAllocation', newAllocation.allocation_id, 'CREATE', req, null, newAllocation);
    }

    await logAudit('Contribution', newContribution.contribution_id, 'CREATE', req, null, newContribution);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your generous contribution!',
      contribution: newContribution
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getContributors,
  getContributions,
  createContribution
};

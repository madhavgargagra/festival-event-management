// Controller managing Organizers listing and festival history tracking assignments
const { Organizer, FestivalOrganizer, Department, Festival } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all organizers with department info
const getOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Department, attributes: ['name'] }]
    });
    return res.status(200).json({ success: true, organizers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Add organizer to festival role (assigning a time-bound assignment in festival_organizers)
const assignOrganizerToFestival = async (req, res) => {
  const { organizer_id, festival_id, organizer_role_in_festival, start_date, end_date } = req.body;

  try {
    const organizer = await Organizer.findByPk(organizer_id);
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found.' });
    }

    const festival = await Festival.findByPk(festival_id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found.' });
    }

    // Create entry mapping role history
    const association = await FestivalOrganizer.create({
      organizer_id,
      festival_id,
      organizer_role_in_festival,
      start_date,
      end_date
    });

    await logAudit('FestivalOrganizer', association.id, 'CREATE', req, null, association);

    return res.status(201).json({
      success: true,
      message: 'Organizer role history assigned for this festival.',
      association
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'This organizer is already linked to this festival.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Update organizer department or role (Admin action)
const updateOrganizerInfo = async (req, res) => {
  const { id } = req.params;
  const { department_id, role } = req.body;

  try {
    const organizer = await Organizer.findByPk(id);
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    const oldVal = { ...organizer.toJSON() };
    await organizer.update({ department_id, role });
    await logAudit('Organizer', id, 'UPDATE', req, oldVal, organizer);

    return res.status(200).json({ success: true, message: 'Organizer department/role updated successfully.', organizer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOrganizers,
  assignOrganizerToFestival,
  updateOrganizerInfo
};

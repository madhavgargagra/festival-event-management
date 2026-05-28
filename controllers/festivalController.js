// Controller managing Festivals CRUD operations
const { Festival } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all festivals
const getFestivals = async (req, res) => {
  try {
    const festivals = await Festival.findAll({
      order: [['start_date', 'ASC']]
    });
    return res.status(200).json({ success: true, festivals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Create new festival
const createFestival = async (req, res) => {
  const { name, location, start_date, end_date } = req.body;

  try {
    const newFestival = await Festival.create({ name, location, start_date, end_date });
    await logAudit('Festival', newFestival.festival_id, 'CREATE', req, null, newFestival);
    return res.status(201).json({ success: true, festival: newFestival });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Update existing festival details
const updateFestival = async (req, res) => {
  const { id } = req.params;
  const { name, location, start_date, end_date } = req.body;

  try {
    const festival = await Festival.findByPk(id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const oldVal = { ...festival.toJSON() };
    await festival.update({ name, location, start_date, end_date });
    await logAudit('Festival', festival.festival_id, 'UPDATE', req, oldVal, festival);
    
    return res.status(200).json({ success: true, festival });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Delete festival (cascades automatically delete events/assignments)
const deleteFestival = async (req, res) => {
  const { id } = req.params;

  try {
    const festival = await Festival.findByPk(id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const oldVal = { ...festival.toJSON() };
    await festival.destroy();
    await logAudit('Festival', id, 'DELETE', req, oldVal, null);

    return res.status(200).json({ success: true, message: 'Festival deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getFestivals,
  createFestival,
  updateFestival,
  deleteFestival
};

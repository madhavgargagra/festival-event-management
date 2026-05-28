// Controller managing Events CRUD operations and business rules
const { Event, Festival, Expense, ContributionAllocation } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all events with their parent festival details
const getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: Festival, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['date', 'ASC']]
    });
    return res.status(200).json({ success: true, events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Create new event (validating date range with parent festival)
const createEvent = async (req, res) => {
  const { festival_id, name, description, date, location, budget_estimate } = req.body;

  try {
    const festival = await Festival.findByPk(festival_id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Parent Festival not found' });
    }

    // Business Rule: Event date must fall within Festival start and end date range
    const eventTime = new Date(date).getTime();
    const festStart = new Date(festival.start_date).getTime();
    const festEnd = new Date(festival.end_date + 'T23:59:59').getTime(); // Include full end date

    if (eventTime < festStart || eventTime > festEnd) {
      return res.status(400).json({
        success: false,
        message: `Event date must fall within the parent Festival period (${festival.start_date} to ${festival.end_date})`
      });
    }

    // Set organizer_id from logged-in organizer or body
    const organizer_id = req.user.role === 'Organizer' ? req.user.id : (req.body.organizer_id || req.user.id);

    const newEvent = await Event.create({
      festival_id,
      organizer_id,
      name,
      description,
      date,
      location,
      budget_estimate: budget_estimate || 0.00
    });

    await logAudit('Event', newEvent.event_id, 'CREATE', req, null, newEvent);

    return res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Update event details
const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, date, location, budget_estimate } = req.body;

  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // If date is updated, check against parent festival dates
    if (date) {
      const festival = await Festival.findByPk(event.festival_id);
      const eventTime = new Date(date).getTime();
      const festStart = new Date(festival.start_date).getTime();
      const festEnd = new Date(festival.end_date + 'T23:59:59').getTime();

      if (eventTime < festStart || eventTime > festEnd) {
        return res.status(400).json({
          success: false,
          message: `Event date must fall within the parent Festival period (${festival.start_date} to ${festival.end_date})`
        });
      }
    }

    const oldVal = { ...event.toJSON() };
    await event.update({ name, description, date, location, budget_estimate });
    await logAudit('Event', event.event_id, 'UPDATE', req, oldVal, event);

    return res.status(200).json({ success: true, event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Delete event (with safety validation checks)
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Business Rule: Event cannot be deleted if it already has Expenses or Allocations
    const hasExpenses = await Expense.findOne({ where: { event_id: id } });
    if (hasExpenses) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event because it has expenses linked to it.'
      });
    }

    const hasAllocations = await ContributionAllocation.findOne({ where: { event_id: id } });
    if (hasAllocations) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event because it has contribution allocations linked to it.'
      });
    }

    const oldVal = { ...event.toJSON() };
    await event.destroy();
    await logAudit('Event', id, 'DELETE', req, oldVal, null);

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
};

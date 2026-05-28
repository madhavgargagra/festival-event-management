// Controller managing Volunteers profiles, background status, and assignments
const { Volunteer, VolunteerAssignment, Event } = require('../models');
const { logAudit } = require('./auditController');

// Helper to parse shift string "09:00 - 13:00" into start and end minutes from midnight
const parseShift = (shiftStr) => {
  if (!shiftStr) return null;
  const parts = shiftStr.split('-');
  if (parts.length !== 2) return null;

  const parseTime = (timeStr) => {
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0] || 0);
    const m = parseInt(parts[1] || 0);
    return h * 60 + m;
  };

  return {
    start: parseTime(parts[0]),
    end: parseTime(parts[1])
  };
};

// Check if two shift intervals overlap
const isOverlapping = (shift1, shift2) => {
  const s1 = parseShift(shift1);
  const s2 = parseShift(shift2);
  if (!s1 || !s2) return false;
  return s1.start < s2.end && s2.start < s1.end;
};

// 1. Fetch all volunteers list
const getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.findAll({
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json({ success: true, volunteers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Fetch volunteer assignments (filtered if user is a Volunteer)
const getVolunteerAssignments = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'Volunteer') {
      whereClause.volunteer_id = req.user.id;
    }

    const assignments = await VolunteerAssignment.findAll({
      where: whereClause,
      include: [
        { model: Volunteer, attributes: ['name', 'email', 'phone'] },
        { model: Event, attributes: ['name', 'date', 'location'] }
      ]
    });
    return res.status(200).json({ success: true, assignments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Assign volunteer to event (verifying background check & schedule conflicts)
const assignVolunteer = async (req, res) => {
  const { volunteer_id, event_id, role, assigned_date, hours_committed, shift_time } = req.body;

  try {
    // Check volunteer check status
    const volunteer = await Volunteer.findByPk(volunteer_id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found.' });
    }

    // Business Rule: Volunteer must pass background check for sensitive roles / general assignments
    if (volunteer.background_check_status !== 'Passed') {
      return res.status(400).json({
        success: false,
        message: `Volunteer background check status is currently ${volunteer.background_check_status}. Must be Passed to assign.`
      });
    }

    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Business Rule: Volunteers cannot be scheduled for overlapping shift_time for multiple events
    const existingAssignments = await VolunteerAssignment.findAll({
      where: { volunteer_id, assigned_date }
    });

    for (const assoc of existingAssignments) {
      if (isOverlapping(shift_time, assoc.shift_time)) {
        return res.status(400).json({
          success: false,
          message: `Schedule conflict! Volunteer is already assigned on ${assigned_date} during shift: ${assoc.shift_time}.`
        });
      }
    }

    const newAssignment = await VolunteerAssignment.create({
      volunteer_id,
      event_id,
      role,
      assigned_date,
      hours_committed,
      shift_time
    });

    await logAudit('VolunteerAssignment', newAssignment.assignment_id, 'CREATE', req, null, newAssignment);

    return res.status(201).json({
      success: true,
      message: 'Volunteer successfully assigned to event',
      assignment: newAssignment
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Update volunteer certificates and profile details (self-service)
const uploadCertificates = async (req, res) => {
  const volunteer_id = req.user.id;
  const { availability_schedule, skillset } = req.body;

  try {
    const volunteer = await Volunteer.findByPk(volunteer_id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found' });
    }

    const oldVal = { ...volunteer.toJSON() };
    const updateData = {};
    if (availability_schedule) updateData.availability_schedule = availability_schedule;
    if (skillset) updateData.skillset = skillset;
    if (req.file) {
      updateData.certification_path = `/uploads/volunteer_id/${req.file.filename}`;
      updateData.certifications = req.file.originalname;
    }

    await volunteer.update(updateData);
    await logAudit('Volunteer', volunteer_id, 'UPDATE', req, oldVal, volunteer);

    return res.status(200).json({ success: true, message: 'Profile and certifications updated.', volunteer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Update Volunteer background check rating (Admin action)
const updateBackgroundStatus = async (req, res) => {
  const { id } = req.params;
  const { background_check_status, feedback_rating } = req.body;

  try {
    const volunteer = await Volunteer.findByPk(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    }

    const oldVal = { ...volunteer.toJSON() };
    const updateData = {};
    if (background_check_status) updateData.background_check_status = background_check_status;
    if (feedback_rating) updateData.feedback_rating = feedback_rating;

    await volunteer.update(updateData);
    await logAudit('Volunteer', id, 'UPDATE', req, oldVal, volunteer);

    return res.status(200).json({ success: true, message: 'Volunteer compliance status updated.', volunteer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVolunteers,
  getVolunteerAssignments,
  assignVolunteer,
  uploadCertificates,
  updateBackgroundStatus
};

// Controller managing authentication, registrations, and user profiles
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Organizer, Volunteer, Contributor, Vendor } = require('../models');
const { logAudit } = require('./auditController');
require('dotenv').config();

// 1. Unified login endpoint scanning tables dynamically
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;
    let role = null;
    let userIdField = null;

    // Search organizers (Admin, Finance, Organizer roles)
    user = await Organizer.findOne({ where: { email } });
    if (user) {
      role = user.role;
      userIdField = 'organizer_id';
    } else {
      // Search volunteers
      user = await Volunteer.findOne({ where: { email } });
      if (user) {
        role = 'Volunteer';
        userIdField = 'volunteer_id';
      } else {
        // Search contributors
        user = await Contributor.findOne({ where: { email } });
        if (user) {
          role = 'Contributor';
          userIdField = 'contributor_id';
        } else {
          // Search vendors
          user = await Vendor.findOne({ where: { email } });
          if (user) {
            role = 'Vendor';
            userIdField = 'vendor_id';
          }
        }
      }
    }

    // If user not found or password doesn't match
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user[userIdField],
        name: user.name,
        email: user.email,
        role: role,
        department_id: user.department_id || null
      },
      process.env.JWT_SECRET || 'super_secret_festival_key_12345',
      { expiresIn: '2h' }
    );

    // Set token as secure browser cookie for EJS dynamic views
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if running in HTTPS
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user[userIdField],
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Account registration controller routing to correct tables based on role
const register = async (req, res) => {
  const { name, email, password, phone, role, service_type } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    let newUser = null;

    if (role === 'Volunteer') {
      newUser = await Volunteer.create({
        name,
        email,
        password: hashedPassword,
        phone,
        background_check_status: 'NotStarted'
      });
      await logAudit('Volunteer', newUser.volunteer_id, 'CREATE', { user: { id: newUser.volunteer_id, role: 'Volunteer' } }, null, newUser);
    } else if (role === 'Vendor') {
      newUser = await Vendor.create({
        name,
        email,
        password: hashedPassword,
        phone,
        service_type: service_type || 'General Service',
        compliance_status: 'Pending'
      });
      await logAudit('Vendor', newUser.vendor_id, 'CREATE', { user: { id: newUser.vendor_id, role: 'Vendor' } }, null, newUser);
    } else if (role === 'Organizer') {
      newUser = await Organizer.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'Organizer'
      });
      await logAudit('Organizer', newUser.organizer_id, 'CREATE', { user: { id: newUser.organizer_id, role: 'Organizer' } }, null, newUser);
    } else {
      // Default to Contributor
      newUser = await Contributor.create({
        name,
        email,
        password: hashedPassword,
        phone,
        contributor_type: 'Individual'
      });
      await logAudit('Contributor', newUser.contributor_id, 'CREATE', { user: { id: newUser.contributor_id, role: 'Contributor' } }, null, newUser);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now login.'
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get profile details of authenticated user
const getProfile = async (req, res) => {
  const { id, role } = req.user;

  try {
    let profile = null;
    if (role === 'Volunteer') {
      profile = await Volunteer.findByPk(id);
    } else if (role === 'Vendor') {
      profile = await Vendor.findByPk(id);
    } else if (role === 'Contributor') {
      profile = await Contributor.findByPk(id);
    } else {
      profile = await Organizer.findByPk(id);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    return res.status(200).json({ success: true, profile, role });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Clear cookie token session and logout
const logout = (req, res) => {
  res.clearCookie('token');
  if (req.headers.accept && req.headers.accept.includes('json')) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
  return res.redirect('/login');
};

module.exports = {
  login,
  register,
  getProfile,
  logout
};

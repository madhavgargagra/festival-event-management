// Volunteer Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Volunteer = sequelize.define('Volunteer', {
  volunteer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  skillset: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other', 'PreferNotToSay'),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  membership_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  preferred_communication: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  compliance_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  past_participation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  availability_schedule: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  certifications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  certification_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  background_check_status: {
    type: DataTypes.ENUM('NotStarted', 'Pending', 'Passed', 'Failed'),
    allowNull: false,
    defaultValue: 'NotStarted'
  },
  feedback_rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 5.00
  }
}, {
  tableName: 'volunteers'
});

module.exports = Volunteer;

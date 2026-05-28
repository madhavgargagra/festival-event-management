// VolunteerAssignment Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VolunteerAssignment = sequelize.define('VolunteerAssignment', {
  assignment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  volunteer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  assigned_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  hours_committed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  shift_time: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'volunteer_assignments'
});

module.exports = VolunteerAssignment;

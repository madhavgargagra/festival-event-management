// Organizer Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organizer = sequelize.define('Organizer', {
  organizer_id: {
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
  role: {
    type: DataTypes.ENUM('Admin', 'Finance', 'Organizer'),
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'organizers'
});

module.exports = Organizer;

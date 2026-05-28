// Contributor Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contributor = sequelize.define('Contributor', {
  contributor_id: {
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
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contributor_type: {
    type: DataTypes.ENUM('Individual', 'Organization', 'Service'),
    allowNull: false
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
  }
}, {
  tableName: 'contributors'
});

module.exports = Contributor;

// Vendor Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  vendor_id: {
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
  service_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  compliance_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  past_performance: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 5.00
  },
  compliance_status: {
    type: DataTypes.ENUM('Verified', 'Pending', 'Flagged'),
    allowNull: false,
    defaultValue: 'Pending'
  }
}, {
  tableName: 'vendors'
});

module.exports = Vendor;

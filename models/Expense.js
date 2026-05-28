// Expense Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  expense_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expense_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('Pending', 'Partial', 'Paid'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  approval_status: {
    type: DataTypes.ENUM('Pending', 'Recommended', 'Approved', 'Rejected'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  invoice_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recommended_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'expenses'
});

module.exports = Expense;

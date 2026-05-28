// AuditHistory Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditHistory = sequelize.define('AuditHistory', {
  audit_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  changed_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  changed_by_role: {
    type: DataTypes.ENUM('Admin', 'Finance', 'Organizer', 'Volunteer', 'Contributor', 'Vendor'),
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  old_value: {
    type: DataTypes.JSON,
    allowNull: true
  },
  new_value: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'audit_history'
});

module.exports = AuditHistory;

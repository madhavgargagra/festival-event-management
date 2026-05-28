// Contribution Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contribution = sequelize.define('Contribution', {
  contribution_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contributor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  festival_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  contribution_type: {
    type: DataTypes.ENUM('Cash', 'In-Kind', 'Service'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  attachment_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'contributions'
});

module.exports = Contribution;

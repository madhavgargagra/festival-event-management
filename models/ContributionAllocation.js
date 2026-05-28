// ContributionAllocation Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContributionAllocation = sequelize.define('ContributionAllocation', {
  allocation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contribution_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  allocated_item: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  allocated_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  allocation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Allocated', 'Pending_Review', 'Used'),
    allowNull: false,
    defaultValue: 'Allocated'
  }
}, {
  tableName: 'contribution_allocations'
});

module.exports = ContributionAllocation;

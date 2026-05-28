// FestivalOrganizer Model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FestivalOrganizer = sequelize.define('FestivalOrganizer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  organizer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  festival_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  organizer_role_in_festival: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'festival_organizers'
});

module.exports = FestivalOrganizer;
